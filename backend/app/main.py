from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import events, issues, sessions, validation


@asynccontextmanager
async def database_lifespan(
    _: FastAPI,
) -> AsyncIterator[None]:
    Base.metadata.create_all(bind=engine)
    yield


def create_app(
    *,
    initialize_database: bool = True,
) -> FastAPI:
    application = FastAPI(
        title="RPG Telemetry & Quest QA Dashboard API",
        description="Backend API for collecting RPG gameplay telemetry and detecting quest QA issues.",
        version="0.1.0",
        lifespan=(
            database_lifespan
            if initialize_database
            else None
        ),
    )

    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    application.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.get("/health", tags=["health"])
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    application.include_router(sessions.router)
    application.include_router(events.router)
    application.include_router(validation.router)
    application.include_router(issues.router)

    return application


app = create_app()