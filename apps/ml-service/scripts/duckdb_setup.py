#!/usr/bin/env python3
"""
DuckDB analytics database setup and PostgreSQL sync.

Usage:
    python scripts/duckdb_setup.py init       # Initialize DuckDB
    python scripts/duckdb_setup.py sync       # Sync from PostgreSQL
    python scripts/duckdb_setup.py query      # Run example queries

ADR-006: Research Analytics Infrastructure - Task 4.1-4.3
Timestamp: 2025-10-27T07:20:00-07:00
"""

import argparse
import os
import sys
from pathlib import Path
from datetime import datetime

import duckdb
import pandas as pd
from sqlalchemy import create_engine


# Paths
REPO_ROOT = Path(__file__).parent.parent.parent.parent
DUCKDB_PATH = REPO_ROOT / "data" / "americano_analytics.duckdb"
POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://kyin@localhost:5432/americano")


def init_duckdb():
    """
    Initialize DuckDB analytics database.

    Creates database file and installs necessary extensions.
    """
    print(f"📦 Initializing DuckDB at {DUCKDB_PATH}...")

    # Ensure data directory exists
    DUCKDB_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Connect to DuckDB
    conn = duckdb.connect(str(DUCKDB_PATH))

    # Install extensions
    print("📦 Installing DuckDB extensions...")
    conn.execute("INSTALL parquet")
    conn.execute("LOAD parquet")
    conn.execute("INSTALL httpfs")
    conn.execute("LOAD httpfs")

    print(f"✅ DuckDB initialized at {DUCKDB_PATH}")
    print(f"   Size: {DUCKDB_PATH.stat().st_size / 1024:.2f} KB")

    conn.close()


def sync_from_postgres():
    """
    Sync operational data from PostgreSQL to DuckDB analytics database.

    Syncs tables:
    - BehavioralEvent
    - ExperimentProtocol
    - PhaseAssignment
    - AnalysisRun
    """
    print("🔄 Syncing data from PostgreSQL to DuckDB...")

    # Connect to PostgreSQL
    pg_engine = create_engine(POSTGRES_URL)

    # Connect to DuckDB
    duck_conn = duckdb.connect(str(DUCKDB_PATH))

    # Tables to sync
    tables = [
        "behavioral_events",
        "experiment_protocols",
        "phase_assignments",
        "analysis_runs",
    ]

    total_rows = 0

    for table in tables:
        print(f"\n📊 Syncing {table}...")

        # Read from PostgreSQL
        query = f'SELECT * FROM "{table}"'
        try:
            df = pd.read_sql(query, pg_engine)
            row_count = len(df)

            if row_count == 0:
                print(f"   ⚠️  No data found in {table}")
                continue

            # Write to DuckDB
            duck_conn.execute(f"DROP TABLE IF EXISTS {table}")
            duck_conn.execute(
                f"CREATE TABLE {table} AS SELECT * FROM df"
            )

            # Create indexes for common queries
            if table == "behavioral_events":
                print(f"   🔍 Creating indexes...")
                duck_conn.execute(
                    f"CREATE INDEX idx_{table}_userId ON {table}(userId)"
                )
                duck_conn.execute(
                    f"CREATE INDEX idx_{table}_timestamp ON {table}(timestamp)"
                )
                duck_conn.execute(
                    f"CREATE INDEX idx_{table}_experimentPhase ON {table}(experimentPhase)"
                )

            print(f"   ✅ Synced {row_count:,} rows")
            total_rows += row_count

        except Exception as e:
            print(f"   ❌ Error syncing {table}: {e}")

    print(f"\n✅ Sync complete! Total rows: {total_rows:,}")

    duck_conn.close()


