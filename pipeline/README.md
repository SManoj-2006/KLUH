# KLUH Resume Matching Pipeline

A standalone Python **FastAPI** microservice that parses PDF resumes with spaCy NLP and scores candidates against job listings using a 3-factor matching algorithm. Runs on **port 8000**, completely independent of the Express backend on port 3001.

---

## Database Schema Reference

This pipeline maps to the following **Supabase PostgreSQL** tables:

| Resume field | Job field | Weight | Purpose |
|---|---|---|---|
| `resumes.extracted_skills` (jsonb) | `jobs.job_function` (text) | **50%** | Skill match |
| `resumes.parsed_role` (text) | `jobs.job_title` (text) | **30%** | Role match |
| `resumes.experience_years` (int4) | `jobs.experience` (text) | **20%** | Experience match |
| _(no education field in resumes)_ | `jobs.qualification` | — | Informational only — **not scored** |

### Match Score Formula

```
final_score = (skill_score × 0.50) + (role_score × 0.30) + (experience_score × 0.20)
final_score_pct = round(final_score × 100, 2)
```

| Score range | Label |
|---|---|
| 80–100 | Excellent Match |
| 60–79 | Good Match |
| 40–59 | Partial Match |
| 0–39 | Low Match |

### Matching Factor Details

**Factor 1 — Skill Match (50%)**
- Tokenise `jobs.job_function` by splitting on commas
- Compare each token against `resumes.extracted_skills` (case-insensitive)
- `skill_score = matched_count / total_job_function_tokens`

**Factor 2 — Role Match (30%)**
- Tokenise `resumes.parsed_role` and `jobs.job_title` into words
- Remove stop words: `and or the a an of in at for`
- `role_score = matched_words_from_role / total_words_in_parsed_role`

**Factor 3 — Experience Match (20%)**
- Rule A — Range `"X-Y years"`: full score if within range, penalised gradually outside
- Rule B — Minimum `"X+ years"`: full score if ≥ X, penalised below
- Rule C — `"Fresher"` / `"Entry Level"`: full score if ≤ 1 year
- Rule D — Unparseable: neutral score of 0.5 (no penalisation)

---

## Two Ways to Use This Pipeline

### Option A — Full pipeline (PDF upload → extract → match with local jobs)

```bash
POST http://localhost:8000/upload-resume
Content-Type: multipart/form-data
Body: file=@/path/to/resume.pdf
```

The pipeline:
1. Extracts text from the PDF using PyMuPDF
2. Cleans and lowercases the text
3. Uses spaCy + PhraseMatcher to extract `extracted_skills`, `parsed_role`, `experience_years`
4. Scores the candidate against the 10 jobs in `jobs_data.json`
5. Returns ranked `job_matches` sorted by `final_score` descending

### Option B — Match only (caller provides Supabase job data)

```bash
POST http://localhost:8000/match-jobs
Content-Type: application/json
```

```json
{
  "resume_profile": {
    "extracted_skills": ["Python", "SQL", "React"],
    "parsed_role": "Backend Developer",
    "experience_years": 3
  },
  "jobs": [
    {
      "id": 1,
      "company": "TechCorp Hyderabad",
      "job_title": "Python Backend Engineer",
      "job_function": "Software Development, Python, Django, SQL, REST API",
      "vacancies": "3",
      "qualification": "B.Tech",
      "experience": "2-4 years"
    }
  ]
}
```

This endpoint exists so the Express backend can forward jobs fetched directly from Supabase without this pipeline needing any database credentials.

### Saving results to the recommendations table

For each item in `job_matches`:

```sql
INSERT INTO recommendations (user_id, job_id, match_score)
VALUES (:auth_user_id, :job_matches_n_job_id, :job_matches_n_final_score);
```

---

## Setup

### 1. Create and activate a virtual environment

```bash
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Download the spaCy model

```bash
python -m spacy download en_core_web_sm
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env if you want to change the port (default: 8000)
```

### 5. Run the server

```bash
uvicorn main:app --reload --port 8000
```

---

## File Structure

```
pipeline/
├── main.py              FastAPI app — 4 endpoints + lifespan startup
├── extractor.py         PDF text extraction (PyMuPDF)
├── cleaner.py           Text normalisation and lowercasing
├── nlp_pipeline.py      spaCy NLP — extracts skills, role, experience
├── matcher.py           3-factor scoring + ranking engine
├── jobs_data.json       10 sample jobs (matches jobs table schema exactly)
├── skills_list.txt      75+ skills for PhraseMatcher
├── requirements.txt     Python dependencies
├── .env.example         Environment variable template
└── README.md            This file
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload-resume` | Upload PDF, extract profile, match local jobs |
| `POST` | `/match-jobs` | Match pre-parsed profile against caller-supplied jobs |
| `GET` | `/jobs` | Return local `jobs_data.json` for testing |
| `GET` | `/health` | Service health check |

---

## Testing with curl

```bash
# Health check
curl http://localhost:8000/health

# View local jobs
curl http://localhost:8000/jobs

# Upload a PDF resume
curl -X POST http://localhost:8000/upload-resume \
     -F "file=@/path/to/resume.pdf"

# Match using pre-parsed data
curl -X POST http://localhost:8000/match-jobs \
     -H "Content-Type: application/json" \
     -d '{
       "resume_profile": {
         "extracted_skills": ["Python", "SQL", "Django"],
         "parsed_role": "Backend Developer",
         "experience_years": 3
       },
       "jobs": [
         {
           "id": 1,
           "company": "TechCorp",
           "job_title": "Python Backend Engineer",
           "job_function": "Python, Django, SQL, REST API",
           "vacancies": "2",
           "qualification": "B.Tech",
           "experience": "2-4 years"
         }
       ]
     }'
```

---

## Notes

- The `jobs.qualification` field is **never used in scoring** because the `resumes` table has no corresponding education column. It is included in match results as informational context only.
- All data is processed in-memory; this service holds no database credentials.
- The spaCy model and PhraseMatcher are loaded **once at startup** (FastAPI lifespan) and reused for every request — no per-request reloading.
- Uploaded PDFs are saved to `/tmp/resume_pipeline_upload.pdf` and **always deleted** in a `finally` block after processing.
