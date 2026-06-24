from __future__ import annotations

import json
import mimetypes
import re
import secrets
import threading
import time
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone
from email.parser import BytesParser
from email.policy import default
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, unquote, urlparse

from vsf_profiler.connectors import (
    DEFAULT_MYSQL_CHUNK_ROWS,
    DEFAULT_MYSQL_SCHEMA,
    DEFAULT_POSTGRES_CHUNK_ROWS,
    DEFAULT_POSTGRES_SCHEMA,
    MAX_MYSQL_CHUNK_ROWS,
    MAX_POSTGRES_CHUNK_ROWS,
    MySQLConnector,
    PostgresConnector,
    TabularSourceConnector,
    redact_connection_url,
    redact_secret_text,
)

LOCAL_WEB_HOST = "127.0.0.1"
DEFAULT_WEB_PORT = 8765
DEFAULT_RUN_ROOT = Path("outputs/web_runs")
MAX_UPLOAD_BYTES = 250 * 1024 * 1024
MAX_PATH_JOB_BYTES = 16 * 1024
MAX_DATABASE_JOB_BYTES = 16 * 1024
MAX_EVALUATION_JOB_BYTES = 4 * 1024
MAX_ISSUE_ENRICHMENT_BYTES = 4 * 1024
MAX_PREFLIGHT_REVIEW_BYTES = 64 * 1024
TARGET_PATTERN = re.compile(r"^[A-Za-z_][\w]*\.[A-Za-z_][\w]*$")
ALLOWED_LLM_PROVIDERS = {"fake", "openai"}
ALLOWED_DATABASE_SOURCE_TYPES = {"postgres", "mysql"}
POSTGRES_URL_SCHEMES = {"postgres", "postgresql"}
MYSQL_URL_SCHEMES = {"mysql", "mariadb", "mysql+pymysql", "mariadb+pymysql"}

ARTIFACT_LABELS = {
    "profile_summary.json": "Profile summary",
    "issues.json": "Issues",
    "connector_metadata.json": "Connector metadata",
    "schema_parse_report.json": "Schema parse diagnostics",
    "lineage_graph.json": "Runtime artifact context",
    "schema_evaluation.json": "Schema evaluation",
    "relationship_graph.json": "Relationship graph",
    "dataset_verdict.json": "Data-quality readiness",
    "table_assessments.json": "Table assessments",
    "issue_action_plans.json": "Issue action plans",
    "issue_llm_enrichments.json": "Issue LLM enrichments",
    "issue_todos.json": "Issue todos",
    "quality_gates.json": "Quality gates",
    "influence.json": "Legacy association artifact",
    "report.html": "HTML report",
    "report.md": "Markdown report",
    "run_events.jsonl": "Runtime events",
    "run_summary.json": "Runtime summary",
    "l4_report.md": "Compatibility LLM report",
    "guardrail_report.json": "LLM output validation report",
    "preflight_review.json": "Preflight review",
    "ground_truth_issues.json": "Evaluation ground truth",
    "baseline_comparison.json": "Great Expectations baseline comparison",
    "evaluation_summary.json": "Evaluation summary",
}
OPTIONAL_DASHBOARD_ARTIFACTS = [
    "connector_metadata.json",
    "l4_report.md",
    "guardrail_report.json",
    "issue_llm_enrichments.json",
]
DASHBOARD_REQUIRED_ARTIFACTS = [
    "issues.json",
    "schema_parse_report.json",
    "lineage_graph.json",
    "profile_summary.json",
    "relationship_graph.json",
    "dataset_verdict.json",
    "table_assessments.json",
    "issue_action_plans.json",
    "issue_todos.json",
    "quality_gates.json",
    "schema_evaluation.json",
    "influence.json",
    "run_summary.json",
]


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


@dataclass(frozen=True)
class UploadedFile:
    filename: str
    content: bytes


@dataclass
class WebRunJob:
    job_id: str
    root_dir: Path
    input_dir: Path
    csv_dir: Path
    out_dir: Path
    input_mode: str = "upload"
    database_source_type: str | None = None
    evaluation_dataset_id: str | None = None
    use_llm: bool = False
    llm_provider: str | None = None
    status: str = "queued"
    created_at: str = field(default_factory=_iso_now)
    started_at: str | None = None
    finished_at: str | None = None
    error: str = ""

    @property
    def events_path(self) -> Path:
        return self.out_dir / "run_events.jsonl"

    @property
    def summary_path(self) -> Path:
        return self.out_dir / "run_summary.json"


