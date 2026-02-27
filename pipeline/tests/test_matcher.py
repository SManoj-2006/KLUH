"""
tests/test_matcher.py — Unit tests for matcher.py

Tests cover:
  - calculate_skill_score: exact match, partial match, no match, case insensitivity
  - calculate_role_score: word overlap, stop-word removal, None parsed_role
  - calculate_experience_score: Rules A/B/C/D, None experience_years
  - calculate_final_score: formula verification
  - get_match_label: all 4 threshold bands
  - get_matched_skills / get_missing_skills: case-insensitive set logic
  - match_resume_to_jobs: ranking, output shape, qualification is informational only
"""
from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from matcher import (
    calculate_experience_score,
    calculate_final_score,
    calculate_role_score,
    calculate_skill_score,
    get_match_label,
    get_matched_skills,
    get_missing_skills,
    match_resume_to_jobs,
)


# ===========================================================================
# FACTOR 1 — Skill Score
# ===========================================================================

class TestCalculateSkillScore:
    def test_perfect_match(self):
        skills = ["Python", "SQL", "Django"]
        job_fn = "Python, SQL, Django"
        score = calculate_skill_score(skills, job_fn)
        assert score == pytest.approx(1.0)

    def test_partial_match(self):
        # Spec example: ["Python","SQL","React"] vs "Software Development, Python, Django, SQL"
        # tokens: ["Software Development","Python","Django","SQL"] = 4
        # matched: Python, SQL = 2 → 2/4 = 0.50
        skills = ["Python", "SQL", "React"]
        job_fn = "Software Development, Python, Django, SQL"
        score = calculate_skill_score(skills, job_fn)
        assert score == pytest.approx(0.50)

    def test_no_match(self):
        skills = ["Kotlin", "Swift", "Rust"]
        job_fn = "Python, Django, SQL, REST API"
        score = calculate_skill_score(skills, job_fn)
        assert score == pytest.approx(0.0)

    def test_case_insensitive(self):
        # "python" vs "Python" in job_fn
        skills = ["python", "sql"]
        job_fn = "Python, SQL, Django"
        score = calculate_skill_score(skills, job_fn)
        assert score == pytest.approx(2 / 3)

    def test_empty_skills_returns_zero(self):
        score = calculate_skill_score([], "Python, SQL, Django")
        assert score == pytest.approx(0.0)

    def test_empty_job_function_returns_zero(self):
        score = calculate_skill_score(["Python", "SQL"], "")
        assert score == pytest.approx(0.0)

    def test_score_clamped_at_one(self):
        # More matching skills than job tokens shouldn't exceed 1.0
        skills = ["Python", "SQL", "Django", "REST API", "Docker"]
        job_fn = "Python, SQL"
        score = calculate_skill_score(skills, job_fn)
        assert 0.0 <= score <= 1.0
        assert score == pytest.approx(1.0)

    def test_single_token_job_function(self):
        skills = ["Python"]
        job_fn = "Python"
        score = calculate_skill_score(skills, job_fn)
        assert score == pytest.approx(1.0)

    def test_whitespace_trimmed_in_tokens(self):
        skills = ["Power BI"]
        job_fn = "  SQL ,  Power BI , Advanced Excel "
        score = calculate_skill_score(skills, job_fn)
        assert score == pytest.approx(1 / 3)


# ===========================================================================
# FACTOR 2 — Role Score
# ===========================================================================

class TestCalculateRoleScore:
    def test_spec_example(self):
        # Spec: "Backend Developer" vs "Python Backend Engineer"
        # parsed words (no stopwords): ["backend","developer"]
        # title words: ["python","backend","engineer"]
        # matched: ["backend"] → 1/2 = 0.50
        score = calculate_role_score("Backend Developer", "Python Backend Engineer")
        assert score == pytest.approx(0.50)

    def test_full_match(self):
        score = calculate_role_score("Software Engineer", "Software Engineer")
        assert score == pytest.approx(1.0)

    def test_none_parsed_role_returns_zero(self):
        score = calculate_role_score(None, "Python Backend Engineer")
        assert score == pytest.approx(0.0)

    def test_empty_parsed_role_returns_zero(self):
        score = calculate_role_score("", "Python Backend Engineer")
        assert score == pytest.approx(0.0)

    def test_stop_words_are_removed(self):
        # "Developer" matches "Developer" but stop words "the", "a" are stripped
        score = calculate_role_score("the Developer", "a Software Developer")
        # After stopword removal: parsed = ["developer"], title = ["software","developer"]
        # matched = 1/1 = 1.0
        assert score == pytest.approx(1.0)

    def test_case_insensitive(self):
        score = calculate_role_score("BACKEND DEVELOPER", "backend developer engineer")
        assert score == pytest.approx(1.0)

    def test_no_overlap_returns_zero(self):
        score = calculate_role_score("Accountant Manager", "Software Engineer")
        assert score == pytest.approx(0.0)

    def test_data_analyst(self):
        score = calculate_role_score("Data Analyst", "Senior Data Analyst")
        # parsed: ["data","analyst"] → both in title → 2/2 = 1.0
        assert score == pytest.approx(1.0)


