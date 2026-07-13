# RPG Telemetry & Quest QA Dashboard

A full-stack game development QA tool for collecting RPG gameplay telemetry, validating quest state transitions, analyzing playtest sessions, and generating reproducible bug reports.

## Overview

Large RPGs contain branching quests, dependent objectives, rewards, dialogue choices, and world-state transitions. Bugs in these systems can be difficult to reproduce from a tester's written description alone.

This project demonstrates how structured gameplay telemetry can help QA engineers and developers:

* inspect complete playtest sessions;
* detect invalid quest states automatically;
* identify problematic game areas;
* analyze player deaths and performance drops;
* generate consistent Markdown bug reports with reproduction steps.

## Current Status

The backend API and analytical frontend dashboard are implemented and connected.

The project currently supports:

* playtest session creation;
* telemetry event ingestion;
* quest state validation;
* automatic issue detection;
* Markdown bug report generation;
* session event timelines;
* telemetry payload inspection;
* issue filtering and search;
* gameplay analytics charts;
* area risk scoring;
* responsive frontend navigation;
* frontend production builds with route-level code splitting.

Automated backend tests, CI, Docker setup, and Unreal Engine telemetry integration are the next development stages.

## Tech Stack

### Backend

* Python
* FastAPI
* SQLAlchemy
* PostgreSQL
* Pydantic

### Frontend

* React
* TypeScript
* Vite
* React Router
* Recharts

### Planned Integration and Infrastructure

* Unreal Engine 5
* C++ telemetry sender
* pytest
* GitHub Actions
* Docker Compose

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

## Implemented Features

### Telemetry Sessions

* create and list playtest sessions;
* retrieve a session with its events and detected issues;
* associate events with player, build, quest, area, and timestamp;
* store arbitrary structured event payloads.

### Quest Validation

The validation service detects invalid quest situations such as:

* rewards granted before quest completion;
* quests completed without all required stages;
* incomplete or inconsistent quest progression.

Detected issues contain:

* severity;
* title and description;
* related quest and telemetry event;
* reproduction steps;
* session and build context.

### Bug Report Generation

Each detected issue can be exported as a Markdown bug report containing:

* issue summary;
* severity and build version;
* affected quest;
* related event;
* reproduction steps;
* expected and actual behavior.

### Dashboard

The React dashboard includes:

* total sessions, events, issues, and latest build;
* telemetry events grouped by type;
* detected issues grouped by severity;
* player deaths and FPS drops grouped by area;
* area risk overview;
* session list;
* detailed event timeline;
* expandable event payloads;
* issue search and filters;
* links to generated Markdown bug reports.

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

## Project Structure

```text
rpg-telemetry-qa-dashboard/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── scripts/
│   │   └── generate_sessions.py
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── types/
│   └── README.md
├── unreal-demo/
├── docs/
└── README.md
```

## Run Locally

### Backend

Open a terminal in the backend directory:

```bash
cd backend
```

Activate the virtual environment on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Start the FastAPI server:

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

For database configuration and backend-specific setup, see:

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

With the backend running:

```bash
cd backend
python scripts/generate_sessions.py
```

The generator creates several example playtest scenarios:

* normal quest completion;
* player death;
* FPS drops;
* quest completed without required stages;
* reward granted at an invalid quest state.

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

## Frontend Quality Checks

```bash
cd frontend
npm run lint
npm run build
```

The frontend uses lazy-loaded routes and code splitting so analytical dependencies are not included in every initial page load.

## Roadmap

* add isolated backend test infrastructure;
* test API endpoints, quest validation, and bug reports;
* add GitHub Actions continuous integration;
* containerize the backend, frontend, and PostgreSQL;
* create an Unreal Engine 5 demonstration level;
* implement a reusable C++ telemetry sender;
* send real gameplay events from Unreal Engine to FastAPI;
* prepare screenshots, architecture documentation, and a portfolio demonstration video.

## Project Purpose

This is a portfolio project focused on backend development, gameplay telemetry, QA automation, data analysis, and integration between game code and external development tools.
