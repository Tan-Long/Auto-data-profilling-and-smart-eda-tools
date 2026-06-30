from __future__ import annotations

import json
import shutil
import csv
from collections.abc import Mapping, Sequence
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

from vsf_profiler.quality_rules import PLACEHOLDER_TOKENS


REMEDIATION_PLAN_FILENAME = "remediation_plan.json"
APPROVED_REMEDIATIONS_FILENAME = "approved_remediations.json"
REMEDIATION_RUN_SUMMARY_FILENAME = "remediation_run_summary.json"
BEFORE_AFTER_QUALITY_DIFF_FILENAME = "before_after_quality_diff.json"

SUPPORTED_DROP_ISSUE_TYPES = {
    "REQUIRED_FIELD_NULL",
    "PRIMARY_KEY_NULL",
    "FOREIGN_KEY_NULL",
    "VALUE_OUT_OF_RANGE",
    "NEGATIVE_VALUE_NOT_ALLOWED",
    "DATE_ORDER_INVALID",
    "ORPHAN_FOREIGN_KEY",
    "DUPLICATE_PRIMARY_KEY",
    "PARENT_KEY_DUPLICATE",
    "UNIQUE_DUPLICATE",
}

OPERATION_ORDER = {
    "DATE_ORDER_INVALID": 10,
    "VALUE_OUT_OF_RANGE": 20,
    "NEGATIVE_VALUE_NOT_ALLOWED": 20,
    "REQUIRED_FIELD_NULL": 30,
    "PRIMARY_KEY_NULL": 30,
    "FOREIGN_KEY_NULL": 30,
    "ORPHAN_FOREIGN_KEY": 40,
    "INVALID_PLACEHOLDER_TOKEN": 50,
    "DUPLICATE_PRIMARY_KEY": 90,
    "PARENT_KEY_DUPLICATE": 90,
    "UNIQUE_DUPLICATE": 90,
}


def build_remediation_plan(
    *,
    issues: Sequence[Mapping[str, Any]],
    issue_action_plans: Mapping[str, Any] | None = None,
    schema_evaluation: Mapping[str, Any] | None = None,
    runtime_inputs: Mapping[str, Any] | None = None,
    rules_path: str | Path | None = None,
) -> dict[str, Any]:
    rules_by_table = _load_rules_by_table(rules_path)
    table_to_csv = _table_to_csv_name(schema_evaluation)
    plan_by_issue = _action_plan_by_issue(issue_action_plans)
    actions = [
        _remediation_action(
            index=index,
            issue=dict(issue),
            rules_by_table=rules_by_table,
            table_to_csv=table_to_csv,
            action_plan=plan_by_issue.get(str(issue.get("issue_id") or "")),
        )
        for index, issue in enumerate(issues, start=1)
    ]
    auto_applicable = [action for action in actions if action["deterministic_operation"]["supported"]]
    review_required = [action for action in actions if not action["deterministic_operation"]["supported"]]
    return {
        "artifact": "remediation_plan",
        "version": 1,
        "source": "deterministic",
        "generated_at": _iso_now(),
        "derived_from": [
            "issues.json",
            "issue_action_plans.json",
            "schema_evaluation.json",
            "run_summary.json",
            "rules.yaml",
        ],
        "policy": {
            "source_data_mutation": "never",
            "application_target": "staged_copy_only",
            "approval_required": True,
            "llm_role": "advisory_only",
            "llm_may_mutate_data": False,
            "deterministic_source_of_truth": "remediation_plan.json",
        },
        "input_context": {
            "source_type": runtime_inputs.get("source_type") if runtime_inputs else None,
            "dbml_path": runtime_inputs.get("dbml_path") if runtime_inputs else None,
            "csv_dir": runtime_inputs.get("csv_dir") if runtime_inputs else None,
            "rules_path": str(rules_path) if rules_path else None,
            "target": runtime_inputs.get("target") if runtime_inputs else None,
        },
        "summary": {
            "issue_count": len(actions),
            "action_count": len(actions),
            "auto_applicable_count": len(auto_applicable),
            "review_required_count": len(review_required),
            "copy_only": True,
            "source": "deterministic",
        },
        "actions": actions,
    }


