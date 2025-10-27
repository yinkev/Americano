#!/usr/bin/env python3
"""
Create and populate a DuckDB analytics database for Americano.

Supports two ingestion paths:
1) Parquet -> DuckDB tables (default, robust for CI/dev)
2) Direct PostgreSQL scan via postgres_scanner (optional)

Also applies simple physical ordering and optional indexes for common filters.
"""

from __future__ import annotations

import os
import sys
import logging
import pathlib
from typing import Optional, Sequence

import duckdb
from dotenv import load_dotenv


def configure_logging() -> None:
    logging.basicConfig(
        level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


def get_env(name: str, default: Optional[str] = None) -> Optional[str]:
    return os.getenv(name, default)


def ensure_parent(path: pathlib.Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def table_has_columns(con: duckdb.DuckDBPyConnection, table: str, cols: Sequence[str]) -> bool:
    info = con.execute(f"PRAGMA table_info({table})").fetchdf()
    present = set(col.lower() for col in info["name"].tolist())
    return all(c.lower() in present for c in cols)


def first_present_column(con: duckdb.DuckDBPyConnection, table: str, candidates: Sequence[str]) -> Optional[str]:
    info = con.execute(f"PRAGMA table_info({table})").fetchdf()
    present = [col for col in info["name"].tolist()]
    for c in candidates:
        for p in present:
            if p.lower() == c.lower():
                return p
    return None


def create_schema(con: duckdb.DuckDBPyConnection, schema: str = "analytics") -> None:
    con.execute(f"CREATE SCHEMA IF NOT EXISTS {schema}")


def create_from_parquet(
    con: duckdb.DuckDBPyConnection,
    table: str,
    parquet_path: str,
    order_by_candidates: Optional[Sequence[str]] = None,
) -> None:
    path = pathlib.Path(parquet_path)
    if not path.exists():
        logging.warning("Parquet not found for %s: %s (skipping)", table, parquet_path)
        return
    # Try to order the table by a relevant column (e.g., timestamp) for better compression/zone-maps
    order_clause = ""
    if order_by_candidates:
        # Peek schema to choose an available column
        cols_df = con.execute(f"DESCRIBE SELECT * FROM read_parquet(?) LIMIT 0", [str(path)]).fetchdf()
        present = {c.lower() for c in cols_df["column_name"].tolist()}
        chosen = next((c for c in order_by_candidates if c.lower() in present), None)
        if chosen:
            order_clause = f" ORDER BY {chosen}"

    sql = f"""
        CREATE OR REPLACE TABLE {table} AS
        SELECT * FROM read_parquet(?) {order_clause}
    """
    con.execute(sql, [str(path)])
    logging.info("Created table %s from %s%s", table, parquet_path, f" (ordered)" if order_clause else "")


def create_indexes_if_helpful(con: duckdb.DuckDBPyConnection) -> None:
    # behavioral_events: common filters by user + time
    if table_has_columns(con, "analytics.behavioral_events", ["learner_id", "event_time"]):
        con.execute(
            "CREATE INDEX IF NOT EXISTS idx_events_learner_ts ON analytics.behavioral_events(learner_id, event_time)"
        )
        logging.info("Created index idx_events_learner_ts")

    # phase_assignments: by learner/phase
    if table_has_columns(con, "analytics.phase_assignments", ["learner_id", "phase"]):
        con.execute(
            "CREATE INDEX IF NOT EXISTS idx_phase_assign_learner_phase ON analytics.phase_assignments(learner_id, phase)"
        )
        logging.info("Created index idx_phase_assign_learner_phase")


def attach_postgres(con: duckdb.DuckDBPyConnection) -> None:
    # Prefer explicit PG_* vars; fall back to DATABASE_URL parsing in the future if needed
    host = get_env("PG_HOST", "localhost")
    port = int(get_env("PG_PORT", "5432"))
    user = get_env("PG_USER", "postgres")
    password = get_env("PG_PASSWORD", "")
    database = get_env("PG_DATABASE", "postgres")

    con.execute("INSTALL postgres_scanner; LOAD postgres_scanner;")
    con.execute(
        "ATTACH 'dbname={db} user={user} password={pwd} host={host} port={port}' AS pg (TYPE POSTGRES, READ_ONLY)".format(
            db=database, user=user, pwd=password, host=host, port=port
        )
    )
    logging.info("Attached Postgres database '%s' via postgres_scanner", database)


def create_from_postgres(con: duckdb.DuckDBPyConnection) -> None:
    # Map Postgres tables -> DuckDB analytics schema tables
    mappings = {
        "analytics.behavioral_events": "public.BehavioralEvent",
        "analytics.experiment_protocols": "public.ExperimentProtocol",
        "analytics.phase_assignments": "public.PhaseAssignment",
        "analytics.analysis_runs": "public.AnalysisRun",
    }
    for duck_table, pg_table in mappings.items():
        try:
            con.execute(f"CREATE OR REPLACE TABLE {duck_table} AS SELECT * FROM pg.{pg_table}")
            logging.info("Created table %s from Postgres table %s", duck_table, pg_table)
        except Exception as e:
            logging.warning("Skipping %s (missing in Postgres?): %s", pg_table, e)


def main() -> int:
    load_dotenv(override=False)
    configure_logging()

    db_path = pathlib.Path(get_env("DUCKDB_DB_PATH", "./data/duckdb/analytics.duckdb"))
    ensure_parent(db_path)

    con = duckdb.connect(str(db_path))
    create_schema(con, "analytics")

    use_pg = get_env("DUCKDB_USE_POSTGRES_SCANNER", "false").lower() in {"1", "true", "yes"}
    if use_pg:
        try:
            attach_postgres(con)
            create_from_postgres(con)
        except Exception as e:
            logging.error("Postgres scanner path failed: %s", e)
            logging.info("Falling back to Parquet ingestion")
            use_pg = False

    if not use_pg:
        # Ingest from Parquet exports
        create_from_parquet(
            con,
            table="analytics.behavioral_events",
            parquet_path=get_env("BEHAVIORAL_EVENTS_PARQUET", "./data/parquet/behavioral_events_export.parquet"),
            order_by_candidates=["event_time", "event_timestamp", "timestamp", "ts"],
        )
        create_from_parquet(
            con,
            table="analytics.experiment_protocols",
            parquet_path=get_env("EXPERIMENT_PROTOCOLS_PARQUET", "./data/parquet/experiment_protocols_export.parquet"),
            order_by_candidates=["created_at", "updated_at"],
        )
        create_from_parquet(
            con,
            table="analytics.phase_assignments",
            parquet_path=get_env("PHASE_ASSIGNMENTS_PARQUET", "./data/parquet/phase_assignments_export.parquet"),
            order_by_candidates=["assigned_at", "event_time", "timestamp"],
        )
        create_from_parquet(
            con,
            table="analytics.analysis_runs",
            parquet_path=get_env("ANALYSIS_RUNS_PARQUET", "./data/parquet/analysis_runs_export.parquet"),
            order_by_candidates=["created_at"],
        )

    # Optional helpful indexes for interactive analytics
    try:
        create_indexes_if_helpful(con)
    except Exception as e:
        logging.warning("Index creation skipped: %s", e)

    # Quick summary
    for t in [
        "analytics.behavioral_events",
        "analytics.experiment_protocols",
        "analytics.phase_assignments",
        "analytics.analysis_runs",
    ]:
        try:
            count = con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
            logging.info("%s rows: %s", t, count)
        except Exception:
            pass

    logging.info("DuckDB ready at %s", db_path)
    con.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

