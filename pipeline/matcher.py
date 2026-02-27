"""
matcher.py — 3-factor resume-to-job scoring and ranking engine.

Implements the exact matching logic defined by the schema spec.
All scoring uses ONLY the fields that exist in the jobs table:
  jobs.job_function → Factor 1 (skill match,      50% weight)
  jobs.job_title    → Factor 2 (role match,        30% weight)
  jobs.experience   → Factor 3 (experience match,  20% weight)
  jobs.qualification → informational output only — NOT used in scoring.

This module is completely self-contained and has no dependency on any
other existing project file.
"""

from __future__ import annotations

import logging
import re

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_STOP_WORDS: frozenset[str] = frozenset(
    {"and", "or", "the", "a", "an", "of", "in", "at", "for"}
)

# Matches "X-Y years" or "X - Y years" (Rule A)
_RANGE_RE = re.compile(r"(\d+)\s*[-–]\s*(\d+)\s*(?:years?|yrs?)?", re.IGNORECASE)

# Matches "X+ years" (Rule B)
_MIN_RE = re.compile(r"(\d+)\+\s*(?:years?|yrs?)", re.IGNORECASE)

# Fresher / entry-level keywords (Rule C)
_FRESHER_KEYWORDS: frozenset[str] = frozenset(
    {"fresher", "entry level", "entry-level", "0 years", "0-1"}
)

# Score labels
_LABEL_EXCELLENT = "Excellent Match"
_LABEL_GOOD = "Good Match"
_LABEL_PARTIAL = "Partial Match"
_LABEL_LOW = "Low Match"


# ---------------------------------------------------------------------------
# Factor 1 — Skill Match (50%)
# ---------------------------------------------------------------------------


def calculate_skill_score(
    extracted_skills: list[str],
    job_function: str,
) -> float:
    """
    Factor 1: Skill match (weight 50%).

    Compares ``resumes.extracted_skills`` against ``jobs.job_function``.

    Tokenisation: ``job_function`` is split on commas; each resulting
    segment is stripped of leading/trailing whitespace to form a token.
    This matches the spec example where
    ``"Software Development, Python, Django, SQL"``
    becomes ``["Software Development", "Python", "Django", "SQL"]``.

    All comparisons are case-insensitive.

    Args:
        extracted_skills: List of skill strings from
                          ``resumes.extracted_skills``.
        job_function:     Text value of ``jobs.job_function``.

    Returns:
        Float in the range ``[0.0, 1.0]``.  Returns ``0.0`` if
        ``job_function`` is empty or ``extracted_skills`` is empty.
    """
    if not extracted_skills or not job_function:
        return 0.0

    tokens = [t.strip() for t in job_function.split(",") if t.strip()]
    if not tokens:
        return 0.0

    tokens_lower = {t.lower() for t in tokens}
    skills_lower = {s.lower() for s in extracted_skills}

    match_count = len(tokens_lower & skills_lower)
    score = match_count / len(tokens)

    clamped = max(0.0, min(1.0, score))
    logger.debug(
        "Skill score: %d/%d tokens matched → %.4f",
        match_count,
        len(tokens),
        clamped,
    )
    return clamped


# ---------------------------------------------------------------------------
# Factor 2 — Role Match (30%)
# ---------------------------------------------------------------------------


def _tokenise_role(text: str) -> list[str]:
    """Split text into lowercase words, removing stop words."""
    words = re.findall(r"\w+", text.lower())
    return [w for w in words if w not in _STOP_WORDS]


def calculate_role_score(
    parsed_role: str | None,
    job_title: str,
) -> float:
    """
    Factor 2: Role match (weight 30%).

    Compares ``resumes.parsed_role`` against ``jobs.job_title``.

    Both strings are tokenised into individual words; stop words
    (``"and"`` / ``"or"`` / ``"the"`` / ``"a"`` / ``"an"`` /
    ``"of"`` / ``"in"`` / ``"at"`` / ``"for"``) are removed.
    Comparison is case-insensitive.

    Args:
        parsed_role: Detected role from ``resumes.parsed_role``, or
                     ``None`` if the role could not be determined.
        job_title:   Text value of ``jobs.job_title``.

    Returns:
        Float in the range ``[0.0, 1.0]``.  Returns ``0.0`` if
        ``parsed_role`` is ``None`` or empty, or if ``job_title``
        has no usable tokens.
    """
    if not parsed_role or not job_title:
        return 0.0

    parsed_words = _tokenise_role(parsed_role)
    title_words = set(_tokenise_role(job_title))

    if not parsed_words:
        return 0.0

    match_count = sum(1 for w in parsed_words if w in title_words)
    score = match_count / len(parsed_words)

    clamped = max(0.0, min(1.0, score))
    logger.debug(
        "Role score: %d/%d words matched ('%s' vs '%s') → %.4f",
        match_count,
        len(parsed_words),
        parsed_role,
        job_title,
        clamped,
    )
    return clamped


