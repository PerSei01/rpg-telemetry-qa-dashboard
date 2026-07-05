from fastapi import FastAPI
from sqlalchemy import text

from app.database import Base, engine
from app import models

app = FastAPI(
    title="RPG Telemetry QA Dashboard API",
    description="Backend API for collecting RPG gameplay telemetry and detecting quest QA issues.",
    version="0.1.0",
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