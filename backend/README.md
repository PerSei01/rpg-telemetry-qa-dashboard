# Backend

FastAPI backend for RPG Telemetry & Quest QA Dashboard.

## Current Scope

* FastAPI application setup
* PostgreSQL connection
* SQLAlchemy ORM configuration
* Database models:
  * PlaytestSession
  * TelemetryEvent
  * DetectedIssue
* Health check endpoint
* Playtest session API
* Telemetry event API
* Quest state validation
* Markdown bug report export

## Run Locally

Create and activate a virtual environment:

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/rpg_telemetry_db
```

Run the server:

```bash
uvicorn app.main:app --reload
```

Open the interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

## Health Check

```http
GET /health
```

Expected response:

```json
{
  "status": "ok",
  "database": "connected"
}
```

## API Endpoints

### Sessions

Create a playtest session:

```http
POST /sessions
```

Request body:

```json
{
  "player_name": "TestPlayer",
  "build_version": "0.1.0"
}
```

List playtest sessions:

```http
GET /sessions
```

Get playtest session details:

```http
GET /sessions/{session_id}
```

### Events

Create a telemetry event:

```http
POST /events
```

Request body:

```json
{
  "session_id": 1,
  "event_type": "quest_started",
  "area": "village",
  "quest_id": "missing_alchemist",
  "payload": {
    "stage": "talk_to_guard"
  }
}
```

List events for a playtest session:

```http
GET /sessions/{session_id}/events
```

## Generate Fake Gameplay Sessions

Make sure the backend server is running, then execute the generator from the `backend/` directory:

```bash
python scripts/generate_sessions.py
```

The script creates several demo playtest sessions:

* normal quest run
* player death run
* FPS drop run
* broken quest run
* wrong reward run

## Validate Playtest Session

Run quest validation for a playtest session:

```http
POST /sessions/{session_id}/validate
```

The validator currently detects:

* reward granted before quest completion
* quest completed without required stages

Example response:

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

## Export Bug Report

Generate a Markdown bug report for a detected issue:

```http
GET /issues/{issue_id}/bug-report
```

The endpoint returns a Markdown-formatted QA report containing:

* issue title
* severity
* session ID
* build version
* quest ID
* description
* steps to reproduce
* expected result
* actual result

Example output:

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