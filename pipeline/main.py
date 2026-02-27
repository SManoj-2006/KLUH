"""
main.py — FastAPI microservice for resume parsing and job matching.

This service runs on port 8000, independently of the Express backend
on port 3001. It exposes four endpoints:

  POST /upload-resume   Accept a PDF, extract skills/role/experience, match jobs.
  POST /match-jobs      Accept a pre-parsed resume profile + jobs list, match jobs.
  GET  /jobs            Return local jobs_data.json for standalone testing.
  GET  /health          Service health check.

spaCy model and local jobs are loaded ONCE at startup via the FastAPI
lifespan event and stored in module-level variables.

This file is completely self-contained and has no dependency on any
other existing project file in the repository.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import tempfile
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from supabase import create_client, Client as SupabaseClient

import cleaner
import extractor
import matcher
import nlp_pipeline

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

_PIPELINE_PORT = int(os.getenv("PIPELINE_PORT", "8000"))
_JOBS_FILE = Path(__file__).parent / "jobs_data.json"
_TMP_UPLOAD_PATH = os.path.join(tempfile.gettempdir(), "resume_pipeline_upload.pdf")

# Supabase config — read from .env
_SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
_SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# ---------------------------------------------------------------------------
# Module-level state (populated during startup lifespan)
# ---------------------------------------------------------------------------

_nlp = None
_phrase_matcher = None
_local_jobs: list[dict] = []


def _fetch_jobs_from_supabase() -> list[dict]:
    """
    Fetch all rows from the Supabase ``jobs`` table.

    Queries exactly the columns used by the matching algorithm so the
    pipeline never pulls more data than it needs.  Returns an empty list
    (without raising) if credentials are absent or the query fails, so
    the lifespan can transparently fall back to ``jobs_data.json``.

    Returns:
        List of job dicts with keys: id, company, job_title, job_function,
        vacancies, qualification, experience.
    """
    if not _SUPABASE_URL or not _SUPABASE_KEY:
        logger.warning(
            "SUPABASE_URL or SUPABASE_KEY not set — skipping Supabase fetch."
        )
        return []

    try:
        client: SupabaseClient = create_client(_SUPABASE_URL, _SUPABASE_KEY)
        response = (
            client.table("jobs")
            .select(
                "id, company, job_title, job_function, "
                "vacancies, qualification, experience"
            )
            .execute()
        )
        jobs = response.data or []
        logger.info("Fetched %d jobs from Supabase.", len(jobs))
        return jobs
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to fetch jobs from Supabase: %s", exc)
        return []


def get_nlp_state():
    """
    Return the cached (nlp, matcher) tuple.

    This function is imported by nlp_pipeline.process_resume() to avoid
    passing nlp/matcher as arguments through every call chain.

    Returns:
        Tuple of (nlp, PhraseMatcher).

    Raises:
        RuntimeError: If the pipeline has not been initialised yet.
    """
    if _nlp is None or _phrase_matcher is None:
        raise RuntimeError(
            "NLP model has not been loaded. "
            "Ensure the FastAPI lifespan has completed startup."
        )
    return _nlp, _phrase_matcher


# Make get_nlp_state importable as pipeline_state.get_nlp_state
# nlp_pipeline imports it with: from pipeline_state import get_nlp_state
# We satisfy this by inserting the current module into sys.modules.
sys.modules["pipeline_state"] = sys.modules[__name__]  # type: ignore[assignment]

# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.

    Runs startup logic before the first request is served and teardown
    logic (if any) after the server shuts down.

    Startup:
      1. Load spaCy ``en_core_web_sm`` model.
      2. Build ``PhraseMatcher`` from ``skills_list.txt``.
      3. Load ``jobs_data.json`` into ``_local_jobs``.

    Args:
        app: The FastAPI application instance.
    """
    global _nlp, _phrase_matcher, _local_jobs  # noqa: PLW0603

    logger.info("=== Pipeline startup ===")

    # Step 1 & 2 — NLP model + PhraseMatcher
    _nlp, _phrase_matcher = nlp_pipeline.load_nlp_model()
    logger.info("spaCy model and PhraseMatcher loaded successfully.")

    # Step 3 — load jobs: try Supabase first, fall back to local JSON
    supabase_jobs = _fetch_jobs_from_supabase()
    if supabase_jobs:
        _local_jobs = supabase_jobs
        logger.info("Using %d jobs from Supabase.", len(_local_jobs))
    else:
        logger.warning(
            "Supabase unavailable or returned no jobs — "
            "falling back to jobs_data.json"
        )
        if not _JOBS_FILE.exists():
            logger.error("jobs_data.json not found at: %s", _JOBS_FILE)
            _local_jobs = []
        else:
            with _JOBS_FILE.open(encoding="utf-8") as fh:
                _local_jobs = json.load(fh)
            logger.info(
                "Loaded %d jobs from %s", len(_local_jobs), _JOBS_FILE
            )

    yield  # server runs here

    logger.info("=== Pipeline shutdown ===")


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="KLUH Resume Matching Pipeline",
    description=(
        "Standalone resume parsing and job-matching microservice. "
        "Extracts skills, role, and experience from a PDF resume and "
        "scores the candidate against every job using a 3-factor formula."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class ResumeProfile(BaseModel):
    """Represents the parsed resume fields as returned by nlp_pipeline."""

    extracted_skills: list[str]
    parsed_role: str | None = None
    experience_years: int | None = None


class MatchJobsRequest(BaseModel):
    """
    Request body for POST /match-jobs.

    The caller (e.g. Express backend) provides:
      - A pre-parsed resume profile (as returned by /upload-resume or by
        fetching ``resumes.*`` columns from Supabase).
      - A list of job dicts fetched directly from the ``jobs`` Supabase table.
    """

    resume_profile: ResumeProfile
    jobs: list[dict[str, Any]]


# ---------------------------------------------------------------------------
# Helper — build standardised response
# ---------------------------------------------------------------------------


def _ok(message: str, data: dict) -> dict:
    return {"success": True, "message": message, "data": data}


def _err(message: str, status: int) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content={"success": False, "message": message},
    )


