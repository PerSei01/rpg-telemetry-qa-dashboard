from datetime import datetime

from fastapi.testclient import TestClient


def create_session(
    client: TestClient,
) -> dict:
    response = client.post(
        "/sessions",
        json={
            "player_name": "LifecycleTester",
            "build_version": "test-build",
        },
    )

    assert response.status_code == 201

    return response.json()


def create_event(
    client: TestClient,
    session_id: int,
    event_type: str,
    timestamp: str,
) -> dict:
    response = client.post(
        "/events",
        json={
            "session_id": session_id,
            "event_type": event_type,
            "timestamp": timestamp,
            "area": "lifecycle_test",
            "payload": {},
        },
    )

    assert response.status_code == 201

    return response.json()


def test_game_ended_completes_session(
    client: TestClient,
) -> None:
    session = create_session(client)

    create_event(
        client,
        session_id=session["id"],
        event_type="game_started",
        timestamp="2026-07-22T12:00:00Z",
    )

    create_event(
        client,
        session_id=session["id"],
        event_type="game_ended",
        timestamp="2026-07-22T12:05:30Z",
    )

    response = client.get(
        f"/sessions/{session['id']}",
    )

    assert response.status_code == 200

    session_details = response.json()

    assert datetime.fromisoformat(
        session_details["started_at"],
    ) == datetime(2026, 7, 22, 12, 0, 0)

    assert datetime.fromisoformat(
        session_details["ended_at"],
    ) == datetime(2026, 7, 22, 12, 5, 30)


def test_event_preserves_client_timestamp(
    client: TestClient,
) -> None:
    session = create_session(client)

    event = create_event(
        client,
        session_id=session["id"],
        event_type="entered_area",
        timestamp="2026-07-22T14:15:45Z",
    )

    assert datetime.fromisoformat(
        event["timestamp"],
    ) == datetime(2026, 7, 22, 14, 15, 45)