def run_example_queries():
    """
    Run example DuckDB queries to demonstrate analytics speed.

    Compares query performance vs PostgreSQL.
    """
    print("📊 Running example DuckDB queries...\n")

    # Connect to DuckDB
    duck_conn = duckdb.connect(str(DUCKDB_PATH))

    # Connect to PostgreSQL for comparison
    pg_engine = create_engine(POSTGRES_URL)

    # === Query 1: Total event count ===
    print("🔍 Query 1: Total BehavioralEvent count")
    start = datetime.now()
    result = duck_conn.execute(
        "SELECT COUNT(*) as total FROM behavioral_events"
    ).fetchone()
    duckdb_time = (datetime.now() - start).total_seconds() * 1000

    if result[0] > 0:
        print(f"   DuckDB: {result[0]:,} events ({duckdb_time:.2f}ms)")

        # Compare with PostgreSQL
        start = datetime.now()
        pg_result = pd.read_sql(
            'SELECT COUNT(*) as total FROM "behavioral_events"', pg_engine
        )
        pg_time = (datetime.now() - start).total_seconds() * 1000

        speedup = pg_time / duckdb_time if duckdb_time > 0 else 0
        print(f"   PostgreSQL: {pg_result['total'][0]:,} events ({pg_time:.2f}ms)")
        print(f"   🚀 Speedup: {speedup:.1f}x faster")
    else:
        print(f"   ⚠️  No data in behavioral_events table")

    # === Query 2: Event type distribution ===
    print("\n🔍 Query 2: Event type distribution")
    start = datetime.now()
    df = duck_conn.execute(
        """
        SELECT eventType, COUNT(*) as count
        FROM behavioral_events
        GROUP BY eventType
        ORDER BY count DESC
        """
    ).fetchdf()
    duckdb_time = (datetime.now() - start).total_seconds() * 1000

    if len(df) > 0:
        print(f"   DuckDB: {len(df)} event types ({duckdb_time:.2f}ms)")
        for _, row in df.head(5).iterrows():
            print(f"      {row['eventType']}: {row['count']:,}")
    else:
        print(f"   ⚠️  No data")

    # === Query 3: Experiment phase distribution ===
    print("\n🔍 Query 3: Experiment phase distribution")
    start = datetime.now()
    df = duck_conn.execute(
        """
        SELECT experimentPhase, COUNT(*) as count
        FROM behavioral_events
        WHERE experimentPhase IS NOT NULL
        GROUP BY experimentPhase
        ORDER BY count DESC
        """
    ).fetchdf()
    duckdb_time = (datetime.now() - start).total_seconds() * 1000

    if len(df) > 0:
        print(f"   DuckDB: {len(df)} phases ({duckdb_time:.2f}ms)")
        for _, row in df.iterrows():
            print(f"      {row['experimentPhase']}: {row['count']:,}")
    else:
        print(f"   ℹ️  No experiment phases found (expected on fresh install)")

    # === Query 4: Time-series aggregation ===
    print("\n🔍 Query 4: Daily event counts (last 30 days)")
    start = datetime.now()
    df = duck_conn.execute(
        """
        SELECT
            DATE_TRUNC('day', timestamp) as date,
            COUNT(*) as events
        FROM behavioral_events
        WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY date
        ORDER BY date DESC
        LIMIT 10
        """
    ).fetchdf()
    duckdb_time = (datetime.now() - start).total_seconds() * 1000

    print(f"   DuckDB: {len(df)} days ({duckdb_time:.2f}ms)")
    if len(df) > 0:
        for _, row in df.iterrows():
            print(f"      {row['date'].date()}: {row['events']:,} events")
    else:
        print(f"   ℹ️  No recent events")

    print(f"\n✅ Example queries complete!")
    print(f"💡 DuckDB is 10-100x faster than PostgreSQL for analytics")

    duck_conn.close()


def main():
    """Parse arguments and run commands."""
    parser = argparse.ArgumentParser(
        description="DuckDB analytics database management"
    )
    parser.add_argument(
        "command",
        choices=["init", "sync", "query"],
        help="Command to run",
    )

    args = parser.parse_args()

    try:
        if args.command == "init":
            init_duckdb()
        elif args.command == "sync":
            if not DUCKDB_PATH.exists():
                print("⚠️  DuckDB not initialized. Running init first...")
                init_duckdb()
            sync_from_postgres()
        elif args.command == "query":
            if not DUCKDB_PATH.exists():
                print("❌ DuckDB not initialized. Run 'python scripts/duckdb_setup.py init' first")
                sys.exit(1)
            run_example_queries()
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
