from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PlaytestSession
from app.schemas import ValidationResult
from app.services.quest_validator import validate_session

router = APIRouter(
    tags=["validation"],
)


@router.post(
    "/sessions/{session_id}/validate",
    response_model=ValidationResult,
)
def validate_playtest_session(
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

    issues = validate_session(session_id, db)

    db.commit()

    for issue in issues:
        db.refresh(issue)

    return {
        "session_id": session_id,
        "issues_created": len(issues),
        "issues": issues,
    }