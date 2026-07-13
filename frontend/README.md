# Frontend

React frontend for RPG Telemetry & Quest QA Dashboard.

## Run Locally

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Make sure the FastAPI backend is running, then start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Available Routes

```text
/                     Dashboard overview and analytics
/sessions             Playtest session list
/sessions/{id}        Event timeline and validation findings
/issues                Filterable detected issue list
```

## Current Features

- dashboard summary
- telemetry events by type
- detected issues by severity
- deaths and FPS drops by area
- area risk overview
- playtest session timeline
- telemetry payload inspection
- detected issue filters
- Markdown bug report links
- responsive layout
- route-level code splitting

## Production Checks

```bash
npm run lint
npm run build
```