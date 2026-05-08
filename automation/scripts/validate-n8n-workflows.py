#!/usr/bin/env python3
"""Validate checked-in n8n workflow exports."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
WORKFLOW_DIR = REPO_ROOT / "automation" / "n8n" / "workflows"
LEAD_WORKFLOW = WORKFLOW_DIR / "lead-capture-alert-template-v2.json"


class DuplicateKeyError(ValueError):
    pass


def reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    seen: set[str] = set()
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in seen:
            raise DuplicateKeyError(f"duplicate key: {key!r}")
        seen.add(key)
        result[key] = value
    return result


def load_json_without_duplicate_keys(path: Path) -> Any:
    text = path.read_text(encoding="utf-8")
    return json.loads(text, object_pairs_hook=reject_duplicate_keys)


def parse_n8n_json_body(raw_body: Any, node_name: str) -> Any:
    if isinstance(raw_body, dict):
        return raw_body
    if not isinstance(raw_body, str):
        raise ValueError(f"{node_name} responseBody must be a JSON object or string")

    body = raw_body.strip()
    if body.startswith("="):
        body = body[1:].strip()
    parsed = json.loads(body, object_pairs_hook=reject_duplicate_keys)
    if not isinstance(parsed, dict):
        raise ValueError(f"{node_name} responseBody must parse to a JSON object")
    return parsed


def validate_lead_workflow(workflow: dict[str, Any]) -> None:
    nodes = workflow.get("nodes")
    if not isinstance(nodes, list):
        raise ValueError("lead workflow must contain a nodes array")

    webhook_nodes = [
        node
        for node in nodes
        if isinstance(node, dict) and node.get("type") == "n8n-nodes-base.webhook"
    ]
    if not any(node.get("parameters", {}).get("path") == "system-capital-lead" for node in webhook_nodes):
        raise ValueError("lead workflow webhook path must be system-capital-lead")

    respond_success = next(
        (
            node
            for node in nodes
            if isinstance(node, dict)
            and (node.get("id") == "respond_success" or node.get("name") == "Respond Success")
        ),
        None,
    )
    if not respond_success:
        raise ValueError("lead workflow must include Respond Success node")

    parameters = respond_success.get("parameters", {})
    if parameters.get("respondWith") != "json":
        raise ValueError("Respond Success must respond with JSON")

    body = parse_n8n_json_body(parameters.get("responseBody"), "Respond Success")
    if body.get("success") is not True:
        raise ValueError("Respond Success JSON body must include success: true")


def main() -> None:
    workflow_paths = sorted(WORKFLOW_DIR.glob("*.json"))
    if not workflow_paths:
        raise SystemExit(f"No n8n workflow JSON files found in {WORKFLOW_DIR}")

    loaded: dict[Path, Any] = {}
    for path in workflow_paths:
        try:
            loaded[path] = load_json_without_duplicate_keys(path)
        except Exception as exc:  # noqa: BLE001 - CLI validator should print file context.
            raise SystemExit(f"{path.relative_to(REPO_ROOT)} failed validation: {exc}") from exc
        print(f"✓ {path.relative_to(REPO_ROOT)} parses with no duplicate keys")

    if LEAD_WORKFLOW not in loaded:
        raise SystemExit(f"Missing required lead workflow: {LEAD_WORKFLOW.relative_to(REPO_ROOT)}")

    try:
        validate_lead_workflow(loaded[LEAD_WORKFLOW])
    except Exception as exc:  # noqa: BLE001 - CLI validator should print workflow-specific context.
        raise SystemExit(f"{LEAD_WORKFLOW.relative_to(REPO_ROOT)} failed lead workflow checks: {exc}") from exc

    print("✓ Lead workflow webhook path is system-capital-lead")
    print("✓ Respond Success uses a valid JSON response body")


if __name__ == "__main__":
    main()