# ---------------------------------------------------------------------------
# Factor 3 — Experience Match (20%)
# ---------------------------------------------------------------------------


def _parse_experience_text(job_experience: str, experience_years: int) -> float:
    """
    Internal helper that applies Rules A → D to compute the experience score.

    Args:
        job_experience:   Text value of ``jobs.experience``.
        experience_years: Candidate's years of experience from
                          ``resumes.experience_years``.

    Returns:
        Float experience score in the range ``[0.0, 1.0]``.
    """
    text = job_experience.strip().lower()

    # Rule A — range format "X-Y years"
    range_match = _RANGE_RE.search(text)
    if range_match:
        low = int(range_match.group(1))
        high = int(range_match.group(2))
        if experience_years < low:
            score = max(0.0, 1.0 - (low - experience_years) * 0.2)
        elif experience_years > high:
            score = max(0.0, 1.0 - (experience_years - high) * 0.1)
        else:
            score = 1.0
        logger.debug(
            "Experience Rule A (range %d-%d): candidate=%d → %.4f",
            low,
            high,
            experience_years,
            score,
        )
        return score

    # Rule B — minimum format "X+ years"
    min_match = _MIN_RE.search(text)
    if min_match:
        minimum = int(min_match.group(1))
        if experience_years >= minimum:
            score = 1.0
        else:
            score = max(0.0, 1.0 - (minimum - experience_years) * 0.2)
        logger.debug(
            "Experience Rule B (min %d+): candidate=%d → %.4f",
            minimum,
            experience_years,
            score,
        )
        return score

    # Rule C — fresher / entry-level
    if any(kw in text for kw in _FRESHER_KEYWORDS):
        if experience_years <= 1:
            score = 1.0
        else:
            score = max(0.0, 1.0 - (experience_years - 1) * 0.2)
        logger.debug(
            "Experience Rule C (fresher): candidate=%d → %.4f",
            experience_years,
            score,
        )
        return score

    # Rule D — cannot parse
    logger.debug(
        "Experience Rule D (unparseable '%s'): returning neutral 0.5",
        job_experience,
    )
    return 0.5


def calculate_experience_score(
    experience_years: int | None,
    job_experience: str,
) -> float:
    """
    Factor 3: Experience match (weight 20%).

    Parses ``jobs.experience`` text using four rules (A–D) and compares
    against ``resumes.experience_years``.

    Rules:
      A — Range format ``"X-Y years"``.
      B — Minimum format ``"X+ years"``.
      C — Fresher / entry-level keywords.
      D — Unparseable text → neutral score 0.5 (no penalisation).

    Args:
        experience_years: Integer from ``resumes.experience_years``, or
                          ``None`` if the value could not be extracted.
        job_experience:   Text value of ``jobs.experience``.

    Returns:
        Float in the range ``[0.0, 1.0]``.  Returns ``0.5`` (neutral)
        if ``experience_years`` is ``None``.
    """
    if experience_years is None:
        logger.debug(
            "experience_years is None — returning neutral score 0.5"
        )
        return 0.5

    return _parse_experience_text(job_experience, experience_years)


# ---------------------------------------------------------------------------
# Final Score
# ---------------------------------------------------------------------------


def calculate_final_score(
    skill_score: float,
    role_score: float,
    experience_score: float,
) -> float:
    """
    Combine the three factor scores into a final percentage.

    Formula::

        final_score = (skill_score * 0.50) + (role_score * 0.30) + (experience_score * 0.20)
        final_score_pct = round(final_score * 100, 2)

    Args:
        skill_score:      Float ``[0.0, 1.0]`` from :func:`calculate_skill_score`.
        role_score:       Float ``[0.0, 1.0]`` from :func:`calculate_role_score`.
        experience_score: Float ``[0.0, 1.0]`` from :func:`calculate_experience_score`.

    Returns:
        Float in the range ``[0.0, 100.0]`` rounded to 2 decimal places.
    """
    raw = (skill_score * 0.50) + (role_score * 0.30) + (experience_score * 0.20)
    return round(raw * 100, 2)


# ---------------------------------------------------------------------------
# Labels and helper extractors
# ---------------------------------------------------------------------------


def get_match_label(final_score: float) -> str:
    """
    Return a human-readable match quality label based on the final score.

    Args:
        final_score: Float in the range ``[0.0, 100.0]``.

    Returns:
        One of:
          - ``"Excellent Match"`` (80–100)
          - ``"Good Match"``      (60–79)
          - ``"Partial Match"``   (40–59)
          - ``"Low Match"``       (0–39)
    """
    if final_score >= 80.0:
        return _LABEL_EXCELLENT
    if final_score >= 60.0:
        return _LABEL_GOOD
    if final_score >= 40.0:
        return _LABEL_PARTIAL
    return _LABEL_LOW


