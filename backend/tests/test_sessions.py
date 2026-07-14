from fastapi.testclient import TestClient

from tests.factories import create_test_session


def test_create_session(
    client: TestClient,
) -> None:
    response = client.post(
        "/sessions",
        json={
            "player_name": "QuestTester",
            "build_version": "0.2.0-test",
        },
    )

    assert response.status_code == 201

    body = response.json()

    assert body["id"] > 0
    assert body["player_name"] == "QuestTester"
    assert body["build_version"] == "0.2.0-test"
    assert body["started_at"] is not None


def test_list_sessions(
    client: TestClient,
) -> None:
    create_test_session(
        client,
        player_name="FirstTester",
    )

    create_test_session(
        client,
        player_name="SecondTester",
    )

    response = client.get("/sessions")

    assert response.status_code == 200

    sessions = response.json()

    assert len(sessions) == 2
    assert {
        session["player_name"]
        for session in sessions
    } == {
        "FirstTester",
        "SecondTester",
    }


def test_get_session_details(
    client: TestClient,
) -> None:
    created_session = create_test_session(client)

    response = client.get(
        f"/sessions/{created_session['id']}",
    )

    assert response.status_code == 200

    session = response.json()

    assert session["id"] == created_session["id"]
    assert session["player_name"] == "TestPlayer"
    assert session["events"] == []
    assert session["detected_issues"] == []


def test_get_missing_session_returns_404(
    client: TestClient,
) -> None:
    response = client.get("/sessions/999999")

    assert response.status_code == 404