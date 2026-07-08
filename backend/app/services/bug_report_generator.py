from app.models import DetectedIssue


def generate_bug_report(issue: DetectedIssue) -> str:
    session = issue.session

    return "\n".join(
        [
            f"# Bug Report: {issue.title}",
            "",
            "## Severity",
            format_severity(issue.severity),
            "",
            "## Session",
            f"Session ID: {issue.session_id}  ",
            f"Build: {session.build_version if session else 'Unknown'}",
            "",
            "## Quest",
            issue.quest_id or "N/A",
            "",
            "## Description",
            issue.description,
            "",
            "## Steps to Reproduce",
            format_reproduction_steps(issue.reproduction_steps),
            "",
            "## Expected Result",
            get_expected_result(issue),
            "",
            "## Actual Result",
            get_actual_result(issue),
            "",
        ]
    )


def format_severity(severity: str) -> str:
    return severity.capitalize()


def format_reproduction_steps(reproduction_steps: str | None) -> str:
    if not reproduction_steps:
        return "No reproduction steps available."

    lines = [
        line.strip()
        for line in reproduction_steps.splitlines()
        if line.strip()
    ]

    if not lines:
        return "No reproduction steps available."

    return "\n".join(lines)


def get_expected_result(issue: DetectedIssue) -> str:
    if issue.title == "Reward granted before quest completion":
        return "Reward should only be granted after the quest is completed."

    if issue.title == "Quest completed without required stages":
        return "Quest should only be completed after all required stages are completed."

    return "Game logic should remain valid during the playtest session."


def get_actual_result(issue: DetectedIssue) -> str:
    if issue.title == "Reward granted before quest completion":
        return "Reward was granted before quest completion."

    if issue.title == "Quest completed without required stages":
        return "Quest was completed while one or more required stages were missing."

    return issue.description