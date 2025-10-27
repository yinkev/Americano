#!/usr/bin/env python3
"""
Export BehavioralEvent table to Parquet for DVC versioning.

Enhanced with:
- Pandera schema validation (fail-fast data quality)
- DuckDB sync capability (automatic analytics database update)
- Comprehensive error handling and logging
- Support for both SQLAlchemy and Prisma Python client

Usage:
    python scripts/export_behavioral_events.py [--days 90] [--user-id USER_ID]
    python scripts/export_behavioral_events.py --sync-duckdb  # Sync to DuckDB after export

ADR-006: Research Analytics Infrastructure
"""

import argparse
import logging
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import duckdb
import pandas as pd
from sqlalchemy import create_engine, text

# Import Pandera validation from app.schemas
sys.path.insert(0, str(Path(__file__).parent.parent))
from app.schemas import validate_behavioral_events, validate_with_report


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://kyin@localhost:5432/americano"
)

# Output directory (relative to repo root)
REPO_ROOT = Path(__file__).parent.parent.parent.parent
DATA_DIR = REPO_ROOT / "data" / "raw"
DUCKDB_PATH = Path(os.getenv("DUCKDB_DB_PATH", "./data/duckdb/analytics.duckdb"))


def export_behavioral_events(
    days: int = 90,
    user_id: Optional[str] = None,
    validate: bool = True,
    strict_validation: bool = True
) -> tuple[pd.DataFrame, Path]:
    """
    Export BehavioralEvent table to Parquet file with validation.

    Args:
        days: Number of days to look back (default: 90)
        user_id: Optional user ID to filter by (for single-user export)
        validate: Whether to run Pandera validation (default: True)
        strict_validation: If True, fail on validation errors (default: True)

    Returns:
        Tuple of (DataFrame, output_path)

    Raises:
        ValueError: If database connection fails
        Exception: If strict_validation=True and validation fails
    """
    logger.info(f"📊 Exporting BehavioralEvent data (last {days} days)...")
    logger.info(f"🔗 Database: {DATABASE_URL.split('@')[1]}")  # Hide credentials

    # Create database connection
    try:
        engine = create_engine(DATABASE_URL)
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        raise ValueError(f"Cannot connect to database: {e}")

    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    # Build query - select from BehavioralEvent table (Prisma naming)
    query = """
        SELECT
            id,
            "userId",
            "eventType",
            "eventData",
            timestamp,
            "completionQuality",
            "contentType",
            "dayOfWeek",
            "difficultyLevel",
            "engagementLevel",
            "sessionPerformanceScore",
            "timeOfDay",
            "experimentPhase",
            "randomizationSeed",
            "contextMetadataId"
        FROM "BehavioralEvent"
        WHERE timestamp >= :start_date
          AND timestamp <= :end_date
    """

    # Add user filter if provided
    if user_id:
        query += ' AND "userId" = :user_id'

    # Execute query and load into DataFrame
    params = {"start_date": start_date, "end_date": end_date}
    if user_id:
        params["user_id"] = user_id

    logger.info(f"📅 Date range: {start_date.date()} to {end_date.date()}")
    if user_id:
        logger.info(f"👤 User filter: {user_id}")

    try:
        df = pd.read_sql(text(query), engine, params=params)
    except Exception as e:
        logger.error(f"❌ Query execution failed: {e}")
        # Try fallback to lowercase table name (in case of migration differences)
        try:
            query_fallback = query.replace('"BehavioralEvent"', 'behavioral_events')
            logger.info("🔄 Attempting fallback to lowercase table name...")
            df = pd.read_sql(text(query_fallback), engine, params=params)
        except Exception as e2:
            logger.error(f"❌ Fallback query also failed: {e2}")
            raise

    row_count = len(df)
    logger.info(f"✅ Loaded {row_count:,} rows from database")

    if row_count == 0:
        logger.warning("⚠️  No data found for specified date range")
        # Still create empty parquet file for pipeline consistency
        df = pd.DataFrame(columns=[
            "id", "userId", "eventType", "eventData", "timestamp",
            "completionQuality", "contentType", "dayOfWeek", "difficultyLevel",
            "engagementLevel", "sessionPerformanceScore", "timeOfDay",
            "experimentPhase", "randomizationSeed", "contextMetadataId"
        ])

    # ==================== VALIDATION ====================
    if validate and row_count > 0:
        logger.info("🔍 Running Pandera validation...")
        try:
            if strict_validation:
                df = validate_behavioral_events(df, strict=True, raise_on_error=True)
                logger.info("✅ Strict validation passed")
            else:
                df, report = validate_with_report(df)
                logger.info(f"✅ Validation complete: {report['valid_rows']}/{report['total_rows']} valid rows")
                if report['errors']:
                    logger.warning(f"⚠️  Found {len(report['errors'])} validation errors")
                    for error in report['errors'][:5]:  # Show first 5 errors
                        logger.warning(f"   - {error['column']}: {error['check']}")
        except Exception as e:
            logger.error(f"❌ Validation failed: {e}")
            if strict_validation:
                raise
            else:
                logger.warning("⚠️  Continuing with unvalidated data (strict_validation=False)")

    # Generate filename with timestamp
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"behavioral_events_{timestamp_str}.parquet"
    output_path = DATA_DIR / filename

    # Ensure output directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # ==================== WRITE TO PARQUET ====================
    logger.info(f"💾 Writing to {output_path}...")
    try:
        df.to_parquet(output_path, engine="pyarrow", compression="snappy", index=False)
        file_size_mb = output_path.stat().st_size / (1024 * 1024)
        logger.info(f"✅ Parquet file created: {file_size_mb:.2f} MB")
    except Exception as e:
        logger.error(f"❌ Failed to write Parquet file: {e}")
        raise

    # Create/update symlink to latest
    symlink_path = DATA_DIR / "behavioral_events_latest.parquet"
    try:
        if symlink_path.exists() or symlink_path.is_symlink():
            symlink_path.unlink()
        # Create relative symlink
        symlink_path.symlink_to(filename)
        logger.info(f"🔗 Symlink updated: behavioral_events_latest.parquet → {filename}")
    except Exception as e:
        logger.warning(f"⚠️  Failed to create symlink: {e}")

    # ==================== SUMMARY STATISTICS ====================
    if row_count > 0:
        logger.info("\n📈 Summary Statistics:")
        logger.info(f"   Total rows: {row_count:,}")
        logger.info(f"   Unique users: {df['userId'].nunique()}")
        logger.info(f"   Event types: {df['eventType'].nunique()}")
        logger.info(f"   Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")

        # Experiment phase distribution (if exists)
        if df["experimentPhase"].notna().any():
            logger.info("\n🔬 Experiment Phase Distribution:")
            phase_counts = df["experimentPhase"].value_counts()
            for phase, count in phase_counts.items():
                logger.info(f"   {phase}: {count:,} events")

    logger.info("\n✅ Export complete!")
    logger.info("\n📝 Next steps:")
    logger.info(f"   1. Track with DVC: dvc add {output_path}")
    logger.info(f"   2. Commit .dvc file: git add {output_path}.dvc data/raw/.gitignore")
    logger.info(f"   3. Sync to DuckDB: python scripts/export_behavioral_events.py --sync-duckdb")

    return df, output_path


