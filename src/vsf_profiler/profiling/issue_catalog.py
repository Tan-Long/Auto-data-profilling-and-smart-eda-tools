from __future__ import annotations

from pathlib import Path

import duckdb

from vsf_profiler.ingestion.duckdb_utils import run_scalar, safe_rate, sql_literal
from vsf_profiler.models import Issue


CAUSES = {
    "TABLE_MISSING": ["Bản trích xuất CSV không có bảng nào được yêu cầu bởi DBML contract."],
    "COLUMN_MISSING": ["Dòng tiêu đề CSV thiếu một cột được yêu cầu bởi DBML contract."],
    "EXTRA_COLUMN": ["Bản trích xuất CSV bao gồm một cột không được khai báo trong DBML contract."],
    "TYPE_CAST_INVALID": ["Dữ liệu nguồn chứa các giá trị không khớp với kiểu dữ liệu được khai báo trong DBML."],
    "REQUIRED_FIELD_NULL": ["Trường bắt buộc (required field) đang bị trống hoặc null từ nguồn."],
    "PRIMARY_KEY_NULL": ["Cột khóa chính (primary key) bị trống hoặc null khi tạo ra."],
    "DUPLICATE_PRIMARY_KEY": ["Tính duy nhất của khóa chính chưa được đảm bảo trước khi export."],
    "UNIQUE_DUPLICATE": ["Trường duy nhất (unique field) có chứa các giá trị trùng lặp trong bản export CSV."],
    "ORPHAN_FOREIGN_KEY": [
        "Bảng cha có thể đang bị thiếu một batch dữ liệu.",
        "Dòng dữ liệu của bảng con có thể đã được tải (load) trước bảng cha.",
        "Logic biến đổi khóa join không đồng nhất giữa các bảng.",
    ],
    "PARENT_KEY_DUPLICATE": ["Khóa cha không duy nhất, do đó các phép join có thể làm nhân đôi (multiply) số dòng của bảng con."],
    "CHILD_RELATIONSHIP_DUPLICATE": [
        "Các giá trị khóa ngoại của bảng con không duy nhất đối với một mối quan hệ one-to-one đã được khai báo."
    ],
    "VALUE_OUT_OF_RANGE": ["Dữ liệu vi phạm giới hạn đã cấu hình (range constraint)."],
    "NEGATIVE_VALUE_NOT_ALLOWED": ["Dữ liệu vi phạm quy tắc số không âm đã cấu hình."],
    "DATE_ORDER_INVALID": ["Thứ tự thời gian vi phạm quy tắc logic theo trình tự đã cấu hình."],
    "ACCEPTED_VALUE_VIOLATION": ["Cột phân loại (categorical) chứa các giá trị không được khai báo trước."],
    "REGEX_MISMATCH": ["Giá trị text không khớp với mẫu (pattern) mong đợi."],
    "EMPTY_STRING": ["Các trường text chứa chuỗi rỗng có thể gây ảnh hưởng khác với null."],
    "INVALID_PLACEHOLDER_TOKEN": ["Có chứa các placeholder token thay vì các giá trị null chuẩn hóa."],
    "NUMERIC_OUTLIER": ["Các giá trị số nằm ngoài khoảng an toàn (IQR fence) đối với cột này."],
}

FIXES = {
    "TABLE_MISSING": ["Tạo lại bản trích xuất (extract) và đảm bảo bao gồm tất cả các bảng trong DBML."],
    "COLUMN_MISSING": ["Cập nhật câu lệnh export hoặc DBML contract để các cột khớp nhau."],
    "EXTRA_COLUMN": ["Xác nhận xem DBML contract có cần cột này không, hoặc loại bỏ cột này khỏi bản export."],
    "TYPE_CAST_INVALID": ["Chuẩn hóa các giá trị của nguồn dữ liệu trước khi export và cách ly các dòng không thể ép kiểu (cast)."],
    "REQUIRED_FIELD_NULL": ["Thêm bước kiểm tra not-null trước khi publish và bổ sung các giá trị còn thiếu."],
    "PRIMARY_KEY_NULL": ["Loại bỏ các dòng bị thiếu khóa chính trước khi thực hiện các phép JOIN ở luồng sau."],
    "DUPLICATE_PRIMARY_KEY": ["Loại bỏ trùng lặp (deduplicate) dựa trên khóa chính hoặc sửa lỗi logic tạo khóa từ nguồn."],
    "UNIQUE_DUPLICATE": ["Kiểm tra lại tính duy nhất (uniqueness) trong contract và loại bỏ trùng lặp ở dữ liệu gốc."],
    "ORPHAN_FOREIGN_KEY": [
        "Kiểm tra lại pipeline tải dữ liệu của bảng cha.",
        "Thêm bước anti-join validation trước khi publish.",
        "Cách ly các dòng dữ liệu con bị thiếu khóa cha.",
    ],
    "PARENT_KEY_DUPLICATE": ["Loại bỏ trùng lặp (deduplicate) khóa cha trước khi sử dụng bảng này làm bảng dimension."],
    "CHILD_RELATIONSHIP_DUPLICATE": [
        "Loại bỏ trùng lặp khóa ngoại của bảng con hoặc thay đổi thiết lập cardinality trong DBML."
    ],
    "VALUE_OUT_OF_RANGE": ["Giới hạn (clamp), loại bỏ, hoặc sửa lại các giá trị nằm ngoài vùng an toàn đã cấu hình."],
    "NEGATIVE_VALUE_NOT_ALLOWED": ["Loại bỏ các giá trị số âm hoặc sửa lại logic xử lý dấu từ nguồn."],
    "DATE_ORDER_INVALID": ["Sửa lại logic tính toán thời gian và thêm bước kiểm tra thứ tự trong pipeline."],
    "ACCEPTED_VALUE_VIOLATION": ["Cập nhật tập giá trị cho phép hoặc chuẩn hóa các giá trị category không hợp lệ."],
    "REGEX_MISMATCH": ["Chuẩn hóa trường văn bản hoặc cập nhật lại regex nếu contract có thay đổi."],
    "EMPTY_STRING": ["Chuyển các chuỗi rỗng thành null hoặc bắt buộc áp dụng quy tắc văn bản không rỗng."],
    "INVALID_PLACEHOLDER_TOKEN": ["Chuẩn hóa các token giữ chỗ (placeholder) thành null tại bước ingestion."],
    "NUMERIC_OUTLIER": [
        "Xem xét các dòng dữ liệu mẫu và quyết định nên sửa, giới hạn (cap), transform, hoặc giữ nguyên giá trị."
    ],
}


