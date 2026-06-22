# AI Resume Job Matcher

An AI-powered full-stack application that compares a resume against a job description, scores the fit, identifies strengths and gaps, recommends resume improvements, and drafts a tailored cover letter.

The project is designed to be GitHub-ready: it includes a usable frontend, FastAPI backend, database persistence, file parsing, optional OpenAI integration, Docker support, tests, and clear setup docs.

## Features

- Paste resume text or upload PDF, DOCX, or TXT resumes
- Paste any job description
- Generate match score, summary, strengths, gaps, recommendations, and cover letter
- Save analysis history in SQLite by default
- Works without an API key using a local keyword-based analyzer
- Uses OpenAI automatically when `OPENAI_API_KEY` is configured
- Includes Docker Compose for local full-stack startup

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, lucide-react
- Backend: FastAPI, SQLModel, Pydantic, SQLite
- AI: OpenAI API with local fallback analyzer
- File parsing: pypdf, python-docx
- DevOps: Docker, Docker Compose
- Testing: pytest

## Architecture

```txt
Browser
  |
  | Next.js UI
  v
Frontend :3000
  |
  | REST API
  v
FastAPI Backend :8000
  |
  | SQLModel
  v
SQLite database
  |
  | optional
  v
OpenAI API
```

## Project Structure

```txt
ai-resume-job-matcher/
  backend/
    app/
      api/
      core/
      models/
      prompts/
      schemas/
      services/
    tests/
  frontend/
    app/
    components/
    lib/
  docker-compose.yml
```

## Local Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at:

```txt
http://localhost:8000
```

API docs:

```txt
http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at:

```txt
http://localhost:3000
```

## Docker Setup

Create environment files first:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

## OpenAI Configuration

The app runs without OpenAI. To enable AI-quality analysis, set:

```env
OPENAI_API_KEY="your_api_key"
OPENAI_MODEL="gpt-4o-mini"
```

When no key is present, the backend uses a deterministic local analyzer so reviewers can test the project immediately.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Backend health check |
| GET | `/api/analyses` | List recent analyses |
| POST | `/api/analyses/text` | Analyze pasted resume text |
| POST | `/api/analyses/upload` | Analyze uploaded resume file |

Example request:

```bash
curl -X POST http://localhost:8000/api/analyses/text \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Jane Doe\nReact FastAPI PostgreSQL dashboard experience",
    "job_description": "Senior Full Stack Engineer with React, FastAPI, PostgreSQL and AI experience"
  }'
```

## Testing

```bash
cd backend
pytest
```

## Roadmap

- Add authentication and per-user analysis history
- Add PostgreSQL profile for production deployment
- Add RAG over previous resumes and job descriptions
- Add export to PDF for generated recommendations
- Add richer scoring categories such as skills, seniority, domain, and impact
- Add CI with backend tests and frontend linting

## License

MIT
