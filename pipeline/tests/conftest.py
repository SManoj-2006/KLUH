"""
tests/conftest.py — Shared pytest fixtures for the pipeline test suite.

Provides:
  - A sample PDF file created in-memory with PyMuPDF for upload tests
  - Sample resume text strings for NLP and matcher tests
  - Sample jobs lists matching the Supabase schema exactly
  - FastAPI TestClient with lifespan properly triggered
"""
from __future__ import annotations

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import io
import json
import tempfile
from pathlib import Path

import fitz  # PyMuPDF
import pytest
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Sample resume text fixtures
# ---------------------------------------------------------------------------

PYTHON_BACKEND_RESUME_TEXT = """
John Smith
Email: john.smith@email.com | Phone: +91-9876543210

Objective: Seeking a position as a Backend Developer with 3 years of experience.

Skills Summary:
Python, Django, SQL, PostgreSQL, REST API, Git, Docker, Linux

Work Experience:
Software Engineer - TechFirm Pvt Ltd          2021 - 2024
  - Built REST API endpoints using Django and Python
  - Managed PostgreSQL databases and optimised SQL queries
  - Deployed applications using Docker on Linux servers

Junior Developer - StartupABC                 2020 - 2021
  - Worked with Python and basic SQL

Education:
B.Tech in Computer Science - 2020

3 years of experience in software development
"""

FRESHER_RESUME_TEXT = """
Priya Patel
Email: priya@email.com

Career Objective: Applying for a Data Analyst position as a fresh graduate.

Skills:
SQL, Advanced Excel, Power BI, Tableau, Communication, MS Office

Education:
B.Tech - Information Technology - 2024

No work experience. Fresher.
"""

MECHANICAL_RESUME_TEXT = """
Rahul Verma
Mechanical Engineer

Summary: 5 years experience in mechanical design and manufacturing.

Technical Skills:
AutoCAD, CATIA, ANSYS, SolidWorks, MATLAB

Experience:
Design Engineer - PrecisionWorks Ltd    2019 - 2024
  - Created 3D models using CATIA and AutoCAD
  - Performed structural analysis using ANSYS and MATLAB

Education:
B.Tech Mechanical Engineering - 2019

5+ years of experience
"""

QA_RESUME_TEXT = """
Ananya Rao
QA Engineer

Objective: Position as QA Automation Engineer

Skills: Selenium, Core Java, SQL, Postman, TestNG, Appium

Experience: 2 years of experience in quality assurance testing

Work History:
QA Analyst - SoftTest Labs            2022 - 2024
"""

EMPTY_SKILLS_RESUME_TEXT = """
Generic Candidate
Looking for any opportunity.

Hobbies: Reading, Cricket, Music.

Education: High School 2020.

No technical skills listed.
"""


# ---------------------------------------------------------------------------
# Sample jobs fixture
# ---------------------------------------------------------------------------

SAMPLE_JOBS = [
    {
        "id": 1,
        "company": "TechCorp Hyderabad",
        "job_title": "Python Backend Engineer",
        "job_function": "Software Development, Python, Django, SQL, REST API",
        "vacancies": "3",
        "qualification": "B.Tech",
        "experience": "2-4 years",
    },
    {
        "id": 2,
        "company": "DataVision Analytics",
        "job_title": "Data Analyst",
        "job_function": "Data Analysis, SQL, Power BI, Advanced Excel, Tableau",
        "vacancies": "2",
        "qualification": "Any Graduate",
        "experience": "Fresher",
    },
    {
        "id": 3,
        "company": "Pixel Studio",
        "job_title": "Frontend Developer",
        "job_function": "React, JavaScript, TypeScript, CSS, Figma",
        "vacancies": "4",
        "qualification": "B.Tech / BCA",
        "experience": "1-2 years",
    },
    {
        "id": 4,
        "company": "Precision Fabricators",
        "job_title": "Mechanical Design Engineer",
        "job_function": "AutoCAD, CATIA, ANSYS, STAAD Pro, MATLAB",
        "vacancies": "3",
        "qualification": "B.Tech Mechanical",
        "experience": "2-4 years",
    },
    {
        "id": 5,
        "company": "CloudNative",
        "job_title": "Cloud Infrastructure Engineer",
        "job_function": "AWS, Docker, Kubernetes, Python, Linux, CI/CD",
        "vacancies": "2",
        "qualification": "B.Tech",
        "experience": "3+ years",
    },
]


# ---------------------------------------------------------------------------
# PDF fixture
# ---------------------------------------------------------------------------

def make_pdf_bytes(text: str) -> bytes:
    """Create a real, valid PDF from the given text using PyMuPDF."""
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text, fontsize=11)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


@pytest.fixture(scope="session")
def python_backend_pdf_bytes():
    return make_pdf_bytes(PYTHON_BACKEND_RESUME_TEXT)


@pytest.fixture(scope="session")
def fresher_pdf_bytes():
    return make_pdf_bytes(FRESHER_RESUME_TEXT)


@pytest.fixture(scope="session")
def mechanical_pdf_bytes():
    return make_pdf_bytes(MECHANICAL_RESUME_TEXT)


@pytest.fixture(scope="session")
def sample_pdf_path(python_backend_pdf_bytes, tmp_path_factory):
    """Write a real PDF to a temp file and return its path."""
    tmp = tmp_path_factory.mktemp("pdfs") / "sample_resume.pdf"
    tmp.write_bytes(python_backend_pdf_bytes)
    return str(tmp)


# ---------------------------------------------------------------------------
# FastAPI TestClient fixture
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def api_client():
    """
    Return a FastAPI TestClient with lifespan enabled.
    This triggers startup (loads spaCy model, reads jobs_data.json).
    """
    from main import app
    with TestClient(app, raise_server_exceptions=True) as client:
        yield client