def sync_to_duckdb(parquet_path: Path) -> None:
    """
    Sync Parquet file to DuckDB analytics database.

    Args:
        parquet_path: Path to Parquet file to sync

    Raises:
        FileNotFoundError: If Parquet file doesn't exist
        Exception: If DuckDB sync fails
    """
    if not parquet_path.exists():
        raise FileNotFoundError(f"Parquet file not found: {parquet_path}")

    logger.info(f"🦆 Syncing to DuckDB: {DUCKDB_PATH}")

    # Ensure DuckDB directory exists
    DUCKDB_PATH.parent.mkdir(parents=True, exist_ok=True)

    try:
        # Connect to DuckDB
        con = duckdb.connect(str(DUCKDB_PATH))

        # Create research schema (avoiding "analytics" due to DuckDB built-in conflicts)
        con.execute("CREATE SCHEMA IF NOT EXISTS research")
        logger.info("✅ Research schema ready")

        # Create or replace table from Parquet (ordered by timestamp for performance)
        # Note: We don't order empty tables to avoid errors
        parquet_df = con.execute("SELECT COUNT(*) FROM read_parquet(?)", [str(parquet_path)]).fetchone()[0]

        if parquet_df > 0:
            con.execute("""
                CREATE OR REPLACE TABLE research.behavioral_events AS
                SELECT * FROM read_parquet(?)
                ORDER BY timestamp
            """, [str(parquet_path)])
        else:
            # For empty tables, don't use ORDER BY
            con.execute("""
                CREATE OR REPLACE TABLE research.behavioral_events AS
                SELECT * FROM read_parquet(?)
            """, [str(parquet_path)])

        # Get row count
        row_count = con.execute("SELECT COUNT(*) FROM research.behavioral_events").fetchone()[0]
        logger.info(f"✅ Synced {row_count:,} rows to DuckDB")

        # Create indexes for common query patterns (only if we have data)
        if row_count > 0:
            logger.info("📊 Creating performance indexes...")
            try:
                con.execute("""
                    CREATE INDEX IF NOT EXISTS idx_events_user_time
                    ON research.behavioral_events(userId, timestamp)
                """)
                con.execute("""
                    CREATE INDEX IF NOT EXISTS idx_events_type
                    ON research.behavioral_events(eventType)
                """)
                con.execute("""
                    CREATE INDEX IF NOT EXISTS idx_events_phase
                    ON research.behavioral_events(experimentPhase)
                """)
                logger.info("✅ Indexes created")
            except Exception as e:
                logger.warning(f"⚠️  Index creation failed (non-fatal): {e}")

        # Quick validation query
        if row_count > 0:
            summary = con.execute("""
                SELECT
                    COUNT(*) as total_events,
                    COUNT(DISTINCT userId) as unique_users,
                    COUNT(DISTINCT eventType) as event_types,
                    MIN(timestamp) as earliest,
                    MAX(timestamp) as latest
                FROM research.behavioral_events
            """).fetchdf()

            logger.info("\n📊 DuckDB Summary:")
            logger.info(f"   Total events: {summary['total_events'].iloc[0]:,}")
            logger.info(f"   Unique users: {summary['unique_users'].iloc[0]}")
            logger.info(f"   Event types: {summary['event_types'].iloc[0]}")
            logger.info(f"   Date range: {summary['earliest'].iloc[0]} to {summary['latest'].iloc[0]}")
        else:
            logger.info("\n📊 DuckDB Summary: Empty table (0 rows)")

        con.close()
        logger.info(f"\n✅ DuckDB sync complete: {DUCKDB_PATH}")

    except Exception as e:
        logger.error(f"❌ DuckDB sync failed: {e}")
        raise


