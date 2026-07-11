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
/                     Dashboard overview
/sessions             Playtest session list
/sessions/{id}        Playtest session details
/issues                Detected issues
```

## Production Build

```bash
npm run build
```