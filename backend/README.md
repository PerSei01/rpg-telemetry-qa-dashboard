# Backend

FastAPI backend for RPG Telemetry & Quest QA Dashboard.

## Current Scope

- FastAPI application setup
- PostgreSQL connection
- SQLAlchemy ORM configuration
- Initial database models:
  - PlaytestSession
  - TelemetryEvent
  - DetectedIssue
- Health check endpoint
- Playtest session API
- Telemetry event API

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

Create `.env` file:

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/rpg_telemetry_db
```

Run server:

```bash
uvicorn app.main:app --reload
```

Open:

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

Make sure the backend server is running:

```bash
uvicorn app.main:app --reload
```

Run the generator from the `backend/` directory:

```bash
python scripts/generate_sessions.py
```

The script creates several demo playtest sessions:

- normal quest run
- player death run
- FPS drop run
- broken quest run
- wrong reward run

## Validate Playtest Session

Run quest validation for a playtest session:

```http
POST /sessions/{session_id}/validate
```

The validator currently detects:

- reward granted before quest completion
- quest completed without required stages

Example response:

```json
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