# RPG Telemetry & Quest QA Dashboard

A full-stack game development QA tool for collecting RPG gameplay telemetry, validating quest state transitions, analyzing playtest sessions, and generating reproducible bug reports.

## Overview

Large RPGs contain branching quests, dependent objectives, rewards, dialogue choices, and world-state transitions. Bugs in these systems can be difficult to reproduce from a tester's written description alone.

This project demonstrates how structured gameplay telemetry can help QA engineers and developers:

- inspect complete playtest sessions;
- detect invalid quest states automatically;
- identify problematic game areas;
- analyze player deaths and performance drops;
- generate consistent Markdown bug reports with reproduction steps.

## Current Status

The backend API, analytical frontend dashboard, automated test suite, continuous integration workflow, and Docker Compose environment are implemented and connected.

The project currently supports:

- playtest session creation;
- telemetry event ingestion;
- quest state validation;
- automatic issue detection;
- Markdown bug report generation;
- session event timelines;
- telemetry payload inspection;
- issue filtering and search;
- gameplay analytics charts;
- area risk scoring;
- responsive frontend navigation;
- route-level frontend code splitting;
- isolated backend API tests;
- quest validator and bug report tests;
- automated frontend linting and production builds;
- full-stack Docker startup;
- automated Docker smoke testing in CI.

Unreal Engine telemetry integration is the next major development stage.

## Tech Stack

### Backend

- Python 3.10
- FastAPI
- SQLAlchemy
- PostgreSQL
- Psycopg 3
- Pydantic

### Frontend

- React
- TypeScript
- Vite
- React Router
- Recharts
- Nginx

### Testing and CI

- pytest
- FastAPI TestClient
- isolated in-memory SQLite test database
- ESLint
- GitHub Actions
- Docker smoke tests

### Infrastructure

- Docker
- Docker Compose
- PostgreSQL container
- multi-stage frontend image
- Nginx reverse proxy
- persistent Docker volume

### Planned Game Integration

- Unreal Engine 5
- reusable C++ telemetry sender
- UE5 demonstration level

## Architecture

```text
Gameplay Client / Demo Generator
              |
              v
        FastAPI Backend
              |
              v
         PostgreSQL
              |
              v
     React QA Dashboard
```

The gameplay client sends structured telemetry events to the API. The backend stores the events, validates quest progression, and creates detected issues. The frontend retrieves the stored data and presents it as timelines, filters, charts, and risk summaries.

The Docker environment uses the following structure:

```text
Browser
   |
   v
Nginx + React
   |
   | /api
   v
FastAPI Backend
   |
   v
PostgreSQL
```

Nginx serves the production frontend and proxies `/api` requests to the FastAPI container.

## Implemented Features

### Telemetry Sessions

- create and list playtest sessions;
- retrieve a session with its events and detected issues;
- associate events with player, build, quest, area, and timestamp;
- store arbitrary structured event payloads.

### Quest Validation

The validation service detects invalid quest situations such as:

- rewards granted before quest completion;
- quests completed without all required stages;
- incomplete or inconsistent quest progression.

Detected issues contain:

- severity;
- title and description;
- related quest and telemetry event;
- reproduction steps;
- session and build context.

### Bug Report Generation

Each detected issue can be exported as a Markdown bug report containing:

- issue summary;
- severity and build version;
- affected quest;
- related event;
- reproduction steps;
- expected and actual behavior.

### Dashboard

The React dashboard includes:

- total sessions, events, issues, and latest build;
- telemetry events grouped by type;
- detected issues grouped by severity;
- player deaths and FPS drops grouped by area;
- area risk overview;
- session list;
- detailed event timeline;
- expandable event payloads;
- issue search and filters;
- links to generated Markdown bug reports.

## Area Risk Analysis

The dashboard calculates a transparent risk score for each game area:

```text
Player death      +3
FPS drop          +2
Critical issue    +4
High issue        +3
Medium issue      +2
Low issue         +1
```

