# Frontend

React and TypeScript frontend for the RPG Telemetry & Quest QA Dashboard.

The application presents gameplay telemetry, quest validation results, analytical charts, area risk scores, and generated QA bug reports.

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- Recharts
- ESLint
- Nginx
- Docker

## Run Locally

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Make sure the FastAPI backend is running, then start the Vite development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Run with Docker

From the project root:

```bash
docker compose up --build
```

The production frontend will be available at:

```text
http://localhost:8080
```

The Docker image uses a multi-stage build:

```text
Node.js
└── installs dependencies and builds the React application

Nginx
└── serves the generated static files
```

Nginx proxies frontend requests beginning with `/api` to the FastAPI container:

```text
Browser
   |
   v
http://localhost:8080/api
   |
   v
FastAPI backend
```

React Router fallback is configured in Nginx, so direct navigation and page refreshes work for routes such as:

```text
http://localhost:8080/sessions/1
http://localhost:8080/issues
```

## Available Routes

```text
/                     Dashboard overview and analytics
/sessions             Playtest session list
/sessions/{id}        Session details and event timeline
/issues                Searchable and filterable issue list
```

Unknown routes display a dedicated not-found page.

## Dashboard

The main dashboard displays:

- total playtest sessions;
- total telemetry events;
- total detected issues;
- latest tested build;
- telemetry events grouped by type;
- detected issues grouped by severity;
- player deaths and FPS drops grouped by area;
- area risk overview.

Dashboard data can be refreshed without reloading the application.

## Session Details

The session details page includes:

- player and build information;
- total event count;
- detected issue count;
- player death count;
- FPS drop count;
- chronological telemetry event timeline;
- expandable structured event payloads;
- detected issue cards;
- reproduction steps;
- links to generated Markdown bug reports.

## Detected Issues

The issues page combines validation findings from all playtest sessions.

Available filters include:

- free-text search;
- severity;
- build version;
- quest ID.

Filter values are stored in the URL query string. This allows filtered views to remain active after a page refresh and makes them shareable.

Example:

```text
/issues?severity=critical&build=0.1.0&query=quest
```

Each issue provides:

- title and severity;
- session and build context;
- related quest;
- detection timestamp;
- reproduction steps;
- link to the originating session;
- link to the Markdown bug report.

## Area Risk Analysis

The dashboard calculates an analytical risk score for each game area.

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

This score is a transparent QA heuristic rather than a gameplay difficulty measurement.

## API Configuration

The API base URL is configured through:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

During local development, the browser communicates directly with FastAPI.

During the Docker production build, the value is:

```env
VITE_API_BASE_URL=/api
```

Nginx then proxies `/api` requests to the backend container.

## Code Splitting

Application pages are loaded through route-level lazy imports.

This means the browser downloads page-specific JavaScript only when the corresponding route is opened.

The analytics code and Recharts dependency are separated from the initial application bundle instead of being loaded on every page.

## Accessibility and Responsive Design

The frontend includes:

- visible keyboard focus states;
- semantic headings and navigation;
- loading, error, and empty states;
- reduced-motion support;
- responsive dashboard cards;
- responsive chart layout;
- horizontally scrollable data tables on narrow screens.

## Quality Checks

Run ESLint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Both commands are also executed automatically by GitHub Actions on every push and pull request.

## Production Preview

Build the application:

```bash
npm run build
```

Preview the generated production files locally:

```bash
npm run preview
```

The preview server is intended only for checking the production build locally. The Docker version uses Nginx as the production web server.