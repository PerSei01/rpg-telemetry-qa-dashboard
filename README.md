# RPG Telemetry & Quest QA Dashboard

A game development QA tool for collecting RPG gameplay telemetry, detecting invalid quest states, analyzing playtest sessions, and generating reproducible bug reports.

## Project Goal

Large RPGs contain complex quest logic, branching states, and hard-to-reproduce bugs. This project demonstrates how gameplay telemetry can help QA and developers detect invalid quest states and generate clear bug reports.

## Tech Stack

- Unreal Engine 5
- C++ for the telemetry sender
- Python / FastAPI for backend API
- PostgreSQL for data storage
- React for dashboard UI
- Docker for local setup
- pytest for backend tests

## Planned Features

- Gameplay session tracking
- Telemetry event ingestion
- Quest state validation
- Detected issue list
- Markdown bug report export
- Dashboard with playtest analytics
- UE5 demo scene sending events to backend