Risk levels:

```text
0–1    Low
2–4    Medium
5–7    High
8+     Critical
```

This score is an analytical QA heuristic rather than a gameplay difficulty measurement.

## Run with Docker

The complete application can be built and started with Docker Compose:

```bash
docker compose up --build
```

Available services:

```text
Frontend       http://localhost:8080
Backend        http://localhost:8000
API docs       http://localhost:8000/docs
PostgreSQL     localhost:5433
```

Generate demonstration playtest sessions inside the backend container:

```bash
docker compose exec backend python scripts/generate_sessions.py
```

View running services:

```bash
docker compose ps
```

Stop the application:

```bash
docker compose down
```

The PostgreSQL data is stored in a named Docker volume and remains available after a normal restart.

Remove the containers and all containerized PostgreSQL data:

```bash
docker compose down --volumes
```

The Docker environment does not require a locally installed PostgreSQL server, Python virtual environment, or Node.js dependencies.

## Run Locally without Docker

### Backend

Open a terminal in the backend directory:

```bash
cd backend
```

Create and activate a Python virtual environment.

Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the PostgreSQL connection through `DATABASE_URL`, then start FastAPI:

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

For backend-specific instructions, see:

```text
backend/README.md
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at:

```text
http://localhost:5173
```

For frontend configuration and available routes, see:

```text
frontend/README.md
```

## Generate Demo Sessions

With the backend running locally:

```bash
cd backend
python scripts/generate_sessions.py
```

The generator creates several example playtest scenarios:

- normal quest completion;
- player death;
- FPS drops;
- quest completed without required stages;
- reward granted before quest completion.

Broken sessions can then be validated through the API to create detected issues.

## Main API Endpoints

```http
GET  /health

POST /sessions
GET  /sessions
GET  /sessions/{session_id}

POST /events
GET  /sessions/{session_id}/events

POST /sessions/{session_id}/validate

GET  /issues/{issue_id}/bug-report
```

## Frontend Routes

```text
/                     Dashboard and gameplay analytics
/sessions             Playtest session list
/sessions/{id}        Session details and event timeline
/issues                Searchable and filterable issue list
```

## Backend Tests

Install development dependencies:

```bash
cd backend
pip install -r requirements-dev.txt
```

Run the full test suite:

```bash
python -m pytest
```

The tests cover:

- health endpoint;
- session creation and retrieval;
- telemetry event ingestion;
- missing-resource responses;
- valid quest progression;
- missing required quest stages;
- rewards granted before completion;
- repeated validation;
- Markdown bug report generation.

The test suite uses an isolated in-memory SQLite database and does not modify the development PostgreSQL database.

## Frontend Quality Checks

```bash
cd frontend
npm run lint
npm run build
```

The frontend uses lazy-loaded routes and code splitting so analytical dependencies are not included in every initial page load.

## Continuous Integration

GitHub Actions runs automatically on every push and pull request.

The workflow contains three jobs:

```text
Backend Tests
- install Python dependencies
- run the complete pytest suite

Frontend Lint and Build
- install locked npm dependencies
- run ESLint
- create a production build

Docker Smoke Test
- build the complete Docker Compose stack
- start PostgreSQL, FastAPI, and Nginx
- verify the backend health endpoint
- verify the frontend
- verify the Nginx-to-FastAPI API proxy
```

The Docker smoke test runs only after the backend and frontend jobs complete successfully.

## Roadmap

- create an Unreal Engine 5 demonstration level;
- implement a reusable C++ telemetry sender;
- send real gameplay events from Unreal Engine to FastAPI;
- test end-to-end telemetry ingestion from the game;
- add architecture diagrams and application screenshots;
- prepare a portfolio demonstration video;
- complete final documentation and deployment notes.

## Project Purpose

This is a portfolio project focused on backend development, gameplay telemetry, QA automation, automated testing, continuous integration, containerization, data analysis, and integration between game code and external development tools.