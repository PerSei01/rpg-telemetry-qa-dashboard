from typing import Any

from fastapi.testclient import TestClient


def create_test_session(
    client: TestClient,
    *,
    player_name: str = "TestPlayer",
    build_version: str = "test-build-1",
) -> dict[str, Any]:
    response = client.post(
        "/sessions",
        json={
            "player_name": player_name,
            "build_version": build_version,
        },
    )

    assert response.status_code == 201, response.text

    return response.json()


def create_test_event(
    client: TestClient,
    *,
    session_id: int,
    event_type: str,
    area: str | None = "test_village",
    quest_id: str | None = "quest_test_001",
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    response = client.post(
        "/events",
        json={
            "session_id": session_id,
            "event_type": event_type,
            "timestamp": "2026-07-14T12:00:00Z",
            "area": area,
            "quest_id": quest_id,
            "payload": payload or {},
        },
    )

    assert response.status_code == 201, response.text

    return response.json()