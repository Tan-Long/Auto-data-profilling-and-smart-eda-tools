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
REQUIRED_ARTIFACTS = [
    "profile_summary.json",
    "issues.json",
    "influence.json",
    "schema_parse_report.json",
    "lineage_graph.json",
    "schema_evaluation.json",
    "relationship_graph.json",
    "dataset_verdict.json",
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
    lineage_graph = _read_json(source_root / "lineage_graph.json")
    schema_parse = _read_json(source_root / "schema_parse_report.json")
    schema_evaluation = _read_json(source_root / "schema_evaluation.json")
    connector_metadata = _read_json(source_root / "connector_metadata.json")
    chart_paths = sorted(path for path in artifact_index if path.startswith("charts/"))
    sample_paths = sorted(path for path in artifact_index if path.startswith("samples/"))
    optional_paths = [
        path
        for path in ["connector_metadata.json", "l4_report.md", "guardrail_report.json"]
        if path in artifact_index
    ]
    run_id = source_run.get("run_id", "unknown") if source_run else "unknown"
    run_status = source_run.get("status", "unknown") if source_run else "unknown"
    issue_counts = source_run.get("issue_counts") or {}
    verdict_label = verdict.get("verdict", "unknown")
    risk_score = verdict.get("risk_score", "n/a")
    relationship_summary = relationship_graph.get("summary") or {}
    lineage_summary = lineage_graph.get("summary") or {}
    parse_counts = schema_parse.get("counts") or {}
    eval_summary = schema_evaluation.get("summary") or {}
    cards = [
        ("Verdict", verdict_label, f"Risk score {risk_score}"),
        ("Issues", str(issue_counts.get("total", "0")), "Total findings"),
        ("Tables", str(eval_summary.get("mapped_table_count", "0")), "Mapped source tables"),
        ("Relationships", str(relationship_summary.get("edge_count", "0")), "FK edges"),
        ("Lineage", str(lineage_summary.get("edge_count", "0")), "Dependency edges"),
        ("Artifacts", str(len(artifact_index)), "Package files"),
    ]
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VSF Analysis Package</title>
  <style>
    :root {{
      --foreground-primary: #17211d;
      --foreground-secondary: #4d5b55;
      --foreground-tertiary: #6d7974;
      --surface-canvas: #f4efe5;
      --surface-panel: #fffaf0;
      --surface-overlay: #fffdf7;
      --surface-inset: #ece3d3;
      --border-subtle: #e7dccb;
      --border-default: #d4c7b5;
      --border-strong: #9c8f7d;
      --accent: #0b6b5f;
      --warning: #a76a00;
      --destructive: #a33b2f;
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
      border-radius: 18px;
      background: var(--surface-panel);
    }}
    h1, h2, h3, p {{ margin-top: 0; }}
    h1 {{ margin-bottom: 0; font-family: Georgia, "Times New Roman", serif; font-size: 28px; }}
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
    .metric strong {{ display: block; font-size: 24px; line-height: 1; }}
    .metric span {{ color: var(--foreground-secondary); font-size: 12px; font-weight: 800; text-transform: uppercase; }}
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
      .grid, .links {{ grid-template-columns: 1fr; }}
      main {{ width: min(100% - 20px, 1180px); padding-top: 16px; }}
    }}
  </style>
</head>
<body>
  <main>
    <header>
      <p class="eyebrow">VSF Data Profiler</p>
      <h1>Analysis Package</h1>
      <p class="meta">Run <code>{_h(run_id)}</code> finished with status <strong>{_h(run_status)}</strong>. This package contains generated artifacts only, plus bounded sample evidence when available.</p>
    </header>
    <section class="grid" aria-label="Package summary">
      {''.join(_metric_card(label, value, detail) for label, value, detail in cards)}
    </section>
    <section class="grid">
      <article class="panel">
        <h2>Schema</h2>
        <ul class="summary-list">
          <li><span>Tables parsed</span><strong>{_h(parse_counts.get("tables", 0))}</strong></li>
          <li><span>Columns parsed</span><strong>{_h(parse_counts.get("columns", 0))}</strong></li>
          <li><span>Diagnostics</span><strong>{_h(len(schema_parse.get("diagnostics") or []))}</strong></li>
        </ul>
      </article>
      <article class="panel">
        <h2>Runtime</h2>
        <ul class="summary-list">
          <li><span>Stages</span><strong>{_h(len(source_run.get("stage_timings") or []))}</strong></li>
          <li><span>Failed stages</span><strong>{_h(len(source_run.get("failed_stages") or []))}</strong></li>
          <li><span>Duration seconds</span><strong>{_h(source_run.get("duration_seconds", "n/a"))}</strong></li>
        </ul>
      </article>
      <article class="panel">
        <h2>Connector</h2>
        {connector_summary_html(connector_metadata)}
      </article>
    </section>
    <section class="section panel">
      <h2>Primary reports</h2>
      <div class="links">
        {_artifact_link("Open PDF report", PDF_REPORT_NAME, artifact_index)}
        {_artifact_link("Open HTML report", "report.html", artifact_index)}
        {_artifact_link("Open Markdown report", "report.md", artifact_index)}
        {_artifact_link("Open manifest", MANIFEST_NAME, {MANIFEST_NAME: {"path": MANIFEST_NAME}})}
      </div>
    </section>
    <section class="section panel">
      <h2>Machine artifacts</h2>
      <div class="links">
        {''.join(_artifact_link(label, path, artifact_index) for label, path in _artifact_links())}
        {''.join(_artifact_link(Path(path).name, path, artifact_index) for path in optional_paths)}
      </div>
    </section>
    <section class="section panel">
      <h2>Chart specs</h2>
      <div class="links">
        {''.join(_artifact_link(Path(path).name, path, artifact_index) for path in chart_paths) or '<p class="meta">No chart specs were included.</p>'}
      </div>
    </section>
    <section class="section panel">
      <h2>Sample evidence</h2>
      <div class="links">
        {''.join(_artifact_link(Path(path).name, path, artifact_index) for path in sample_paths[:20]) or '<p class="meta">No sample CSV artifacts were included.</p>'}
      </div>
    </section>
    <section class="section">
      <h2>Embedded report</h2>
      <iframe src="report.html" title="VSF deterministic HTML report"></iframe>
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


def _artifact_links() -> list[tuple[str, str]]:
    return [
        ("Dataset verdict", "dataset_verdict.json"),
        ("Profile summary", "profile_summary.json"),
        ("Issues", "issues.json"),
        ("Schema parse", "schema_parse_report.json"),
        ("Schema evaluation", "schema_evaluation.json"),
        ("Relationship graph", "relationship_graph.json"),
        ("Lineage graph", "lineage_graph.json"),
        ("Influence", "influence.json"),
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
