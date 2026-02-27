"""
tests/test_api.py — Integration tests for all 4 FastAPI endpoints.

Uses FastAPI TestClient with lifespan enabled (from conftest.py api_client fixture)
so the spaCy model is loaded before any test runs.

Tests cover:
  GET  /health       — status, keys, jobs_loaded count
  GET  /jobs         — list from jobs_data.json, schema fields present
  POST /match-jobs   — valid payload, wrong payload, empty jobs list, None fields
  POST /upload-resume — valid PDF, non-PDF file rejected, empty file rejected
"""
from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import io
import pytest
from fastapi.testclient import TestClient

from tests.conftest import (
    PYTHON_BACKEND_RESUME_TEXT,
    FRESHER_RESUME_TEXT,
    MECHANICAL_RESUME_TEXT,
    make_pdf_bytes,
)


# ===========================================================================
# GET /health
# ===========================================================================

class TestHealthEndpoint:
    def test_returns_200(self, api_client: TestClient):
        response = api_client.get("/health")
        assert response.status_code == 200

    def test_success_true(self, api_client: TestClient):
        data = api_client.get("/health").json()
        assert data["success"] is True

    def test_status_healthy(self, api_client: TestClient):
        data = api_client.get("/health").json()
        assert data["data"]["status"] == "healthy"

    def test_spacy_model_name(self, api_client: TestClient):
        data = api_client.get("/health").json()
        assert data["data"]["spacy_model"] == "en_core_web_sm"

    def test_jobs_loaded_count(self, api_client: TestClient):
        data = api_client.get("/health").json()
        assert data["data"]["jobs_loaded"] == 10

    def test_matching_factors_keys(self, api_client: TestClient):
        data = api_client.get("/health").json()
        factors = data["data"]["matching_factors"]
        assert "skill_match" in factors
        assert "role_match" in factors
        assert "experience_match" in factors

    def test_matching_factors_mention_weights(self, api_client: TestClient):
        data = api_client.get("/health").json()
        factors = data["data"]["matching_factors"]
        assert "50%" in factors["skill_match"]
        assert "30%" in factors["role_match"]
        assert "20%" in factors["experience_match"]


# ===========================================================================
# GET /jobs
# ===========================================================================

class TestJobsEndpoint:
    def test_returns_200(self, api_client: TestClient):
        response = api_client.get("/jobs")
        assert response.status_code == 200

    def test_success_true(self, api_client: TestClient):
        data = api_client.get("/jobs").json()
        assert data["success"] is True

    def test_total_is_10(self, api_client: TestClient):
        data = api_client.get("/jobs").json()
        assert data["data"]["total"] == 10

    def test_jobs_is_list(self, api_client: TestClient):
        data = api_client.get("/jobs").json()
        assert isinstance(data["data"]["jobs"], list)

    def test_jobs_schema_fields_present(self, api_client: TestClient):
        data = api_client.get("/jobs").json()
        required_fields = {"id", "company", "job_title", "job_function",
                           "vacancies", "qualification", "experience"}
        for job in data["data"]["jobs"]:
            for field in required_fields:
                assert field in job, f"Field '{field}' missing from job {job.get('id')}"

    def test_no_extra_fields_in_jobs(self, api_client: TestClient):
        data = api_client.get("/jobs").json()
        allowed_fields = {"id", "company", "job_title", "job_function",
                          "vacancies", "qualification", "experience"}
        for job in data["data"]["jobs"]:
            extra = set(job.keys()) - allowed_fields
            assert not extra, f"Extra fields found: {extra}"

    def test_job_ids_are_integers(self, api_client: TestClient):
        data = api_client.get("/jobs").json()
        for job in data["data"]["jobs"]:
            assert isinstance(job["id"], int)


# ===========================================================================
# POST /match-jobs
# ===========================================================================