# ===========================================================================
# FACTOR 3 — Experience Score
# ===========================================================================

class TestCalculateExperienceScore:
    # Rule A — Range format
    def test_rule_a_within_range(self):
        # 3 years, "2-4 years" → exactly in range → 1.0
        score = calculate_experience_score(3, "2-4 years")
        assert score == pytest.approx(1.0)

    def test_rule_a_at_lower_bound(self):
        score = calculate_experience_score(2, "2-4 years")
        assert score == pytest.approx(1.0)

    def test_rule_a_at_upper_bound(self):
        score = calculate_experience_score(4, "2-4 years")
        assert score == pytest.approx(1.0)

    def test_rule_a_below_range_penalised(self):
        # 0 years, range 2-4 → 1 - (2-0)*0.2 = 1 - 0.4 = 0.6
        score = calculate_experience_score(0, "2-4 years")
        assert score == pytest.approx(0.6)

    def test_rule_a_above_range_penalised(self):
        # 7 years, range 2-4 → 1 - (7-4)*0.1 = 1 - 0.3 = 0.7
        score = calculate_experience_score(7, "2-4 years")
        assert score == pytest.approx(0.7)

    def test_rule_a_far_below_clamps_to_zero(self):
        # 0 years, range 10-15 → 1 - (10-0)*0.2 = 1 - 2.0 < 0 → 0.0
        score = calculate_experience_score(0, "10-15 years")
        assert score == pytest.approx(0.0)

    # Rule B — Minimum ("X+ years")
    def test_rule_b_above_minimum(self):
        score = calculate_experience_score(5, "3+ years")
        assert score == pytest.approx(1.0)

    def test_rule_b_exactly_minimum(self):
        score = calculate_experience_score(3, "3+ years")
        assert score == pytest.approx(1.0)

    def test_rule_b_below_minimum(self):
        # 1 year, "3+" → 1 - (3-1)*0.2 = 1 - 0.4 = 0.6
        score = calculate_experience_score(1, "3+ years")
        assert score == pytest.approx(0.6)

    # Rule C — Fresher
    def test_rule_c_fresher_zero_years(self):
        score = calculate_experience_score(0, "Fresher")
        assert score == pytest.approx(1.0)

    def test_rule_c_fresher_one_year(self):
        score = calculate_experience_score(1, "Fresher")
        assert score == pytest.approx(1.0)

    def test_rule_c_fresher_two_years(self):
        # 2 years, fresher → 1 - (2-1)*0.2 = 0.8
        score = calculate_experience_score(2, "Fresher")
        assert score == pytest.approx(0.8)

    def test_rule_c_entry_level(self):
        score = calculate_experience_score(0, "Entry Level")
        assert score == pytest.approx(1.0)

    def test_rule_c_overqualified_clamped(self):
        # 7 years, fresher → 1 - (7-1)*0.2 = 1-1.2 = -0.2 → 0.0
        score = calculate_experience_score(7, "Fresher")
        assert score == pytest.approx(0.0)

    # Rule D — Unparseable
    def test_rule_d_unparseable_returns_neutral(self):
        score = calculate_experience_score(3, "Negotiable")
        assert score == pytest.approx(0.5)

    def test_rule_d_empty_string_neutral(self):
        score = calculate_experience_score(3, "")
        assert score == pytest.approx(0.5)

    # None experience_years → neutral
    def test_none_experience_years_returns_neutral(self):
        score = calculate_experience_score(None, "2-4 years")
        assert score == pytest.approx(0.5)