class IssueCatalog:
    def __init__(self, samples_dir: Path, con: duckdb.DuckDBPyConnection | None = None) -> None:
        self.samples_dir = samples_dir
        self.samples_dir.mkdir(parents=True, exist_ok=True)
        self.con = con
        self._counter = 0
        self.issues: list[Issue] = []

    def add_issue(
        self,
        *,
        issue_type: str,
        severity: str,
        table: str,
        columns: list[str],
        bad_count: int,
        total_count: int,
        evidence_sql: str,
        parent_table: str | None = None,
        parent_columns: list[str] | None = None,
        sample_sql: str | None = None,
        sample_key_sql: str | None = None,
        probable_causes: list[str] | None = None,
        suggested_fix: list[str] | None = None,
    ) -> Issue | None:
        if bad_count <= 0:
            return None

        self._counter += 1
        issue_id = f"ISSUE-{self._counter:04d}"
        sample_path = None
        if sample_sql and self.con is not None:
            sample_path = self.samples_dir / f"{issue_id}.csv"
            self._write_sample(sample_sql, sample_path)
        sample_path_for_issue = None
        if sample_path:
            try:
                sample_path_for_issue = str(sample_path.relative_to(self.samples_dir.parent))
            except ValueError:
                sample_path_for_issue = str(sample_path)

        sample_keys: list[str] = []
        if sample_key_sql and self.con is not None:
            try:
                rows = self.con.execute(sample_key_sql).fetchall()
                sample_keys = [str(row[0]) for row in rows if row and row[0] is not None]
            except duckdb.Error:
                sample_keys = []

        issue = Issue(
            issue_id=issue_id,
            issue_type=issue_type,
            severity=severity,
            table=table,
            columns=columns,
            parent_table=parent_table,
            parent_columns=parent_columns,
            bad_count=int(bad_count),
            total_count=int(total_count),
            bad_rate=round(safe_rate(int(bad_count), int(total_count)), 6),
            sample_bad_rows_path=sample_path_for_issue,
            sample_keys=sample_keys,
            evidence_sql=evidence_sql.strip(),
            probable_causes=probable_causes or CAUSES.get(issue_type, ["Data violates the current contract."]),
            suggested_fix=suggested_fix or FIXES.get(issue_type, ["Inspect sample rows and update the pipeline."]),
        )
        self.issues.append(issue)
        return issue

    def add_count_issue(
        self,
        *,
        issue_type: str,
        severity: str,
        table: str,
        columns: list[str],
        total_count: int,
        count_sql: str,
        sample_sql: str | None = None,
        parent_table: str | None = None,
        parent_columns: list[str] | None = None,
        sample_key_sql: str | None = None,
    ) -> Issue | None:
        if self.con is None:
            raise RuntimeError("add_count_issue requires a DuckDB connection")
        bad_count = int(run_scalar(self.con, count_sql, 0))
        return self.add_issue(
            issue_type=issue_type,
            severity=severity,
            table=table,
            columns=columns,
            parent_table=parent_table,
            parent_columns=parent_columns,
            bad_count=bad_count,
            total_count=total_count,
            evidence_sql=count_sql,
            sample_sql=sample_sql,
            sample_key_sql=sample_key_sql,
        )

    def _write_sample(self, sample_sql: str, sample_path: Path) -> None:
        try:
            copy_sql = f"COPY ({sample_sql}) TO {sql_literal(sample_path)} (HEADER, DELIMITER ',')"
            self.con.execute(copy_sql)
        except duckdb.Error:
            sample_path.write_text("sample_error\n")