class WebRunStore:
    def __init__(self, *, run_root: Path = DEFAULT_RUN_ROOT) -> None:
        self.run_root = run_root
        self.run_root.mkdir(parents=True, exist_ok=True)
        self._jobs: dict[str, WebRunJob] = {}
        self._lock = threading.Lock()

    def start_job(
        self,
        *,
        dbml: UploadedFile,
        csv_files: list[UploadedFile],
        rules: UploadedFile | None = None,
        target: str | None = None,
        mapping_overrides: dict[str, str] | None = None,
        preflight_review: dict[str, Any] | None = None,
        use_llm: bool = False,
        llm_provider: str | None = None,
    ) -> WebRunJob:
        if not csv_files:
            raise ValueError("At least one CSV file is required.")
        validated_use_llm, validated_llm_provider = _validated_llm_options(
            use_llm=use_llm,
            llm_provider=llm_provider,
        )
        job_id = _new_job_id()
        root_dir = self.run_root / job_id
        input_dir = root_dir / "input"
        csv_dir = input_dir / "csv"
        out_dir = root_dir / "artifacts"
        csv_dir.mkdir(parents=True, exist_ok=True)
        out_dir.mkdir(parents=True, exist_ok=True)

        dbml_path = input_dir / _safe_filename(dbml.filename, fallback="schema.dbml")
        dbml_path.write_bytes(dbml.content)
        stored_csv_names: dict[str, str] = {}
        for index, csv_file in enumerate(csv_files, start=1):
            fallback = f"table_{index}.csv"
            safe_name = _safe_filename(csv_file.filename, fallback=fallback)
            (csv_dir / safe_name).write_bytes(csv_file.content)
            stored_csv_names[csv_file.filename] = safe_name
            stored_csv_names[Path(csv_file.filename).stem] = Path(safe_name).stem
        rules_path: Path | None = None
        if rules is not None and rules.content.strip():
            rules_path = input_dir / _safe_filename(rules.filename, fallback="rules.yaml")
            rules_path.write_bytes(rules.content)
        stored_mapping_overrides = _translate_uploaded_mapping_overrides(
            _clean_mapping_overrides(mapping_overrides or {}),
            stored_csv_names=stored_csv_names,
        )

        job = WebRunJob(
            job_id=job_id,
            root_dir=root_dir,
            input_dir=input_dir,
            csv_dir=csv_dir,
            out_dir=out_dir,
            input_mode="upload",
            use_llm=validated_use_llm,
            llm_provider=validated_llm_provider,
        )
        with self._lock:
            self._jobs[job_id] = job
        thread = threading.Thread(
            target=self._run_job,
            args=(
                job,
                dbml_path,
                csv_dir,
                rules_path,
                target or None,
                stored_mapping_overrides,
                _clean_preflight_review(preflight_review),
                validated_use_llm,
                validated_llm_provider,
            ),
            name=f"vsf-web-run-{job_id}",
            daemon=True,
        )
        thread.start()
        return job

    def start_path_job(
        self,
        *,
        dbml_path: str | Path,
        csv_dir: str | Path,
        rules_path: str | Path | None = None,
        target: str | None = None,
        mapping_overrides: dict[str, str] | None = None,
        preflight_review: dict[str, Any] | None = None,
        use_llm: bool = False,
        llm_provider: str | None = None,
    ) -> WebRunJob:
        validated_dbml_path = _validated_file_path(
            dbml_path,
            label="DBML path",
            extensions={".dbml"},
        )
        validated_csv_dir = _validated_csv_dir(csv_dir)
        validated_rules_path: Path | None = None
        if rules_path is not None and str(rules_path).strip():
            validated_rules_path = _validated_file_path(
                rules_path,
                label="Rules path",
                extensions={".yaml", ".yml"},
            )
        validated_target = _validated_target(target)
        validated_use_llm, validated_llm_provider = _validated_llm_options(
            use_llm=use_llm,
            llm_provider=llm_provider,
        )

        job_id = _new_job_id()
        root_dir = self.run_root / job_id
        input_dir = root_dir / "input"
        out_dir = root_dir / "artifacts"
        input_dir.mkdir(parents=True, exist_ok=True)
        out_dir.mkdir(parents=True, exist_ok=True)
        manifest = {
            "input_mode": "path",
            "dbml_path": str(validated_dbml_path),
            "csv_dir": str(validated_csv_dir),
            "rules_path": str(validated_rules_path) if validated_rules_path else None,
            "target": validated_target,
            "mapping_overrides": _clean_mapping_overrides(mapping_overrides or {}),
            "preflight_review": _clean_preflight_review(preflight_review),
            "use_llm": validated_use_llm,
            "llm_provider": validated_llm_provider,
        }
        (input_dir / "path_inputs.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        job = WebRunJob(
            job_id=job_id,
            root_dir=root_dir,
            input_dir=input_dir,
            csv_dir=validated_csv_dir,
            out_dir=out_dir,
            input_mode="path",
            use_llm=validated_use_llm,
            llm_provider=validated_llm_provider,
        )
        with self._lock:
            self._jobs[job_id] = job
        thread = threading.Thread(
            target=self._run_job,
            args=(
                job,
                validated_dbml_path,
                validated_csv_dir,
                validated_rules_path,
                validated_target,
                _clean_mapping_overrides(mapping_overrides or {}),
                _clean_preflight_review(preflight_review),
                validated_use_llm,
                validated_llm_provider,
            ),
            name=f"vsf-web-run-{job_id}",
            daemon=True,
        )
        thread.start()
        return job

    def start_database_job(
        self,
        *,
        source_type: str,
        connection_url: str,
        schema: str | None = None,
        tables: str | None = None,
        chunk_rows: int | str | None = None,
        rules_path: str | Path | None = None,
        target: str | None = None,
        preflight_review: dict[str, Any] | None = None,
        use_llm: bool = False,
        llm_provider: str | None = None,
    ) -> WebRunJob:
        validated_source_type = _validated_database_source_type(source_type)
        validated_connection_url = _validated_database_url(
            connection_url,
            source_type=validated_source_type,
        )
        validated_schema = _validated_database_schema(schema, source_type=validated_source_type)
        validated_tables = _validated_database_tables(tables)
        validated_chunk_rows = _validated_database_chunk_rows(
            chunk_rows,
            source_type=validated_source_type,
        )
        validated_rules_path: Path | None = None
        if rules_path is not None and str(rules_path).strip():
            validated_rules_path = _validated_file_path(
                rules_path,
                label="Rules path",
                extensions={".yaml", ".yml"},
            )
        validated_target = _validated_target(target)
        validated_use_llm, validated_llm_provider = _validated_llm_options(
            use_llm=use_llm,
            llm_provider=llm_provider,
        )
        source_connector = _database_connector_from_options(
            source_type=validated_source_type,
            connection_url=validated_connection_url,
            schema=validated_schema,
            tables=validated_tables,
            chunk_rows=validated_chunk_rows,
        )

        job_id = _new_job_id()
        root_dir = self.run_root / job_id
        input_dir = root_dir / "input"
        out_dir = root_dir / "artifacts"
        input_dir.mkdir(parents=True, exist_ok=True)
        out_dir.mkdir(parents=True, exist_ok=True)
        manifest = {
            "input_mode": "database",
            "source_type": validated_source_type,
            "connection_url": redact_connection_url(validated_connection_url),
            "schema": validated_schema,
            "tables": validated_tables,
            "chunk_rows": validated_chunk_rows,
            "rules_path": str(validated_rules_path) if validated_rules_path else None,
            "target": validated_target,
            "preflight_review": _clean_preflight_review(preflight_review),
            "use_llm": validated_use_llm,
            "llm_provider": validated_llm_provider,
            "secrets_redacted": True,
        }
        (input_dir / "database_inputs.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        job = WebRunJob(
            job_id=job_id,
            root_dir=root_dir,
            input_dir=input_dir,
            csv_dir=input_dir,
            out_dir=out_dir,
            input_mode="database",
            database_source_type=validated_source_type,
            use_llm=validated_use_llm,
            llm_provider=validated_llm_provider,
        )
        with self._lock:
            self._jobs[job_id] = job
        thread = threading.Thread(
            target=self._run_database_job,
            args=(
                job,
                source_connector,
                validated_connection_url,
                validated_rules_path,
                validated_target,
                _clean_preflight_review(preflight_review),
                validated_use_llm,
                validated_llm_provider,
            ),
            name=f"vsf-web-run-{job_id}",
            daemon=True,
        )
        thread.start()
        return job

    def evaluation_catalog_payload(self) -> dict[str, Any]:
        from vsf_profiler.evaluation_benchmark import evaluation_catalog_payload

        return evaluation_catalog_payload()

    def start_evaluation_job(self, *, dataset_id: str) -> WebRunJob:
        validated_dataset_id = _validated_evaluation_dataset_id(dataset_id)
        job_id = _new_job_id()
        root_dir = self.run_root / job_id
        input_dir = root_dir / "input"
        out_dir = root_dir / "artifacts"
        input_dir.mkdir(parents=True, exist_ok=True)
        out_dir.mkdir(parents=True, exist_ok=True)
        manifest = {
            "input_mode": "evaluation",
            "dataset_id": validated_dataset_id,
            "input_policy": "built_in_curated_datasets_only",
            "arbitrary_uploads_supported": False,
            "use_llm": False,
            "llm_provider": None,
        }
        (input_dir / "evaluation_inputs.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        job = WebRunJob(
            job_id=job_id,
            root_dir=root_dir,
            input_dir=input_dir,
            csv_dir=input_dir,
            out_dir=out_dir,
            input_mode="evaluation",
            evaluation_dataset_id=validated_dataset_id,
            use_llm=False,
            llm_provider=None,
        )
        with self._lock:
            self._jobs[job_id] = job
        thread = threading.Thread(
            target=self._run_evaluation_job,
            args=(job, validated_dataset_id),
            name=f"vsf-web-evaluation-{job_id}",
            daemon=True,
        )
        thread.start()
        return job

    def enrich_issue(
        self,
        job: WebRunJob,
        *,
        issue_id: str,
        provider: str,
    ) -> dict[str, Any]:
        from vsf_profiler.llm_issue_enrichment import (
            ISSUE_ENRICHMENT_FILENAME,
            generate_issue_llm_enrichment,
        )

        if _normalized_web_status(job.status) not in {"succeeded", "unknown"}:
            raise ValueError("Issue LLM enrichment requires a completed run.")
        result = generate_issue_llm_enrichment(
            out_dir=job.out_dir,
            issue_id=issue_id,
            provider_name=provider,
        )
        return {
            "job_id": job.job_id,
            "artifact_path": ISSUE_ENRICHMENT_FILENAME,
            "artifact_url": f"/api/jobs/{job.job_id}/artifacts/{ISSUE_ENRICHMENT_FILENAME}",
            "enrichment": result["entry"],
            "artifacts": self.artifact_payload(job),
            "dashboard": self.dashboard_payload(job),
        }

    def get_job(self, job_id: str) -> WebRunJob | None:
        with self._lock:
            job = self._jobs.get(job_id)
        if job is not None:
            return job
        return self._historical_job(job_id)

    def history_payload(self) -> dict[str, Any]:
        runs = [
            self.history_entry(job)
            for job in self._iter_known_jobs()
        ]
        runs.sort(
            key=lambda item: item.get("finished_at") or item.get("started_at") or item.get("created_at") or "",
            reverse=True,
        )
        return {
            "run_root": str(self.run_root),
            "generated_at": _iso_now(),
            "runs": runs,
        }

    def history_entry(self, job: WebRunJob) -> dict[str, Any]:
        summary = _read_json_if_exists(job.summary_path) or {}
        quality_gate_summary = _quality_gate_summary(job.out_dir / "quality_gates.json")
        stages = _stages_from_summary_or_events(summary, job.events_path)
        failed_stages = [stage for stage in stages if stage.get("status") == "failed"]
        skipped_stages = [stage for stage in stages if stage.get("status") == "skipped"]
        artifacts = self.artifact_payload(job)
        dashboard = self.dashboard_payload(job)
        return {
            "job_id": job.job_id,
            "run_id": str(summary.get("run_id") or job.job_id),
            "name": job.job_id,
            "status": _normalized_web_status(summary.get("status") or job.status),
            "created_at": job.created_at,
            "started_at": summary.get("started_at") or job.started_at,
            "finished_at": summary.get("finished_at") or job.finished_at,
            "duration_seconds": summary.get("duration_seconds"),
            "input_mode": job.input_mode,
            "source_mode": _source_mode_label(job),
            "issue_count": _issue_count(summary, job.out_dir / "issues.json"),
            "quality_gate_summary": quality_gate_summary,
            "stage_count": len(stages),
            "failed_stage_count": len(failed_stages),
            "skipped_stage_count": len(skipped_stages),
            "artifact_count": len(artifacts),
            "missing_artifacts": dashboard["missing_artifacts"],
            "partial": not job.summary_path.exists(),
            "error": _summary_error(summary) or job.error,
            "stages": stages,
            "events_url": f"/api/jobs/{job.job_id}/events",
            "artifacts_url": f"/api/jobs/{job.job_id}/artifacts",
            "dashboard_url": f"/api/jobs/{job.job_id}/dashboard",
        }

    def job_payload(self, job: WebRunJob) -> dict[str, Any]:
        summary = _read_json_if_exists(job.summary_path)
        return {
            "job_id": job.job_id,
            "status": _normalized_web_status(summary.get("status") if summary else job.status),
            "input_mode": job.input_mode,
            "created_at": job.created_at,
            "started_at": summary.get("started_at") if summary else job.started_at,
            "finished_at": summary.get("finished_at") if summary else job.finished_at,
            "error": _summary_error(summary or {}) or job.error,
            "llm": {
                "enabled": job.use_llm,
                "provider": job.llm_provider,
            },
            "database": (
                {"source_type": job.database_source_type}
                if job.database_source_type is not None
                else None
            ),
            "evaluation": (
                {"dataset_id": job.evaluation_dataset_id}
                if job.evaluation_dataset_id is not None
                else None
            ),
            "summary": summary,
            "events_url": f"/api/jobs/{job.job_id}/events",
            "artifacts_url": f"/api/jobs/{job.job_id}/artifacts",
            "artifacts": self.artifact_payload(job),
        }

    def artifact_payload(self, job: WebRunJob) -> list[dict[str, str]]:
        artifacts: list[dict[str, str]] = []
        summary = _read_json_if_exists(job.summary_path)
        paths: set[str] = set()
        if summary:
            paths.update(
                path
                for path in (summary.get("artifact_paths") or {}).values()
                if isinstance(path, str)
            )
        for path in _canonical_artifact_paths(job.out_dir):
            paths.add(path)
        for artifact_path in sorted(paths):
            path = job.out_dir / artifact_path
            if not path.is_file():
                continue
            artifacts.append(
                {
                    "path": artifact_path,
                    "label": ARTIFACT_LABELS.get(artifact_path, artifact_path),
                    "url": f"/api/jobs/{job.job_id}/artifacts/{artifact_path}",
                }
            )
        return artifacts

    def dashboard_payload(self, job: WebRunJob) -> dict[str, Any]:
        artifacts = {artifact["path"]: artifact["url"] for artifact in self.artifact_payload(job)}
        chart_artifacts = sorted(path for path in artifacts if path.startswith("charts/"))
        missing_artifacts = [
            artifact_path
            for artifact_path in DASHBOARD_REQUIRED_ARTIFACTS
            if artifact_path not in artifacts
        ]
        return {
            "job_id": job.job_id,
            "status": job.status,
            "artifact_urls": {
                artifact_path: artifacts[artifact_path]
                for artifact_path in sorted(
                    set(DASHBOARD_REQUIRED_ARTIFACTS)
                    | set(chart_artifacts)
                    | set(OPTIONAL_DASHBOARD_ARTIFACTS)
                )
                if artifact_path in artifacts
            },
            "required_artifacts": list(DASHBOARD_REQUIRED_ARTIFACTS),
            "chart_artifacts": chart_artifacts,
            "missing_artifacts": missing_artifacts,
        }

    def resolve_artifact(self, job: WebRunJob, artifact_path: str) -> Path:
        decoded = unquote(artifact_path)
        candidate = (job.out_dir / decoded).resolve()
        root = job.out_dir.resolve()
        if candidate == root or root not in candidate.parents:
            raise ValueError("Artifact path is outside the job output directory.")
        if not candidate.is_file():
            raise FileNotFoundError(decoded)
        return candidate

    def _run_job(
        self,
        job: WebRunJob,
        dbml_path: Path,
        csv_dir: Path,
        rules_path: Path | None,
        target: str | None,
        mapping_overrides: dict[str, str] | None,
        preflight_review: dict[str, Any] | None,
        use_llm: bool,
        llm_provider_name: str | None,
    ) -> None:
        from vsf_profiler.cli import _llm_provider_from_config, run_pipeline

        job.status = "running"
        job.started_at = _iso_now()
        self._write_preflight_review(job, preflight_review)
        try:
            llm_provider = _llm_provider_from_config(llm_provider_name) if use_llm else None
            run_pipeline(
                dbml_path=dbml_path,
                csv_dir=csv_dir,
                mapping_overrides=mapping_overrides,
                rules_path=rules_path,
                target=target,
                out_dir=job.out_dir,
                use_llm=use_llm,
                llm_provider=llm_provider,
                requested_llm_provider=llm_provider_name if use_llm else None,
            )
        except Exception as exc:
            job.status = "failed"
            job.error = f"{exc.__class__.__name__}: {exc}"
        else:
            job.status = "succeeded"
        finally:
            job.finished_at = _iso_now()

    def _run_database_job(
        self,
        job: WebRunJob,
        source_connector: TabularSourceConnector,
        connection_url: str,
        rules_path: Path | None,
        target: str | None,
        preflight_review: dict[str, Any] | None,
        use_llm: bool,
        llm_provider_name: str | None,
    ) -> None:
        from vsf_profiler.cli import _llm_provider_from_config, run_pipeline

        job.status = "running"
        job.started_at = _iso_now()
        self._write_preflight_review(job, preflight_review)
        try:
            llm_provider = _llm_provider_from_config(llm_provider_name) if use_llm else None
            run_pipeline(
                dbml_path=None,
                csv_dir=None,
                rules_path=rules_path,
                target=target,
                out_dir=job.out_dir,
                source_connector=source_connector,
                use_llm=use_llm,
                llm_provider=llm_provider,
                requested_llm_provider=llm_provider_name if use_llm else None,
            )
        except Exception as exc:
            job.status = "failed"
            job.error = _safe_error_message(exc, secret_values=[connection_url])
        else:
            job.status = "succeeded"
        finally:
            job.finished_at = _iso_now()

    def _run_evaluation_job(self, job: WebRunJob, dataset_id: str) -> None:
        from vsf_profiler.evaluation_benchmark import run_evaluation_benchmark

        job.status = "running"
        job.started_at = _iso_now()
        try:
            run_evaluation_benchmark(
                dataset_id=dataset_id,
                input_dir=job.input_dir / "dataset",
                out_dir=job.out_dir,
            )
        except Exception as exc:
            job.status = "failed"
            job.error = f"{exc.__class__.__name__}: {exc}"
        else:
            job.status = "succeeded"
        finally:
            job.finished_at = _iso_now()

    def _write_preflight_review(
        self,
        job: WebRunJob,
        preflight_review: dict[str, Any] | None,
    ) -> None:
        if not preflight_review:
            return
        payload = dict(preflight_review)
        payload.setdefault("recorded_at", _iso_now())
        (job.out_dir / "preflight_review.json").write_text(
            json.dumps(payload, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    def _iter_known_jobs(self) -> list[WebRunJob]:
        jobs_by_id: dict[str, WebRunJob] = {}
        with self._lock:
            jobs_by_id.update(self._jobs)
        for run_dir in sorted(self.run_root.iterdir()) if self.run_root.exists() else []:
            if not run_dir.is_dir():
                continue
            if run_dir.name in jobs_by_id:
                continue
            historical_job = self._historical_job(run_dir.name)
            if historical_job is not None:
                jobs_by_id[run_dir.name] = historical_job
        return list(jobs_by_id.values())

    def _historical_job(self, job_id: str) -> WebRunJob | None:
        if not _valid_job_id(job_id):
            return None
        root_dir = (self.run_root / job_id).resolve()
        run_root = self.run_root.resolve()
        if root_dir == run_root or run_root not in root_dir.parents:
            return None
        if not root_dir.is_dir():
            return None

        input_dir = root_dir / "input"
        out_dir = root_dir / "artifacts"
        summary = _read_json_if_exists(out_dir / "run_summary.json") or {}
        metadata = _historical_input_metadata(root_dir, input_dir, summary)
        status = _normalized_web_status(summary.get("status") or _status_from_events(out_dir / "run_events.jsonl"))
        return WebRunJob(
            job_id=job_id,
            root_dir=root_dir,
            input_dir=input_dir,
            csv_dir=metadata["csv_dir"],
            out_dir=out_dir,
            input_mode=metadata["input_mode"],
            database_source_type=metadata["database_source_type"],
            evaluation_dataset_id=metadata["evaluation_dataset_id"],
            use_llm=metadata["use_llm"],
            llm_provider=metadata["llm_provider"],
            status=status,
            created_at=_created_at_for_run(root_dir, summary),
            started_at=summary.get("started_at"),
            finished_at=summary.get("finished_at"),
            error=_summary_error(summary),
        )


class WebRunnerHandler(BaseHTTPRequestHandler):
    store: WebRunStore
    static_dir: Path
    bound_host: str = LOCAL_WEB_HOST

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path
        if path == "/api/health":
            self._send_json({"status": "ok", "host": self.bound_host})
            return
        if path == "/api/history":
            self._send_json(self.store.history_payload())
            return
        if path == "/api/evaluation-catalog":
            self._send_json(self.store.evaluation_catalog_payload())
            return
        if path.startswith("/api/jobs/"):
            self._handle_job_get(path)
            return
        self._serve_static(path)

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/jobs":
                payload = self._parse_multipart_upload()
                job = self.store.start_job(
                    dbml=payload["dbml"],
                    csv_files=payload["csv_files"],
                    rules=payload.get("rules"),
                    target=payload.get("target"),
                    mapping_overrides=payload.get("mapping_overrides"),
                    preflight_review=payload.get("preflight_review"),
                    use_llm=payload.get("use_llm", False),
                    llm_provider=payload.get("llm_provider"),
                )
            elif parsed.path == "/api/path-jobs":
                payload = self._parse_path_job_body()
                job = self.store.start_path_job(
                    dbml_path=payload["dbml_path"],
                    csv_dir=payload["csv_dir"],
                    rules_path=payload.get("rules_path"),
                    target=payload.get("target"),
                    mapping_overrides=payload.get("mapping_overrides"),
                    preflight_review=payload.get("preflight_review"),
                    use_llm=bool(payload.get("use_llm", False)),
                    llm_provider=payload.get("llm_provider"),
                )
            elif parsed.path == "/api/database-jobs":
                payload = self._parse_database_job_body()
                job = self.store.start_database_job(
                    source_type=payload["source_type"],
                    connection_url=payload["connection_url"],
                    schema=payload.get("schema"),
                    tables=payload.get("tables"),
                    chunk_rows=payload.get("chunk_rows"),
                    rules_path=payload.get("rules_path"),
                    target=payload.get("target"),
                    preflight_review=payload.get("preflight_review"),
                    use_llm=bool(payload.get("use_llm", False)),
                    llm_provider=payload.get("llm_provider"),
                )
            elif parsed.path == "/api/evaluations":
                payload = self._parse_evaluation_job_body()
                job = self.store.start_evaluation_job(
                    dataset_id=payload["dataset_id"],
                )
            elif _issue_enrichment_post_path(parsed.path):
                job_id = parsed.path.strip("/").split("/")[2]
                job = self.store.get_job(job_id)
                if job is None:
                    self.send_error(HTTPStatus.NOT_FOUND)
                    return
                payload = self._parse_issue_enrichment_body()
                result = self.store.enrich_issue(
                    job,
                    issue_id=payload["issue_id"],
                    provider=payload["provider"],
                )
                self._send_json(result)
                return
            else:
                self.send_error(HTTPStatus.NOT_FOUND)
                return
        except ValueError as exc:
            self._send_json({"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
            return
        self._send_json(self.store.job_payload(job), status=HTTPStatus.ACCEPTED)

    def log_message(self, format: str, *args: Any) -> None:
        return

    def _handle_job_get(self, path: str) -> None:
        parts = path.strip("/").split("/")
        if len(parts) < 3:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        job = self.store.get_job(parts[2])
        if job is None:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        if len(parts) == 3:
            self._send_json(self.store.job_payload(job))
            return
        if len(parts) == 4 and parts[3] == "events":
            self._stream_events(job)
            return
        if len(parts) == 4 and parts[3] == "artifacts":
            self._send_json({"artifacts": self.store.artifact_payload(job)})
            return
        if len(parts) == 4 and parts[3] == "dashboard":
            self._send_json(self.store.dashboard_payload(job))
            return
        if len(parts) >= 5 and parts[3] == "artifacts":
            artifact_path = "/".join(parts[4:])
            try:
                path_to_file = self.store.resolve_artifact(job, artifact_path)
            except FileNotFoundError:
                self.send_error(HTTPStatus.NOT_FOUND)
                return
            except ValueError:
                self.send_error(HTTPStatus.BAD_REQUEST)
                return
            self._send_file(path_to_file)
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def _stream_events(self, job: WebRunJob) -> None:
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.end_headers()

        offset = 0
        try:
            while True:
                if job.events_path.exists():
                    with job.events_path.open("r", encoding="utf-8") as handle:
                        handle.seek(offset)
                        for line in handle:
                            self._write_sse("run-event", line.strip())
                        offset = handle.tell()
                self._write_sse("job", json.dumps(self.store.job_payload(job), ensure_ascii=False))
                if job.status in {"succeeded", "failed", "unknown"}:
                    break
                time.sleep(0.4)
        except BrokenPipeError:
            return

    def _write_sse(self, event_name: str, data: str) -> None:
        try:
            self.wfile.write(f"event: {event_name}\n".encode("utf-8"))
            self.wfile.write(f"data: {data}\n\n".encode("utf-8"))
            self.wfile.flush()
        except BrokenPipeError:
            raise

    def _parse_multipart_upload(self) -> dict[str, Any]:
        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            raise ValueError("Expected multipart/form-data upload.")
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            raise ValueError("Upload body is empty.")
        if content_length > MAX_UPLOAD_BYTES:
            raise ValueError("Upload is too large for demo mode.")
        body = self.rfile.read(content_length)
        header = (
            f"Content-Type: {content_type}\r\n"
            "MIME-Version: 1.0\r\n"
            "\r\n"
        ).encode("utf-8")
        message = BytesParser(policy=default).parsebytes(header + body)
        if not message.is_multipart():
            raise ValueError("Upload payload is not multipart.")

        dbml: UploadedFile | None = None
        rules: UploadedFile | None = None
        csv_files: list[UploadedFile] = []
        fields: dict[str, str] = {}

        for part in message.iter_parts():
            field_name = part.get_param("name", header="content-disposition")
            filename = part.get_filename()
            if not field_name:
                continue
            content = part.get_payload(decode=True) or b""
            if filename:
                upload = UploadedFile(filename=filename, content=content)
                if field_name == "dbml":
                    dbml = upload
                elif field_name == "rules":
                    rules = upload
                elif field_name in {"csv", "csvFiles"}:
                    csv_files.append(upload)
            else:
                charset = part.get_content_charset() or "utf-8"
                fields[field_name] = content.decode(charset, errors="replace").strip()

        if dbml is None:
            raise ValueError("DBML file is required.")
        return {
            "dbml": dbml,
            "csv_files": csv_files,
            "rules": rules,
            "target": fields.get("target") or None,
            "mapping_overrides": _parse_mapping_overrides_field(fields.get("mapping_overrides")),
            "preflight_review": _parse_preflight_review_field(fields.get("preflight_review")),
            "use_llm": _parse_bool_field(fields.get("use_llm")),
            "llm_provider": _optional_llm_provider_string(fields.get("llm_provider")),
        }

    def _parse_path_job_body(self) -> dict[str, Any]:
        content_type = self.headers.get("Content-Type", "")
        if "application/json" not in content_type:
            raise ValueError("Expected application/json path job payload.")
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            raise ValueError("Path job body is empty.")
        if content_length > MAX_PATH_JOB_BYTES:
            raise ValueError("Path job payload is too large.")
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ValueError("Path job payload must be valid JSON.") from exc
        if not isinstance(payload, dict):
            raise ValueError("Path job payload must be a JSON object.")
        return {
            "dbml_path": _required_string(payload, "dbml_path"),
            "csv_dir": _required_string(payload, "csv_dir"),
            "rules_path": _optional_string(payload, "rules_path"),
            "target": _optional_string(payload, "target"),
            "mapping_overrides": _optional_mapping_overrides(payload, "mapping_overrides"),
            "preflight_review": _optional_preflight_review(payload, "preflight_review"),
            "use_llm": _optional_bool(payload, "use_llm"),
            "llm_provider": _optional_llm_provider_string(payload.get("llm_provider")),
        }

    def _parse_database_job_body(self) -> dict[str, Any]:
        content_type = self.headers.get("Content-Type", "")
        if "application/json" not in content_type:
            raise ValueError("Expected application/json database job payload.")
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            raise ValueError("Database job body is empty.")
        if content_length > MAX_DATABASE_JOB_BYTES:
            raise ValueError("Database job payload is too large.")
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ValueError("Database job payload must be valid JSON.") from exc
        if not isinstance(payload, dict):
            raise ValueError("Database job payload must be a JSON object.")
        return {
            "source_type": _required_string(payload, "source_type"),
            "connection_url": _required_string(payload, "connection_url"),
            "schema": _optional_string(payload, "schema"),
            "tables": _optional_string(payload, "tables"),
            "chunk_rows": payload.get("chunk_rows"),
            "rules_path": _optional_string(payload, "rules_path"),
            "target": _optional_string(payload, "target"),
            "preflight_review": _optional_preflight_review(payload, "preflight_review"),
            "use_llm": _optional_bool(payload, "use_llm"),
            "llm_provider": _optional_llm_provider_string(payload.get("llm_provider")),
        }

    def _parse_evaluation_job_body(self) -> dict[str, Any]:
        content_type = self.headers.get("Content-Type", "")
        if "application/json" not in content_type:
            raise ValueError("Expected application/json evaluation payload.")
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            raise ValueError("Evaluation payload is empty.")
        if content_length > MAX_EVALUATION_JOB_BYTES:
            raise ValueError("Evaluation payload is too large.")
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ValueError("Evaluation payload must be valid JSON.") from exc
        if not isinstance(payload, dict):
            raise ValueError("Evaluation payload must be a JSON object.")
        return {
            "dataset_id": _required_string(payload, "dataset_id"),
        }

    def _parse_issue_enrichment_body(self) -> dict[str, Any]:
        content_type = self.headers.get("Content-Type", "")
        if "application/json" not in content_type:
            raise ValueError("Expected application/json issue enrichment payload.")
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            raise ValueError("Issue enrichment payload is empty.")
        if content_length > MAX_ISSUE_ENRICHMENT_BYTES:
            raise ValueError("Issue enrichment payload is too large.")
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ValueError("Issue enrichment payload must be valid JSON.") from exc
        if not isinstance(payload, dict):
            raise ValueError("Issue enrichment payload must be a JSON object.")
        provider = _optional_llm_provider_string(payload.get("provider"))
        if not provider:
            raise ValueError("provider is required.")
        return {
            "issue_id": _required_string(payload, "issue_id"),
            "provider": provider,
        }

    def _serve_static(self, path: str) -> None:
        if path in {"", "/"}:
            static_path = self.static_dir / "index.html"
        else:
            requested = unquote(path.lstrip("/"))
            static_path = (self.static_dir / requested).resolve()
            root = self.static_dir.resolve()
            if static_path == root or root not in static_path.parents:
                self.send_error(HTTPStatus.BAD_REQUEST)
                return
        if not static_path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        self._send_file(static_path)

    def _send_file(self, path: Path) -> None:
        content_type = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(path.stat().st_size))
        self.end_headers()
        with path.open("rb") as handle:
            self.wfile.write(handle.read())

    def _send_json(self, payload: dict[str, Any], *, status: HTTPStatus = HTTPStatus.OK) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def run_web_server(
    *,
    host: str = LOCAL_WEB_HOST,
    port: int = DEFAULT_WEB_PORT,
    run_root: Path = DEFAULT_RUN_ROOT,
) -> None:
    server = create_web_server(host=host, port=port, run_root=run_root)
    print(f"VSF Data Profiler web runner: http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


def create_web_server(
    *,
    host: str = LOCAL_WEB_HOST,
    port: int = DEFAULT_WEB_PORT,
    run_root: Path = DEFAULT_RUN_ROOT,
) -> ThreadingHTTPServer:
    static_dir = _web_static_dir()
    store = WebRunStore(run_root=run_root)

    class Handler(WebRunnerHandler):
        pass

    Handler.store = store
    Handler.static_dir = static_dir
    Handler.bound_host = host
    return ThreadingHTTPServer((host, port), Handler)


def _web_static_dir() -> Path:
    repo_web = Path(__file__).resolve().parents[2] / "web"
    if repo_web.exists():
        return repo_web
    return Path.cwd() / "web"


def _canonical_artifact_paths(out_dir: Path) -> list[str]:
    paths = [
        "profile_summary.json",
        "issues.json",
        "schema_parse_report.json",
        "connector_metadata.json",
        "lineage_graph.json",
        "schema_evaluation.json",
        "relationship_graph.json",
        "dataset_verdict.json",
        "table_assessments.json",
        "issue_action_plans.json",
        "issue_llm_enrichments.json",
        "issue_todos.json",
        "quality_gates.json",
        "influence.json",
        "schema_diagram.json",
        "schema_diagram.dbml",
        "run_events.jsonl",
        "run_summary.json",
        "run.log",
        "preflight_review.json",
        "report.md",
        "report.html",
        "l4_report.md",
        "guardrail_report.json",
        "ground_truth_issues.json",
        "baseline_comparison.json",
        "evaluation_summary.json",
    ]
    chart_dir = out_dir / "charts"
    if chart_dir.exists():
        paths.extend(
            path.relative_to(out_dir).as_posix()
            for path in sorted(chart_dir.glob("*.json"))
        )
    return paths


def _read_json_if_exists(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    return payload if isinstance(payload, dict) else None


def _read_json_value_if_exists(path: Path) -> Any | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def _valid_job_id(job_id: str) -> bool:
    return bool(re.fullmatch(r"[A-Za-z0-9_.-]+", job_id or ""))


def _issue_enrichment_post_path(path: str) -> bool:
    parts = path.strip("/").split("/")
    return len(parts) == 4 and parts[0] == "api" and parts[1] == "jobs" and parts[3] == "issue-enrichments"


def _historical_input_metadata(
    root_dir: Path,
    input_dir: Path,
    summary: dict[str, Any],
) -> dict[str, Any]:
    path_inputs = _read_json_if_exists(input_dir / "path_inputs.json") or {}
    database_inputs = _read_json_if_exists(input_dir / "database_inputs.json") or {}
    evaluation_inputs = _read_json_if_exists(input_dir / "evaluation_inputs.json") or {}
    summary_inputs = summary.get("inputs") if isinstance(summary.get("inputs"), dict) else {}
    source_type = str(database_inputs.get("source_type") or summary_inputs.get("source_type") or "")
    use_llm = bool(
        path_inputs.get("use_llm")
        or database_inputs.get("use_llm")
        or evaluation_inputs.get("use_llm")
        or summary_inputs.get("use_llm")
    )
    llm_provider = (
        path_inputs.get("llm_provider")
        or database_inputs.get("llm_provider")
        or evaluation_inputs.get("llm_provider")
        or summary_inputs.get("llm_provider")
    )
    if database_inputs or source_type in ALLOWED_DATABASE_SOURCE_TYPES:
        return {
            "input_mode": "database",
            "database_source_type": source_type if source_type in ALLOWED_DATABASE_SOURCE_TYPES else None,
            "evaluation_dataset_id": None,
            "csv_dir": input_dir,
            "use_llm": use_llm,
            "llm_provider": llm_provider if isinstance(llm_provider, str) else None,
        }

    if evaluation_inputs:
        dataset_id = evaluation_inputs.get("dataset_id")
        return {
            "input_mode": "evaluation",
            "database_source_type": None,
            "evaluation_dataset_id": dataset_id if isinstance(dataset_id, str) else None,
            "csv_dir": input_dir,
            "use_llm": False,
            "llm_provider": None,
        }

    if path_inputs:
        csv_dir_value = path_inputs.get("csv_dir") or summary_inputs.get("csv_dir")
        return {
            "input_mode": "path",
            "database_source_type": None,
            "evaluation_dataset_id": None,
            "csv_dir": Path(str(csv_dir_value)) if csv_dir_value else input_dir,
            "use_llm": use_llm,
            "llm_provider": llm_provider if isinstance(llm_provider, str) else None,
        }

    csv_dir_value = summary_inputs.get("csv_dir")
    csv_dir = Path(str(csv_dir_value)) if csv_dir_value else input_dir / "csv"
    input_mode = "upload"
    try:
        if csv_dir.exists() and not _path_is_inside(csv_dir, root_dir):
            input_mode = "path"
    except (OSError, ValueError):
        input_mode = "path" if csv_dir_value else "upload"
    return {
        "input_mode": input_mode,
        "database_source_type": None,
        "evaluation_dataset_id": None,
        "csv_dir": csv_dir,
        "use_llm": use_llm,
        "llm_provider": llm_provider if isinstance(llm_provider, str) else None,
    }


def _path_is_inside(candidate: Path, root: Path) -> bool:
    candidate.resolve().relative_to(root.resolve())
    return True


def _created_at_for_run(root_dir: Path, summary: dict[str, Any]) -> str:
    started_at = summary.get("started_at")
    if isinstance(started_at, str) and started_at:
        return started_at
    try:
        return _iso_from_timestamp(root_dir.stat().st_mtime)
    except OSError:
        return _iso_now()


def _iso_from_timestamp(timestamp: float) -> str:
    return datetime.fromtimestamp(timestamp, timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _normalized_web_status(status: Any) -> str:
    normalized = str(status or "").strip().lower()
    if normalized in {"success", "succeeded", "completed", "complete", "passed"}:
        return "succeeded"
    if normalized in {"failed", "failure", "error"}:
        return "failed"
    if normalized in {"queued", "pending"}:
        return "queued"
    if normalized in {"running", "initialized", "started"}:
        return "running"
    return "unknown"


def _normalized_stage_status(status: Any) -> str:
    normalized = str(status or "").strip().lower()
    if normalized in {"completed", "complete", "success", "succeeded"}:
        return "completed"
    if normalized in {"failed", "failure", "error"}:
        return "failed"
    if normalized in {"skipped", "skip"}:
        return "skipped"
    if normalized in {"running", "started"}:
        return "running"
    return "unknown"


def _status_from_events(events_path: Path) -> str:
    status = "unknown"
    for event in _iter_run_events(events_path):
        event_type = event.get("event_type")
        if event_type == "run_failed":
            return "failed"
        if event_type == "run_finished":
            return _normalized_web_status(event.get("status"))
        if event_type == "run_started":
            status = "running"
    return status


def _iter_run_events(events_path: Path) -> list[dict[str, Any]]:
    if not events_path.exists():
        return []
    events: list[dict[str, Any]] = []
    try:
        with events_path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if isinstance(event, dict):
                    events.append(event)
    except OSError:
        return []
    return events


def _stages_from_summary_or_events(
    summary: dict[str, Any],
    events_path: Path,
) -> list[dict[str, Any]]:
    summary_stages = summary.get("stage_timings")
    if isinstance(summary_stages, list) and summary_stages:
        return [
            stage
            for stage in (_normalize_stage_entry(item) for item in summary_stages)
            if stage is not None
        ]
    return _stages_from_events(events_path)


def _normalize_stage_entry(stage: Any) -> dict[str, Any] | None:
    if not isinstance(stage, dict):
        return None
    name = str(stage.get("name") or stage.get("stage") or "").strip()
    if not name:
        return None
    details = stage.get("details") if isinstance(stage.get("details"), dict) else {}
    error_type = stage.get("error_type")
    error_message = stage.get("error_message")
    skip_reason = stage.get("skip_reason") or details.get("skip_reason")
    return {
        "name": name,
        "display_name": str(stage.get("display_name") or stage.get("displayName") or name),
        "status": _normalized_stage_status(stage.get("status")),
        "started_at": stage.get("started_at"),
        "finished_at": stage.get("finished_at"),
        "duration_seconds": stage.get("duration_seconds"),
        "details": details,
        "skip_reason": skip_reason if isinstance(skip_reason, str) else None,
        "error_type": error_type if isinstance(error_type, str) else None,
        "error_message": error_message if isinstance(error_message, str) else None,
    }


def _stages_from_events(events_path: Path) -> list[dict[str, Any]]:
    stage_map: dict[str, dict[str, Any]] = {}
    for event in _iter_run_events(events_path):
        stage_name = event.get("stage")
        if not isinstance(stage_name, str) or not stage_name:
            continue
        details = event.get("details") if isinstance(event.get("details"), dict) else {}
        nested_details = details.get("details") if isinstance(details.get("details"), dict) else {}
        current = stage_map.setdefault(
            stage_name,
            {
                "name": stage_name,
                "display_name": details.get("display_name") or stage_name,
                "status": "running",
                "started_at": None,
                "finished_at": None,
                "duration_seconds": None,
                "details": {},
                "skip_reason": None,
                "error_type": None,
                "error_message": None,
            },
        )
        if details.get("display_name"):
            current["display_name"] = details["display_name"]
        if event.get("event_type") == "stage_started":
            current["started_at"] = event.get("timestamp")
            current["status"] = "running"
        if event.get("event_type") in {"stage_finished", "stage_failed"}:
            current["finished_at"] = event.get("timestamp")
            current["status"] = _normalized_stage_status(event.get("status"))
            current["duration_seconds"] = event.get("duration_seconds")
            current["details"] = nested_details
            current["skip_reason"] = nested_details.get("skip_reason")
            current["error_type"] = details.get("error_type")
            current["error_message"] = details.get("error_message")
    return list(stage_map.values())


def _quality_gate_summary(path: Path) -> dict[str, Any]:
    artifact = _read_json_if_exists(path)
    if not artifact:
        return {
            "available": False,
            "gate_count": 0,
            "blocked_count": 0,
            "needs_review_count": 0,
            "usable_with_caution_count": 0,
            "clean_count": 0,
        }
    gates = artifact.get("gates") if isinstance(artifact.get("gates"), list) else []
    summary = artifact.get("summary") if isinstance(artifact.get("summary"), dict) else {}
    status_counts = Counter(
        str(gate.get("status") or "")
        for gate in gates
        if isinstance(gate, dict)
    )
    return {
        "available": True,
        "gate_count": _int_or_default(summary.get("gate_count"), len(gates)),
        "blocked_count": _int_or_default(summary.get("blocked_count"), status_counts.get("Blocked", 0)),
        "needs_review_count": _int_or_default(
            summary.get("needs_review_count"),
            status_counts.get("Needs Review", 0),
        ),
        "usable_with_caution_count": _int_or_default(
            summary.get("usable_with_caution_count"),
            status_counts.get("Usable With Caution", 0),
        ),
        "clean_count": _int_or_default(summary.get("clean_count"), status_counts.get("Clean", 0)),
    }


def _issue_count(summary: dict[str, Any], issues_path: Path) -> int:
    issue_counts = summary.get("issue_counts") if isinstance(summary.get("issue_counts"), dict) else {}
    total = _int_or_none(issue_counts.get("total"))
    if total is not None:
        return total
    issues = _read_json_value_if_exists(issues_path)
    return len(issues) if isinstance(issues, list) else 0


def _source_mode_label(job: WebRunJob) -> str:
    if job.input_mode == "database":
        return f"database:{job.database_source_type}" if job.database_source_type else "database"
    if job.input_mode == "evaluation":
        return f"evaluation:{job.evaluation_dataset_id}" if job.evaluation_dataset_id else "evaluation"
    return job.input_mode


def _summary_error(summary: dict[str, Any]) -> str:
    error = summary.get("error")
    if isinstance(error, str):
        return error
    if not isinstance(error, dict):
        return ""
    error_type = error.get("error_type")
    error_message = error.get("error_message")
    if error_type and error_message:
        return f"{error_type}: {error_message}"
    return str(error_message or error_type or "")


def _int_or_default(value: Any, default: int) -> int:
    coerced = _int_or_none(value)
    return default if coerced is None else coerced


def _int_or_none(value: Any) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float) and value.is_integer():
        return int(value)
    if isinstance(value, str) and value.strip().isdigit():
        return int(value)
    return None


def _database_connector_from_options(
    *,
    source_type: str,
    connection_url: str,
    schema: str,
    tables: str | None,
    chunk_rows: int,
) -> TabularSourceConnector:
    if source_type == "postgres":
        return PostgresConnector.from_config(
            postgres_url=connection_url,
            postgres_schema=schema or DEFAULT_POSTGRES_SCHEMA,
            postgres_tables=tables,
            postgres_chunk_rows=chunk_rows,
        )
    if source_type == "mysql":
        return MySQLConnector.from_config(
            mysql_url=connection_url,
            mysql_schema=schema or DEFAULT_MYSQL_SCHEMA,
            mysql_tables=tables,
            mysql_chunk_rows=chunk_rows,
        )
    raise ValueError("source_type must be postgres or mysql.")


def _validated_database_source_type(source_type: str) -> str:
    if not isinstance(source_type, str):
        raise ValueError("source_type must be a string.")
    normalized = source_type.strip().lower()
    if normalized in {"mariadb", "mysql/mariadb"}:
        normalized = "mysql"
    if normalized not in ALLOWED_DATABASE_SOURCE_TYPES:
        raise ValueError("source_type must be postgres or mysql.")
    return normalized


def _validated_database_url(connection_url: str, *, source_type: str) -> str:
    if not isinstance(connection_url, str):
        raise ValueError("connection_url must be a string.")
    url = connection_url.strip()
    if not url:
        raise ValueError("connection_url is required.")
    if len(url) > 4096:
        raise ValueError("connection_url is too long.")
    if any(char.isspace() for char in url):
        raise ValueError("connection_url must not contain whitespace.")
    parsed = urlparse(url)
    scheme = parsed.scheme.lower()
    if not scheme or not parsed.netloc:
        raise ValueError("connection_url must be a database URL.")
    if source_type == "postgres" and scheme not in POSTGRES_URL_SCHEMES:
        raise ValueError("Postgres connection_url must use postgres:// or postgresql://.")
    if source_type == "mysql" and scheme not in MYSQL_URL_SCHEMES:
        raise ValueError("MySQL connection_url must use mysql:// or mariadb://.")
    return url


def _validated_database_schema(schema: str | None, *, source_type: str) -> str:
    if schema is None:
        return DEFAULT_POSTGRES_SCHEMA if source_type == "postgres" else DEFAULT_MYSQL_SCHEMA
    if not isinstance(schema, str):
        raise ValueError("schema must be a string.")
    stripped = schema.strip()
    if len(stripped) > 256:
        raise ValueError("schema is too long.")
    if _has_control_characters(stripped):
        raise ValueError("schema must not contain control characters.")
    if not stripped and source_type == "postgres":
        return DEFAULT_POSTGRES_SCHEMA
    return stripped


def _validated_database_tables(tables: str | None) -> str | None:
    if tables is None:
        return None
    if not isinstance(tables, str):
        raise ValueError("tables must be a string.")
    stripped = tables.strip()
    if not stripped:
        return None
    if len(stripped) > 4096:
        raise ValueError("tables is too long.")
    if _has_control_characters(stripped):
        raise ValueError("tables must not contain control characters.")
    return stripped


def _validated_database_chunk_rows(
    chunk_rows: int | str | None,
    *,
    source_type: str,
) -> int:
    default = DEFAULT_POSTGRES_CHUNK_ROWS if source_type == "postgres" else DEFAULT_MYSQL_CHUNK_ROWS
    maximum = MAX_POSTGRES_CHUNK_ROWS if source_type == "postgres" else MAX_MYSQL_CHUNK_ROWS
    if chunk_rows is None or chunk_rows == "":
        return default
    if isinstance(chunk_rows, bool):
        raise ValueError("chunk_rows must be an integer.")
    try:
        value = int(chunk_rows)
    except (TypeError, ValueError) as exc:
        raise ValueError("chunk_rows must be an integer.") from exc
    if value <= 0 or value > maximum:
        raise ValueError(f"chunk_rows must be between 1 and {maximum}.")
    return value


def _has_control_characters(value: str) -> bool:
    return any(ord(char) < 32 for char in value)


def _safe_error_message(exc: Exception, *, secret_values: list[str]) -> str:
    message = f"{exc.__class__.__name__}: {exc}"
    for secret in _expanded_secret_values(secret_values):
        if secret:
            replacement = redact_connection_url(secret) if "://" in secret else "[redacted]"
            message = message.replace(secret, replacement)
    return redact_secret_text(message)


def _expanded_secret_values(values: list[str]) -> list[str]:
    expanded: list[str] = []
    for value in values:
        if not value:
            continue
        expanded.append(value)
        try:
            parsed = urlparse(value)
        except ValueError:
            continue
        if parsed.password:
            expanded.append(unquote(parsed.password))
        for key, query_value in parse_qsl(parsed.query, keep_blank_values=True):
            if any(
                part in key.lower()
                for part in ("secret", "token", "password", "api_key", "api-key", "credential")
            ):
                expanded.append(query_value)
    return expanded


def _validated_file_path(
    path_value: str | Path,
    *,
    label: str,
    extensions: set[str],
) -> Path:
    path = Path(path_value).expanduser()
    if not path.exists():
        raise ValueError(f"{label} does not exist: {path}")
    if not path.is_file():
        raise ValueError(f"{label} must be a file: {path}")
    suffix = path.suffix.lower()
    if suffix not in extensions:
        allowed = ", ".join(sorted(extensions))
        raise ValueError(f"{label} must use {allowed} extension: {path}")
    return path.resolve()


def _validated_csv_dir(path_value: str | Path) -> Path:
    path = Path(path_value).expanduser()
    if not path.exists():
        raise ValueError(f"CSV directory does not exist: {path}")
    if not path.is_dir():
        raise ValueError(f"CSV directory must be a directory: {path}")
    if not any(child.is_file() and child.suffix.lower() == ".csv" for child in path.iterdir()):
        raise ValueError(f"CSV directory must contain at least one .csv file: {path}")
    return path.resolve()


def _validated_target(target: str | None) -> str | None:
    if target is None:
        return None
    stripped = target.strip()
    if not stripped:
        return None
    if not TARGET_PATTERN.match(stripped):
        raise ValueError("Target column must use table.column format.")
    return stripped


def _validated_evaluation_dataset_id(dataset_id: str) -> str:
    if not isinstance(dataset_id, str):
        raise ValueError("dataset_id must be a string.")
    stripped = dataset_id.strip()
    if not stripped:
        raise ValueError("dataset_id is required.")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+", stripped):
        raise ValueError("dataset_id contains unsupported characters.")
    from vsf_profiler.evaluation_benchmark import get_evaluation_dataset

    return get_evaluation_dataset(stripped).dataset_id


def _validated_llm_options(*, use_llm: bool, llm_provider: str | None) -> tuple[bool, str | None]:
    provider = _optional_llm_provider_string(llm_provider)
    if provider and not use_llm:
        raise ValueError("llm_provider requires use_llm.")
    return bool(use_llm), provider


def _optional_llm_provider_string(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError("llm_provider must be a string.")
    provider = value.strip().lower()
    if not provider:
        return None
    if provider not in ALLOWED_LLM_PROVIDERS:
        allowed = ", ".join(sorted(ALLOWED_LLM_PROVIDERS))
        raise ValueError(f"llm_provider must be one of: {allowed}.")
    return provider


def _optional_bool(payload: dict[str, Any], key: str) -> bool:
    value = payload.get(key)
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return _parse_bool_field(value)
    raise ValueError(f"{key} must be a boolean.")


def _parse_bool_field(value: str | None) -> bool:
    if value is None or not value.strip():
        return False
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValueError("use_llm must be a boolean.")


def _required_string(payload: dict[str, Any], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{key} is required.")
    return value.strip()


def _optional_string(payload: dict[str, Any], key: str) -> str | None:
    value = payload.get(key)
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError(f"{key} must be a string.")
    stripped = value.strip()
    return stripped or None


def _optional_mapping_overrides(payload: dict[str, Any], key: str) -> dict[str, str]:
    value = payload.get(key)
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise ValueError(f"{key} must be an object.")
    return _clean_mapping_overrides(value)


def _optional_preflight_review(payload: dict[str, Any], key: str) -> dict[str, Any] | None:
    value = payload.get(key)
    if value is None:
        return None
    return _clean_preflight_review(value)


def _parse_mapping_overrides_field(value: str | None) -> dict[str, str]:
    if value is None or not value.strip():
        return {}
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError as exc:
        raise ValueError("mapping_overrides must be valid JSON.") from exc
    if not isinstance(parsed, dict):
        raise ValueError("mapping_overrides must be a JSON object.")
    return _clean_mapping_overrides(parsed)


def _parse_preflight_review_field(value: str | None) -> dict[str, Any] | None:
    if value is None or not value.strip():
        return None
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError as exc:
        raise ValueError("preflight_review must be valid JSON.") from exc
    return _clean_preflight_review(parsed)


def _clean_preflight_review(preflight_review: dict[str, Any] | None) -> dict[str, Any] | None:
    if preflight_review is None:
        return None
    if not isinstance(preflight_review, dict):
        raise ValueError("preflight_review must be a JSON object.")
    try:
        serialized = json.dumps(preflight_review, ensure_ascii=False)
    except (TypeError, ValueError) as exc:
        raise ValueError("preflight_review must be JSON serializable.") from exc
    if len(serialized.encode("utf-8")) > MAX_PREFLIGHT_REVIEW_BYTES:
        raise ValueError("preflight_review is too large.")
    return json.loads(serialized)


def _clean_mapping_overrides(mapping_overrides: dict[str, Any]) -> dict[str, str]:
    cleaned: dict[str, str] = {}
    for table_name, csv_name in mapping_overrides.items():
        if not isinstance(table_name, str) or not table_name.strip():
            raise ValueError("Mapping override table names must be non-empty strings.")
        if not isinstance(csv_name, str) or not csv_name.strip():
            raise ValueError(f"Mapping override for {table_name!r} must be a non-empty string.")
        cleaned[table_name.strip()] = csv_name.strip()
    return cleaned


def _translate_uploaded_mapping_overrides(
    mapping_overrides: dict[str, str],
    *,
    stored_csv_names: dict[str, str],
) -> dict[str, str]:
    translated: dict[str, str] = {}
    for table_name, csv_name in mapping_overrides.items():
        translated[table_name] = stored_csv_names.get(csv_name, csv_name)
    return translated


def _safe_filename(filename: str, *, fallback: str) -> str:
    name = Path(filename).name.strip()
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name)
    name = name.strip("._")
    return name or fallback


def _new_job_id() -> str:
    return f"run_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{secrets.token_hex(4)}"
