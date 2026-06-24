from __future__ import annotations

import hashlib
import html
import json
import re
import shutil
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from vsf_profiler.pdf_export import PdfExportResult, write_simple_pdf_report


PACKAGE_VERSION = 1
MANIFEST_NAME = "export_manifest.json"
INDEX_NAME = "index.html"
PDF_REPORT_NAME = "analysis_report.pdf"
FIXED_ZIP_TIMESTAMP = (2026, 1, 1, 0, 0, 0)
PACKAGE_ACTION_PLAN_LIMIT = 5
PACKAGE_ACTION_PLAN_SUMMARY_LIMIT = 30
PACKAGE_EVIDENCE_VALUE_LIMIT = 6
PACKAGE_TODO_GROUP_LIMIT = 3
REQUIRED_ARTIFACTS = [
    "profile_summary.json",
    "issues.json",
    "influence.json",
    "schema_parse_report.json",
    "lineage_graph.json",
    "schema_evaluation.json",
    "relationship_graph.json",
    "dataset_verdict.json",
    "table_assessments.json",
    "schema_diagram.json",
    "schema_diagram.dbml",
    "run.log",
    "run_events.jsonl",
    "run_summary.json",
    "report.md",
    "report.html",
]
OPTIONAL_ARTIFACTS = [
    "connector_metadata.json",
    "preflight_review.json",
    "issue_action_plans.json",
    "issue_llm_enrichments.json",
    "issue_todos.json",
    "quality_gates.json",
    "ground_truth_issues.json",
    "baseline_comparison.json",
    "evaluation_summary.json",
    "l4_report.md",
    "guardrail_report.json",
]
TEXT_SUFFIXES = {".json", ".jsonl", ".log", ".md", ".html", ".txt", ".dbml", ".csv", ".pdf"}
SENSITIVE_ASSIGNMENT_RE = re.compile(
    r"(?i)(password|passwd|pwd|token|api[_-]?key|secret)=([^\s,;&<>\"]+)"
)
CONNECTION_CREDENTIAL_RE = re.compile(
    r"(?i)\b(postgres(?:ql)?|mysql|mariadb|snowflake|redshift)://([^@\s<>\"]+)@"
)
BEARER_TOKEN_RE = re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._~+/=-]{12,}")
OPENAI_KEY_RE = re.compile(r"\bsk-[A-Za-z0-9_-]{12,}")


@dataclass(frozen=True)
class PackageResult:
    output_dir: Path
    manifest_path: Path
    index_path: Path
    zip_path: Path | None
    pdf_path: Path | None
    file_count: int


@dataclass(frozen=True)
class _PackageFile:
    source_path: Path
    relative_path: str
    kind: str


def create_analysis_package(
    *,
    input_dir: Path,
    output_dir: Path,
    create_zip: bool = False,
    create_pdf: bool = False,
    force: bool = False,
    created_at: str | None = None,
) -> PackageResult:
    source_root = input_dir.resolve()
    package_root = output_dir.resolve()
    _validate_package_paths(source_root, package_root)
    if not source_root.is_dir():
        raise ValueError(f"Input directory does not exist: {input_dir}")
    if package_root.exists():
        if not force and any(package_root.iterdir()):
            raise ValueError(f"Output directory is not empty: {output_dir}. Use --force to replace it.")
        if force:
            shutil.rmtree(package_root)
    package_root.mkdir(parents=True, exist_ok=True)

    created_at_value = created_at or _iso_now()
    files, missing_required, excluded_files = _discover_package_files(source_root)
    if missing_required:
        missing_text = ", ".join(missing_required)
        raise ValueError(f"Input directory is missing required run artifacts: {missing_text}")

    copied_entries = [_copy_package_file(file, package_root) for file in files]
    pdf_result: PdfExportResult | None = None
    if create_pdf:
        pdf_result = write_simple_pdf_report(
            source_markdown_path=package_root / "report.md",
            output_pdf_path=package_root / PDF_REPORT_NAME,
            created_at=created_at_value,
        )
        copied_entries.append(_file_entry(pdf_result.path, PDF_REPORT_NAME, "pdf_report"))
    artifact_index = {entry["path"]: entry for entry in copied_entries}
    source_run = _read_json(source_root / "run_summary.json")
    connector_metadata = _read_json(source_root / "connector_metadata.json")
    index_html = _render_index_html(
        artifact_index=artifact_index,
        source_run=source_run,
        source_root=source_root,
    )
    index_path = package_root / INDEX_NAME
    index_path.write_text(index_html, encoding="utf-8")
    index_entry = _file_entry(index_path, INDEX_NAME, "package_entrypoint")
    all_entries = [index_entry, *copied_entries]

    manifest = _build_manifest(
        created_at=created_at_value,
        source_root=source_root,
        package_root=package_root,
        entries=all_entries,
        source_run=source_run,
        connector_metadata=connector_metadata,
        pdf_result=pdf_result,
        redaction={"scanned_file_count": 0, "violations": []},
        excluded_files=excluded_files,
        zip_path=package_root.with_suffix(".zip") if create_zip else None,
    )
    manifest_path = package_root / MANIFEST_NAME
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    redaction = _scan_package_redaction(package_root)
    if redaction["violations"]:
        violations = "; ".join(
            f"{item['path']}:{item['line']} {item['code']}" for item in redaction["violations"][:5]
        )
        raise ValueError(f"Package redaction scan failed: {violations}")
    manifest["redaction"]["scanned_file_count"] = redaction["scanned_file_count"]
    if pdf_result is not None:
        manifest["pdf_export"]["redaction_status"] = redaction["status"]
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    zip_path: Path | None = None
    if create_zip:
        zip_path = package_root.with_suffix(".zip")
        if zip_path.exists():
            if not force:
                raise ValueError(f"Zip archive already exists: {zip_path}. Use --force to replace it.")
            zip_path.unlink()
        _write_deterministic_zip(package_root, zip_path)

    return PackageResult(
        output_dir=package_root,
        manifest_path=manifest_path,
        index_path=index_path,
        zip_path=zip_path,
        pdf_path=pdf_result.path if pdf_result else None,
        file_count=len(all_entries),
    )


def _validate_package_paths(source_root: Path, package_root: Path) -> None:
    if source_root == package_root:
        raise ValueError("Output directory must be different from the input directory.")
    if source_root in package_root.parents:
        raise ValueError("Output directory must not be inside the input run directory.")


def _discover_package_files(source_root: Path) -> tuple[list[_PackageFile], list[str], list[dict[str, str]]]:
    files: list[_PackageFile] = []
    included: set[str] = set()
    missing_required: list[str] = []
    for relative_path in REQUIRED_ARTIFACTS:
        path = source_root / relative_path
        if path.is_file():
            files.append(_PackageFile(path, relative_path, _artifact_kind(relative_path)))
            included.add(relative_path)
        else:
            missing_required.append(relative_path)

    for relative_path in OPTIONAL_ARTIFACTS:
        path = source_root / relative_path
        if path.is_file():
            files.append(_PackageFile(path, relative_path, _artifact_kind(relative_path)))
            included.add(relative_path)

    charts_dir = source_root / "charts"
    if charts_dir.is_dir():
        for path in sorted(charts_dir.glob("*.json")):
            relative_path = _relative_posix(path, source_root)
            files.append(_PackageFile(path, relative_path, "chart_spec"))
            included.add(relative_path)

    samples_dir = source_root / "samples"
    if samples_dir.is_dir():
        for path in sorted(samples_dir.rglob("*.csv")):
            relative_path = _relative_posix(path, source_root)
            files.append(_PackageFile(path, relative_path, "sample_csv"))
            included.add(relative_path)

    excluded = _excluded_files(source_root, included)
    files.sort(key=lambda file: file.relative_path)
    return files, missing_required, excluded


def _excluded_files(source_root: Path, included: set[str]) -> list[dict[str, str]]:
    excluded: list[dict[str, str]] = []
    for path in sorted(source_root.rglob("*")):
        if not path.is_file():
            continue
        relative_path = _relative_posix(path, source_root)
        if relative_path in included:
            continue
        reason = _exclusion_reason(relative_path)
        if reason:
            excluded.append({"path": relative_path, "reason": reason})
    return excluded


def _exclusion_reason(relative_path: str) -> str:
    parts = relative_path.split("/")
    if any(part == ".connector_extracts" for part in parts):
        return "connector_temp_extract"
    if any(part.startswith(".") for part in parts):
        return "hidden_or_temp_file"
    if relative_path in {MANIFEST_NAME, INDEX_NAME} or relative_path.endswith(".zip"):
        return "previous_package_artifact"
    if Path(relative_path).suffix.lower() == ".csv" and parts[0] != "samples":
        return "raw_source_csv_not_allowed"
    return ""


