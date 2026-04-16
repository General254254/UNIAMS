# UniAMS — University Assignment Management System

## Stack
| Layer | Technology |
|---|---|
| Backend | Django 4.2 + DRF + simplejwt |
| Database | PostgreSQL |
| File Storage | Local media/ (dev) |
| Plagiarism | scikit-learn TF-IDF + pdfplumber + python-docx |
| Frontend | React 18 + Vite + Tailwind CSS |

---

## Folder Structure
```
Easier/
├── backend/          ← Django project
│   ├── config/       ← settings, urls, wsgi
│   ├── accounts/     ← CustomUser, auth endpoints
│   ├── units/        ← Unit, Assignment, RevisionMaterial, Submission
│   │   └── management/commands/check_plagiarism.py
│   ├── plagiarism/   ← text extractor + similarity engine
│   └── media/        ← unit-scoped uploads (git-ignored)
│       └── units/{unit_id}/
│           ├── assignments/
│           ├── revisions/
│           └── submissions/{assignment_id}/{student_id}/
└── frontend/         ← React + Vite
```

---

## Quick Start

### 1. Start PostgreSQL
```bash
docker-compose up -d
```

### 2. Backend setup
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env        # edit SECRET_KEY if needed
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the Vite proxy forwards `/api` and `/media` to Django on port 8000.

---

## API Reference

### Auth
| Method | URL | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register with role & unit_ids |
| POST | `/api/auth/login/` | Returns access + refresh JWT |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET  | `/api/auth/me/` | Current user profile |

### Units & Resources
| Method | URL | Access |
|---|---|---|
| GET | `/api/units/` | Any authenticated user |
| GET | `/api/units/<id>/` | Enrolled / lecturer |
| GET/POST | `/api/units/<id>/assignments/` | GET: enrolled; POST: lecturer only |
| GET/PATCH/DELETE | `/api/units/<id>/assignments/<id>/` | Lecturer |
| GET | `/api/units/<id>/assignments/<id>/submissions/` | Rep or Lecturer |
| GET | `/api/units/<id>/assignments/<id>/download-zip/` | Rep or Lecturer |
| GET | `/api/units/<id>/assignments/<id>/plagiarism-report/` | Lecturer only |
| GET/POST | `/api/units/<id>/revisions/` | GET: enrolled; POST: lecturer |
| GET/DELETE | `/api/units/<id>/revisions/<id>/` | Lecturer to delete |
| POST | `/api/submissions/` | Student only |
| GET  | `/api/submissions/mine/` | Student's own |

---

## Plagiarism Check (CLI)
```bash
python manage.py check_plagiarism --unit 1 --assignment 3
```
- Compares submissions **within the same assignment only** (unit-scoped)
- Saves `similarity_score` to each Submission
- Emails lecturer if any pair > 75% cosine similarity
- Outputs a console table

---

## File Upload Paths
```
media/units/1/assignments/report.pdf
media/units/1/revisions/lecture_notes.pdf
media/units/1/submissions/3/7/essay.docx
              ^unit  ^asgn ^student
```

## Roles
| Role | Can do |
|---|---|
| **student** | Upload submissions, view assignments & revisions in enrolled units |
| **rep** | View all submissions, download ZIP, view revisions (enrolled units) |
| **lecturer** | Create/edit/delete assignments, upload revisions, download ZIP, view plagiarism report |