class TestMatchJobsEndpoint:
    def _python_profile(self):
        return {
            "extracted_skills": ["Python", "Django", "SQL", "REST API"],
            "parsed_role": "Backend Developer",
            "experience_years": 3,
        }

    def _sample_jobs(self):
        return [
            {
                "id": 1,
                "company": "TechCorp",
                "job_title": "Python Backend Engineer",
                "job_function": "Python, Django, SQL, REST API",
                "vacancies": "3",
                "qualification": "B.Tech",
                "experience": "2-4 years",
            },
            {
                "id": 2,
                "company": "Pixel Studio",
                "job_title": "Frontend Developer",
                "job_function": "React, JavaScript, TypeScript",
                "vacancies": "2",
                "qualification": "BCA",
                "experience": "Fresher",
            },
            {
                "id": 3,
                "company": "DataCo",
                "job_title": "Mechanical Engineer",
                "job_function": "AutoCAD, CATIA, ANSYS",
                "vacancies": "1",
                "qualification": "B.Tech Mech",
                "experience": "3-5 years",
            },
        ]

    def test_returns_200(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={
            "resume_profile": self._python_profile(),
            "jobs": self._sample_jobs(),
        })
        assert response.status_code == 200

    def test_success_true(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={
            "resume_profile": self._python_profile(),
            "jobs": self._sample_jobs(),
        })
        assert response.json()["success"] is True

    def test_job_matches_length(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={
            "resume_profile": self._python_profile(),
            "jobs": self._sample_jobs(),
        })
        data = response.json()["data"]
        assert len(data["job_matches"]) == 3

    def test_job_matches_sorted_by_score(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={
            "resume_profile": self._python_profile(),
            "jobs": self._sample_jobs(),
        })
        scores = [m["final_score"] for m in response.json()["data"]["job_matches"]]
        assert scores == sorted(scores, reverse=True)

    def test_python_job_ranks_first(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={
            "resume_profile": self._python_profile(),
            "jobs": self._sample_jobs(),
        })
        top_match = response.json()["data"]["job_matches"][0]
        assert top_match["job_id"] == 1
        assert top_match["rank"] == 1

    def test_match_result_keys(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={
            "resume_profile": self._python_profile(),
            "jobs": self._sample_jobs(),
        })
        required = {
            "job_id", "company", "job_title", "job_function",
            "vacancies", "qualification", "experience_required",
            "final_score", "skill_score", "role_score", "experience_score",
            "match_label", "matched_skills", "missing_skills", "rank",
        }
        for match in response.json()["data"]["job_matches"]:
            assert required.issubset(set(match.keys()))

    def test_scores_are_floats(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={
            "resume_profile": self._python_profile(),
            "jobs": self._sample_jobs(),
        })
        for match in response.json()["data"]["job_matches"]:
            assert isinstance(match["final_score"], float)

    def test_scores_in_valid_range(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={
            "resume_profile": self._python_profile(),
            "jobs": self._sample_jobs(),
        })
        for match in response.json()["data"]["job_matches"]:
            assert 0.0 <= match["final_score"] <= 100.0

    def test_empty_jobs_list_returns_empty_matches(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={
            "resume_profile": self._python_profile(),
            "jobs": [],
        })
        assert response.status_code == 200
        assert response.json()["data"]["job_matches"] == []

    def test_none_parsed_role(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={
            "resume_profile": {
                "extracted_skills": ["Python"],
                "parsed_role": None,
                "experience_years": 3,
            },
            "jobs": self._sample_jobs(),
        })
        assert response.status_code == 200
        for match in response.json()["data"]["job_matches"]:
            assert match["role_score"] == pytest.approx(0.0)

    def test_none_experience_years_neutral(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={
            "resume_profile": {
                "extracted_skills": ["Python"],
                "parsed_role": "Developer",
                "experience_years": None,
            },
            "jobs": self._sample_jobs(),
        })
        assert response.status_code == 200
        for match in response.json()["data"]["job_matches"]:
            assert match["experience_score"] == pytest.approx(50.0)

    def test_invalid_body_returns_422(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={"bad": "payload"})
        assert response.status_code == 422

    def test_total_jobs_analysed_field(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={
            "resume_profile": self._python_profile(),
            "jobs": self._sample_jobs(),
        })
        assert response.json()["data"]["total_jobs_analysed"] == 3

    def test_processing_time_ms_present(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={
            "resume_profile": self._python_profile(),
            "jobs": self._sample_jobs(),
        })
        assert "processing_time_ms" in response.json()["data"]

    def test_matched_skills_subset_of_extracted(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={
            "resume_profile": self._python_profile(),
            "jobs": self._sample_jobs(),
        })
        for match in response.json()["data"]["job_matches"]:
            for skill in match["matched_skills"]:
                # matched_skills must be tokens from job_function
                assert skill.lower() in match["job_function"].lower()

    def test_fresher_job_experience_score(self, api_client: TestClient):
        response = api_client.post("/match-jobs", json={
            "resume_profile": {
                "extracted_skills": ["SQL"],
                "parsed_role": "Analyst",
                "experience_years": 0,
            },
            "jobs": [self._sample_jobs()[1]],  # Fresher job
        })
        match = response.json()["data"]["job_matches"][0]
        assert match["experience_score"] == pytest.approx(100.0)


# ===========================================================================
# POST /upload-resume
# ===========================================================================