def _copy_package_file(file: _PackageFile, package_root: Path) -> dict[str, Any]:
    target_path = package_root / file.relative_path
    target_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(file.source_path, target_path)
    return _file_entry(target_path, file.relative_path, file.kind)


def _file_entry(path: Path, relative_path: str, kind: str) -> dict[str, Any]:
    return {
        "path": relative_path,
        "kind": kind,
        "size_bytes": path.stat().st_size,
        "sha256": _sha256_file(path),
    }


def _build_manifest(
    *,
    created_at: str,
    source_root: Path,
    package_root: Path,
    entries: list[dict[str, Any]],
    source_run: dict[str, Any],
    connector_metadata: dict[str, Any],
    pdf_result: PdfExportResult | None,
    redaction: dict[str, Any],
    excluded_files: list[dict[str, str]],
    zip_path: Path | None,
) -> dict[str, Any]:
    total_bytes = sum(int(entry["size_bytes"]) for entry in entries)
    connector_redaction_status = None
    if connector_metadata:
        connector_redaction_status = bool(connector_metadata.get("secrets_redacted"))
    pdf_entry = next((entry for entry in entries if entry["path"] == PDF_REPORT_NAME), None)
    return {
        "artifact": "export_manifest",
        "version": PACKAGE_VERSION,
        "created_at": created_at,
        "package": {
            "input_dir": str(source_root),
            "output_dir": str(package_root),
            "entrypoint": INDEX_NAME,
            "manifest_path": MANIFEST_NAME,
            "file_count": len(entries),
            "total_bytes": total_bytes,
            "zip_archive": {
                "created": zip_path is not None,
                "path": str(zip_path) if zip_path else "",
                "name": zip_path.name if zip_path else "",
            },
        },
        "pdf_export": _pdf_export_manifest(pdf_result, pdf_entry),
        "source_run": source_run,
        "redaction": {
            "status": "passed",
            "scanned_file_count": redaction["scanned_file_count"],
            "violations": [],
            "connector_secrets_redacted": connector_redaction_status,
        },
        "included_files": entries,
        "excluded_files": excluded_files,
        "warnings": _package_warnings(source_run, connector_metadata),
    }


def _pdf_export_manifest(
    pdf_result: PdfExportResult | None,
    pdf_entry: dict[str, Any] | None,
) -> dict[str, Any]:
    if pdf_result is None or pdf_entry is None:
        return {
            "created": False,
            "path": "",
            "sha256": "",
            "backend": "",
            "generator": "",
            "created_at": "",
            "redaction_status": "",
        }
    return {
        "created": True,
        "path": PDF_REPORT_NAME,
        "sha256": pdf_entry["sha256"],
        "backend": pdf_result.backend,
        "generator": pdf_result.generator,
        "created_at": pdf_result.created_at,
        "source_path": "report.md",
        "redaction_status": "pending",
    }


def _package_warnings(source_run: dict[str, Any], connector_metadata: dict[str, Any]) -> list[str]:
    warnings: list[str] = []
    if source_run and source_run.get("status") != "success":
        warnings.append(f"Source run status is {source_run.get('status')}.")
    if connector_metadata and not connector_metadata.get("secrets_redacted"):
        warnings.append("Connector metadata did not report secrets_redacted=true.")
    return warnings


def _render_index_html(
    *,
    artifact_index: dict[str, dict[str, Any]],
    source_run: dict[str, Any],
    source_root: Path,
) -> str:
    verdict = _read_json(source_root / "dataset_verdict.json")
    relationship_graph = _read_json(source_root / "relationship_graph.json")
    table_assessments = _read_json(source_root / "table_assessments.json")
    lineage_graph = _read_json(source_root / "lineage_graph.json")
    schema_parse = _read_json(source_root / "schema_parse_report.json")
    schema_evaluation = _read_json(source_root / "schema_evaluation.json")
    connector_metadata = _read_json(source_root / "connector_metadata.json")
    profile_summary = _read_json(source_root / "profile_summary.json")
    issues = _read_json_list(source_root / "issues.json")
    quality_gates = _read_json(source_root / "quality_gates.json")
    issue_action_plans = _read_json(source_root / "issue_action_plans.json")
    issue_todos = _read_json(source_root / "issue_todos.json")
    evaluation_summary = _read_json(source_root / "evaluation_summary.json")
    chart_paths = sorted(path for path in artifact_index if path.startswith("charts/"))
    sample_paths = sorted(path for path in artifact_index if path.startswith("samples/"))
    run_id = source_run.get("run_id", "unknown") if source_run else "unknown"
    run_status = source_run.get("status", "unknown") if source_run else "unknown"
    verdict_issue_counts = verdict.get("issue_counts") or {}
    severity_counts = verdict_issue_counts.get("by_severity") or {}
    issue_total = verdict_issue_counts.get("total", len(issues))
    blocker_count = sum(int(severity_counts.get(severity, 0) or 0) for severity in ("P0", "P1"))
    verdict_label = verdict.get("verdict", "unknown")
    risk_score = verdict.get("risk_score", "n/a")
    relationship_summary = relationship_graph.get("summary") or {}
    table_assessment_summary = table_assessments.get("summary") or {}
    lineage_summary = lineage_graph.get("summary") or {}
    parse_counts = schema_parse.get("counts") or {}
    eval_summary = schema_evaluation.get("summary") or {}
    profile_tables = profile_summary.get("tables") or {}
    row_count = sum(int(table.get("row_count") or 0) for table in profile_tables.values())
    column_count = sum(int(table.get("column_count") or 0) for table in profile_tables.values())
    all_outlier_rows = top_numeric_outlier_rows(profile_summary, limit=10_000)
    outlier_rows = all_outlier_rows[:10]
    outlier_count = sum(int(row.get("outlier_count") or 0) for row in all_outlier_rows)
    column_usability_rows = package_column_usability_rows(profile_summary, issues)
    blocked_column_count = sum(1 for row in column_usability_rows if row["status"] == "blocked")
    preparation_column_count = sum(
        1 for row in column_usability_rows if row["status"] == "needs_preparation"
    )
    column_issue_blocks = package_column_issue_blocks(issues)
    relationship_status_counts = relationship_summary.get("status_counts") or {}
    invalid_fk_count = int(relationship_status_counts.get("invalid", 0) or 0)
    cards = [
        ("Readiness", verdict_label, f"Risk score {risk_score}"),
        ("Issues", str(issue_total), f"{blocker_count} P0/P1 blockers"),
        ("Tables", str(len(profile_tables) or eval_summary.get("mapped_table_count", "0")), f"{row_count} rows, {column_count} columns"),
        ("FK Health", f"{invalid_fk_count}/{relationship_summary.get('edge_count', 0)}", "Invalid relationship edges"),
        (
            "Table assessments",
            str(table_assessment_summary.get("table_count", "0")),
            "Readiness rows",
        ),
        ("Column usability", str(blocked_column_count), f"{preparation_column_count} need preparation"),
        ("Numeric outliers", str(outlier_count), f"{len(all_outlier_rows)} profiled columns"),
        ("Artifacts", str(len(artifact_index)), "Package files"),
    ]
    run_summary_html = package_run_summary_html(
        source_run=source_run,
        verdict=verdict,
        quality_gates=quality_gates,
        issue_total=issue_total,
        blocker_count=blocker_count,
        table_count=len(profile_tables) or eval_summary.get("mapped_table_count", 0),
        column_count=column_count,
        row_count=row_count,
    )
    quality_gates_html = package_quality_gates_html(quality_gates)
    table_overview_html = package_table_overview_html(table_assessments)
    column_issue_matrix_html = package_column_issue_matrix_html(column_issue_blocks)
    action_plans_html = package_action_plans_html(issue_action_plans)
    todos_html = package_todos_html(issue_todos)
    developer_artifact_links_html = package_developer_artifact_links_html(
        artifact_index,
        chart_paths=chart_paths,
        sample_paths=sample_paths,
    )
    evaluation_summary_html = package_evaluation_summary_html(evaluation_summary)
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VSF Data Quality Package</title>
  <style>
    :root {{
      --foreground-primary: #121817;
      --foreground-secondary: #46504d;
      --foreground-tertiary: #68736f;
      --surface-canvas: #f5f7f5;
      --surface-panel: #ffffff;
      --surface-overlay: #f9faf8;
      --surface-inset: #eef2ef;
      --border-subtle: #e3e8e4;
      --border-default: #cfd8d2;
      --border-strong: #9daaa3;
      --accent: #0f7664;
      --success: #23764d;
      --warning: #9a5f00;
      --destructive: #b23b32;
      --info: #316596;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: var(--surface-canvas);
      color: var(--foreground-primary);
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }}
    main {{ width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 28px 0 48px; }}
    header {{
      display: grid;
      gap: 10px;
      padding: 20px;
      border: 1px solid var(--border-default);
      border-radius: 12px;
      background: var(--surface-panel);
    }}
    h1, h2, h3, p {{ margin-top: 0; }}
    h1 {{ margin-bottom: 0; font-size: 30px; line-height: 1.12; letter-spacing: 0; }}
    h2 {{ margin-bottom: 12px; font-size: 18px; }}
    a {{ color: var(--accent); font-weight: 800; }}
    code {{ font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }}
    .eyebrow {{
      margin: 0 0 4px;
      color: var(--foreground-tertiary);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }}
    .meta {{ color: var(--foreground-secondary); font-size: 13px; }}
    .grid {{ display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 16px 0; }}
    .panel {{
      min-width: 0;
      padding: 14px;
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      background: var(--surface-overlay);
    }}
    details.panel summary {{ cursor: pointer; font-weight: 800; color: var(--foreground-primary); }}
    details.panel summary:focus-visible {{
      outline: 3px solid rgba(15, 118, 100, 0.28);
      outline-offset: 3px;
    }}
    .metric strong {{ display: block; font-size: 24px; line-height: 1; }}
    .metric span {{ color: var(--foreground-secondary); font-size: 12px; font-weight: 800; text-transform: uppercase; }}
    .stack {{ display: grid; gap: 10px; }}
    .todo-summary-cards {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }}
    .todo-summary-cards div,
    .todo-card {{ min-width: 0; padding: 10px 12px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--surface-panel); }}
    .todo-summary-cards strong {{ display: block; font-size: 22px; line-height: 1; }}
    .todo-summary-cards span,
    .todo-card span {{ color: var(--foreground-tertiary); font-size: 11px; font-weight: 800; text-transform: uppercase; }}
    .todo-summary-cards p,
    .todo-card p {{ margin: 4px 0 0; color: var(--foreground-secondary); font-size: 13px; line-height: 1.38; }}
    .todo-card-list {{ display: grid; gap: 8px; }}
    .todo-card header {{ display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 0 6px; padding: 0; border: 0; border-radius: 0; background: transparent; }}
    .todo-card code {{ color: var(--accent); font-weight: 800; }}
    .todo-card-meta {{ display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }}
    .todo-card-meta span {{ padding: 3px 7px; border: 1px solid var(--border-subtle); border-radius: 999px; background: var(--surface-overlay); color: var(--foreground-secondary); font-size: 11px; text-transform: none; }}
    .todo-more {{ margin: 8px 0 0; padding: 8px 10px; border: 1px dashed var(--border-default); border-radius: 8px; background: var(--surface-panel); color: var(--foreground-secondary); font-size: 13px; }}
    table {{ width: 100%; border-collapse: collapse; background: var(--surface-panel); }}
    th, td {{ padding: 8px 9px; border-bottom: 1px solid var(--border-subtle); text-align: left; vertical-align: top; }}
    th {{ background: var(--surface-inset); color: var(--foreground-secondary); font-size: 11px; font-weight: 800; text-transform: uppercase; }}
    .table-wrap {{ overflow-x: auto; }}
    .pill {{ display: inline-flex; min-height: 24px; align-items: center; border: 1px solid var(--border-default); border-radius: 999px; padding: 2px 8px; font: 800 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }}
    .NOT_READY, .P0, .P1, .failed, .invalid {{ color: var(--destructive); border-color: rgba(178, 59, 50, 0.35); }}
    .WARN, .P2, .fallback_used, .warning {{ color: var(--warning); border-color: rgba(154, 95, 0, 0.35); }}
    .READY, .P3, .passed, .valid {{ color: var(--success); border-color: rgba(35, 118, 77, 0.35); }}
    .not_enabled, .unknown {{ color: var(--info); border-color: rgba(49, 101, 150, 0.35); }}
    .section {{ margin-top: 16px; }}
    .links {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }}
    .link-row {{
      display: grid;
      gap: 3px;
      padding: 10px;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      background: var(--surface-panel);
      text-decoration: none;
    }}
    .link-row code {{ color: var(--foreground-tertiary); font-size: 12px; overflow-wrap: anywhere; }}
    .summary-list {{ display: grid; gap: 7px; margin: 0; padding: 0; list-style: none; }}
    .summary-list li {{ display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px; }}
    iframe {{
      width: 100%;
      min-height: 560px;
      border: 1px solid var(--border-default);
      border-radius: 12px;
      background: white;
    }}
    @media (max-width: 820px) {{
      .grid, .links, .todo-summary-cards {{ grid-template-columns: 1fr; }}
      main {{ width: min(100% - 20px, 1180px); padding-top: 16px; }}
    }}
  </style>
