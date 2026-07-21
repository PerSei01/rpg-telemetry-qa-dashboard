from sqlalchemy.orm import Session

from app.models import DetectedIssue, TelemetryEvent


REQUIRED_STAGES_BY_QUEST = {
    "missing_alchemist": [
        "talked_to_guard",
        "entered_cave",
        "found_alchemist",
        "returned_to_village",
    ],
}


def validate_session(
    session_id: int,
    db: Session,
) -> list[DetectedIssue]:
    clear_existing_issues(session_id, db)

    events = (
        db.query(TelemetryEvent)
        .filter(TelemetryEvent.session_id == session_id)
        .order_by(
            TelemetryEvent.timestamp.asc(),
            TelemetryEvent.id.asc(),
        )
        .all()
    )

    created_issues: list[DetectedIssue] = []

    created_issues.extend(
        validate_reward_timing(session_id, events, db)
    )
    created_issues.extend(
        validate_required_quest_stages(
            session_id,
            events,
            db,
        )
    )

    db.flush()

    return created_issues


def clear_existing_issues(
    session_id: int,
    db: Session,
) -> None:
    (
        db.query(DetectedIssue)
        .filter(DetectedIssue.session_id == session_id)
        .delete(synchronize_session=False)
    )


def validate_reward_timing(
    session_id: int,
    events: list[TelemetryEvent],
    db: Session,
) -> list[DetectedIssue]:
    created_issues: list[DetectedIssue] = []

    completed_quests: set[str] = set()

    for event in events:
        quest_id = event.quest_id

        if not quest_id:
            continue

        if event.event_type == "quest_completed":
            completed_quests.add(quest_id)

        if event.event_type == "reward_given" and quest_id not in completed_quests:
            issue = DetectedIssue(
                session_id=session_id,
                severity="high",
                title="Reward granted before quest completion",
                description=(
                    f"Reward was granted for quest '{quest_id}' before the quest "
                    "was completed."
                ),
                quest_id=quest_id,
                event_id=event.id,
                reproduction_steps=build_reproduction_steps(events, event),
            )

            db.add(issue)
            created_issues.append(issue)

    return created_issues


def validate_required_quest_stages(
    session_id: int,
    events: list[TelemetryEvent],
    db: Session,
) -> list[DetectedIssue]:
    created_issues: list[DetectedIssue] = []

    completed_stages_by_quest: dict[str, set[str]] = {}

    for event in events:
        quest_id = event.quest_id

        if not quest_id:
            continue

        if event.event_type == "quest_stage_completed":
            stage = event.payload.get("stage")

            if stage:
                completed_stages_by_quest.setdefault(
                    quest_id,
                    set(),
                ).add(stage)

            continue

        if event.event_type != "quest_completed":
            continue

        required_stages = REQUIRED_STAGES_BY_QUEST.get(
            quest_id,
            [],
        )
        completed_stages = completed_stages_by_quest.get(
            quest_id,
            set(),
        )

        missing_stages = [
            stage
            for stage in required_stages
            if stage not in completed_stages
        ]

        if missing_stages:
            issue = DetectedIssue(
                session_id=session_id,
                severity="critical",
                title="Quest completed without required stages",
                description=(
                    f"Quest '{quest_id}' was completed without "
                    "required stages: "
                    f"{', '.join(missing_stages)}."
                ),
                quest_id=quest_id,
                event_id=event.id,
                reproduction_steps=build_reproduction_steps(
                    events,
                    event,
                ),
            )

            db.add(issue)
            created_issues.append(issue)

    return created_issues


def build_reproduction_steps(
    events: list[TelemetryEvent],
    target_event: TelemetryEvent,
) -> str:
    steps: list[str] = []

    for index, event in enumerate(events, start=1):
        if event.id and target_event.id and event.id > target_event.id:
            break

        details = format_event_details(event)
        steps.append(f"{index}. {event.event_type}{details}")

    return "\n".join(steps)


def format_event_details(event: TelemetryEvent) -> str:
    parts: list[str] = []

    if event.area:
        parts.append(f"area={event.area}")

    if event.quest_id:
        parts.append(f"quest={event.quest_id}")

    stage = event.payload.get("stage")

    if stage:
        parts.append(f"stage={stage}")

    if not parts:
        return ""

    return f" ({', '.join(parts)})"