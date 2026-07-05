from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PlaytestSessionCreate(BaseModel):
    player_name: str = Field(..., min_length=1, max_length=100)
    build_version: str = Field(..., min_length=1, max_length=50)


class PlaytestSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    player_name: str
    build_version: str
    started_at: datetime
    ended_at: datetime | None = None


class TelemetryEventCreate(BaseModel):
    session_id: int
    event_type: str = Field(..., min_length=1, max_length=100)
    area: str | None = Field(default=None, max_length=100)
    quest_id: str | None = Field(default=None, max_length=100)
    payload: dict[str, Any] = Field(default_factory=dict)


class TelemetryEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    event_type: str
    timestamp: datetime
    area: str | None = None
    quest_id: str | None = None
    payload: dict[str, Any]


class DetectedIssueRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    severity: str
    title: str
    description: str
    quest_id: str | None = None
    event_id: int | None = None
    reproduction_steps: str | None = None
    created_at: datetime


class PlaytestSessionDetail(PlaytestSessionRead):
    events: list[TelemetryEventRead] = []
    detected_issues: list[DetectedIssueRead] = []