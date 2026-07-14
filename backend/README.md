# Backend

FastAPI backend for the RPG Telemetry & Quest QA Dashboard.

It receives gameplay telemetry, stores playtest sessions and events, validates quest progression, and generates Markdown bug reports for detected issues.

## Current Features

- PostgreSQL connection through SQLAlchemy;
- playtest session creation and retrieval;
- telemetry event ingestion;
- structured JSON event payloads;
- quest state validation;
- automatic issue detection;
- reproduction step generation;
- Markdown bug report export;
- isolated automated tests;
- Docker runtime support.

## Run Locally

Create and activate a virtual environment:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Install runtime dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/rpg_telemetry_db
```

Start the server:

```bash
uvicorn app.main:app --reload
```

Available URLs:

```text
API          http://127.0.0.1:8000
API docs     http://127.0.0.1:8000/docs
```

## Run with Docker

From the project root:

```bash
docker compose up --build
```

The backend will be available at:

```text
http://localhost:8000
```

Generate demo sessions inside the running backend container:

```bash
docker compose exec backend python scripts/generate_sessions.py
```

## Health Check

```http
GET /health
```

Expected response:

```json
{
  "status": "ok"
}
```

## API Endpoints

### Sessions

Create a playtest session:

```http
POST /sessions
```

Example request:

```json
{
  "player_name": "TestPlayer",
  "build_version": "0.1.0"
}
```

List all sessions:

```http
GET /sessions
```

Get a session with its telemetry events and detected issues:

```http
GET /sessions/{session_id}
```

### Events

Create a telemetry event:

```http
POST /events
```

Example request:

```json
{
  "session_id": 1,
  "event_type": "quest_started",
  "timestamp": "2026-01-01T12:00:00Z",
  "area": "village",
  "quest_id": "missing_alchemist",
  "payload": {
    "stage": "talk_to_guard"
  }
}
```

List events belonging to a session:

```http
GET /sessions/{session_id}/events
```

### Quest Validation

Validate a recorded playtest session:

```http
POST /sessions/{session_id}/validate
```

The validator currently detects:

- rewards granted before quest completion;
- quests completed without all required stages.

Required stages are currently configured for the demonstration quest:

```text
missing_alchemist
```

Example validation response:

```json
{
  "session_id": 7,
  "issues_created": 1,
  "issues": [
    {
      "id": 2,
      "session_id": 7,
      "severity": "high",
      "title": "Reward granted before quest completion",
      "description": "Reward was granted for quest 'missing_alchemist' before the quest was completed.",
      "quest_id": "missing_alchemist",
      "event_id": 32,
      "reproduction_steps": [
        "1. quest_started (area=village, quest=missing_alchemist, stage=talk_to_guard)",
        "2. quest_stage_completed (area=village, quest=missing_alchemist, stage=talked_to_guard)",
        "3. reward_given (area=village, quest=missing_alchemist)"
      ],
      "created_at": "2026-07-07T17:49:01.546187"
    }
  ]
}
```

Repeated validation replaces previous findings for the session instead of creating duplicate issues.

### Bug Reports

Generate a Markdown bug report for a detected issue:

```http
GET /issues/{issue_id}/bug-report
```

The response uses the `text/markdown` media type and contains:

- issue title and severity;
- session and build information;
- affected quest;
- description;
- reproduction steps;
- expected result;
- actual result.

Example:

```md
# Bug Report: Quest completed without required stages

## Severity
Critical

## Session
Session ID: 6  
Build: 0.1.0

## Quest
missing_alchemist

## Description
Quest 'missing_alchemist' was completed without required stages: entered_cave, found_alchemist.

## Steps to Reproduce
1. quest_started (area=village, quest=missing_alchemist, stage=talk_to_guard)
2. quest_stage_completed (area=village, quest=missing_alchemist, stage=talked_to_guard)
3. entered_area (area=village, quest=missing_alchemist)
4. quest_stage_completed (area=village, quest=missing_alchemist, stage=returned_to_village)
5. quest_completed (area=village, quest=missing_alchemist)

## Expected Result
Quest should only be completed after all required stages are completed.

## Actual Result
Quest was completed while one or more required stages were missing.
```

## Generate Demo Sessions

With the backend running locally:

```bash
python scripts/generate_sessions.py
```

The generator creates:

- a normal quest run;
- a player death run;
- an FPS drop run;
- a broken quest run;
- an invalid reward run.

The broken sessions can then be validated through the API.

## Run Tests

Install development dependencies:

```bash
pip install -r requirements-dev.txt
```

Run the full backend test suite:

```bash
python -m pytest
```

Run tests with detailed output:

```bash
python -m pytest -v
```

The test suite covers:

- health checks;
- session creation and retrieval;
- telemetry event ingestion;
- missing resources;
- valid quest progression;
- missing required quest stages;
- rewards granted before completion;
- repeated validation;
- Markdown bug report generation.

Tests use an isolated in-memory SQLite database and do not modify the development PostgreSQL database.