def build_remediation_plan_from_artifacts(out_dir: Path) -> dict[str, Any]:
    issues = _read_json_value(out_dir / "issues.json", default=[])
    action_plans = _read_json_value(out_dir / "issue_action_plans.json", default={})
    schema_evaluation = _read_json_value(out_dir / "schema_evaluation.json", default={})
    run_summary = _read_json_value(out_dir / "run_summary.json", default={})
    runtime_inputs = run_summary.get("inputs") if isinstance(run_summary, Mapping) else {}
    rules_path = runtime_inputs.get("rules_path") if isinstance(runtime_inputs, Mapping) else None
    plan = build_remediation_plan(
        issues=issues if isinstance(issues, list) else [],
        issue_action_plans=action_plans if isinstance(action_plans, Mapping) else {},
        schema_evaluation=schema_evaluation if isinstance(schema_evaluation, Mapping) else {},
        runtime_inputs=runtime_inputs if isinstance(runtime_inputs, Mapping) else {},
        rules_path=rules_path,
    )
    (out_dir / REMEDIATION_PLAN_FILENAME).write_text(
        json.dumps(plan, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return plan


def copy_csv_inputs_for_remediation(
    *,
    source_dbml_path: Path,
    source_csv_dir: Path,
    source_rules_path: Path | None,
    input_dir: Path,
) -> dict[str, Path | None]:
    input_dir.mkdir(parents=True, exist_ok=True)
    staged_dbml_path = input_dir / "schema.dbml"
    staged_csv_dir = input_dir / "csv"
    staged_rules_path = input_dir / "rules.yaml" if source_rules_path else None

    shutil.copy2(source_dbml_path, staged_dbml_path)
    if staged_csv_dir.exists():
        shutil.rmtree(staged_csv_dir)
    shutil.copytree(source_csv_dir, staged_csv_dir)
    if source_rules_path and staged_rules_path:
        shutil.copy2(source_rules_path, staged_rules_path)

    return {
        "dbml_path": staged_dbml_path,
        "csv_dir": staged_csv_dir,
        "rules_path": staged_rules_path,
    }


def apply_remediation_actions_to_csv_dir(
    *,
    remediation_plan: Mapping[str, Any],
    csv_dir: Path,
    approved_remediation_ids: Sequence[str],
) -> dict[str, Any]:
    approved = {str(value) for value in approved_remediation_ids}
    actions = [
        action
        for action in remediation_plan.get("actions", [])
        if isinstance(action, Mapping) and str(action.get("remediation_id")) in approved
    ]
    actions.sort(key=lambda action: int(action.get("operation_order") or 1000))

    csv_dir = csv_dir.resolve()
    csv_file_by_table = _csv_file_by_table(remediation_plan)
    table_cache: dict[str, list[dict[str, str]]] = {}
    table_fields: dict[str, list[str]] = {}
    table_paths: dict[str, Path] = {}
    results: list[dict[str, Any]] = []
    for action in actions:
        operation = action.get("deterministic_operation") or {}
        if not operation.get("supported"):
            results.append(_apply_result(action, "skipped", 0, "Operation requires human review."))
            continue
        table = str(action.get("table") or "")
        csv_file = str(action.get("csv_file") or f"{table}.csv")
        load_error = _load_staged_table(table_cache, table_fields, table_paths, table, csv_dir, csv_file)
        if load_error:
            results.append(_apply_result(action, "skipped", 0, load_error))
            continue

        result = _apply_operation(
            table_cache,
            table_fields,
            table_paths,
            action,
            csv_dir=csv_dir,
            csv_file_by_table=csv_file_by_table,
        )
        results.append(result)

    for table, rows in table_cache.items():
        _write_csv_rows(table_paths[table], table_fields[table], rows)

    applied = [row for row in results if row["status"] == "applied"]
    changed = [row for row in applied if row["affected_count"] > 0]
    return {
        "artifact": "approved_remediations",
        "version": 1,
        "source": "deterministic",
        "generated_at": _iso_now(),
        "policy": {
            "source_data_mutation": "never",
            "application_target": "staged_copy_only",
            "approval_required": True,
        },
        "summary": {
            "approved_count": len(approved),
            "matched_action_count": len(actions),
            "applied_count": len(applied),
            "changed_action_count": len(changed),
            "affected_count": sum(int(row["affected_count"]) for row in results),
        },
        "approved_remediation_ids": sorted(approved),
        "results": results,
    }


def compare_quality_runs(
    *,
    before_out_dir: Path,
    after_out_dir: Path,
    before_job_id: str,
    after_job_id: str,
) -> dict[str, Any]:
    before_issues = _read_json_value(before_out_dir / "issues.json", default=[])
    after_issues = _read_json_value(after_out_dir / "issues.json", default=[])
    before_verdict = _read_json_value(before_out_dir / "dataset_verdict.json", default={})
    after_verdict = _read_json_value(after_out_dir / "dataset_verdict.json", default={})
    before_gates = _read_json_value(before_out_dir / "quality_gates.json", default={})
    after_gates = _read_json_value(after_out_dir / "quality_gates.json", default={})

    before_rows = before_issues if isinstance(before_issues, list) else []
    after_rows = after_issues if isinstance(after_issues, list) else []
    before_signatures = {_issue_signature(issue): issue for issue in before_rows}
    after_signatures = {_issue_signature(issue): issue for issue in after_rows}
    resolved = sorted(set(before_signatures) - set(after_signatures))
    new = sorted(set(after_signatures) - set(before_signatures))
    remaining = sorted(set(before_signatures) & set(after_signatures))
    return {
        "artifact": "before_after_quality_diff",
        "version": 1,
        "source": "deterministic",
        "generated_at": _iso_now(),
        "before_job_id": before_job_id,
        "after_job_id": after_job_id,
        "summary": {
            "before_issue_count": len(before_rows),
            "after_issue_count": len(after_rows),
            "issue_delta": len(after_rows) - len(before_rows),
            "resolved_issue_count": len(resolved),
            "remaining_issue_count": len(remaining),
            "new_issue_count": len(new),
            "before_verdict": _verdict_label(before_verdict),
            "after_verdict": _verdict_label(after_verdict),
            "before_blocked_gates": _blocked_gate_count(before_gates),
            "after_blocked_gates": _blocked_gate_count(after_gates),
        },
        "resolved_issue_signatures": resolved,
        "remaining_issue_signatures": remaining,
        "new_issue_signatures": new,
    }


def _remediation_action(
    *,
    index: int,
    issue: dict[str, Any],
    rules_by_table: Mapping[str, Sequence[Mapping[str, Any]]],
    table_to_csv: Mapping[str, str],
    action_plan: Mapping[str, Any] | None,
) -> dict[str, Any]:
    issue_id = str(issue.get("issue_id") or f"ISSUE-{index:04d}")
    issue_type = str(issue.get("issue_type") or "UNKNOWN")
    table = str(issue.get("table") or "")
    columns = [str(col) for col in issue.get("columns") or []]
    operation = _operation_for_issue(issue, rules_by_table=rules_by_table)
    supported = bool(operation.get("supported"))
    return {
        "remediation_id": f"REMEDY-{index:04d}",
        "issue_id": issue_id,
        "issue_type": issue_type,
        "severity": issue.get("severity") or "P?",
        "table": table,
        "columns": columns,
        "csv_file": table_to_csv.get(table, f"{table}.csv"),
        "bad_count": issue.get("bad_count"),
        "total_count": issue.get("total_count"),
        "operation_order": OPERATION_ORDER.get(issue_type, 500),
        "requires_approval": True,
        "application_mode": "staged_copy_only",
        "proposed_change": _proposed_change_text(issue, operation),
        "deterministic_operation": operation,
        "llm_boundary": {
            "role": "advisory_only",
            "may_change_data": False,
            "message": (
                "LLM guidance can explain or critique this action, but only the deterministic "
                "operation is allowed to change the staged copy after approval."
            ),
        },
        "evidence": {
            "sample_bad_rows_path": issue.get("sample_bad_rows_path"),
            "evidence_sql": issue.get("evidence_sql"),
            "action_plan_available": bool(action_plan),
        },
        "status": "ready_for_approval" if supported else "human_review_required",
    }


def _operation_for_issue(
    issue: Mapping[str, Any],
    *,
    rules_by_table: Mapping[str, Sequence[Mapping[str, Any]]],
) -> dict[str, Any]:
    issue_type = str(issue.get("issue_type") or "")
    table = str(issue.get("table") or "")
    columns = [str(col) for col in issue.get("columns") or []]
    if issue_type in {"REQUIRED_FIELD_NULL", "PRIMARY_KEY_NULL", "FOREIGN_KEY_NULL"} and columns:
        return {
            "supported": True,
            "type": "drop_rows_with_blank_values",
            "columns": columns,
            "reason": "Rows with blank required/key values cannot be repaired deterministically.",
        }
    if issue_type == "INVALID_PLACEHOLDER_TOKEN" and columns:
        return {
            "supported": True,
            "type": "replace_placeholder_tokens",
            "columns": columns,
            "tokens": list(PLACEHOLDER_TOKENS),
            "replacement": "REMEDIATION_REVIEW_REQUIRED",
            "reason": "Placeholder text is replaced in the staged copy with an explicit review marker.",
        }
    if issue_type in {"VALUE_OUT_OF_RANGE", "NEGATIVE_VALUE_NOT_ALLOWED"} and columns:
        rule = _matching_range_rule(table, columns[0], issue_type, rules_by_table)
        return {
            "supported": True,
            "type": "drop_rows_outside_range",
            "columns": columns[:1],
            "min": rule.get("min", 0 if issue_type == "NEGATIVE_VALUE_NOT_ALLOWED" else None),
            "max": rule.get("max"),
            "reason": "Out-of-range rows are excluded from the staged copy before recheck.",
        }
    if issue_type == "DATE_ORDER_INVALID" and len(columns) >= 2:
        return {
            "supported": True,
            "type": "drop_rows_with_invalid_date_order",
            "columns": columns[:2],
            "reason": "Rows with end timestamp before start timestamp are excluded from the staged copy.",
        }
    if issue_type == "ORPHAN_FOREIGN_KEY" and columns:
        parent_table = issue.get("parent_table")
        parent_columns = [str(col) for col in issue.get("parent_columns") or []]
        if parent_table and parent_columns:
            return {
                "supported": True,
                "type": "drop_rows_with_orphan_fk",
                "columns": columns,
                "parent_table": str(parent_table),
                "parent_columns": parent_columns,
                "reason": "Child rows whose keys are absent from the staged parent table are excluded.",
            }
    if issue_type in {"DUPLICATE_PRIMARY_KEY", "PARENT_KEY_DUPLICATE", "UNIQUE_DUPLICATE"} and columns:
        return {
            "supported": True,
            "type": "dedupe_rows_keep_first",
            "columns": columns,
            "reason": "After higher-priority row fixes, duplicate keys keep the first remaining row.",
        }
    return {
        "supported": False,
        "type": "human_review_required",
        "columns": columns,
        "reason": "No deterministic copy-only operation is defined for this issue type.",
    }


def _apply_operation(
    table_cache: dict[str, list[dict[str, str]]],
    table_fields: dict[str, list[str]],
    table_paths: dict[str, Path],
    action: Mapping[str, Any],
    *,
    csv_dir: Path,
    csv_file_by_table: Mapping[str, str],
) -> dict[str, Any]:
    operation = action.get("deterministic_operation") or {}
    table = str(action.get("table") or "")
    rows = table_cache[table]
    fieldnames = table_fields[table]
    op_type = str(operation.get("type") or "")
    if op_type == "drop_rows_with_blank_values":
        columns = _existing_columns(fieldnames, operation.get("columns") or [])
        drop_indexes = _blank_indexes(rows, columns)
        return _drop_rows(table_cache, action, drop_indexes)
    if op_type == "replace_placeholder_tokens":
        columns = _existing_columns(fieldnames, operation.get("columns") or [])
        tokens = {str(token).strip().lower() for token in operation.get("tokens") or []}
        replacement = str(operation.get("replacement") or "REMEDIATION_REVIEW_REQUIRED")
        affected = 0
        for row in rows:
            for column in columns:
                if str(row.get(column, "")).strip().lower() in tokens:
                    row[column] = replacement
                    affected += 1
        return _apply_result(action, "applied", affected, "Placeholder tokens replaced in staged copy.")
    if op_type == "drop_rows_outside_range":
        columns = _existing_columns(fieldnames, operation.get("columns") or [])
        if not columns:
            return _apply_result(action, "skipped", 0, "Referenced range column is missing.")
        drop_indexes = _range_violation_indexes(rows, columns[0], operation)
        return _drop_rows(table_cache, action, drop_indexes)
    if op_type == "drop_rows_with_invalid_date_order":
        columns = _existing_columns(fieldnames, operation.get("columns") or [])
        if len(columns) < 2:
            return _apply_result(action, "skipped", 0, "Referenced date-order columns are missing.")
        drop_indexes = _date_order_violation_indexes(rows, columns[0], columns[1])
        return _drop_rows(table_cache, action, drop_indexes)
    if op_type == "drop_rows_with_orphan_fk":
        columns = _existing_columns(fieldnames, operation.get("columns") or [])
        parent_table = str(operation.get("parent_table") or "")
        parent_columns = [str(col) for col in operation.get("parent_columns") or []]
        parent_rows = table_cache.get(parent_table)
        if parent_rows is None:
            parent_csv = csv_file_by_table.get(parent_table, f"{parent_table}.csv")
            load_error = _load_staged_table(
                table_cache,
                table_fields,
                table_paths,
                parent_table,
                csv_dir,
                parent_csv,
            )
            if load_error:
                return _apply_result(action, "skipped", 0, load_error)
            parent_rows = table_cache[parent_table]
        parent_columns = _existing_columns(table_fields[parent_table], parent_columns)
        if not columns or len(columns) != len(parent_columns):
            return _apply_result(action, "skipped", 0, "FK columns are missing in staged copy.")
        parent_keys = {_key_value(row, parent_columns) for row in parent_rows}
        drop_indexes = {
            index
            for index, row in enumerate(rows)
            if _key_value(row, columns).strip() and _key_value(row, columns) not in parent_keys
        }
        return _drop_rows(table_cache, action, drop_indexes)
    if op_type == "dedupe_rows_keep_first":
        columns = _existing_columns(fieldnames, operation.get("columns") or [])
        if not columns:
            return _apply_result(action, "skipped", 0, "Duplicate key columns are missing.")
        drop_indexes = _duplicate_indexes(rows, columns)
        return _drop_rows(table_cache, action, drop_indexes)
    return _apply_result(action, "skipped", 0, f"Unsupported operation: {op_type}")


def _csv_file_by_table(remediation_plan: Mapping[str, Any]) -> dict[str, str]:
    result: dict[str, str] = {}
    for action in remediation_plan.get("actions", []):
        if not isinstance(action, Mapping):
            continue
        table = str(action.get("table") or "")
        csv_file = str(action.get("csv_file") or "")
        if table and csv_file:
            result[table] = csv_file
    return result


def _load_staged_table(
    table_cache: dict[str, list[dict[str, str]]],
    table_fields: dict[str, list[str]],
    table_paths: dict[str, Path],
    table: str,
    csv_dir: Path,
    csv_file: str,
) -> str | None:
    if table in table_cache:
        return None
    path = (csv_dir / csv_file).resolve()
    try:
        path.relative_to(csv_dir)
    except ValueError:
        return "CSV path is outside staged copy."
    if not path.exists():
        return f"Staged CSV not found: {csv_file}"
    fieldnames, rows = _read_csv_rows(path)
    table_cache[table] = rows
    table_fields[table] = fieldnames
    table_paths[table] = path
    return None


def _drop_rows(
    table_cache: dict[str, list[dict[str, str]]],
    action: Mapping[str, Any],
    drop_indexes: set[int],
) -> dict[str, Any]:
    table = str(action.get("table") or "")
    affected = len(drop_indexes)
    table_cache[table] = [
        row for index, row in enumerate(table_cache[table]) if index not in drop_indexes
    ]
    return _apply_result(action, "applied", affected, "Rows removed from staged copy.")


def _apply_result(
    action: Mapping[str, Any],
    status: str,
    affected_count: int,
    message: str,
) -> dict[str, Any]:
    return {
        "remediation_id": action.get("remediation_id"),
        "issue_id": action.get("issue_id"),
        "issue_type": action.get("issue_type"),
        "table": action.get("table"),
        "operation": (action.get("deterministic_operation") or {}).get("type"),
        "status": status,
        "affected_count": affected_count,
        "message": message,
    }


def _read_csv_rows(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        fieldnames = list(reader.fieldnames or [])
        rows = [
            {column: "" if row.get(column) is None else str(row.get(column)) for column in fieldnames}
            for row in reader
        ]
    return fieldnames, rows


def _write_csv_rows(path: Path, fieldnames: Sequence[str], rows: Sequence[Mapping[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=list(fieldnames),
            extrasaction="ignore",
            lineterminator="\n",
        )
        writer.writeheader()
        for row in rows:
            writer.writerow({column: str(row.get(column, "")) for column in fieldnames})


def _blank_indexes(rows: Sequence[Mapping[str, str]], columns: Sequence[str]) -> set[int]:
    if not columns:
        return set()
    return {
        index
        for index, row in enumerate(rows)
        if any(str(row.get(column, "")).strip() == "" for column in columns)
    }


def _range_violation_indexes(
    rows: Sequence[Mapping[str, str]],
    column: str,
    operation: Mapping[str, Any],
) -> set[int]:
    min_value = _float_or_none(operation.get("min"))
    max_value = _float_or_none(operation.get("max"))
    drop_indexes: set[int] = set()
    for index, row in enumerate(rows):
        text = str(row.get(column, "")).strip()
        if not text:
            continue
        number = _float_or_none(text)
        if number is None:
            continue
        if min_value is not None and number < min_value:
            drop_indexes.add(index)
        elif max_value is not None and number > max_value:
            drop_indexes.add(index)
    return drop_indexes


def _date_order_violation_indexes(
    rows: Sequence[Mapping[str, str]],
    start_column: str,
    end_column: str,
) -> set[int]:
    drop_indexes: set[int] = set()
    for index, row in enumerate(rows):
        end_text = str(row.get(end_column, "")).strip()
        if not end_text:
            continue
        start_value = _parse_datetime_value(row.get(start_column, ""))
        end_value = _parse_datetime_value(end_text)
        if start_value is not None and end_value is not None and end_value < start_value:
            drop_indexes.add(index)
    return drop_indexes


def _duplicate_indexes(rows: Sequence[Mapping[str, str]], columns: Sequence[str]) -> set[int]:
    seen: set[str] = set()
    drop_indexes: set[int] = set()
    for index, row in enumerate(rows):
        if any(str(row.get(column, "")).strip() == "" for column in columns):
            continue
        key = _key_value(row, columns)
        if key in seen:
            drop_indexes.add(index)
        else:
            seen.add(key)
    return drop_indexes


def _key_value(row: Mapping[str, str], columns: Sequence[str]) -> str:
    return "|".join(str(row.get(column, "")).strip() for column in columns)


def _existing_columns(fieldnames: Sequence[str], columns: Sequence[Any]) -> list[str]:
    available = set(fieldnames)
    return [str(column) for column in columns if str(column) in available]


def _float_or_none(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(str(value).strip())
    except ValueError:
        return None


def _parse_datetime_value(value: Any) -> datetime | None:
    text = str(value or "").strip()
    if not text:
        return None
    normalized = f"{text[:-1]}+00:00" if text.endswith("Z") else text
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        parsed = _parse_datetime_with_known_format(text)
    if parsed is not None and parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def _parse_datetime_with_known_format(value: str) -> datetime | None:
    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%m/%d/%Y",
        "%d/%m/%Y",
    ):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def _proposed_change_text(issue: Mapping[str, Any], operation: Mapping[str, Any]) -> str:
    issue_type = issue.get("issue_type") or "issue"
    table = issue.get("table") or "dataset"
    columns = ", ".join(str(col) for col in issue.get("columns") or []) or "table"
    if not operation.get("supported"):
        return f"Review {issue_type} on {table}.{columns}; no deterministic copy-only fix is defined."
    op_type = operation.get("type")
    if op_type == "replace_placeholder_tokens":
        return f"Replace placeholder tokens in staged {table}.{columns} with a review marker."
    if op_type == "dedupe_rows_keep_first":
        return f"Keep the first remaining staged row for each duplicate key in {table}.{columns}."
    return f"Exclude rows matching {issue_type} evidence from the staged {table} CSV."


def _matching_range_rule(
    table: str,
    column: str,
    issue_type: str,
    rules_by_table: Mapping[str, Sequence[Mapping[str, Any]]],
) -> dict[str, Any]:
    for rule in rules_by_table.get(table, []):
        if str(rule.get("type", "")).lower() != "range":
            continue
        if str(rule.get("column")) != column:
            continue
        if issue_type == "NEGATIVE_VALUE_NOT_ALLOWED" and float(rule.get("min", -1)) != 0:
            continue
        return dict(rule)
    return {}


def _load_rules_by_table(rules_path: str | Path | None) -> dict[str, list[dict[str, Any]]]:
    if not rules_path:
        return {}
    path = Path(rules_path)
    if not path.exists():
        return {}
    loaded = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    rules = loaded.get("rules") if isinstance(loaded, Mapping) else {}
    if not isinstance(rules, Mapping):
        return {}
    return {
        str(table): [dict(rule) for rule in table_rules if isinstance(rule, Mapping)]
        for table, table_rules in rules.items()
        if isinstance(table_rules, list)
    }


def _table_to_csv_name(schema_evaluation: Mapping[str, Any] | None) -> dict[str, str]:
    result: dict[str, str] = {}
    rows = schema_evaluation.get("tables") if isinstance(schema_evaluation, Mapping) else []
    for row in rows if isinstance(rows, list) else []:
        if not isinstance(row, Mapping):
            continue
        table = row.get("table")
        selected_csv = row.get("selected_csv")
        csv_path = row.get("csv_path")
        if table and selected_csv:
            result[str(table)] = Path(str(selected_csv)).name
        elif table and csv_path:
            result[str(table)] = Path(str(csv_path)).name
    return result


def _action_plan_by_issue(issue_action_plans: Mapping[str, Any] | None) -> dict[str, Mapping[str, Any]]:
    rows = issue_action_plans.get("plans") if isinstance(issue_action_plans, Mapping) else []
    result: dict[str, Mapping[str, Any]] = {}
    for row in rows if isinstance(rows, list) else []:
        if isinstance(row, Mapping) and row.get("issue_id"):
            result[str(row["issue_id"])] = row
    return result


def _issue_signature(issue: Mapping[str, Any]) -> str:
    columns = ",".join(str(col) for col in issue.get("columns") or [])
    parent_columns = ",".join(str(col) for col in issue.get("parent_columns") or [])
    return "|".join(
        [
            str(issue.get("issue_type") or ""),
            str(issue.get("table") or ""),
            columns,
            str(issue.get("parent_table") or ""),
            parent_columns,
        ]
    )


def _verdict_label(verdict: Any) -> str:
    if not isinstance(verdict, Mapping):
        return "unknown"
    return str(verdict.get("verdict") or verdict.get("summary", {}).get("verdict") or "unknown")


def _blocked_gate_count(gates: Any) -> int:
    if not isinstance(gates, Mapping):
        return 0
    summary = gates.get("summary")
    if isinstance(summary, Mapping) and summary.get("blocked_count") is not None:
        return int(summary.get("blocked_count") or 0)
    rows = gates.get("gates")
    return sum(1 for row in rows if isinstance(row, Mapping) and row.get("status") == "Blocked") if isinstance(rows, list) else 0


def _read_json_value(path: Path, *, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
