from pathlib import Path

import pytest

from vsf_profiler.duckdb_utils import connect, fetch_bounded_df


def test_fetch_bounded_df_enforces_row_and_column_limits():
    con = connect()
    try:
        frame = fetch_bounded_df(
            con,
            "SELECT i AS value FROM range(100) AS data(i)",
            max_rows=7,
            max_columns=1,
        )
        assert len(frame) == 7
        assert list(frame.columns) == ["value"]

        with pytest.raises(ValueError, match="exceeding max_columns=1"):
            fetch_bounded_df(
                con,
                "SELECT 1 AS first_value, 2 AS second_value",
                max_rows=10,
                max_columns=1,
            )
    finally:
        con.close()


def test_production_duckdb_to_pandas_calls_go_through_bounded_helper():
    src_root = Path(__file__).resolve().parents[1] / "src" / "vsf_profiler"
    offenders = []
    for path in src_root.glob("*.py"):
        if path.name == "duckdb_utils.py":
            continue
        if ".fetchdf(" in path.read_text():
            offenders.append(path.name)
    assert offenders == []


def test_production_pandas_usage_is_limited_to_bounded_analysis_modules():
    src_root = Path(__file__).resolve().parents[1] / "src" / "vsf_profiler"
    allowed_imports = {"duckdb_utils.py"}
    import_offenders = []
    read_csv_offenders = []
    for path in src_root.glob("*.py"):
        text = path.read_text()
        if ("import pandas" in text or "from pandas" in text) and path.name not in allowed_imports:
            import_offenders.append(path.name)
        if "pandas.read_csv" in text or "pd.read_csv" in text:
            read_csv_offenders.append(path.name)

    assert import_offenders == []
    assert read_csv_offenders == []
