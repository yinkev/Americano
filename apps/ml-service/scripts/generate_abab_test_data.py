"""
Generate synthetic ABAB (reversal design) behavioral event data in DuckDB.

Design
------
- User: test-abab-user-001
- Protocol (doc-only): abab_protocol_001
- Phases (15 observations each, sequential days from 2025-09-01):
  1) baseline_1        (B1)  mean≈65
  2) intervention_A_1  (A1)  mean≈80  (+15 vs baseline)
  3) baseline_2        (B2)  mean≈68  (baseline with slight carryover)
  4) intervention_A_2  (A2)  mean≈82  (+14 vs B2)

Noise & Reproducibility
-----------------------
- Random seed: 42 for deterministic generation
- Phase SDs in the 5–8 range to add realistic variability
- Scores are clipped to [0, 100]

Storage
-------
Writes into apps/ml-service/data/behavioral_events.duckdb using the schema:

    CREATE TABLE behavioral_events (
        timestamp TIMESTAMP,
        userId VARCHAR,
        experimentPhase VARCHAR,
        sessionPerformanceScore DOUBLE,
        engagementLevel DOUBLE,
        randomizationSeed INTEGER
    );

Notes
-----
- Column names intentionally use camelCase to match existing analytics code.
- The script is idempotent for the test user: it deletes prior rows for
  userId='test-abab-user-001' before inserting exactly 60 new rows.
"""

from __future__ import annotations

import sys
from datetime import datetime, timedelta
from pathlib import Path
import random

try:
    import duckdb  # Verified against DuckDB Python API docs (parameters use $1, $2 ...)
except Exception as e:  # pragma: no cover
    sys.stderr.write(
        "DuckDB Python package is required. Install with:\n"
        "  python3 -m pip install duckdb\n"
        f"Import error: {e}\n"
    )
    sys.exit(1)


DB_RELATIVE = Path(__file__).resolve().parents[1] / "data" / "behavioral_events.duckdb"
TABLE_NAME = "behavioral_events"

TEST_USER_ID = "test-abab-user-001"
RANDOM_SEED = 42

# Phase configuration: (phase_name, mean_score, sd)
PHASES = [
    ("baseline_1", 65.0, 6.0),
    ("intervention_A_1", 80.0, 5.5),
    ("baseline_2", 68.0, 7.0),
    ("intervention_A_2", 82.0, 6.0),
]

N_PER_PHASE = 15
START_DATE = datetime(2025, 9, 1)


def ensure_db_dir_exists() -> None:
    DB_RELATIVE.parent.mkdir(parents=True, exist_ok=True)


def connect_db():
    """Connect to the DuckDB file and return a connection."""
    return duckdb.connect(str(DB_RELATIVE))


def ensure_table(conn) -> None:
    """Create the table if it does not exist, matching the expected schema."""
    conn.execute(
        f"""
        CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
            timestamp TIMESTAMP,
            userId VARCHAR,
            experimentPhase VARCHAR,
            sessionPerformanceScore DOUBLE,
            engagementLevel DOUBLE,
            randomizationSeed INTEGER
        );
        """
    )


