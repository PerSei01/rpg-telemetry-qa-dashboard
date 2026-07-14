from fastapi.testclient import TestClient

from tests.factories import (
    create_test_event,
    create_test_session,
)


QUEST_ID = "missing_alchemist"


def create_detected_issue(
    client: TestClient,
) -> tuple[dict, dict]:
    session = create_test_session(
        client,
        player_name="BugReportTester",
        build_version="test-build-report",
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

    validation_response = client.post(
        f"/sessions/{session['id']}/validate",
    )

    assert (
        validation_response.status_code == 200
    ), validation_response.text

    session_response = client.get(
        f"/sessions/{session['id']}",
    )

    assert (
        session_response.status_code == 200
    ), session_response.text

    issues = session_response.json()["detected_issues"]

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

    return session, matching_issues[0]


def test_export_bug_report(
    client: TestClient,
) -> None:
    session, issue = create_detected_issue(client)

    response = client.get(
        f"/issues/{issue['id']}/bug-report",
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith(
        "text/markdown",
    )

    report = response.text

    assert issue["title"] in report
    assert issue["severity"].lower() in report.lower()
    assert session["build_version"] in report
    assert issue["quest_id"] in report
    assert "entered_cave" in report
    assert "found_alchemist" in report

    assert any(
        step in report
        for step in issue["reproduction_steps"]
    )


def test_export_missing_bug_report_returns_404(
    client: TestClient,
) -> None:
    response = client.get(
        "/issues/999999/bug-report",
    )

    assert response.status_code == 404