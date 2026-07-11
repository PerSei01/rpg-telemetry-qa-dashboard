from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine
from app import models
from app.routers import events, issues, sessions, validation

app = FastAPI(
    title="RPG Telemetry QA Dashboard API",
    description="Backend API for collecting RPG gameplay telemetry and detecting quest QA issues.",
    version="0.1.0",
)
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def read_root():
    return {"message": "RPG Telemetry QA Dashboard backend is running"}


@app.get("/health")
def health_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "connected",
    }


app.include_router(sessions.router)
app.include_router(events.router)
app.include_router(validation.router)
app.include_router(issues.router)