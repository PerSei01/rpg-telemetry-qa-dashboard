# RPG Telemetry & Quest QA Dashboard

A full-stack game development QA tool for collecting RPG gameplay telemetry, validating quest state transitions, analyzing playtest sessions, and generating reproducible bug reports.

## Overview

Large RPGs contain branching quests, dependent objectives, rewards, dialogue choices, and world-state transitions. Bugs in these systems can be difficult to reproduce from a tester's written description alone.

This project demonstrates how structured gameplay telemetry can help QA engineers and developers:

- inspect complete playtest sessions;
- distinguish active and completed playtests;
- preserve the real order and timestamps of gameplay events;
- detect invalid quest states automatically;
- identify problematic game areas;
- analyze player deaths and performance drops;
- generate consistent Markdown bug reports with reproduction steps.

The project includes a working Unreal Engine demonstration level that sends gameplay telemetry to FastAPI in real time.

## Current Status

The complete end-to-end telemetry pipeline is implemented:

```text
Unreal Engine 5
        |
        v
    FastAPI
        |
        v
   PostgreSQL
        |
        v
React QA Dashboard
```

The project currently supports:

- Unreal Engine playtest session creation;
- automatic `game_started` and `game_ended` events;
- active and completed session states;
- playtest duration calculation;
- queued Unreal events while a session is being created;
- gameplay telemetry triggers placed directly in a UE5 level;
- telemetry event ingestion;
- preservation of client event timestamps;
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
- session lifecycle regression tests;
- quest validator and bug report tests;
- automated frontend linting and production builds;
- full-stack Docker startup;
- automated Docker smoke testing in CI.

## Tech Stack

### Game Integration

- Unreal Engine 5.8
- C++
- Unreal HTTP module
- Unreal JSON serialization
- `UGameInstanceSubsystem`
- level-based telemetry trigger actors

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

## Architecture

### End-to-End Telemetry Flow

```text
Unreal Engine Demo
        |
        | HTTP + JSON
        v
FastAPI Backend
        |
        | SQLAlchemy
        v
PostgreSQL
        |
        | REST API
        v
React QA Dashboard
```

The Unreal Engine client creates a playtest session and sends structured gameplay events to the API. The backend stores those events, updates the session lifecycle, validates quest progression, and creates detected issues. The frontend retrieves the stored data and presents it as timelines, filters, charts, statuses, durations, and risk summaries.

### Docker Runtime

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

## Unreal Engine Integration

The Unreal project is located at:

```text
unreal-demo/RPGTelemetryDemo
```

Main integration classes:

```text
UTelemetrySubsystem
ATelemetryTrigger
```

### `UTelemetrySubsystem`

The game instance subsystem manages the telemetry lifecycle:

1. initializes when the Unreal playtest starts;
2. queues `game_started` before a backend session is available;
3. checks the FastAPI health endpoint;
4. creates a new playtest session;
5. stores the returned session ID;
6. sends queued and live gameplay events;
7. sends `game_ended` when the playtest stops;
8. waits for pending HTTP requests before the PIE game instance is destroyed.

Each Unreal Play session creates a separate backend playtest session.

### `ATelemetryTrigger`

Telemetry triggers can be placed directly in the level and configured in the Unreal Editor.

Editable values include:

- event type;
- area;
- quest ID;
- quest stage;
- trigger-once behavior.

When the player overlaps a trigger, it sends a structured event to FastAPI.

### Session Lifecycle

```text
Play
  |
  v
game_started
  |
  v
gameplay events
  |
  v
game_ended
  |
  v
Completed session
```

While the Unreal playtest is running, the dashboard displays the session as:

```text
Active
In progress
```

After Stop is pressed in Unreal, the same session becomes:

```text
Completed
<calculated duration>
```

## Implemented Features

### Telemetry Sessions

- create and list playtest sessions;
- retrieve a session with its events and detected issues;
- distinguish active and completed sessions;
- store session start and end times;
- calculate completed session duration;
- associate events with player, build, quest, area, and timestamp;
- preserve timestamps sent by the gameplay client;
- store arbitrary structured event payloads.

### Telemetry Event Lifecycle

The backend interprets lifecycle events automatically:

```text
game_started -> session started_at
game_ended   -> session ended_at
```

Timezone-aware timestamps are normalized to UTC before storage.

### Quest Validation

The validation service detects invalid quest situations such as:

- rewards granted before quest completion;
- quests completed without all required stages;
- incomplete or inconsistent quest progression.

Validation runs automatically when relevant events such as `quest_completed` or `reward_given` are received.

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
- active and completed session badges;
- completed session duration;
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
0-1    Low
2-4    Medium
5-7    High
8+     Critical
```

This score is an analytical QA heuristic rather than a gameplay difficulty measurement.

## Run with Docker

The complete web application can be built and started with Docker Compose:

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

## Run the Unreal Engine Demo

Start the backend first:

```bash
cd backend
uvicorn app.main:app --reload
```

Then open:

```text
unreal-demo/RPGTelemetryDemo/RPGTelemetryDemo.uproject
```

In Unreal Editor:

1. open the demonstration level;
2. press Play;
3. move through the configured telemetry triggers;
4. inspect the new Active session in the dashboard;
5. press Stop;
6. refresh the dashboard and inspect the Completed session.

The Unreal client currently sends telemetry to:

```text
http://127.0.0.1:8000
```

A complete playtest timeline should contain:

```text
game_started
quest and area events
game_ended
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

Each generated scenario now includes:

```text
game_started
scenario events
game_ended
```

Generated sessions therefore appear as Completed and include a calculated duration.

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
- client timestamp preservation;
- active-to-completed session lifecycle;
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

## Unreal Build Check

Close Unreal Editor before compiling the project through Visual Studio.

Build configuration:

```text
Development Editor
Win64
```

The Unreal project keeps source code and required content in Git while ignoring generated project files, IDE metadata, binaries, intermediate build files, and removed template variants.

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

## Repository Structure

```text
backend/
  app/
  scripts/
  tests/

frontend/
  src/

unreal-demo/
  RPGTelemetryDemo/

.github/
  workflows/

docker-compose.yml
README.md
```

## Historical Session Note

Sessions created before lifecycle support may remain marked as Active when they do not contain a `game_ended` event. Their completion time cannot be reconstructed reliably without inventing data.

New Unreal and generated demo sessions use the complete lifecycle and are displayed correctly.

## Roadmap

- add architecture diagrams;
- add application and Unreal Engine screenshots;
- prepare a portfolio demonstration video;
- add deployment notes;
- perform final documentation and UI polish.

## Project Purpose

This is a portfolio project focused on backend development, gameplay telemetry, QA automation, automated testing, continuous integration, containerization, data analysis, C++ game integration, and communication between a game client and external development tools.