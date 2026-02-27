"""test_match_jobs_live.py — test /match-jobs against live Supabase jobs"""
import urllib.request
import json

BASE = "http://127.0.0.1:8000"

# --- Step 1: Get all Supabase jobs from /jobs endpoint ---
r = urllib.request.urlopen(f"{BASE}/jobs")
jobs_data = json.loads(r.read())
jobs = jobs_data["data"]["jobs"]
print(f"Total jobs loaded from Supabase: {len(jobs)}")
print()

# --- Step 2: Test Profile 1 — Python Backend Developer (3yr) ---
profile_python = {
    "extracted_skills": ["Python", "Django", "SQL", "REST API", "Docker", "Git"],
    "parsed_role": "Backend Developer",
    "experience_years": 3,
}

body = json.dumps({"resume_profile": profile_python, "jobs": jobs}).encode()
req = urllib.request.Request(
    f"{BASE}/match-jobs",
    data=body,
    headers={"Content-Type": "application/json"},
    method="POST",
)
result = json.loads(urllib.request.urlopen(req).read())["data"]

print("=" * 60)
print("PROFILE 1: Python Backend Developer | 3 yrs | Python/Django/SQL/Docker")
print(f"Processing time: {result['processing_time_ms']} ms")
print(f"Total jobs analysed: {result['total_jobs_analysed']}")
print()
print("TOP 5 MATCHES:")
for m in result["job_matches"][:5]:
    print(f"  #{m['rank']} [{m['match_label']}] {m['job_title']} @ {m['company']}")
    print(f"      Final: {m['final_score']}%  |  Skills: {m['skill_score']}%  |  Role: {m['role_score']}%  |  Exp: {m['experience_score']}%")
    print(f"      Matched skills : {m['matched_skills']}")
    print(f"      Missing skills : {m['missing_skills']}")
    print()

# --- Step 3: Test Profile 2 — Fresher Data Analyst ---
profile_fresher = {
    "extracted_skills": ["SQL", "Power BI", "Advanced Excel", "Tableau"],
    "parsed_role": "Data Analyst",
    "experience_years": 0,
}

body2 = json.dumps({"resume_profile": profile_fresher, "jobs": jobs}).encode()
req2 = urllib.request.Request(
    f"{BASE}/match-jobs",
    data=body2,
    headers={"Content-Type": "application/json"},
    method="POST",
)
result2 = json.loads(urllib.request.urlopen(req2).read())["data"]

print("=" * 60)
print("PROFILE 2: Fresher Data Analyst | 0 yrs | SQL/Power BI/Excel/Tableau")
print()
print("TOP 5 MATCHES:")
for m in result2["job_matches"][:5]:
    print(f"  #{m['rank']} [{m['match_label']}] {m['job_title']} @ {m['company']}")
    print(f"      Final: {m['final_score']}%  |  Skills: {m['skill_score']}%  |  Role: {m['role_score']}%  |  Exp: {m['experience_score']}%")
    print()