# ===========================================================================
# Final Score
# ===========================================================================

class TestCalculateFinalScore:
    def test_spec_example(self):
        # skill=0.5, role=0.5, exp=1.0
        # (0.5*0.5) + (0.5*0.3) + (1.0*0.2) = 0.25+0.15+0.20 = 0.60 → 60.0
        result = calculate_final_score(0.5, 0.5, 1.0)
        assert result == pytest.approx(60.0)

    def test_all_zero(self):
        assert calculate_final_score(0.0, 0.0, 0.0) == pytest.approx(0.0)

    def test_all_perfect(self):
        assert calculate_final_score(1.0, 1.0, 1.0) == pytest.approx(100.0)

    def test_weights_correct(self):
        # skill only = 1.0, rest 0
        assert calculate_final_score(1.0, 0.0, 0.0) == pytest.approx(50.0)
        # role only = 1.0, rest 0
        assert calculate_final_score(0.0, 1.0, 0.0) == pytest.approx(30.0)
        # exp only = 1.0, rest 0
        assert calculate_final_score(0.0, 0.0, 1.0) == pytest.approx(20.0)

    def test_rounding(self):
        # Ensure result is rounded to 2 decimal places
        result = calculate_final_score(0.333, 0.666, 0.999)
        # 0.333*50 + 0.666*30 + 0.999*20 = 16.65 + 19.98 + 19.98 = 56.61
        assert isinstance(result, float)
        # Confirm rounding to 2dp
        assert result == round(result, 2)


# ===========================================================================
# Match Labels
# ===========================================================================

class TestGetMatchLabel:
    def test_excellent(self):
        assert get_match_label(80.0) == "Excellent Match"
        assert get_match_label(100.0) == "Excellent Match"
        assert get_match_label(95.5) == "Excellent Match"

    def test_good(self):
        assert get_match_label(60.0) == "Good Match"
        assert get_match_label(79.99) == "Good Match"

    def test_partial(self):
        assert get_match_label(40.0) == "Partial Match"
        assert get_match_label(59.99) == "Partial Match"

    def test_low(self):
        assert get_match_label(0.0) == "Low Match"
        assert get_match_label(39.99) == "Low Match"

    def test_boundary_80(self):
        assert get_match_label(80.0) == "Excellent Match"
        assert get_match_label(79.99) == "Good Match"

    def test_boundary_60(self):
        assert get_match_label(60.0) == "Good Match"
        assert get_match_label(59.99) == "Partial Match"

    def test_boundary_40(self):
        assert get_match_label(40.0) == "Partial Match"
        assert get_match_label(39.99) == "Low Match"


# ===========================================================================
# Matched/Missing Skills
# ===========================================================================

class TestMatchedMissingSkills:
    def test_matched_skills_case_insensitive(self):
        skills = ["Python", "SQL", "React"]
        job_fn = "python, sql, django, rest api"
        matched = get_matched_skills(skills, job_fn)
        # python and SQL should both match (case-insensitive)
        matched_lower = [m.lower() for m in matched]
        assert "python" in matched_lower
        assert "sql" in matched_lower
        assert "react" not in matched_lower

    def test_missing_skills_returns_tokens_not_in_resume(self):
        skills = ["Python", "SQL"]
        job_fn = "Python, SQL, Django, REST API"
        missing = get_missing_skills(skills, job_fn)
        missing_lower = [m.lower() for m in missing]
        assert "django" in missing_lower
        assert "rest api" in missing_lower
        assert "python" not in missing_lower
        assert "sql" not in missing_lower

    def test_no_matched_skills(self):
        skills = ["Kotlin", "Swift"]
        job_fn = "Python, Django, SQL"
        assert get_matched_skills(skills, job_fn) == []

    def test_all_skills_matched(self):
        skills = ["Python", "Django"]
        job_fn = "Python, Django"
        missing = get_missing_skills(skills, job_fn)
        assert missing == []


# ===========================================================================
# Full Pipeline: match_resume_to_jobs
# ===========================================================================

