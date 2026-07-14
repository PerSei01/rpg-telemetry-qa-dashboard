from fastapi.testclient import TestClient

from tests.factories import create_test_session


def test_create_and_list_event(
    client: TestClient,
) -> None:
    session = create_test_session(client)

    event_payload = {
        "session_id": session["id"],
        "event_type": "quest_started",
        "timestamp": "2026-07-14T12:00:00Z",
        "area": "test_village",
        "quest_id": "quest_test_001",
        "payload": {
            "stage": "started",
            "source": "pytest",
        },
    }

    create_response = client.post(
        "/events",
        json=event_payload,
    )

    assert create_response.status_code == 201

    created_event = create_response.json()

    assert created_event["id"] > 0
    assert created_event["session_id"] == session["id"]
    assert created_event["event_type"] == "quest_started"
    assert created_event["area"] == "test_village"
    assert created_event["quest_id"] == "quest_test_001"
    assert created_event["payload"] == {
        "stage": "started",
        "source": "pytest",
    }

    list_response = client.get(
        f"/sessions/{session['id']}/events",
    )

    assert list_response.status_code == 200

    events = list_response.json()

    assert len(events) == 1
    assert events[0]["id"] == created_event["id"]


def test_create_event_for_missing_session_returns_404(
    client: TestClient,
) -> None:
    response = client.post(
        "/events",
        json={
            "session_id": 999999,
            "event_type": "player_death",
            "timestamp": "2026-07-14T12:00:00Z",
            "area": "test_forest",
            "quest_id": None,
            "payload": {
                "cause": "pytest",
            },
        },
    )

    assert response.status_code == 404