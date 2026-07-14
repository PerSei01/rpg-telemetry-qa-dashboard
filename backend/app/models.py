from datetime import datetime
from enum import Enum

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class IssueSeverity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class PlaytestSession(Base):
    __tablename__ = "playtest_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    player_name: Mapped[str] = mapped_column(String(100), nullable=False)
    build_version: Mapped[str] = mapped_column(String(50), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    events: Mapped[list["TelemetryEvent"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
    )

    detected_issues: Mapped[list["DetectedIssue"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
    )


class TelemetryEvent(Base):
    __tablename__ = "telemetry_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("playtest_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    area: Mapped[str | None] = mapped_column(String(100), nullable=True)
    quest_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON().with_variant(JSONB(), "postgresql"), default=dict, nullable=False)

    session: Mapped["PlaytestSession"] = relationship(back_populates="events")


class DetectedIssue(Base):
    __tablename__ = "detected_issues"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("playtest_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    quest_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    event_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reproduction_steps: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    session: Mapped["PlaytestSession"] = relationship(back_populates="detected_issues")