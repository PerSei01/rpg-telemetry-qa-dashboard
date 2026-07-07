import os
import sys
import time
from typing import Any

import requests


API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
DEFAULT_BUILD_VERSION = "0.1.0"


def post_json(path: str, data: dict[str, Any]) -> dict[str, Any]:
    url = f"{API_BASE_URL}{path}"

    try:
        response = requests.post(url, json=data, timeout=10)
    except requests.RequestException as exc:
        raise RuntimeError(
            f"Could not connect to backend at {API_BASE_URL}. "
            f"Make sure the FastAPI server is running."
        ) from exc

    if not response.ok:
        raise RuntimeError(
            f"Request failed: POST {path}\n"
            f"Status code: {response.status_code}\n"
            f"Response: {response.text}"
        )

    return response.json()


def create_session(player_name: str, build_version: str = DEFAULT_BUILD_VERSION) -> dict[str, Any]:
    session = post_json(
        "/sessions",
        {
            "player_name": player_name,
            "build_version": build_version,
        },
    )

    print(f"Created session #{session['id']} for {player_name}")
    return session


def create_event(
    session_id: int,
    event_type: str,
    area: str | None = None,
    quest_id: str | None = None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    event = post_json(
        "/events",
        {
            "session_id": session_id,
            "event_type": event_type,
            "area": area,
            "quest_id": quest_id,
            "payload": payload or {},
        },
    )

    print(f"  + {event_type}")
    time.sleep(0.05)
    return event


def generate_normal_quest_run() -> None:
    session = create_session("NormalQuestRun")
    session_id = session["id"]
    quest_id = "missing_alchemist"

    create_event(
        session_id,
        "quest_started",
        area="village",
        quest_id=quest_id,
        payload={"stage": "talk_to_guard"},
    )
    create_event(
        session_id,
        "dialogue_choice_selected",
        area="village",
        quest_id=quest_id,
        payload={
            "npc": "village_guard",
            "choice": "ask_about_alchemist",
        },
    )
    create_event(
        session_id,
        "quest_stage_completed",
        area="village",
        quest_id=quest_id,
        payload={"stage": "talked_to_guard"},
    )
    create_event(
        session_id,
        "entered_area",
        area="forest",
        quest_id=quest_id,
        payload={"from": "village"},
    )
    create_event(
        session_id,
        "entered_area",
        area="cave",
        quest_id=quest_id,
        payload={"from": "forest"},
    )
    create_event(
        session_id,
        "quest_stage_completed",
        area="cave",
        quest_id=quest_id,
        payload={"stage": "entered_cave"},
    )
    create_event(
        session_id,
        "quest_stage_completed",
        area="cave",
        quest_id=quest_id,
        payload={"stage": "found_alchemist"},
    )
    create_event(
        session_id,
        "npc_saved",
        area="cave",
        quest_id=quest_id,
        payload={"npc": "alchemist"},
    )
    create_event(
        session_id,
        "entered_area",
        area="village",
        quest_id=quest_id,
        payload={"from": "cave"},
    )
    create_event(
        session_id,
        "quest_stage_completed",
        area="village",
        quest_id=quest_id,
        payload={"stage": "returned_to_village"},
    )
    create_event(
        session_id,
        "quest_completed",
        area="village",
        quest_id=quest_id,
        payload={"result": "alchemist_saved"},
    )
    create_event(
        session_id,
        "reward_given",
        area="village",
        quest_id=quest_id,
        payload={
            "reward": "gold",
            "amount": 100,
        },
    )


def generate_player_death_run() -> None:
    session = create_session("PlayerDeathRun")
    session_id = session["id"]
    quest_id = "missing_alchemist"

    create_event(
        session_id,
        "quest_started",
        area="village",
        quest_id=quest_id,
        payload={"stage": "talk_to_guard"},
    )
    create_event(
        session_id,
        "entered_area",
        area="forest",
        quest_id=quest_id,
        payload={"from": "village"},
    )
    create_event(
        session_id,
        "combat_started",
        area="forest",
        quest_id=quest_id,
        payload={
            "enemy_group": "wolves",
            "enemy_count": 3,
        },
    )
    create_event(
        session_id,
        "player_death",
        area="forest",
        quest_id=quest_id,
        payload={
            "cause": "wolf_attack",
            "player_level": 2,
        },
    )


def generate_fps_drop_run() -> None:
    session = create_session("FpsDropRun")
    session_id = session["id"]
    quest_id = "missing_alchemist"

    create_event(
        session_id,
        "quest_started",
        area="village",
        quest_id=quest_id,
        payload={"stage": "talk_to_guard"},
    )
    create_event(
        session_id,
        "entered_area",
        area="cave",
        quest_id=quest_id,
        payload={"from": "forest"},
    )
    create_event(
        session_id,
        "fps_drop",
        area="cave",
        quest_id=quest_id,
        payload={
            "average_fps": 24,
            "threshold_fps": 30,
            "duration_seconds": 6.5,
            "possible_cause": "particle_effects",
        },
    )
    create_event(
        session_id,
        "fps_drop",
        area="cave",
        quest_id=quest_id,
        payload={
            "average_fps": 19,
            "threshold_fps": 30,
            "duration_seconds": 3.2,
            "possible_cause": "enemy_spawn",
        },
    )


def generate_broken_quest_run() -> None:
    session = create_session("BrokenQuestRun")
    session_id = session["id"]
    quest_id = "missing_alchemist"

    create_event(
        session_id,
        "quest_started",
        area="village",
        quest_id=quest_id,
        payload={"stage": "talk_to_guard"},
    )
    create_event(
        session_id,
        "quest_stage_completed",
        area="village",
        quest_id=quest_id,
        payload={"stage": "talked_to_guard"},
    )
    create_event(
        session_id,
        "entered_area",
        area="village",
        quest_id=quest_id,
        payload={"from": "forest"},
    )
    create_event(
        session_id,
        "quest_stage_completed",
        area="village",
        quest_id=quest_id,
        payload={"stage": "returned_to_village"},
    )
    create_event(
        session_id,
        "quest_completed",
        area="village",
        quest_id=quest_id,
        payload={
            "result": "completed_without_finding_alchemist",
            "note": "This session intentionally skips the found_alchemist stage.",
        },
    )


def generate_wrong_reward_run() -> None:
    session = create_session("WrongRewardRun")
    session_id = session["id"]
    quest_id = "missing_alchemist"

    create_event(
        session_id,
        "quest_started",
        area="village",
        quest_id=quest_id,
        payload={"stage": "talk_to_guard"},
    )
    create_event(
        session_id,
        "quest_stage_completed",
        area="village",
        quest_id=quest_id,
        payload={"stage": "talked_to_guard"},
    )
    create_event(
        session_id,
        "reward_given",
        area="village",
        quest_id=quest_id,
        payload={
            "reward": "gold",
            "amount": 100,
            "note": "This reward is intentionally granted before quest completion.",
        },
    )


def main() -> None:
    print("Generating fake gameplay sessions...")
    print(f"Backend URL: {API_BASE_URL}")
    print()

    try:
        generate_normal_quest_run()
        print()

        generate_player_death_run()
        print()

        generate_fps_drop_run()
        print()

        generate_broken_quest_run()
        print()

        generate_wrong_reward_run()
        print()

    except RuntimeError as exc:
        print(f"Error: {exc}")
        sys.exit(1)

    print("Fake gameplay sessions generated successfully.")


if __name__ == "__main__":
    main()