</head>
<body>
  <main>
    <header>
      <p class="eyebrow">VSF Data Profiler</p>
      <h1>Data Quality Package</h1>
      <p class="meta">Run <code>{_h(run_id)}</code> finished with status <strong>{_h(run_status)}</strong>. This offline package contains generated artifacts only, plus bounded sample evidence when available. Raw source CSV files are excluded.</p>
    </header>
    <section class="grid" aria-label="Package summary">
      {''.join(_metric_card(label, value, detail) for label, value, detail in cards)}
    </section>
    <section class="section panel">
      <h2>Run Summary</h2>
      <p class="meta">Deterministic summary from run, verdict, profile, and gate artifacts.</p>
      {run_summary_html}
    </section>
    <section class="section panel">
      <h2>Report / Export</h2>
      <p class="meta">Open the fixed-section report first. Developer artifacts are kept below for debugging and compatibility.</p>
      <div class="links">
        {_artifact_link("Open HTML report", "report.html", artifact_index)}
        {_artifact_link("Open Markdown report", "report.md", artifact_index)}
        {_artifact_link("Open PDF report", PDF_REPORT_NAME, artifact_index)}
        {_artifact_link("Open manifest", MANIFEST_NAME, {MANIFEST_NAME: {"path": MANIFEST_NAME}})}
      </div>
    </section>
    <section class="section panel">
      <h2>Quality Gates</h2>
      {quality_gates_html}
    </section>
    <section class="section panel">
      <h2>Table Overview</h2>
      {table_overview_html}
    </section>
    <section class="section panel">
      <h2>Column Issue Matrix</h2>
      {column_issue_matrix_html}
    </section>
    <section class="section panel">
      <h2>Issue Action Plans</h2>
      {action_plans_html}
    </section>
    <section class="section panel">
      <h2>Todos</h2>
      {todos_html}
    </section>
    <section class="section panel">
      <h2>Developer Artifacts</h2>
      <p class="meta">Raw JSON, runtime logs, chart specs, and bounded sample files are listed here. Normal report reading should use the sections above.</p>
      <div class="links">
        {developer_artifact_links_html}
      </div>
    </section>
    <section class="section panel">
      <h2>Evaluation Summary</h2>
      {evaluation_summary_html}
    </section>
    <section class="section">
      <h2>Embedded report</h2>
      <iframe src="report.html" title="VSF deterministic data-quality report"></iframe>
    </section>
  </main>
