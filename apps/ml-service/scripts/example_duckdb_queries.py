#!/usr/bin/env python3
"""
Hello World analytics with DuckDB for Americano.

Demonstrates:
- Event counts by phase
- Daily/weekly time-series
- Join patterns between events and protocols
- Optional performance timing vs PostgreSQL

This script auto-detects key column names where possible. If your exports use
different names, set the corresponding environment variables to override.
"""

from __future__ import annotations

import os
import sys
import time
import logging
from typing import Optional

import duckdb
from dotenv import load_dotenv


def configure_logging() -> None:
    logging.basicConfig(
        level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


def get_env(name: str, default: Optional[str] = None) -> Optional[str]:
    return os.getenv(name, default)


def pick_column(con: duckdb.DuckDBPyConnection, table: str, candidates: list[str], fallback: Optional[str] = None) -> Optional[str]:
    try:
        cols = con.execute(f"PRAGMA table_info({table})").fetchdf()["name"].str.lower().tolist()
    except Exception:
        return fallback
    for c in candidates:
        if c.lower() in cols:
            return c
    return fallback


def time_query(con: duckdb.DuckDBPyConnection, sql: str, params: Optional[list] = None) -> tuple[float, list]:
    start = time.perf_counter()
    res = con.execute(sql, params or []).fetchall()
    dur = (time.perf_counter() - start) * 1000.0
    return dur, res


def main() -> int:
    load_dotenv(override=False)
    configure_logging()

    db_path = get_env("DUCKDB_DB_PATH", "./data/duckdb/analytics.duckdb")
    con = duckdb.connect(db_path)

    events_table = "analytics.behavioral_events"
    phases_table = "analytics.phase_assignments"
    protocols_table = "analytics.experiment_protocols"

    # Auto-detect common columns
    ts_col = pick_column(con, events_table, ["event_time", "event_timestamp", "timestamp", "ts"])
    phase_col_events = pick_column(con, events_table, ["phase", "phase_name", "protocol_phase"])  # optional
    phase_col_phase_assign = pick_column(con, phases_table, ["phase", "phase_name", "protocol_phase"])  # optional
    learner_col = pick_column(con, events_table, ["learner_id", "user_id", "student_id", "participant_id"])  # optional
    proto_id_events = pick_column(con, events_table, ["experiment_id", "protocol_id", "study_id"])  # optional
    proto_id_protocols = pick_column(con, protocols_table, ["experiment_id", "protocol_id", "id"])  # optional

    # 1) Event count by experiment phase
    if phase_col_events and ts_col:
        sql = f"""
            SELECT {phase_col_events} AS phase, COUNT(*) AS event_count
            FROM {events_table}
            GROUP BY {phase_col_events}
            ORDER BY event_count DESC
            LIMIT 20
        """
        dur_ms, rows = time_query(con, sql)
        logging.info("Event count by phase (events table) — %.1f ms", dur_ms)
        for r in rows[:10]:
            logging.info("phase=%s count=%s", r[0], r[1])
    elif phase_col_phase_assign and learner_col:
        sql = f"""
            SELECT pa.{phase_col_phase_assign} AS phase, COUNT(*) AS event_count
            FROM {events_table} e
            JOIN {phases_table} pa USING ({learner_col})
            GROUP BY pa.{phase_col_phase_assign}
            ORDER BY event_count DESC
            LIMIT 20
        """
        dur_ms, rows = time_query(con, sql)
        logging.info("Event count by phase (via phase assignments) — %.1f ms", dur_ms)
        for r in rows[:10]:
            logging.info("phase=%s count=%s", r[0], r[1])
    else:
        logging.warning("Could not determine phase column; skipping phase count query")

    # 2) Time-series aggregations (daily and weekly)
    if ts_col:
        daily_sql = f"""
            SELECT DATE_TRUNC('day', {ts_col}) AS day, COUNT(*) AS events
            FROM {events_table}
            GROUP BY 1
            ORDER BY 1
            LIMIT 60
        """
        weekly_sql = f"""
            SELECT DATE_TRUNC('week', {ts_col}) AS week, COUNT(*) AS events
            FROM {events_table}
            GROUP BY 1
            ORDER BY 1
            LIMIT 52
        """
        d_ms, _ = time_query(con, daily_sql)
        w_ms, _ = time_query(con, weekly_sql)
        logging.info("Daily aggregation — %.1f ms | Weekly aggregation — %.1f ms", d_ms, w_ms)
    else:
        logging.warning("No timestamp column found; skipping time-series aggregations")

    # 3) Join pattern: events -> protocols (by protocol/experiment id)
    if proto_id_events and proto_id_protocols:
        join_sql = f"""
            SELECT p.{proto_id_protocols} AS protocol_id, COUNT(*) AS events
            FROM {events_table} e
            JOIN {protocols_table} p
              ON e.{proto_id_events} = p.{proto_id_protocols}
            GROUP BY 1
            ORDER BY events DESC
            LIMIT 20
        """
        dur_ms, rows = time_query(con, join_sql)
        logging.info("Events per protocol — %.1f ms", dur_ms)
        for r in rows[:10]:
            logging.info("protocol=%s events=%s", r[0], r[1])
    else:
        logging.warning("Could not resolve protocol id columns; skipping join query")

    # 4) Optional: compare DuckDB vs PostgreSQL timing on a simple aggregation
    try_pg = get_env("COMPARE_WITH_POSTGRES", "false").lower() in {"1", "true", "yes"}
    if try_pg and ts_col:
        import sqlalchemy as sa  # lazy import

        pg_url = get_env("DATABASE_URL")
        pg_table = get_env("PG_EVENTS_TABLE", "\"BehavioralEvent\"")
        if pg_url:
            engine = sa.create_engine(pg_url)
            sql = f"SELECT DATE_TRUNC('day', {ts_col}) AS day, COUNT(*) FROM {pg_table} GROUP BY 1 ORDER BY 1 LIMIT 60"
            start = time.perf_counter()
            with engine.connect() as conn:
                conn.execution_options(stream_results=True)
                conn.exec_driver_sql(sql).fetchall()
            pg_ms = (time.perf_counter() - start) * 1000.0

            duck_ms, _ = time_query(con, f"SELECT DATE_TRUNC('day', {ts_col}) AS day, COUNT(*) FROM {events_table} GROUP BY 1 ORDER BY 1 LIMIT 60")
            logging.info("Timing — DuckDB: %.1f ms | PostgreSQL: %.1f ms", duck_ms, pg_ms)
        else:
            logging.warning("DATABASE_URL not set; skipping Postgres timing comparison")

    con.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

