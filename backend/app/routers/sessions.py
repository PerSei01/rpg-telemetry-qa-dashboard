from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PlaytestSession
from app.schemas import PlaytestSessionCreate, PlaytestSessionDetail, PlaytestSessionRead

router = APIRouter(
    prefix="/sessions",
    tags=["sessions"],
)


@router.post(
    "",
    response_model=PlaytestSessionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    session_data: PlaytestSessionCreate,
    db: Session = Depends(get_db),
):
    playtest_session = PlaytestSession(
        player_name=session_data.player_name,
        build_version=session_data.build_version,
    )

    db.add(playtest_session)
    db.commit()
    db.refresh(playtest_session)

    return playtest_session


@router.get(
    "",
    response_model=list[PlaytestSessionRead],
)
def list_sessions(
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(PlaytestSession)
        .order_by(PlaytestSession.started_at.desc())
        .all()
    )

    return sessions


@router.get(
    "/{session_id}",
    response_model=PlaytestSessionDetail,
)
def get_session(
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

    return playtest_session