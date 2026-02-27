"""
nlp_pipeline.py — spaCy NLP extraction pipeline for resume parsing.

Extracts exactly three fields that map directly to columns in the
resumes table of the Supabase schema:

  extracted_skills  → resumes.extracted_skills  (jsonb array)
  parsed_role       → resumes.parsed_role        (text)
  experience_years  → resumes.experience_years   (int4)

This module is completely self-contained and has no dependency on any
other existing project file.
"""

from __future__ import annotations

import logging
import os
import re
from datetime import datetime
from pathlib import Path

import spacy
from spacy.matcher import PhraseMatcher

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Path to skills_list.txt relative to this file.
_SKILLS_FILE = Path(__file__).parent / "skills_list.txt"

# Module-level skill map: lowercase → original casing (e.g. "python" → "Python").
# Populated by load_nlp_model() and read by extract_skills().
# Using a module-level dict because spaCy 3.8's PhraseMatcher is a Cython
# extension type and does not support arbitrary __dict__ attribute assignment.
_skill_map: dict[str, str] = {}

# Common English stop words to remove during role matching.
_STOP_WORDS: frozenset[str] = frozenset(
    {"and", "or", "the", "a", "an", "of", "in", "at", "for"}
)

# Role keywords used for parsed_role detection (ordered longest → shortest
# so the greedy match finds the most specific phrase first).
_ROLE_KEYWORDS: list[str] = sorted(
    [
        "software engineer",
        "software developer",
        "backend developer",
        "frontend developer",
        "fullstack developer",
        "full stack developer",
        "full-stack developer",
        "data scientist",
        "data analyst",
        "data engineer",
        "machine learning engineer",
        "devops engineer",
        "cloud engineer",
        "network engineer",
        "security engineer",
        "embedded systems engineer",
        "mechanical engineer",
        "civil engineer",
        "electrical engineer",
        "qa engineer",
        "qa tester",
        "test engineer",
        "automation engineer",
        "business analyst",
        "systems analyst",
        "database administrator",
        "system administrator",
        "cloud architect",
        "solutions architect",
        "ui/ux designer",
        "ui designer",
        "ux designer",
        "product manager",
        "project manager",
        "scrum master",
        "developer",
        "engineer",
        "analyst",
        "designer",
        "manager",
        "consultant",
        "architect",
        "administrator",
        "scientist",
        "tester",
        "devops",
        "backend",
        "frontend",
        "fullstack",
        "full stack",
        "software",
        "mechanical",
        "civil",
        "electrical",
        "embedded",
        "cloud",
        "network",
        "security",
        "qa",
        "data",
    ],
    key=len,
    reverse=True,
)

# Section header keywords that often precede the desired role.
_SECTION_HEADERS = re.compile(
    r"(?:objective|summary|desired role|applying for|position|career objective)"
    r"[\s:]*(.{5,120}?)(?:\.|,|;|\n|$)",
    re.IGNORECASE,
)

# Explicit experience patterns (Strategy 1).
_EXP_EXPLICIT_RE = re.compile(
    r"(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:professional\s+)?experience",
    re.IGNORECASE,
)
_EXP_EXPLICIT_REV_RE = re.compile(
    r"experience\s+of\s+(\d+)\+?\s*(?:years?|yrs?)",
    re.IGNORECASE,
)

