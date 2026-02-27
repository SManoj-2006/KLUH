"""debug_last_failure.py — identify the one remaining failing test"""
import sys
sys.path.insert(0, ".")

from main import app
from fastapi.testclient import TestClient
from tests.conftest import make_pdf_bytes, PYTHON_BACKEND_RESUME_TEXT, MECHANICAL_RESUME_TEXT
import io, json

with TestClient(app, raise_server_exceptions=False) as client:
    # Test none_experience_years_neutral  (the suspect test)
    payload = {
        "resume_profile": {
            "extracted_skills": ["Python"],
            "parsed_role": "Developer",
            "experience_years": None,
        },
        "jobs": [
            {
                "id": 1, "company": "TC", "job_title": "Python Backend Engineer",
                "job_function": "Python, Django, SQL, REST API",
                "vacancies": "3", "qualification": "B.Tech", "experience": "2-4 years",
            }
        ],
    }
    resp = client.post("/match-jobs", json=payload)
    print("none_exp_years test - Status:", resp.status_code)
    matches = resp.json()["data"]["job_matches"]
    for m in matches:
        print(f"  job_id={m['job_id']} exp_score={m['experience_score']}")

    # Test mechanical resume rank
    pdf_bytes = make_pdf_bytes(MECHANICAL_RESUME_TEXT)
    resp2 = client.post("/upload-resume", files={"file": ("r.pdf", io.BytesIO(pdf_bytes), "application/pdf")})
    print("mechanical upload - Status:", resp2.status_code)
    if resp2.status_code == 200:
        matches2 = resp2.json()["data"]["job_matches"]
        print("  Top match:", matches2[0]["job_id"], matches2[0]["job_title"], matches2[0]["final_score"])
        print("  All job_ids in order:", [m["job_id"] for m in matches2])