class TestMatchResumeToJobs:
    def setup_method(self):
        self.jobs = [
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
                "job_function": "React, JavaScript, TypeScript, CSS",
                "vacancies": "2",
                "qualification": "BCA",
                "experience": "Fresher",
            },
            {
                "id": 3,
                "company": "Precision Fabricators",
                "job_title": "Mechanical Design Engineer",
                "job_function": "AutoCAD, CATIA, ANSYS, MATLAB",
                "vacancies": "1",
                "qualification": "B.Tech Mechanical",
                "experience": "3-5 years",
            },
        ]
        self.python_profile = {
            "extracted_skills": ["Python", "Django", "SQL", "REST API"],
            "parsed_role": "Backend Developer",
            "experience_years": 3,
        }

    def test_returns_all_jobs_ranked(self):
        results = match_resume_to_jobs(self.python_profile, self.jobs)
        assert len(results) == 3

    def test_sorted_by_final_score_descending(self):
        results = match_resume_to_jobs(self.python_profile, self.jobs)
        scores = [r["final_score"] for r in results]
        assert scores == sorted(scores, reverse=True)

    def test_ranks_assigned_correctly(self):
        results = match_resume_to_jobs(self.python_profile, self.jobs)
        ranks = [r["rank"] for r in results]
        assert ranks == list(range(1, len(self.jobs) + 1))

    def test_python_job_ranks_first(self):
        results = match_resume_to_jobs(self.python_profile, self.jobs)
        assert results[0]["job_id"] == 1  # Python Backend Engineer

    def test_output_keys_complete(self):
        results = match_resume_to_jobs(self.python_profile, self.jobs)
        expected_keys = {
            "job_id", "company", "job_title", "job_function",
            "vacancies", "qualification", "experience_required",
            "final_score", "skill_score", "role_score", "experience_score",
            "match_label", "matched_skills", "missing_skills", "rank",
        }
        for result in results:
            assert expected_keys.issubset(set(result.keys()))

    def test_qualification_present_but_not_scored(self):
        # qualification is passed through but the score must be based only
        # on skill/role/experience — verify it doesn't inflate scores
        results = match_resume_to_jobs(self.python_profile, self.jobs)
        # The mechanical job should score very low despite having "B.Tech Mechanical"
        mech = next(r for r in results if r["job_id"] == 3)
        assert mech["final_score"] < 30.0  # No skill or role overlap
        assert mech["qualification"] == "B.Tech Mechanical"

    def test_score_values_are_floats(self):
        results = match_resume_to_jobs(self.python_profile, self.jobs)
        for r in results:
            assert isinstance(r["final_score"], float)
            assert isinstance(r["skill_score"], float)
            assert isinstance(r["role_score"], float)
            assert isinstance(r["experience_score"], float)

    def test_score_in_valid_range(self):
        results = match_resume_to_jobs(self.python_profile, self.jobs)
        for r in results:
            assert 0.0 <= r["final_score"] <= 100.0
            assert 0.0 <= r["skill_score"] <= 100.0
            assert 0.0 <= r["role_score"] <= 100.0
            assert 0.0 <= r["experience_score"] <= 100.0

    def test_empty_jobs_list(self):
        results = match_resume_to_jobs(self.python_profile, [])
        assert results == []

    def test_none_parsed_role(self):
        profile = {"extracted_skills": ["Python"], "parsed_role": None, "experience_years": 3}
        results = match_resume_to_jobs(profile, self.jobs)
        for r in results:
            assert r["role_score"] == pytest.approx(0.0)

    def test_none_experience_years_neutral(self):
        profile = {
            "extracted_skills": ["Python", "Django"],
            "parsed_role": "Backend Developer",
            "experience_years": None,
        }
        results = match_resume_to_jobs(profile, self.jobs)
        for r in results:
            assert r["experience_score"] == pytest.approx(50.0)

    def test_fresher_profile_vs_fresher_job(self):
        profile = {
            "extracted_skills": ["SQL", "Power BI"],
            "parsed_role": "Data Analyst",
            "experience_years": 0,
        }
        jobs = [{
            "id": 10,
            "company": "DataCo",
            "job_title": "Data Analyst",
            "job_function": "SQL, Power BI, Tableau",
            "vacancies": "1",
            "qualification": "Any Graduate",
            "experience": "Fresher",
        }]
        results = match_resume_to_jobs(profile, jobs)
        assert results[0]["experience_score"] == pytest.approx(100.0)
        assert results[0]["match_label"] in ("Excellent Match", "Good Match", "Partial Match")