# Date-range patterns (Strategy 2).
# Covers: "2019 - 2023", "Jan 2019 – Mar 2024", "2018–present", "2020 to present"
_MONTH_NAMES = (
    r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|"
    r"jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|"
    r"nov(?:ember)?|dec(?:ember)?)"
)
_DATE_RANGE_RE = re.compile(
    rf"(?:{_MONTH_NAMES}\s+)?(\d{{4}})\s*[-–—to]+\s*"
    rf"(?:(?:{_MONTH_NAMES})\s+)?(\d{{4}}|present|current|till date|now)",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def load_nlp_model() -> tuple[spacy.language.Language, PhraseMatcher]:
    """
    Load spaCy model and build PhraseMatcher from skills_list.txt.

    This function should be called ONCE at application startup. The
    returned ``(nlp, matcher)`` tuple should be stored at module-level
    and reused for every request.

    Returns:
        Tuple of ``(nlp, matcher)`` where:
          - ``nlp``     is the loaded ``en_core_web_sm`` spaCy model.
          - ``matcher`` is a :class:`spacy.matcher.PhraseMatcher` built
            with ``attr="LOWER"`` for case-insensitive matching and
            populated with every skill from ``skills_list.txt``.

    Raises:
        OSError: If ``en_core_web_sm`` is not installed. Run
                 ``python -m spacy download en_core_web_sm`` to fix.
        FileNotFoundError: If ``skills_list.txt`` is not found next to
                           this module.
    """
    logger.info("Loading spaCy model: en_core_web_sm")
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError as exc:
        raise OSError(
            "spaCy model 'en_core_web_sm' is not installed. "
            "Run: python -m spacy download en_core_web_sm"
        ) from exc

    if not _SKILLS_FILE.exists():
        raise FileNotFoundError(
            f"skills_list.txt not found at expected path: {_SKILLS_FILE}"
        )

    raw_skills = _SKILLS_FILE.read_text(encoding="utf-8").splitlines()
    # Preserve original casing in a lookup dict; key → lowercase.
    skills: dict[str, str] = {}
    for line in raw_skills:
        skill = line.strip()
        if skill:
            skills[skill.lower()] = skill

    matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
    patterns = [nlp.make_doc(skill_lower) for skill_lower in skills]
    matcher.add("SKILLS", patterns)

    # Populate the module-level skill map so extract_skills() can resolve
    # original casing without touching the PhraseMatcher object's attributes
    # (spaCy 3.8's PhraseMatcher is a Cython type; __dict__ assignment fails).
    global _skill_map  # noqa: PLW0603
    _skill_map = skills

    logger.info("PhraseMatcher built with %d skills.", len(skills))
    return nlp, matcher


def extract_skills(
    doc: spacy.tokens.Doc,
    matcher: PhraseMatcher,
) -> list[str]:
    """
    Extract skills from a spaCy Doc using PhraseMatcher.

    Uses ``attr="LOWER"`` so matching is case-insensitive. Deduplication
    preserves the first occurrence while retaining original casing from
    ``skills_list.txt``.

    Maps to: ``resumes.extracted_skills`` (jsonb array of strings).

    Args:
        doc:     spaCy ``Doc`` produced by ``nlp(cleaned_text)``.
        matcher: PhraseMatcher loaded via :func:`load_nlp_model`.

    Returns:
        Deduplicated list of matched skill strings, with casing from
        ``skills_list.txt`` (e.g. ``"Python"``, ``"REST API"``).
    """
    # Read from the module-level map populated by load_nlp_model().
    matches = matcher(doc)

    seen: set[str] = set()
    result: list[str] = []
    for _, start, end in matches:
        span_lower = doc[start:end].text.lower()
        canonical = _skill_map.get(span_lower, doc[start:end].text)
        if canonical not in seen:
            seen.add(canonical)
            result.append(canonical)

    logger.debug("Extracted %d skills: %s", len(result), result)
    return result


def extract_parsed_role(
    cleaned_text: str,
    nlp: spacy.language.Language,
) -> str | None:
    """
    Detect the most likely job role from the resume text.

    Maps to: ``resumes.parsed_role`` (text).

    Strategy (tried in order; returns the first successful match):

    1. Look for section headers (``objective``, ``summary``,
       ``desired role``, ``applying for``, ``position``) and search for
       a role keyword in the text immediately following them.
    2. Scan the full ``cleaned_text`` for the longest matching phrase
       from ``_ROLE_KEYWORDS``.
    3. Return ``None`` if no match is found.

    The returned string uses the casing from ``_ROLE_KEYWORDS`` (title
    case) rather than the lowercased ``cleaned_text``.

    Args:
        cleaned_text: Lowercased, cleaned resume text from
                      :func:`cleaner.clean_text`.
        nlp:          Loaded spaCy model from :func:`load_nlp_model`.

    Returns:
        Detected role string with title casing, or ``None``.
    """
    # Strategy 1 — look near section headers.
    for match in _SECTION_HEADERS.finditer(cleaned_text):
        snippet = match.group(1).lower()
        for keyword in _ROLE_KEYWORDS:
            if keyword in snippet:
                role = keyword.title()
                logger.debug("Role detected via section header: %s", role)
                return role

    # Strategy 2 — scan full text for longest keyword match.
    for keyword in _ROLE_KEYWORDS:
        if keyword in cleaned_text:
            role = keyword.title()
            logger.debug("Role detected via full-text scan: %s", role)
            return role

    logger.debug("No parsed role detected.")
    return None


def extract_experience_years(cleaned_text: str) -> int | None:
    """
    Extract total years of professional experience from resume text.

    Maps to: ``resumes.experience_years`` (int4).

    Strategy (tried in order; returns the first successful result):

    1. **Explicit mention** — look for phrases such as
       ``"3 years of experience"``, ``"5+ years"``, ``"4 yrs experience"``,
       ``"experience of 2 years"``.  Returns the extracted integer.

    2. **Date-range summation** — detect all year-ranges in the text
       (e.g. ``"2019 - 2023"``, ``"Jan 2020 – Mar 2024"``,
       ``"2018–present"``). Sums the duration of all detected ranges.
       Uses the current calendar year for ``"present"``/``"current"``.

    3. If both strategies fail, returns ``None`` (never guesses).

    Args:
        cleaned_text: Lowercased, cleaned resume text from
                      :func:`cleaner.clean_text`.

    Returns:
        Integer years of experience, or ``None`` if not detectable.
    """
    current_year = datetime.now().year

    # Strategy 1 — explicit mentions.
    # Pattern: "X years of experience" or "X yrs experience"
    for pattern in (_EXP_EXPLICIT_RE, _EXP_EXPLICIT_REV_RE):
        match = pattern.search(cleaned_text)
        if match:
            years = int(match.group(1))
            logger.debug(
                "Experience extracted via explicit pattern: %d years", years
            )
            return years

    # Strategy 2 — date-range summation.
    total_months: int = 0
    for match in _DATE_RANGE_RE.finditer(cleaned_text):
        start_year = int(match.group(1))
        end_raw = match.group(2).strip().lower()
        if end_raw in {"present", "current", "till date", "now"}:
            end_year = current_year
        else:
            try:
                end_year = int(end_raw)
            except ValueError:
                continue
        if end_year >= start_year:
            duration = (end_year - start_year) * 12
            # Require ≥ 6 months to avoid education-year false positives
            # (e.g. "B.Tech - 2024" → same start/end → 0 months → ignored).
            if duration >= 6:
                total_months += duration

    if total_months > 0:
        years = max(1, round(total_months / 12))
        logger.debug(
            "Experience extracted via date ranges: %d years (~%d months)",
            years,
            total_months,
        )
        return years

    logger.debug("Could not extract experience years from resume text.")
    return None


def process_resume(cleaned_text: str) -> dict:
    """
    Run the full NLP extraction pipeline on cleaned resume text.

    Loads the spaCy model and PhraseMatcher lazily on the first call if
    they have not already been loaded (for standalone / test use). In
    production the model should be pre-loaded at startup via
    :func:`load_nlp_model` and injected via the FastAPI app state.

    Args:
        cleaned_text: Output from :func:`cleaner.clean_text`.

    Returns:
        Dictionary with exactly these keys, matching the resumes table
        columns::

            {
                'extracted_skills': list[str],   # resumes.extracted_skills
                'parsed_role':      str | None,  # resumes.parsed_role
                'experience_years': int | None,  # resumes.experience_years
            }
    """
    # Import here to avoid circular dependency if called standalone.
    from pipeline_state import get_nlp_state  # type: ignore[import]

    nlp, matcher = get_nlp_state()

    doc = nlp(cleaned_text)

    extracted_skills = extract_skills(doc, matcher)
    parsed_role = extract_parsed_role(cleaned_text, nlp)
    experience_years = extract_experience_years(cleaned_text)

    result = {
        "extracted_skills": extracted_skills,
        "parsed_role": parsed_role,
        "experience_years": experience_years,
    }
    logger.info(
        "NLP extraction complete. Skills: %d | Role: %s | Experience: %s yr",
        len(extracted_skills),
        parsed_role,
        experience_years,
    )
    return result
