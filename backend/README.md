# Backend

FastAPI backend for RPG Telemetry & Quest QA Dashboard.

## Current Day Scope

- FastAPI application setup
- PostgreSQL connection
- SQLAlchemy ORM configuration
- Initial database models:
  - PlaytestSession
  - TelemetryEvent
  - DetectedIssue
- Health check endpoint

## Run Locally

Create and activate virtual environment:

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create .env file:

```bash
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/rpg_telemetry_db
```

Run server:

```bash
uvicorn app.main:app --reload
```

Open:

```bash
http://127.0.0.1:8000/docs
```