def get_matched_skills(
    extracted_skills: list[str],
    job_function: str,
) -> list[str]:
    """
    Return the skills from the resume that also appear in ``job_function``.

    Comparison is case-insensitive; returned strings use the original
    casing from ``extracted_skills``.

    Args:
        extracted_skills: Candidate's skill list.
        job_function:     ``jobs.job_function`` text.

    Returns:
        Sublist of ``extracted_skills`` whose lowercase values appear
        among the lowercase tokens of ``job_function``.
    """
    tokens_lower = {t.strip().lower() for t in job_function.split(",") if t.strip()}
    return [s for s in extracted_skills if s.lower() in tokens_lower]


def get_missing_skills(
    extracted_skills: list[str],
    job_function: str,
) -> list[str]:
    """
    Return the skills listed in ``job_function`` that the candidate lacks.

    Tokens are derived by splitting ``job_function`` on commas and
    stripping whitespace. Skills already present in ``extracted_skills``
    (case-insensitive) are excluded from the result.

    Args:
        extracted_skills: Candidate's skill list.
        job_function:     ``jobs.job_function`` text.

    Returns:
        List of skill tokens from ``job_function`` not found in the
        candidate's ``extracted_skills``, preserving original casing.
    """
    tokens = [t.strip() for t in job_function.split(",") if t.strip()]
    skills_lower = {s.lower() for s in extracted_skills}
    return [t for t in tokens if t.lower() not in skills_lower]


# ---------------------------------------------------------------------------
# Main matching function
# ---------------------------------------------------------------------------


def match_resume_to_jobs(
    resume_profile: dict,
    jobs: list[dict],
) -> list[dict]:
    """
    Match a parsed resume profile against all jobs. Return ranked results.

    Each job is scored using the 3-factor formula.  Results are sorted by
    ``final_score`` descending and assigned a ``rank`` (1 = best match).

    ``jobs.qualification`` is included in each result dict as informational
    context for the caller but is **not** used in any score calculation
    (the resumes table has no education field to compare it against).

    Args:
        resume_profile: Output dict from ``nlp_pipeline.process_resume()``.
                        Expected keys:
                          ``extracted_skills`` (list[str]),
                          ``parsed_role``      (str | None),
                          ``experience_years`` (int | None).
        jobs:           List of job dicts exactly matching the jobs table
                        schema.  Required fields per dict:
                          ``id``, ``company``, ``job_title``,
                          ``job_function``, ``vacancies``,
                          ``qualification``, ``experience``.

    Returns:
        List of match-result dicts sorted by ``final_score`` descending.
        Each dict contains exactly:

        .. code-block:: python

            {
                'job_id':              int,
                'company':             str,
                'job_title':           str,
                'job_function':        str,
                'vacancies':           str,
                'qualification':       str,   # informational only
                'experience_required': str,
                'final_score':         float, # 0.0–100.0
                'skill_score':         float, # 0.0–100.0
                'role_score':          float, # 0.0–100.0
                'experience_score':    float, # 0.0–100.0
                'match_label':         str,
                'matched_skills':      list[str],
                'missing_skills':      list[str],
                'rank':                int,
            }
    """
    extracted_skills: list[str] = resume_profile.get("extracted_skills", [])
    parsed_role: str | None = resume_profile.get("parsed_role")
    experience_years: int | None = resume_profile.get("experience_years")

    results: list[dict] = []

    for job in jobs:
        job_id: int = job["id"]
        company: str = job["company"]
        job_title: str = job["job_title"]
        job_function: str = job.get("job_function", "")
        vacancies: str = job.get("vacancies", "")
        qualification: str = job.get("qualification", "")
        job_experience: str = job.get("experience", "")

        s_score = calculate_skill_score(extracted_skills, job_function)
        r_score = calculate_role_score(parsed_role, job_title)
        e_score = calculate_experience_score(experience_years, job_experience)

        final = calculate_final_score(s_score, r_score, e_score)
        label = get_match_label(final)
        matched = get_matched_skills(extracted_skills, job_function)
        missing = get_missing_skills(extracted_skills, job_function)

        results.append(
            {
                "job_id": job_id,
                "company": company,
                "job_title": job_title,
                "job_function": job_function,
                "vacancies": vacancies,
                "qualification": qualification,        # informational only
                "experience_required": job_experience,
                "final_score": final,
                "skill_score": round(s_score * 100, 2),
                "role_score": round(r_score * 100, 2),
                "experience_score": round(e_score * 100, 2),
                "match_label": label,
                "matched_skills": matched,
                "missing_skills": missing,
                "rank": 0,  # assigned after sort
            }
        )

    # Sort by final_score descending.
    results.sort(key=lambda x: x["final_score"], reverse=True)

    # Assign ranks (1-based).
    for index, result in enumerate(results):
        result["rank"] = index + 1

    logger.info(
        "Matched %d job(s). Top match: '%s' @ %.2f%%",
        len(results),
        results[0]["job_title"] if results else "N/A",
        results[0]["final_score"] if results else 0.0,
    )
    return results
