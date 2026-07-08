from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DetectedIssue
from app.services.bug_report_generator import generate_bug_report

router = APIRouter(
    prefix="/issues",
    tags=["issues"],
)


@router.get(
    "/{issue_id}/bug-report",
    response_class=PlainTextResponse,
)
def get_issue_bug_report(
    issue_id: int,
    db: Session = Depends(get_db),
):
    issue = (
        db.query(DetectedIssue)
        .filter(DetectedIssue.id == issue_id)
        .first()
    )

    if issue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Detected issue not found",
        )

    report = generate_bug_report(issue)

    return PlainTextResponse(
        content=report,
        media_type="text/markdown",
    )