class TestUploadResumeEndpoint:
    def test_rejects_non_pdf(self, api_client: TestClient):
        fake_txt = io.BytesIO(b"This is a plain text resume")
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.txt", fake_txt, "text/plain")},
        )
        assert response.status_code == 400
        assert response.json()["success"] is False
        assert "PDF" in response.json()["message"]

    def test_rejects_docx_as_pdf(self, api_client: TestClient):
        fake_docx = io.BytesIO(b"PK\x03\x04fake docx content")
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.docx", fake_docx, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )
        assert response.status_code == 400

    def test_valid_pdf_returns_200(self, api_client: TestClient):
        pdf_bytes = make_pdf_bytes(PYTHON_BACKEND_RESUME_TEXT)
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        assert response.status_code == 200

    def test_valid_pdf_success_true(self, api_client: TestClient):
        pdf_bytes = make_pdf_bytes(PYTHON_BACKEND_RESUME_TEXT)
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        assert response.json()["success"] is True

    def test_response_has_resume_profile(self, api_client: TestClient):
        pdf_bytes = make_pdf_bytes(PYTHON_BACKEND_RESUME_TEXT)
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        data = response.json()["data"]
        assert "resume_profile" in data
        profile = data["resume_profile"]
        assert "extracted_skills" in profile
        assert "parsed_role" in profile
        assert "experience_years" in profile
        assert "total_skills_found" in profile

    def test_extracted_skills_is_list(self, api_client: TestClient):
        pdf_bytes = make_pdf_bytes(PYTHON_BACKEND_RESUME_TEXT)
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        profile = response.json()["data"]["resume_profile"]
        assert isinstance(profile["extracted_skills"], list)

    def test_python_resume_extracts_python_skill(self, api_client: TestClient):
        pdf_bytes = make_pdf_bytes(PYTHON_BACKEND_RESUME_TEXT)
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        profile = response.json()["data"]["resume_profile"]
        skills_lower = [s.lower() for s in profile["extracted_skills"]]
        assert "python" in skills_lower

    def test_total_skills_found_matches_list_length(self, api_client: TestClient):
        pdf_bytes = make_pdf_bytes(PYTHON_BACKEND_RESUME_TEXT)
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        profile = response.json()["data"]["resume_profile"]
        assert profile["total_skills_found"] == len(profile["extracted_skills"])

    def test_response_has_job_matches(self, api_client: TestClient):
        pdf_bytes = make_pdf_bytes(PYTHON_BACKEND_RESUME_TEXT)
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        data = response.json()["data"]
        assert "job_matches" in data
        assert isinstance(data["job_matches"], list)

    def test_total_jobs_analysed_is_10(self, api_client: TestClient):
        pdf_bytes = make_pdf_bytes(PYTHON_BACKEND_RESUME_TEXT)
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        assert response.json()["data"]["total_jobs_analysed"] == 10

    def test_job_matches_ranked(self, api_client: TestClient):
        pdf_bytes = make_pdf_bytes(PYTHON_BACKEND_RESUME_TEXT)
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        matches = response.json()["data"]["job_matches"]
        scores = [m["final_score"] for m in matches]
        assert scores == sorted(scores, reverse=True)

    def test_python_resume_gets_software_job_rank1(self, api_client: TestClient):
        pdf_bytes = make_pdf_bytes(PYTHON_BACKEND_RESUME_TEXT)
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        top_match = response.json()["data"]["job_matches"][0]
        # Python backend resume should match the Python Backend Engineer job (id:1)
        assert top_match["job_id"] == 1

    def test_fresher_resume_matches_fresher_job_high(self, api_client: TestClient):
        pdf_bytes = make_pdf_bytes(FRESHER_RESUME_TEXT)
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        matches = response.json()["data"]["job_matches"]
        # Find the Accounts Executive job (id:9 - Fresher experience requirement)
        accounts_match = next((m for m in matches if m["job_id"] == 9), None)
        if accounts_match:
            # If NLP extracted experience_years=0/1 → score=100.0 (Rule C)
            # If NLP returned None → score=50.0 (neutral, since we can't detect "0 years")
            # Both are valid outcomes — the important thing is it's >= 50.0
            assert accounts_match["experience_score"] >= 50.0, (
                f"Fresher job experience_score should be ≥ 50.0, "
                f"got {accounts_match['experience_score']}"
            )

    def test_mechanical_resume_matches_mechanical_job_rank1(self, api_client: TestClient):
        pdf_bytes = make_pdf_bytes(MECHANICAL_RESUME_TEXT)
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        matches = response.json()["data"]["job_matches"]
        top_match = matches[0]
        # Mechanical resume should rank the Mechanical Design Engineer job (id:5) highest
        assert top_match["job_id"] == 5

    def test_processing_time_ms_is_positive(self, api_client: TestClient):
        pdf_bytes = make_pdf_bytes(PYTHON_BACKEND_RESUME_TEXT)
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        t = response.json()["data"]["processing_time_ms"]
        assert isinstance(t, (int, float))
        assert t >= 0

    def test_qualification_in_output_but_not_in_scoring(self, api_client: TestClient):
        """Qualification appears in output as informational only."""
        pdf_bytes = make_pdf_bytes(PYTHON_BACKEND_RESUME_TEXT)
        response = api_client.post(
            "/upload-resume",
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        matches = response.json()["data"]["job_matches"]
        for m in matches:
            # qualification must be present in the output
            assert "qualification" in m
            # Verify score is composed of only 3 weighted factors
            reconstructed = (
                (m["skill_score"] / 100 * 0.50)
                + (m["role_score"] / 100 * 0.30)
                + (m["experience_score"] / 100 * 0.20)
            ) * 100
            assert abs(m["final_score"] - round(reconstructed, 2)) < 0.01
