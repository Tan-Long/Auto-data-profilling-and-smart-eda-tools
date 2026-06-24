from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any


TODO_ARTIFACT = "issue_todos"
TODO_VERSION = 1
TODO_TYPES = {
    "fix_data": {
        "label": "Fix data",
        "checklist_field": "fix_data_checklist",
    },
    "verify_after_fix": {
        "label": "Verify after fix",
        "checklist_field": "verify_after_fix_checklist",
    },
}
TYPE_ORDER = {"fix_data": 0, "verify_after_fix": 1}
SEVERITY_ORDER = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}


def build_issue_todos(issue_action_plans: Mapping[str, Any] | Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    plans = _plan_rows(issue_action_plans)
    grouped: dict[tuple[str, str], dict[str, Any]] = {}
    for plan in plans:
        if str(plan.get("source") or "") != "deterministic":
            continue
        for todo_type, config in TODO_TYPES.items():
            for text in _string_list(plan.get(config["checklist_field"])):
                normalized_text = _normalize_text(text)
                if not normalized_text:
                    continue
                key = (todo_type, normalized_text)
                if key not in grouped:
                    grouped[key] = {
                        "todo_type": todo_type,
                        "todo_type_label": config["label"],
                        "text": normalized_text,
                        "source": "deterministic",
                        "occurrences": [],
                    }
                grouped[key]["occurrences"].append(_occurrence(plan))

    groups = [_finalize_group(group) for group in grouped.values()]
    groups.sort(
        key=lambda group: (
            TYPE_ORDER.get(group["todo_type"], 99),
            _priority_rank(group["priorities"]),
            group["text"],
        )
    )
    for index, group in enumerate(groups, start=1):
        prefix = "FIX" if group["todo_type"] == "fix_data" else "VERIFY"
        group["todo_id"] = f"{prefix}-{index:04d}"

    fix_groups = [group for group in groups if group["todo_type"] == "fix_data"]
    verify_groups = [group for group in groups if group["todo_type"] == "verify_after_fix"]
    return {
        "artifact": TODO_ARTIFACT,
        "version": TODO_VERSION,
        "source": "deterministic",
        "derived_from": "issue_action_plans.json",
        "summary": {
            "plan_count": len(plans),
            "todo_group_count": len(groups),
            "todo_occurrence_count": sum(group["occurrence_count"] for group in groups),
            "fix_data_group_count": len(fix_groups),
            "fix_data_occurrence_count": sum(group["occurrence_count"] for group in fix_groups),
            "verify_after_fix_group_count": len(verify_groups),
            "verify_after_fix_occurrence_count": sum(
                group["occurrence_count"] for group in verify_groups
            ),
            "source": "deterministic",
        },
        "groups": groups,
    }


def _plan_rows(issue_action_plans: Mapping[str, Any] | Sequence[Mapping[str, Any]]) -> list[dict[str, Any]]:
    if isinstance(issue_action_plans, Mapping):
        rows = issue_action_plans.get("plans")
    else:
        rows = issue_action_plans
    if not isinstance(rows, Sequence) or isinstance(rows, (str, bytes, bytearray)):
        return []
    result: list[dict[str, Any]] = []
    for row in rows:
        if isinstance(row, Mapping):
            result.append(dict(row))
    return result


def _occurrence(plan: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "issue_id": str(plan.get("issue_id") or "UNKNOWN"),
        "issue_type": str(plan.get("issue_type") or "UNKNOWN"),
        "severity": str(plan.get("severity") or "unknown"),
        "priority": str(plan.get("priority") or "Needs human review"),
        "table": str(plan.get("table") or "unknown"),
        "columns": _string_list(plan.get("columns")),
        "parent_table": plan.get("parent_table") or None,
        "parent_columns": _string_list(plan.get("parent_columns")),
        "human_review_required": bool(plan.get("human_review_required")),
        "finding_summary": str(plan.get("finding_summary") or ""),
    }


def _finalize_group(group: dict[str, Any]) -> dict[str, Any]:
    occurrences = sorted(
        group["occurrences"],
        key=lambda item: (
            _severity_rank(str(item.get("severity") or "")),
            str(item.get("table") or ""),
            ",".join(item.get("columns") or []),
            str(item.get("issue_id") or ""),
        ),
    )
    priorities = _unique(
        str(item.get("priority") or "Needs human review") for item in occurrences
    )
    issue_ids = _unique(str(item.get("issue_id") or "UNKNOWN") for item in occurrences)
    tables = _unique(str(item.get("table") or "unknown") for item in occurrences)
    return {
        **group,
        "occurrences": occurrences,
        "occurrence_count": len(occurrences),
        "priorities": priorities,
        "issue_ids": issue_ids,
        "tables": tables,
    }


def _priority_rank(priorities: Sequence[str]) -> int:
    ranks = [_severity_rank(priority.split(" ", 1)[0]) for priority in priorities]
    return min(ranks) if ranks else 99


def _severity_rank(severity: str) -> int:
    return SEVERITY_ORDER.get(str(severity or "").upper(), 99)


def _string_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value.strip()] if value.strip() else []
    if isinstance(value, Sequence) and not isinstance(value, (bytes, bytearray)):
        return [str(item).strip() for item in value if str(item).strip()]
    return [str(value).strip()] if str(value).strip() else []


def _normalize_text(value: str) -> str:
    return " ".join(str(value).split())


def _unique(values: Sequence[str] | Any) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        cleaned = str(value).strip()
        if not cleaned or cleaned in seen:
            continue
        result.append(cleaned)
        seen.add(cleaned)
    return result