def main():
    """Parse arguments and run export with optional DuckDB sync."""
    parser = argparse.ArgumentParser(
        description="Export BehavioralEvent table to Parquet with DuckDB sync",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Export last 90 days (default)
  python scripts/export_behavioral_events.py

  # Export last 30 days with DuckDB sync
  python scripts/export_behavioral_events.py --days 30 --sync-duckdb

  # Export for specific user
  python scripts/export_behavioral_events.py --user-id cm123abc --days 180

  # Skip validation (for debugging)
  python scripts/export_behavioral_events.py --no-validate
        """
    )
    parser.add_argument(
        "--days",
        type=int,
        default=90,
        help="Number of days to look back (default: 90)",
    )
    parser.add_argument(
        "--user-id",
        type=str,
        help="Filter by specific user ID (optional)"
    )
    parser.add_argument(
        "--sync-duckdb",
        action="store_true",
        help="Sync Parquet to DuckDB after export"
    )
    parser.add_argument(
        "--no-validate",
        action="store_true",
        help="Skip Pandera validation (for debugging)"
    )
    parser.add_argument(
        "--non-strict",
        action="store_true",
        help="Continue on validation errors (default: fail-fast)"
    )

    args = parser.parse_args()

    try:
        # Run export
        df, output_path = export_behavioral_events(
            days=args.days,
            user_id=args.user_id,
            validate=not args.no_validate,
            strict_validation=not args.non_strict
        )

        # Optionally sync to DuckDB
        if args.sync_duckdb:
            sync_to_duckdb(output_path)

    except KeyboardInterrupt:
        logger.warning("\n⚠️  Export interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"❌ Export failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
