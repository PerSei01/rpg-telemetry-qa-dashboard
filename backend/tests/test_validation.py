from fastapi.testclient import TestClient

from tests.factories import (
    create_test_event,
    create_test_session,
)


QUEST_ID = "missing_alchemist"

REQUIRED_STAGES = [
    "talked_to_guard",
    "entered_cave",
    "found_alchemist",
    "returned_to_village",
]


def validate_session(
    client: TestClient,
    session_id: int,
) -> None:
    response = client.post(
        f"/sessions/{session_id}/validate",
    )

    assert response.status_code == 200, response.text


def get_session_issues(
    client: TestClient,
    session_id: int,
) -> list[dict]:
    response = client.get(
        f"/sessions/{session_id}",
    )

    assert response.status_code == 200, response.text

    return response.json()["detected_issues"]


def create_broken_quest_session(
    client: TestClient,
) -> tuple[dict, dict]:
    session = create_test_session(
        client,
        player_name="BrokenQuestTester",
        build_version="test-build-broken",
    )

    create_test_event(
        client,
        session_id=session["id"],
        event_type="quest_started",
        area="village",
        quest_id=QUEST_ID,
        payload={
            "stage": "talk_to_guard",
        },
    )

    create_test_event(
        client,
        session_id=session["id"],
        event_type="quest_stage_completed",
        area="village",
        quest_id=QUEST_ID,
        payload={
            "stage": "talked_to_guard",
        },
    )

    create_test_event(
        client,
        session_id=session["id"],
        event_type="quest_stage_completed",
        area="village",
        quest_id=QUEST_ID,
        payload={
            "stage": "returned_to_village",
        },
    )

    completion_event = create_test_event(
        client,
        session_id=session["id"],
        event_type="quest_completed",
        area="village",
        quest_id=QUEST_ID,
        payload={
            "result": "completed_without_finding_alchemist",
        },
    )

    return session, completion_event


def test_valid_quest_produces_no_issues(
    client: TestClient,
) -> None:
    session = create_test_session(
        client,
        player_name="NormalQuestTester",
        build_version="test-build-valid",
    )

    create_test_event(
        client,
        session_id=session["id"],
        event_type="quest_started",
        area="village",
        quest_id=QUEST_ID,
        payload={
            "stage": "talk_to_guard",
        },
    )

    for stage, area in [
        ("talked_to_guard", "village"),
        ("entered_cave", "cave"),
        ("found_alchemist", "cave"),
        ("returned_to_village", "village"),
    ]:
        create_test_event(
            client,
            session_id=session["id"],
            event_type="quest_stage_completed",
            area=area,
            quest_id=QUEST_ID,
            payload={
                "stage": stage,
            },
        )

    create_test_event(
        client,
        session_id=session["id"],
        event_type="quest_completed",
        area="village",
        quest_id=QUEST_ID,
        payload={
            "result": "alchemist_rescued",
        },
    )

    create_test_event(
        client,
        session_id=session["id"],
        event_type="reward_given",
        area="village",
        quest_id=QUEST_ID,
        payload={
            "reward": "gold",
            "amount": 100,
        },
    )

    issues = get_session_issues(
        client,
        session["id"],
    )

    assert issues == []


def test_missing_required_stage_creates_critical_issue(
    client: TestClient,
) -> None:
    session, completion_event = (
        create_broken_quest_session(client)
    )

    issues = get_session_issues(
        client,
        session["id"],
    )

    matching_issues = [
        issue
        for issue in issues
        if (
            issue["event_id"] == completion_event["id"]
            and issue["severity"] == "critical"
            and issue["quest_id"] == QUEST_ID
        )
    ]

    assert len(matching_issues) == 1, issues

    issue = matching_issues[0]

    assert issue["title"] == (
        "Quest completed without required stages"
    )
    assert issue["event_id"] == completion_event["id"]
    assert issue["reproduction_steps"]
    assert "entered_cave" in issue["description"]
    assert "found_alchemist" in issue["description"]


def test_reward_before_completion_creates_issue(
    client: TestClient,
) -> None:
    session = create_test_session(
        client,
        player_name="WrongRewardTester",
        build_version="test-build-reward",
    )

    create_test_event(
        client,
        session_id=session["id"],
        event_type="quest_started",
        area="village",
        quest_id=QUEST_ID,
        payload={
            "stage": "talk_to_guard",
        },
    )

    reward_event = create_test_event(
        client,
        session_id=session["id"],
        event_type="reward_given",
        area="village",
        quest_id=QUEST_ID,
        payload={
            "reward": "legendary_sword",
        },
    )

    create_test_event(
        client,
        session_id=session["id"],
        event_type="quest_stage_completed",
        area="village",
        quest_id=QUEST_ID,
        payload={
            "stage": "talked_to_guard",
        },
    )

    create_test_event(
        client,
        session_id=session["id"],
        event_type="quest_completed",
        area="village",
        quest_id=QUEST_ID,
        payload={
            "result": "completed_after_early_reward",
        },
    )

    issues = get_session_issues(
        client,
        session["id"],
    )

    matching_issues = [
        issue
        for issue in issues
        if (
            issue["event_id"] == reward_event["id"]
            and issue["severity"] == "high"
            and issue["quest_id"] == QUEST_ID
        )
    ]

    assert len(matching_issues) == 1, issues

    issue = matching_issues[0]

    assert issue["title"] == (
        "Reward granted before quest completion"
    )
    assert issue["reproduction_steps"]


def test_late_stages_do_not_repair_completed_quest(
    client: TestClient,
) -> None:
    session, completion_event = (
        create_broken_quest_session(client)
    )

    for stage in [
        "entered_cave",
        "found_alchemist",
    ]:
        create_test_event(
            client,
            session_id=session["id"],
            event_type="quest_stage_completed",
            area="cave",
            quest_id=QUEST_ID,
            payload={
                "stage": stage,
            },
        )

    validate_session(client, session["id"])

    issues = get_session_issues(
        client,
        session["id"],
    )

    matching_issues = [
        issue
        for issue in issues
        if (
            issue["event_id"] == completion_event["id"]
            and issue["severity"] == "critical"
            and issue["quest_id"] == QUEST_ID
        )
    ]

    assert len(matching_issues) == 1, issues
    assert "entered_cave" in matching_issues[0]["description"]
    assert "found_alchemist" in matching_issues[0]["description"]


def test_repeated_validation_does_not_duplicate_issues(
    client: TestClient,
) -> None:
    session, completion_event = (
        create_broken_quest_session(client)
    )

    issues = get_session_issues(
        client,
        session["id"],
    )

    matching_issues = [
        issue
        for issue in issues
        if (
            issue["event_id"] == completion_event["id"]
            and issue["severity"] == "critical"
            and issue["quest_id"] == QUEST_ID
        )
    ]

    assert len(matching_issues) == 1, issues
    assert len(issues) == 1


def test_validate_missing_session_returns_404(
    client: TestClient,
) -> None:
    response = client.post(
        "/sessions/999999/validate",
    )

    assert response.status_code == 404