def verify_schema(conn) -> None:
    """Verify that the table has the required business columns.

    Only checks presence of columns; allows different physical types so the
    script can adapt to existing analytics schemas.
    """
    rows = conn.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
        """,
        [TABLE_NAME],
    ).fetchall()
    have = {name.lower() for (name,) in rows}
    required = {
        "timestamp",
        "userid",
        "experimentphase",
        "sessionperformancescore",
        "engagementlevel",
        "randomizationseed",
    }
    missing = [c for c in required if c not in have]
    if missing:
        raise RuntimeError(
            "behavioral_events missing required columns: " + ", ".join(missing)
        )


def migrate_schema_if_needed(conn) -> list[str]:
    """Attempt to add any missing required columns non-destructively.

    Returns a list of applied ALTER statements.
    """
    rows = conn.execute(
        """
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1
        """,
        [TABLE_NAME],
    ).fetchall()
    have = {name.lower() for name, _ in rows}
    required_types = {
        "timestamp": "TIMESTAMP",
        "userid": "VARCHAR",
        "experimentphase": "VARCHAR",
        "sessionperformancescore": "DOUBLE",
        "engagementlevel": "DOUBLE",
        "randomizationseed": "INTEGER",
    }
    applied: list[str] = []
    for col, dtype in required_types.items():
        if col not in have:
            sql = f"ALTER TABLE {TABLE_NAME} ADD COLUMN {col} {dtype}"
            conn.execute(sql)
            applied.append(sql)
    return applied


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def generate_rows() -> list[tuple]:
    """Generate 60 rows (15 per phase) with sequential daily timestamps.

    Returns a list of tuples matching the table column order:
    (timestamp, userId, experimentPhase, sessionPerformanceScore, engagementLevel, randomizationSeed)
    """
    rng = random.Random(RANDOM_SEED)
    rows: list[tuple] = []
    day_index = 0
    for phase_name, mean_score, sd in PHASES:
        for _ in range(N_PER_PHASE):
            ts = START_DATE + timedelta(days=day_index)
            # Performance score with Gaussian noise
            score = clamp(rng.gauss(mean_score, sd), 0.0, 100.0)

            # Engagement roughly correlated with performance, kept between 0 and 1
            base_eng = 0.6 + 0.002 * (score - 70.0)  # around 0.6 at 70
            eng_noise = rng.gauss(0.0, 0.06)
            engagement = clamp(base_eng + eng_noise, 0.0, 1.0)

            rows.append(
                (
                    ts,
                    TEST_USER_ID,
                    phase_name,
                    float(round(score, 3)),
                    float(round(engagement, 4)),
                    RANDOM_SEED,
                )
            )
            day_index += 1
    return rows


def delete_existing_for_user(conn) -> int:
    res = conn.execute(
        f"DELETE FROM {TABLE_NAME} WHERE userId = $1",
        [TEST_USER_ID],
    )
    # DuckDB execute() returns the connection; get affected rows via changes() pragma
    # Using changes() is SQLite-specific; DuckDB exposes it via SELECT changes();
    try:
        n = conn.execute("SELECT changes()::INTEGER").fetchone()[0]
    except Exception:
        n = 0
    return int(n)


def introspect_table(conn):
    """Return {lower_col_name: (type_str_upper, notnull_bool, pk_bool)}"""
    info = {}
    for cid, name, dtype, notnull, dflt, pk in conn.execute(
        f"PRAGMA table_info('{TABLE_NAME}')"
    ).fetchall():
        info[name.lower()] = (str(dtype).upper(), bool(notnull), bool(pk))
    return info


def insert_rows(conn, rows: list[tuple]) -> None:
    info = introspect_table(conn)

    # Decide which columns to insert based on existing schema and NOT NULLs.
    must_cols = [
        "timestamp",
        "userid",
        "experimentphase",
        "sessionperformancescore",
        "engagementlevel",
        "randomizationseed",
    ]
    optional_required = []
    for cand in ("id", "eventtype", "eventdata"):
        if cand in info and info[cand][1]:  # not null
            optional_required.append(cand)

    cols = optional_required + must_cols

    # Build placeholder list with $1..$N
    placeholders = [f"${i}" for i in range(1, len(cols) + 1)]
    sql = (
        f"INSERT INTO {TABLE_NAME} (" + ", ".join(cols) + ") VALUES (" + ", ".join(placeholders) + ")"
    )

    import json
    from uuid import uuid5, NAMESPACE_URL

    # Prepare type-aware row expansion
    sps_type = info.get("sessionperformancescore", ("DOUBLE", False, False))[0]
    eng_type = info.get("engagementlevel", ("DOUBLE", False, False))[0]

    day_index = 0
    for (ts, user_id, phase, score_f, eng_f, seed) in rows:
        # Conform to existing column types where needed
        score_val = int(round(score_f)) if sps_type.startswith("INT") else float(score_f)
        eng_val = (
            f"{eng_f:.4f}" if eng_type in {"VARCHAR", "STRING", "TEXT"} else float(eng_f)
        )

        params = []
        # Optional required columns first (id, eventtype, eventdata)
        for c in optional_required:
            if c == "id":
                # Deterministic but unique-ish ID from timestamp + user + phase
                uid = str(
                    uuid5(NAMESPACE_URL, f"abab:{user_id}:{phase}:{ts.isoformat()}:{day_index}")
                )
                params.append(uid)
            elif c == "eventtype":
                params.append("behavioral_session")
            elif c == "eventdata":
                payload = {
                    "source": "synthetic_abab",
                    "design": "ABAB",
                    "protocol": "abab_protocol_001",
                }
                params.append(json.dumps(payload))

        # Then the canonical columns
        params.extend([ts, user_id, phase, score_val, eng_val, seed])

        conn.execute(sql, params)


def summarize(conn) -> list[tuple]:
    return conn.execute(
        f"""
        SELECT
          experimentPhase,
          COUNT(*)                              AS n,
          AVG(sessionPerformanceScore)          AS mean_score,
          STDDEV_SAMP(sessionPerformanceScore)  AS sd_score,
          MIN(timestamp)                        AS first_ts,
          MAX(timestamp)                        AS last_ts
        FROM {TABLE_NAME}
        WHERE userId = $1
        GROUP BY 1
        ORDER BY 1
        """,
        [TEST_USER_ID],
    ).fetchall()


def main() -> None:
    ensure_db_dir_exists()
    conn = connect_db()
    try:
        ensure_table(conn)
        try:
            verify_schema(conn)
        except RuntimeError as e:
            applied = migrate_schema_if_needed(conn)
            if applied:
                print("Applied schema migrations:")
                for s in applied:
                    print("  -", s)
            # Re-verify after migration
            verify_schema(conn)
        removed = delete_existing_for_user(conn)
        rows = generate_rows()
        insert_rows(conn, rows)

        total = conn.execute(
            f"SELECT COUNT(*) FROM {TABLE_NAME} WHERE userId = $1",
            [TEST_USER_ID],
        ).fetchone()[0]

        per_phase = conn.execute(
            f"SELECT experimentPhase, COUNT(*) FROM {TABLE_NAME} WHERE userId=$1 GROUP BY 1 ORDER BY 1",
            [TEST_USER_ID],
        ).fetchall()

        # Basic verification
        expected_phases = {p for p, *_ in PHASES}
        got_phases = {p for p, _ in per_phase}
        ok_counts = all(c == N_PER_PHASE for _, c in per_phase) and len(per_phase) == 4
        ok_phases = got_phases == expected_phases

        stats = summarize(conn)

        print("=== ABAB Synthetic Data Generation ===")
        print(f"Database: {DB_RELATIVE}")
        print(f"Table: {TABLE_NAME}")
        print(f"User: {TEST_USER_ID}")
        print(f"Replaced prior rows for user: {removed}")
        print(f"Inserted rows: {len(rows)}")
        print(f"Current total rows for user: {total}")
        print("\nPer-phase counts:")
        for phase, cnt in per_phase:
            print(f"  - {phase}: {cnt}")

        print("\nSummary (means by phase):")
        for phase, n, mean_score, sd_score, first_ts, last_ts in stats:
            print(
                f"  - {phase}: n={n}, mean={mean_score:.2f}, sd={sd_score:.2f}, "
                f"range=[{first_ts.date()} … {last_ts.date()}]"
            )

        assert ok_counts and ok_phases, "Phase counts or names mismatch"
        print("\nVerification: OK — data can be queried and matches expected 4×15 design.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