# ---------------------------------------------------------------------------
# POST /upload-resume
# ---------------------------------------------------------------------------


@app.post("/upload-resume", summary="Upload a PDF resume and match against jobs")
async def upload_resume(
    file: UploadFile = File(...),
    limit: int = 10,
) -> JSONResponse:
    """
    Accept a PDF resume, extract profile fields, match against local jobs.

    The pipeline scores ALL loaded jobs (from Supabase) for accuracy, then
    returns only the top ``limit`` matches ordered by score descending.
    Each resume produces a different top-N because ranking is unique to the
    resume's skills, role, and experience.

    Query Parameters:
        limit: Number of top matches to return (default 10, min 1, max 333).
    """
    # Validate content type.
    if file.content_type != "application/pdf":
        return _err(
            "Only PDF files are accepted",
            400,
        )

    start_ms = time.monotonic()
    tmp_path = _TMP_UPLOAD_PATH

    try:
        # Save upload to disk.
        file_bytes = await file.read()
        with open(tmp_path, "wb") as fh:
            fh.write(file_bytes)
        logger.info(
            "Saved upload '%s' (%d bytes) to %s",
            file.filename,
            len(file_bytes),
            tmp_path,
        )

        # Extract text.
        try:
            raw_text = extractor.extract_text_from_pdf(tmp_path)
        except (FileNotFoundError, ValueError) as exc:
            logger.warning("Extraction failed: %s", exc)
            return _err(str(exc), 400)

        # Clean text.
        try:
            cleaned = cleaner.clean_text(raw_text)
        except ValueError as exc:
            logger.warning("Cleaning failed: %s", exc)
            return _err(str(exc), 400)

        # NLP extraction.
        resume_data = nlp_pipeline.process_resume(cleaned)

        # Score all jobs, then cut to top N.
        all_matches = matcher.match_resume_to_jobs(resume_data, _local_jobs)
        top_matches = all_matches[:max(1, limit)]

        elapsed_ms = round((time.monotonic() - start_ms) * 1000)

        return JSONResponse(
            content=_ok(
                "Resume processed successfully",
                {
                    "resume_profile": {
                        "name": resume_data.get("name"),
                        "email": resume_data.get("email"),
                        "phone": resume_data.get("phone"),
                        "extracted_skills": resume_data["extracted_skills"],
                        "parsed_role": resume_data["parsed_role"],
                        "experience_years": resume_data["experience_years"],
                        "total_skills_found": len(
                            resume_data["extracted_skills"]
                        ),
                    },
                    "job_matches": top_matches,
                    "total_jobs_analysed": len(_local_jobs),
                    "matches_returned": len(top_matches),
                    "limit_applied": limit,
                    "processing_time_ms": elapsed_ms,
                },
            )
        )

    except Exception as exc:
        logger.exception("Unexpected error in /upload-resume: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    finally:
        # Always delete the temporary file, even if an exception occurred.
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
                logger.debug("Deleted temporary file: %s", tmp_path)
            except OSError as rm_err:
                logger.warning(
                    "Could not delete temporary file %s: %s", tmp_path, rm_err
                )


# ---------------------------------------------------------------------------
# POST /match-jobs
# ---------------------------------------------------------------------------


@app.post(
    "/match-jobs",
    summary="Match a pre-parsed resume profile against caller-supplied jobs",
)
async def match_jobs(request: MatchJobsRequest) -> JSONResponse:
    """
    Accept a pre-parsed resume profile and a list of jobs; return ranked matches.

    This endpoint is designed for integration with the Express backend.
    The caller fetches jobs from Supabase (``SELECT * FROM jobs``) and
    the resume profile from the ``resumes`` table, then posts both here.
    No PDF upload or NLP extraction is performed.

    The caller should save results to ``recommendations``:

    .. code-block:: sql

        INSERT INTO recommendations (user_id, job_id, match_score)
        VALUES (:user_id, :job_id, :final_score);

    Args:
        request: JSON body containing ``resume_profile`` and ``jobs``.

    Returns:
        JSON response with ``job_matches`` sorted by ``final_score``.

    Raises:
        HTTPException 400: If the request body is malformed.
        HTTPException 500: If an unexpected internal error occurs.
    """
    start_ms = time.monotonic()

    try:
        # Convert Pydantic model to plain dict for matcher.
        resume_dict = {
            "extracted_skills": request.resume_profile.extracted_skills,
            "parsed_role": request.resume_profile.parsed_role,
            "experience_years": request.resume_profile.experience_years,
        }

        job_matches = matcher.match_resume_to_jobs(resume_dict, request.jobs)
        elapsed_ms = round((time.monotonic() - start_ms) * 1000)

        return JSONResponse(
            content=_ok(
                "Matching completed successfully",
                {
                    "job_matches": job_matches,
                    "total_jobs_analysed": len(request.jobs),
                    "processing_time_ms": elapsed_ms,
                },
            )
        )

    except Exception as exc:
        logger.exception("Unexpected error in /match-jobs: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# GET /jobs
# ---------------------------------------------------------------------------


@app.get("/jobs", summary="Return local jobs_data.json for standalone testing")
async def get_jobs() -> JSONResponse:
    """
    Return the local ``jobs_data.json`` for standalone testing.

    This endpoint allows developers to verify what jobs the pipeline is
    matching against without needing a Supabase connection.

    Returns:
        JSON response with the list of jobs and the total count.
    """
    return JSONResponse(
        content=_ok(
            "Jobs loaded from local data",
            {
                "jobs": _local_jobs,
                "total": len(_local_jobs),
            },
        )
    )


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------


@app.get("/health", summary="Service health check")
async def health() -> JSONResponse:
    """
    Return the health status of the pipeline service.

    Includes the name of the loaded spaCy model, the number of jobs
    in memory, and a summary of the three matching factors and their weights.

    Returns:
        JSON response with status ``"healthy"`` and metadata.
    """
    return JSONResponse(
        content=_ok(
            "Pipeline is running",
            {
                "status": "healthy",
                "spacy_model": "en_core_web_sm",
                "jobs_loaded": len(_local_jobs),
                "matching_factors": {
                    "skill_match": (
                        "50% weight — resumes.extracted_skills vs jobs.job_function"
                    ),
                    "role_match": (
                        "30% weight — resumes.parsed_role vs jobs.job_title"
                    ),
                    "experience_match": (
                        "20% weight — resumes.experience_years vs jobs.experience"
                    ),
                },
            },
        )
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=_PIPELINE_PORT,
        reload=False,
        log_level="info",
    )