</body>
</html>
"""


def connector_summary_html(connector_metadata: dict[str, Any]) -> str:
    if not connector_metadata:
        return '<p class="meta">No connector metadata was included.</p>'
    return f"""
        <ul class="summary-list">
          <li><span>Source type</span><strong>{_h(connector_metadata.get("source_type", ""))}</strong></li>
          <li><span>Extraction</span><strong>{_h(connector_metadata.get("extraction_status", ""))}</strong></li>
          <li><span>Secrets redacted</span><strong>{_h(connector_metadata.get("secrets_redacted", False))}</strong></li>
        </ul>
    """


def l4_summary_html(guardrail_report: dict[str, Any], artifact_index: dict[str, dict[str, Any]]) -> str:
    if not guardrail_report:
        return (
            '<p><span class="pill not_enabled">not_enabled</span> '
            "LLM summary artifact was not generated for this deterministic run.</p>"
        )
    status = guardrail_report.get("status", "unknown")
    status_text = _l4_display_status(str(status))
    provider = guardrail_report.get("provider", "unknown")
    model = guardrail_report.get("model", "")
    fallback_reason = guardrail_report.get("fallback_reason", "")
    details = [
        f'<span class="pill {_h(status)}">{_h(status_text)}</span>',
        "validates LLM text only, not data readiness",
        f"provider=<strong>{_h(provider)}</strong>",
    ]
    if model:
        details.append(f"model=<code>{_h(model)}</code>")
    if fallback_reason:
        details.append(f"fallback={_h(fallback_reason)}")
    return f"""
      <p>{' · '.join(details)}</p>
      <div class="links">
        {_artifact_link("Open compatibility LLM report", "l4_report.md", artifact_index)}
        {_artifact_link("Open LLM output validation report", "guardrail_report.json", artifact_index)}
      </div>
    """


def table_impact_rows_html(table_assessments: dict[str, Any]) -> str:
    rows = []
    for row in (table_assessments.get("assessments") or [])[:20]:
        impact = row.get("business_impact") or {}
        issue_total = sum(int(value or 0) for value in (row.get("issue_counts_by_severity") or {}).values())
        actions = row.get("recommended_next_actions") or []
        rows.append(
            "<tr>"
            f"<td><code>{_h(row.get('table', ''))}</code></td>"
            f"<td>{_h(row.get('role', ''))}</td>"
            f"<td><span class=\"pill {_h(row.get('readiness', 'unknown'))}\">{_h(row.get('readiness', 'unknown'))}</span></td>"
            f"<td>{_h(row.get('health_score', 0))}</td>"
            f"<td>{_h(issue_total)}</td>"
            f"<td>{_h(len(row.get('relationship_risks') or []))}</td>"
            f"<td>{_h(impact.get('label', ''))}<br><span class=\"meta\">{_h(impact.get('category', ''))}</span></td>"
            f"<td>{_h(actions[0] if actions else '')}</td>"
            "</tr>"
        )
    if not rows:
        return '<tr><td colspan="8">No table assessment rows were included.</td></tr>'
    return "".join(rows)


def issue_rows_html(issues: list[dict[str, Any]], artifact_index: dict[str, dict[str, Any]]) -> str:
    rows = []
    for issue in issues[:25]:
        sample_path = issue.get("sample_bad_rows_path") or ""
        sample_html = _artifact_link(sample_path, sample_path, artifact_index) if sample_path else "none"
        fixes = issue.get("suggested_fix") or []
        rows.append(
            "<tr>"
            f"<td><code>{_h(issue.get('issue_id', ''))}</code></td>"
            f"<td><span class=\"pill {_h(issue.get('severity', 'unknown'))}\">{_h(issue.get('severity', 'unknown'))}</span></td>"
            f"<td>{_h(issue.get('issue_type', ''))}</td>"
            f"<td><code>{_h(issue.get('table', ''))}</code></td>"
            f"<td>{_h(', '.join(issue.get('columns') or []))}</td>"
            f"<td>{_h(issue.get('bad_count', 0))}/{_h(issue.get('total_count', 0))}</td>"
            f"<td>{_h(_format_percent(issue.get('bad_rate', 0)))}</td>"
            f"<td>{sample_html}</td>"
            f"<td>{_h(fixes[0] if fixes else '')}</td>"
            "</tr>"
        )
    if not rows:
        return '<tr><td colspan="9">No issue rows were included.</td></tr>'
    return "".join(rows)


def package_column_usability_rows(
    profile_summary: dict[str, Any],
    issues: list[dict[str, Any]],
    *,
    limit: int = 30,
) -> list[dict[str, Any]]:
    issue_map: dict[tuple[str, str], list[dict[str, Any]]] = {}
    for issue in issues:
        table = str(issue.get("table") or "")
        for column in issue.get("columns") or [""]:
            issue_map.setdefault((table, str(column)), []).append(issue)

    rows = []
    for table_name, table in sorted((profile_summary.get("tables") or {}).items()):
        for column_name, column in sorted((table.get("columns") or {}).items()):
            column_issues = issue_map.get((table_name, column_name), [])
            severity = _worst_issue_severity(column_issues)
            outliers = column.get("outliers") or {}
            outlier_count = int(outliers.get("outlier_count") or 0)
            status = _column_usability_status(
                severity=severity,
                null_rate=float(column.get("null_rate") or 0),
                invalid_cast_count=int(column.get("invalid_cast_count") or 0),
                outlier_count=outlier_count,
            )
            rows.append(
                {
                    "field": f"{table_name}.{column_name}",
                    "status": status,
                    "status_label": _column_usability_label(status),
                    "severity": severity or "none",
                    "issue_types": ", ".join(sorted({issue.get("issue_type", "") for issue in column_issues}))
                    or "none",
                    "evidence": _package_column_evidence(column, column_issues, outlier_count),
                    "advisory_next_step": _package_column_next_step(column, column_issues, outlier_count),
                    "issue_count": len(column_issues),
                }
            )
    rows.sort(
        key=lambda row: (
            {"blocked": 0, "needs_preparation": 1, "ready": 2}.get(row["status"], 3),
            _severity_rank(row["severity"]),
            -int(row["issue_count"]),
            row["field"],
        )
    )
    return rows[:limit]


def package_column_usability_rows_html(rows: list[dict[str, Any]]) -> str:
    html_rows = []
    for row in rows:
        html_rows.append(
            "<tr>"
            f"<td><code>{_h(row.get('field', ''))}</code></td>"
            f"<td>{_h(row.get('status_label', ''))}</td>"
            f"<td><span class=\"pill {_h(row.get('severity', 'none'))}\">{_h(row.get('severity', 'none'))}</span></td>"
            f"<td>{_h(row.get('issue_types', 'none'))}</td>"
            f"<td>{_h(row.get('evidence', ''))}</td>"
            f"<td>{_h(row.get('advisory_next_step', ''))}</td>"
            "</tr>"
        )
    if not html_rows:
        return '<tr><td colspan="6">No column usability rows were generated.</td></tr>'
    return "".join(html_rows)


def package_column_issue_blocks(
    issues: list[dict[str, Any]],
    *,
    limit: int = 40,
) -> list[dict[str, Any]]:
    blocks = []
    for issue in issues:
        for column in issue.get("columns") or ["table_level"]:
            table = str(issue.get("table") or "")
            field = table if column == "table_level" else f"{table}.{column}"
            fixes = issue.get("suggested_fix") or []
            blocks.append(
                {
                    "field": field,
                    "issue_id": issue.get("issue_id") or "",
                    "issue_type": issue.get("issue_type") or "",
                    "severity": issue.get("severity") or "",
                    "evidence": (
                        f"{issue.get('bad_count', 0)}/{issue.get('total_count', 0)} rows; "
                        f"bad rate {_format_percent(issue.get('bad_rate', 0))}"
                    ),
                    "analysis_consequence": _analysis_consequence(str(issue.get("issue_type") or "")),
                    "advisory_next_step": fixes[0] if fixes else "Review generated evidence.",
                }
            )
    blocks.sort(
        key=lambda row: (
            _severity_rank(str(row["severity"])),
            str(row["field"]),
            str(row["issue_id"]),
        )
    )
    return blocks[:limit]


def package_column_issue_blocks_html(rows: list[dict[str, Any]]) -> str:
    html_rows = []
    for row in rows:
        html_rows.append(
            "<tr>"
            f"<td><code>{_h(row.get('field', ''))}</code></td>"
            f"<td><code>{_h(row.get('issue_id', ''))}</code> {_h(row.get('issue_type', ''))}</td>"
            f"<td><span class=\"pill {_h(row.get('severity', 'unknown'))}\">{_h(row.get('severity', 'unknown'))}</span></td>"
            f"<td>{_h(row.get('evidence', ''))}</td>"
            f"<td>{_h(row.get('analysis_consequence', ''))}</td>"
            f"<td>{_h(row.get('advisory_next_step', ''))}</td>"
            "</tr>"
        )
    if not html_rows:
        return '<tr><td colspan="6">No column issue blocks were generated.</td></tr>'
    return "".join(html_rows)


def package_run_summary_html(
    *,
    source_run: dict[str, Any],
    verdict: dict[str, Any],
    quality_gates: dict[str, Any],
    issue_total: Any,
    blocker_count: int,
    table_count: Any,
    column_count: int,
    row_count: int,
) -> str:
    answers = _package_gate_answers(quality_gates)
    run_id = source_run.get("run_id", "unknown") if source_run else "unknown"
    run_status = source_run.get("status", "unknown") if source_run else "unknown"
    duration = source_run.get("duration_seconds", "unknown") if source_run else "unknown"
    readiness = verdict.get("verdict", "unknown") if verdict else "unknown"
    risk_score = verdict.get("risk_score", "n/a") if verdict else "n/a"
    return f"""
      <div class="table-wrap">
        <table>
          <thead><tr><th>Run ID</th><th>Status</th><th>Readiness</th><th>Risk</th><th>Issues</th><th>P0/P1 blockers</th><th>Tables</th><th>Columns</th><th>Rows</th><th>Duration seconds</th></tr></thead>
          <tbody>
            <tr><td><code>{_h(run_id)}</code></td><td>{_h(run_status)}</td><td>{_h(readiness)}</td><td>{_h(risk_score)}</td><td>{_h(issue_total)}</td><td>{_h(blocker_count)}</td><td>{_h(table_count)}</td><td>{_h(column_count)}</td><td>{_h(row_count)}</td><td>{_h(duration)}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Question</th><th>Answer</th><th>Evidence</th></tr></thead>
          <tbody>
            <tr><td>Can this dataset run analysis?</td><td>{_h(answers.get("Can run analysis", {}).get("answer", "Gate evidence missing."))}</td><td>{_h(answers.get("Can run analysis", {}).get("evidence", ""))}</td></tr>
            <tr><td>Can joins be trusted?</td><td>{_h(answers.get("Can trust joins", {}).get("answer", "Gate evidence missing."))}</td><td>{_h(answers.get("Can trust joins", {}).get("evidence", ""))}</td></tr>
          </tbody>
        </table>
      </div>
    """


def package_quality_gates_html(quality_gates: dict[str, Any]) -> str:
    gates = quality_gates.get("gates") if quality_gates else None
    if not isinstance(gates, list):
        return '<p class="meta">Quality gates were not included in this package.</p>'
    summary = quality_gates.get("summary") or {}
    rows = []
    for gate in gates:
        if not isinstance(gate, dict):
            continue
        action = gate.get("recommended_next_action") or {}
        rows.append(
            "<tr>"
            f"<td>{_h(gate.get('label', 'Gate'))}</td>"
            f"<td><span class=\"pill {_h(gate.get('status', 'unknown'))}\">{_h(gate.get('status', 'unknown'))}</span></td>"
            f"<td>{_h(_package_gate_answer(gate).get('answer', 'Needs review.'))}</td>"
            f"<td>{_h(gate.get('explanation', ''))}</td>"
            f"<td>{_h(action.get('label', 'Review evidence'))}</td>"
            "</tr>"
        )
    if not rows:
        rows.append('<tr><td colspan="5">No quality gate rows were included.</td></tr>')
    return f"""
      <p class="meta">Source: deterministic. Blocked gates: {_h(summary.get('blocked_count', 0))} of {_h(summary.get('gate_count', len(gates)))}.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Gate</th><th>Status</th><th>Answer</th><th>Explanation</th><th>Next action</th></tr></thead>
          <tbody>{''.join(rows)}</tbody>
        </table>
      </div>
    """


def package_table_overview_html(table_assessments: dict[str, Any]) -> str:
    assessments = table_assessments.get("assessments") if table_assessments else None
    if not isinstance(assessments, list):
        return '<p class="meta">Table overview is unavailable because table assessment evidence was not included.</p>'
    rows = []
    for row in assessments:
        if not isinstance(row, dict):
            continue
        issue_total = sum(int(value or 0) for value in (row.get("issue_counts_by_severity") or {}).values())
        actions = row.get("recommended_next_actions") or []
        affected_columns = row.get("affected_columns") or []
        relationship_risks = row.get("relationship_risks") or []
        rows.append(
            "<tr>"
            f"<td><code>{_h(row.get('table', ''))}</code></td>"
            f"<td>{_h(row.get('role', ''))}</td>"
            f"<td><span class=\"pill {_h(row.get('readiness', 'unknown'))}\">{_h(row.get('readiness', 'unknown'))}</span></td>"
            f"<td>{_h(row.get('health_score', 0))}</td>"
            f"<td>{_h(row.get('row_count', 0))}</td>"
            f"<td>{_h(row.get('column_count', 0))}</td>"
            f"<td>{_h(issue_total)}</td>"
            f"<td>{_h(len(relationship_risks))}</td>"
            f"<td>{_h(', '.join(str(column) for column in affected_columns[:8]) or 'none')}</td>"
            f"<td>{_h(actions[0] if actions else 'No deterministic fix step was generated.')}</td>"
            "</tr>"
        )
    if not rows:
        rows.append('<tr><td colspan="10">No table overview rows were included.</td></tr>')
    return f"""
      <div class="table-wrap">
        <table>
          <thead><tr><th>Table</th><th>Role</th><th>Readiness</th><th>Health</th><th>Rows</th><th>Columns</th><th>Issues</th><th>Relationship risks</th><th>Affected columns</th><th>First fix step</th></tr></thead>
          <tbody>{''.join(rows)}</tbody>
        </table>
      </div>
    """


def package_column_issue_matrix_html(rows: list[dict[str, Any]]) -> str:
    if not rows:
        return '<p class="meta">No column or table issues were generated for this run.</p>'
    html_rows = []
    for row in rows:
        html_rows.append(
            "<tr>"
            f"<td><code>{_h(row.get('field', ''))}</code></td>"
            f"<td>{_h(_issue_status_label(str(row.get('severity', ''))))}</td>"
            f"<td><code>{_h(row.get('issue_id', ''))}</code> {_h(row.get('issue_type', ''))}</td>"
            f"<td><span class=\"pill {_h(row.get('severity', 'unknown'))}\">{_h(row.get('severity', 'unknown'))}</span></td>"
            f"<td>{_h(row.get('evidence', ''))}</td>"
            f"<td>{_h(row.get('analysis_consequence', ''))}</td>"
            f"<td>{_h(row.get('advisory_next_step', ''))}</td>"
            "</tr>"
        )
    return f"""
      <div class="table-wrap">
        <table>
          <thead><tr><th>Field</th><th>Status</th><th>Issue</th><th>Severity</th><th>Bad rows</th><th>Meaning</th><th>What should be fixed?</th></tr></thead>
          <tbody>{''.join(html_rows)}</tbody>
        </table>
      </div>
    """


def package_action_plans_html(issue_action_plans: dict[str, Any]) -> str:
    plans = issue_action_plans.get("plans") if issue_action_plans else None
    if not isinstance(plans, list):
        return '<p class="meta">Issue action plans were not included in this package.</p>'
    summary = issue_action_plans.get("summary") or {}
    valid_plans = [plan for plan in plans if isinstance(plan, dict)]
    plan_rows = []
    for plan in valid_plans[:PACKAGE_ACTION_PLAN_SUMMARY_LIMIT]:
        row = _package_action_plan_summary_row(plan)
        plan_rows.append(
            "<tr>"
            f"<td><code>{_h(row['issue_id'])}</code> {_h(row['issue_type'])}</td>"
            f"<td>{_h(row['priority'])}</td>"
            f"<td><code>{_h(row['table'])}</code></td>"
            f"<td>{_h(row['columns'])}</td>"
            f"<td>{_h(row['first_fix'])}</td>"
            f"<td>{_h(row['first_verify'])}</td>"
            f"<td>coverage {_h(row['evidence_coverage'])}/100 · actionability {_h(row['actionability'])}/100</td>"
            "</tr>"
        )
    plan_rows_html = (
        "".join(plan_rows)
        or "<tr><td colspan=\"7\">No issue action plans were generated.</td></tr>"
    )
    expanded_cards = []
    for plan in valid_plans[:PACKAGE_ACTION_PLAN_LIMIT]:
        coverage = plan.get("evidence_coverage") or {}
        actionability = plan.get("actionability_score") or {}
        hidden_evidence_value_count = max(
            0,
            len(plan.get("evidence_values") or []) - PACKAGE_EVIDENCE_VALUE_LIMIT,
        )
        hidden_evidence_html = (
            f'<p class="meta">{hidden_evidence_value_count} additional finding values are available in '
            '<code>issue_action_plans.json</code>.</p>'
            if hidden_evidence_value_count
            else ""
        )
        expanded_cards.append(
            f"""
            <details class="panel">
              <summary>{_h(plan.get('issue_id', 'UNKNOWN'))} {_h(plan.get('issue_type', 'Issue'))} · {_h(plan.get('priority', 'Needs human review'))}</summary>
              <p class="meta"><strong>Finding:</strong> {_h(plan.get('finding_summary', 'No finding summary was generated.'))}</p>
              <p class="meta"><strong>Table:</strong> <code>{_h(plan.get('table', 'unknown'))}</code> · <strong>Columns:</strong> {_h(_package_columns_text(plan.get('columns')))}</p>
              <h3>Finding Values</h3>
              {package_evidence_values_html((plan.get('evidence_values') or [])[:PACKAGE_EVIDENCE_VALUE_LIMIT])}
              {hidden_evidence_html}
              <h3>Fix data checklist</h3>
              {_package_list_html(plan.get('fix_data_checklist'), 'No deterministic fix checklist was generated.')}
              <h3>Verify after fix checklist</h3>
              {_package_list_html(plan.get('verify_after_fix_checklist'), 'No deterministic verification checklist was generated.')}
              <h3>Guidelines</h3>
              {_package_list_html(plan.get('guidelines'), 'No deterministic guidelines were generated.')}
              <p class="meta">Evidence coverage: {_h(coverage.get('score', 0))}/100. {_h(coverage.get('explanation', ''))}</p>
              <p class="meta">Actionability: {_h(actionability.get('score', 0))}/100. {_h(actionability.get('explanation', ''))}</p>
            </details>
            """
        )
    if not expanded_cards:
        expanded_cards.append('<p class="meta">No issue action plans were generated.</p>')
    remaining_count = max(0, len(valid_plans) - min(len(valid_plans), PACKAGE_ACTION_PLAN_LIMIT))
    remaining_html = (
        f'<p class="meta">{remaining_count} additional plans are available in '
        '<code>issue_action_plans.json</code> and the todo exports.</p>'
        if remaining_count
        else ""
    )
    return f"""
      <p class="meta">Plans: {_h(summary.get('plan_count', len(valid_plans)))} · human review: {_h(summary.get('human_review_count', 0))} · average actionability: {_h(summary.get('average_actionability_score', 0))}/100.</p>
      <p class="meta">Main package index expands the first {PACKAGE_ACTION_PLAN_LIMIT} highest-priority plans. Full deterministic action-plan evidence remains in <code>issue_action_plans.json</code>.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Issue</th><th>Priority</th><th>Table</th><th>Columns</th><th>First fix</th><th>First verification</th><th>Metrics</th></tr></thead>
          <tbody>{plan_rows_html}</tbody>
        </table>
      </div>
      {remaining_html}
      <div class="stack">{''.join(expanded_cards)}</div>
    """


def _package_action_plan_summary_row(plan: dict[str, Any]) -> dict[str, str]:
    fix_items = [str(item) for item in plan.get("fix_data_checklist") or [] if str(item).strip()]
    verify_items = [
        str(item) for item in plan.get("verify_after_fix_checklist") or [] if str(item).strip()
    ]
    coverage = plan.get("evidence_coverage") or {}
    actionability = plan.get("actionability_score") or {}
    return {
        "issue_id": str(plan.get("issue_id") or "UNKNOWN"),
        "issue_type": str(plan.get("issue_type") or "Issue"),
        "priority": str(plan.get("priority") or "Needs human review"),
        "table": str(plan.get("table") or "unknown"),
        "columns": _package_columns_text(plan.get("columns")),
        "first_fix": fix_items[0] if fix_items else "Needs human review.",
        "first_verify": verify_items[0] if verify_items else "Needs human review.",
        "evidence_coverage": str(coverage.get("score", 0)),
        "actionability": str(actionability.get("score", 0)),
    }


def _package_columns_text(columns: Any) -> str:
    if not isinstance(columns, list):
        return "table-level"
    return ", ".join(str(column) for column in columns if str(column).strip()) or "table-level"


def package_todos_html(issue_todos: dict[str, Any]) -> str:
    groups = issue_todos.get("groups") if issue_todos else None
    if not isinstance(groups, list):
        return '<p class="meta">Todo groups were not included in this package.</p>'
    summary = issue_todos.get("summary") or {}
    fix_groups = [group for group in groups if isinstance(group, dict) and group.get("todo_type") == "fix_data"]
    verify_groups = [
        group for group in groups if isinstance(group, dict) and group.get("todo_type") == "verify_after_fix"
    ]
    fix_display_groups = _package_todo_report_groups(fix_groups, PACKAGE_TODO_GROUP_LIMIT)
    verify_display_groups = _package_todo_report_groups(verify_groups, PACKAGE_TODO_GROUP_LIMIT)
    fix_remaining_count = max(0, len(fix_groups) - len(fix_display_groups))
    verify_remaining_count = max(0, len(verify_groups) - len(verify_display_groups))
    fix_remaining_html = (
        f'<p class="todo-more">{fix_remaining_count} additional Fix data groups, including routine repeated steps, remain in '
        '<code>issue_todos.json</code>.</p>'
        if fix_remaining_count
        else ""
    )
    verify_remaining_html = (
        f'<p class="todo-more">{verify_remaining_count} additional Verify after fix groups, including routine repeated checks, remain in '
        '<code>issue_todos.json</code>.</p>'
        if verify_remaining_count
        else ""
    )
    fix_occurrence_count = summary.get("fix_data_occurrence_count", _package_todo_occurrence_total(fix_groups))
    verify_occurrence_count = summary.get(
        "verify_after_fix_occurrence_count",
        _package_todo_occurrence_total(verify_groups),
    )
    return f"""
      <p class="meta">Compact todo snapshot. Full grouped todos remain in <code>issue_todos.json</code>.</p>
      <div class="todo-summary-cards" aria-label="Todo summary">
        <div><strong>{_h(summary.get('fix_data_group_count', len(fix_groups)))}</strong><span>Fix data groups</span><p>{_h(fix_occurrence_count)} occurrences from deterministic action plans.</p></div>
        <div><strong>{_h(summary.get('verify_after_fix_group_count', len(verify_groups)))}</strong><span>Verify groups</span><p>{_h(verify_occurrence_count)} occurrences to check after rerun.</p></div>
      </div>
      <div class="stack">
        <article class="panel">
          <h3>Fix data snapshot</h3>
          {_package_todo_group_list_html(fix_display_groups, 'No issue-specific Fix data todos were generated.')}
          {fix_remaining_html}
        </article>
        <article class="panel">
          <h3>Verify after fix snapshot</h3>
          {_package_todo_group_list_html(verify_display_groups, 'No issue-specific Verify after fix todos were generated.')}
          {verify_remaining_html}
        </article>
      </div>
    """


def package_evidence_values_html(values: Any) -> str:
    evidence_values = values if isinstance(values, list) else []
    rows = []
    for value in evidence_values:
        if not isinstance(value, dict):
            continue
        meaning = _package_display_artifact_text(str(value.get("meaning", "")))
        raw_value = value.get("raw_value", "")
        if isinstance(raw_value, str) and raw_value.endswith(".json"):
            raw_value = _package_display_artifact_text(raw_value)
        rows.append(
            "<tr>"
            f"<td>{_h(value.get('label', 'value'))}</td>"
            f"<td>{_h(raw_value)}</td>"
            f"<td>{_h(meaning)}</td>"
            "</tr>"
        )
    if not rows:
        rows.append('<tr><td>none</td><td>none</td><td>No finding values were available.</td></tr>')
    return f"""
      <div class="table-wrap">
        <table>
          <thead><tr><th>Finding value</th><th>Raw value</th><th>Meaning</th></tr></thead>
          <tbody>{''.join(rows)}</tbody>
        </table>
      </div>
    """


def package_developer_artifact_links_html(
    artifact_index: dict[str, dict[str, Any]],
    *,
    chart_paths: list[str],
    sample_paths: list[str],
) -> str:
    named_paths = [
        ("Connector metadata", "connector_metadata.json"),
        ("Preflight review", "preflight_review.json"),
        *_artifact_links(),
        ("Issue LLM enrichments", "issue_llm_enrichments.json"),
        ("Evaluation ground truth", "ground_truth_issues.json"),
        ("Great Expectations baseline comparison", "baseline_comparison.json"),
        ("Evaluation summary", "evaluation_summary.json"),
        ("Compatibility LLM report", "l4_report.md"),
        ("LLM output validation report", "guardrail_report.json"),
    ]
    links: list[str] = []
    seen: set[str] = set()
    for label, path in named_paths:
        if path in seen:
            continue
        seen.add(path)
        links.append(_artifact_link(label, path, artifact_index))
    links.extend(_artifact_link(Path(path).name, path, artifact_index) for path in chart_paths)
    links.extend(_artifact_link(Path(path).name, path, artifact_index) for path in sample_paths[:20])
    html_links = "".join(link for link in links if link)
    return html_links or '<p class="meta">No developer artifacts were included.</p>'


def package_evaluation_summary_html(evaluation_summary: dict[str, Any]) -> str:
    if not evaluation_summary:
        return '<p class="meta">No evaluation artifact was included for this deterministic report/export package.</p>'
    status = evaluation_summary.get("status") or evaluation_summary.get("result") or "included"
    return f"""
      <p class="meta">Evaluation status: {_h(status)}</p>
      <pre>{_h(json.dumps(evaluation_summary.get('summary', evaluation_summary), indent=2, ensure_ascii=False))}</pre>
    """


def _package_gate_answers(quality_gates: dict[str, Any]) -> dict[str, dict[str, str]]:
    gates = quality_gates.get("gates") if quality_gates else []
    if not isinstance(gates, list):
        return {}
    answers: dict[str, dict[str, str]] = {}
    for gate in gates:
        if isinstance(gate, dict):
            answers[str(gate.get("label") or "")] = _package_gate_answer(gate)
    return answers


def _package_gate_answer(gate: dict[str, Any]) -> dict[str, str]:
    label = str(gate.get("label") or "")
    status = str(gate.get("status") or "")
    if label == "Can run analysis":
        answer = "No. Analysis is blocked." if status == "Blocked" else "Yes, with the gate status shown."
    elif label == "Can trust joins":
        answer = "No. Join evidence is blocked." if status == "Blocked" else "Yes, with the gate status shown."
    elif status == "Clean":
        answer = "No action required."
    elif status in {"Needs Review", "Usable With Caution"}:
        answer = "Review before sharing."
    else:
        answer = "Needs review."
    evidence = "; ".join(
        f"{value.get('label')}: {value.get('raw_value')}"
        for value in (gate.get("evidence_values") or [])
        if isinstance(value, dict)
    )
    return {"answer": answer, "evidence": evidence}


def _package_list_html(items: Any, empty_text: str) -> str:
    values = [str(item) for item in items] if isinstance(items, list) else []
    if not values:
        values = [empty_text]
    return "<ul>" + "".join(f"<li>{_h(item)}</li>" for item in values) + "</ul>"


def _package_todo_group_list_html(groups: list[dict[str, Any]], empty_text: str) -> str:
    if not groups:
        return f"<p class=\"meta\">{_h(empty_text)}</p>"
    items = []
    for group in groups:
        items.append(
            f"""
            <article class="todo-card">
              <header><code>{_h(group.get('todo_id', 'TODO'))}</code><span>{_h(group.get('occurrence_count', 0))} occurrence{'' if group.get('occurrence_count') == 1 else 's'}</span></header>
              <p>{_h(group.get('short_text') or group.get('text', 'Todo needs review.'))}</p>
              <div class="todo-card-meta"><span>{_h(group.get('tables_text', 'table context'))}</span><span>{_h(group.get('priorities_text', 'priority n/a'))}</span></div>
            </article>
            """
        )
    return '<div class="todo-card-list">' + "".join(items) + "</div>"


def _package_todo_report_groups(groups: list[dict[str, Any]], limit: int) -> list[dict[str, Any]]:
    candidates = [group for group in groups if not _package_is_routine_todo(group)]
    selected = sorted(candidates, key=_package_todo_sort_key)[:limit]
    if not selected:
        selected = sorted(groups, key=_package_todo_sort_key)[:limit]
    return [_package_todo_report_group(group) for group in selected]


def _package_todo_report_group(group: dict[str, Any]) -> dict[str, Any]:
    occurrences = group.get("occurrences") if isinstance(group.get("occurrences"), list) else []
    tables = [str(table) for table in group.get("tables") or [] if str(table).strip()]
    priorities = [str(priority).split(" - ", maxsplit=1)[0] for priority in group.get("priorities") or [] if str(priority).strip()]
    return {
        "todo_id": str(group.get("todo_id") or "TODO"),
        "text": str(group.get("text") or "Todo needs review."),
        "short_text": _package_short_text(str(group.get("text") or "Todo needs review."), 118),
        "occurrence_count": int(group.get("occurrence_count") or len(occurrences) or 0),
        "tables_text": _package_compact_list(tables, empty="table context"),
        "priorities_text": _package_compact_list(sorted(set(priorities)), empty="priority n/a"),
    }


def _package_todo_occurrence_total(groups: list[dict[str, Any]]) -> int:
    return sum(int(group.get("occurrence_count") or 0) for group in groups)


def _package_is_routine_todo(group: dict[str, Any]) -> bool:
    text = " ".join(str(group.get("text") or "").lower().split())
    routine_fragments = [
        "do not edit generated artifacts",
        "rerun the profiler on the corrected csv + dbml inputs",
    ]
    return any(fragment in text for fragment in routine_fragments)


def _package_todo_sort_key(group: dict[str, Any]) -> tuple[int, int, str]:
    priorities = [str(priority) for priority in group.get("priorities") or []]
    priority_rank = min((_package_priority_rank(priority) for priority in priorities), default=9)
    return (priority_rank, -int(group.get("occurrence_count") or 0), str(group.get("text") or ""))


def _package_priority_rank(value: str) -> int:
    label = str(value).upper()
    for index, severity in enumerate(("P0", "P1", "P2", "P3")):
        if label.startswith(severity):
            return index
    return 9


def _package_short_text(text: str, limit: int) -> str:
    normalized = " ".join(text.split())
    if len(normalized) <= limit:
        return normalized
    cutoff = normalized.rfind(" ", 0, max(1, limit - 3))
    if cutoff < 48:
        cutoff = max(1, limit - 3)
    return normalized[:cutoff].rstrip() + "..."


def _package_compact_list(values: list[str], *, empty: str, limit: int = 3) -> str:
    unique_values = []
    seen = set()
    for value in values:
        if value and value not in seen:
            unique_values.append(value)
            seen.add(value)
    if not unique_values:
        return empty
    visible = unique_values[:limit]
    remaining = len(unique_values) - len(visible)
    suffix = f" +{remaining}" if remaining > 0 else ""
    return ", ".join(visible) + suffix


def _package_display_artifact_text(text: str) -> str:
    replacements = {
        "dataset_verdict.json": "dataset readiness evidence",
        "issues.json": "issue evidence",
        "table_assessments.json": "table readiness evidence",
        "issue_action_plans.json": "issue action-plan evidence",
        "issue_todos.json": "todo evidence",
        "quality_gates.json": "quality gate evidence",
        "profile_summary.json": "profile evidence",
        "relationship_graph.json": "relationship evidence",
        "schema_evaluation.json": "schema mapping evidence",
        "schema_parse_report.json": "schema parse evidence",
        "run_summary.json": "run summary evidence",
        "preflight_review.json": "preflight review evidence",
    }
    for artifact_name, label in replacements.items():
        text = text.replace(artifact_name, label)
    return text


def _issue_status_label(severity: str) -> str:
    if severity in {"P0", "P1"}:
        return "Blocked"
    if severity == "P2":
        return "Needs preparation"
    return "Needs review"


def top_numeric_outlier_rows(profile_summary: dict[str, Any], *, limit: int = 10) -> list[dict[str, Any]]:
    rows = []
    for table_name, table in sorted((profile_summary.get("tables") or {}).items()):
        for column_name, column in sorted((table.get("columns") or {}).items()):
            outliers = column.get("outliers") or {}
            outlier_count = int(outliers.get("outlier_count") or 0)
            if outlier_count <= 0:
                continue
            rows.append(
                {
                    "field": f"{table_name}.{column_name}",
                    "method": outliers.get("method") or "iqr",
                    "outlier_count": outlier_count,
                    "outlier_rate": outliers.get("outlier_rate") or 0,
                    "lower_fence": outliers.get("lower_fence"),
                    "upper_fence": outliers.get("upper_fence"),
                }
            )
    rows.sort(key=lambda row: (-int(row["outlier_count"]), -float(row["outlier_rate"]), row["field"]))
    return rows[:limit]


def numeric_outlier_rows_html(rows: list[dict[str, Any]]) -> str:
    html_rows = []
    for row in rows:
        fence = f"{_h(row.get('lower_fence'))} to {_h(row.get('upper_fence'))}"
        html_rows.append(
            "<tr>"
            f"<td><code>{_h(row.get('field', ''))}</code></td>"
            f"<td>{_h(row.get('method', ''))}</td>"
            f"<td>{_h(row.get('outlier_count', 0))}</td>"
            f"<td>{_h(_format_percent(row.get('outlier_rate', 0)))}</td>"
            f"<td>{fence}</td>"
            "</tr>"
        )
    if not html_rows:
        return '<tr><td colspan="5">No numeric IQR outliers were detected.</td></tr>'
    return "".join(html_rows)


def _worst_issue_severity(issues: list[dict[str, Any]]) -> str:
    if not issues:
        return ""
    return min((str(issue.get("severity") or "") for issue in issues), key=_severity_rank)


def _severity_rank(severity: str) -> int:
    return {"P0": 0, "P1": 1, "P2": 2, "P3": 3}.get(severity, 4)


def _column_usability_status(
    *,
    severity: str,
    null_rate: float,
    invalid_cast_count: int,
    outlier_count: int,
) -> str:
    if severity in {"P0", "P1"}:
        return "blocked"
    if severity in {"P2", "P3"} or null_rate > 0 or invalid_cast_count > 0 or outlier_count > 0:
        return "needs_preparation"
    return "ready"


def _column_usability_label(status: str) -> str:
    return {
        "blocked": "Blocked for analysis",
        "needs_preparation": "Needs preparation",
        "ready": "Ready",
    }.get(status, status)


def _package_column_evidence(
    column: dict[str, Any],
    issues: list[dict[str, Any]],
    outlier_count: int,
) -> str:
    parts = [
        f"null rate {_format_percent(column.get('null_rate', 0))}",
        f"distinct={int(column.get('distinct_count') or 0)}",
    ]
    invalid_cast_count = int(column.get("invalid_cast_count") or 0)
    if invalid_cast_count:
        parts.append(f"invalid_casts={invalid_cast_count}")
    if outlier_count:
        parts.append(f"iqr_outliers={outlier_count}")
    if issues:
        parts.append(f"issues={len(issues)}")
    return "; ".join(parts)


def _package_column_next_step(
    column: dict[str, Any],
    issues: list[dict[str, Any]],
    outlier_count: int,
) -> str:
    for issue in issues:
        fixes = issue.get("suggested_fix") or []
        if fixes:
            return str(fixes[0])
    if outlier_count:
        return "Review IQR outlier evidence before scaling, aggregation, or feature use."
    if int(column.get("invalid_cast_count") or 0):
        return "Normalize typed values before using this column in analysis."
    if float(column.get("null_rate") or 0) > 0:
        return "Choose an imputation, exclusion, or missingness flag strategy before modeling."
    return "No deterministic cleanup step was generated."


def _analysis_consequence(issue_type: str) -> str:
    if issue_type in {"PRIMARY_KEY_NULL", "DUPLICATE_PRIMARY_KEY", "UNIQUE_DUPLICATE"}:
        return "Entity-level joins, de-duplication, and train/test splits may be unreliable until key evidence is fixed."
    if issue_type in {
        "ORPHAN_FOREIGN_KEY",
        "PARENT_KEY_DUPLICATE",
        "FOREIGN_KEY_NULL",
        "CHILD_RELATIONSHIP_DUPLICATE",
    }:
        return "Cross-table joins may drop, multiply, or misalign records during feature construction."
    if issue_type in {"REQUIRED_FIELD_NULL", "EMPTY_STRING", "INVALID_PLACEHOLDER_TOKEN"}:
        return "Missingness handling is required before aggregate analysis or model feature use."
    if issue_type in {"VALUE_OUT_OF_RANGE", "NEGATIVE_VALUE_NOT_ALLOWED", "NUMERIC_OUTLIER"}:
        return "Distribution-sensitive aggregates and models may need capping, transformation, or exclusion decisions."
    if issue_type in {"TYPE_CAST_INVALID", "DATE_ORDER_INVALID", "REGEX_MISMATCH"}:
        return "Typed, time-based, or pattern-derived features need normalization before analysis use."
    if issue_type in {"TABLE_MISSING", "COLUMN_MISSING", "EXTRA_COLUMN"}:
        return "Schema coverage should be confirmed before comparing tables or training models."
    return "Dataset readiness is reduced until this evidence is reviewed."


def _scorecard_row(label: str, value: Any, detail: str) -> str:
    return f"<tr><td>{_h(label)}</td><td><strong>{_h(value)}</strong></td><td>{_h(detail)}</td></tr>"


def _l4_display_status(status: str) -> str:
    if status == "passed":
        return "LLM text valid"
    if status == "failed":
        return "LLM text failed"
    if status == "fallback_used":
        return "fallback used"
    if status == "not_enabled":
        return "not enabled"
    return str(status or "unknown").replace("_", " ")


def _artifact_links() -> list[tuple[str, str]]:
    return [
        ("Data-quality readiness", "dataset_verdict.json"),
        ("Table readiness", "table_assessments.json"),
        ("Issue action plans", "issue_action_plans.json"),
        ("Issue todos", "issue_todos.json"),
        ("Quality gates", "quality_gates.json"),
        ("Profile summary", "profile_summary.json"),
        ("Issues", "issues.json"),
        ("Schema parse", "schema_parse_report.json"),
        ("Schema evaluation", "schema_evaluation.json"),
        ("Relationship graph", "relationship_graph.json"),
        ("Developer runtime context", "lineage_graph.json"),
        ("Legacy association artifact", "influence.json"),
        ("Runtime summary", "run_summary.json"),
        ("Runtime events", "run_events.jsonl"),
        ("Runtime log", "run.log"),
        ("Schema diagram JSON", "schema_diagram.json"),
        ("Schema diagram DBML", "schema_diagram.dbml"),
    ]


def _metric_card(label: str, value: Any, detail: str) -> str:
    return f"""
      <article class="panel metric">
        <span>{_h(label)}</span>
        <strong>{_h(value)}</strong>
        <p class="meta">{_h(detail)}</p>
      </article>
    """


def _artifact_link(label: str, path: str, artifact_index: dict[str, dict[str, Any]]) -> str:
    if path not in artifact_index:
        return ""
    return f"""
      <a class="link-row" href="{_h(path)}">
        <strong>{_h(label)}</strong>
        <code>{_h(path)}</code>
      </a>
    """


def _format_percent(value: Any) -> str:
    try:
        return f"{float(value or 0.0) * 100:.2f}%"
    except (TypeError, ValueError):
        return "0.00%"


def _counts_text(counts: dict[str, Any]) -> str:
    if not counts:
        return "none"
    return ", ".join(f"{key}={value}" for key, value in counts.items())


def _scan_package_redaction(package_root: Path) -> dict[str, Any]:
    scanned = 0
    violations: list[dict[str, Any]] = []
    for path in sorted(package_root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        scanned += 1
        relative_path = _relative_posix(path, package_root)
        for line_number, line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), start=1):
            violations.extend(_secret_violations(relative_path, line_number, line))
    return {
        "status": "passed" if not violations else "failed",
        "scanned_file_count": scanned,
        "violations": violations,
    }


def _secret_violations(path: str, line_number: int, line: str) -> list[dict[str, Any]]:
    violations: list[dict[str, Any]] = []
    for match in CONNECTION_CREDENTIAL_RE.finditer(line):
        credential = match.group(2)
        if credential != "[redacted]":
            violations.append(
                {
                    "path": path,
                    "line": line_number,
                    "code": "UNREDACTED_CONNECTION_URL",
                }
            )
    for match in SENSITIVE_ASSIGNMENT_RE.finditer(line):
        value = match.group(2)
        if value.lower() not in {"[redacted]", "%5bredacted%5d"}:
            violations.append(
                {
                    "path": path,
                    "line": line_number,
                    "code": "UNREDACTED_SECRET_ASSIGNMENT",
                }
            )
    if BEARER_TOKEN_RE.search(line):
        violations.append({"path": path, "line": line_number, "code": "BEARER_TOKEN"})
    if OPENAI_KEY_RE.search(line):
        violations.append({"path": path, "line": line_number, "code": "OPENAI_KEY"})
    return violations


def _write_deterministic_zip(package_root: Path, zip_path: Path) -> None:
    entries = sorted(path for path in package_root.rglob("*") if path.is_file())
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in entries:
            relative_path = _relative_posix(path, package_root)
            info = zipfile.ZipInfo(relative_path, date_time=FIXED_ZIP_TIMESTAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, path.read_bytes())


def _read_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    return payload if isinstance(payload, dict) else {}


def _read_json_list(path: Path) -> list[dict[str, Any]]:
    if not path.is_file():
        return []
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    return [item for item in payload if isinstance(item, dict)] if isinstance(payload, list) else []


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _artifact_kind(relative_path: str) -> str:
    if relative_path in {"report.html", "report.md"}:
        return "report"
    if relative_path in {"run.log", "run_events.jsonl", "run_summary.json"}:
        return "runtime"
    if relative_path.startswith("charts/"):
        return "chart_spec"
    if relative_path.startswith("samples/"):
        return "sample_csv"
    if relative_path.endswith(".json"):
        return "machine_artifact"
    if relative_path.endswith(".dbml"):
        return "schema_diagram"
    if relative_path.endswith(".md"):
        return "markdown"
    return "artifact"


def _relative_posix(path: Path, root: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _h(value: Any) -> str:
    return html.escape(str(value), quote=True)
