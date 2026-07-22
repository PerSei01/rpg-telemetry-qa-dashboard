from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PlaytestSession, TelemetryEvent
from app.schemas import TelemetryEventCreate, TelemetryEventRead
from app.services.quest_validator import validate_session

router = APIRouter(
    tags=["events"],
)

VALIDATION_TRIGGER_EVENT_TYPES = {
    "quest_completed",
    "reward_given",
}


def normalize_event_timestamp(
    timestamp: datetime | None,
) -> datetime:
    if timestamp is None:
        return (
            datetime.now(timezone.utc)
            .replace(tzinfo=None)
        )

    if timestamp.tzinfo is None:
        return timestamp

    return (
        timestamp
        .astimezone(timezone.utc)
        .replace(tzinfo=None)
    )


def update_session_lifecycle(
    playtest_session: PlaytestSession,
    event_type: str,
    event_timestamp: datetime,
) -> None:
    if event_type == "game_started":
        if event_timestamp < playtest_session.started_at:
            playtest_session.started_at = event_timestamp

        return

    if event_type != "game_ended":
        return

    if (
        playtest_session.ended_at is None
        or event_timestamp < playtest_session.ended_at
    ):
        playtest_session.ended_at = event_timestamp


@router.post(
    "/events",
    response_model=TelemetryEventRead,
    status_code=status.HTTP_201_CREATED,
)
def create_event(
    event_data: TelemetryEventCreate,
    db: Session = Depends(get_db),
):
    playtest_session = (
        db.query(PlaytestSession)
        .filter(PlaytestSession.id == event_data.session_id)
        .first()
    )

    if playtest_session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playtest session not found",
        )

    event_timestamp = normalize_event_timestamp(
        event_data.timestamp,
    )

    telemetry_event = TelemetryEvent(
        session_id=event_data.session_id,
        event_type=event_data.event_type,
        timestamp=event_timestamp,
        area=event_data.area,
        quest_id=event_data.quest_id,
        payload=event_data.payload,
    )

    db.add(telemetry_event)

    update_session_lifecycle(
        playtest_session,
        telemetry_event.event_type,
        event_timestamp,
    )

    db.flush()

    if (
        telemetry_event.quest_id
        and telemetry_event.event_type
        in VALIDATION_TRIGGER_EVENT_TYPES
    ):
        validate_session(
            telemetry_event.session_id,
            db,
        )

    db.commit()
    db.refresh(telemetry_event)

    return telemetry_event


@router.get(
    "/sessions/{session_id}/events",
    response_model=list[TelemetryEventRead],
)
def list_session_events(
    session_id: int,
    db: Session = Depends(get_db),
):
    playtest_session = (
        db.query(PlaytestSession)
        .filter(PlaytestSession.id == session_id)
        .first()
    )

    if playtest_session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playtest session not found",
        )

    events = (
        db.query(TelemetryEvent)
        .filter(TelemetryEvent.session_id == session_id)
        .order_by(
            TelemetryEvent.timestamp.asc(),
            TelemetryEvent.id.asc(),
        )
        .all()
    )

    return events