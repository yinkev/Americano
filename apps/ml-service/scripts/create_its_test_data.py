#!/usr/bin/env python3
"""
Create synthetic test data for ITS (Interrupted Time Series) endpoint testing.

Generates behavioral events for a test user with pre/post intervention periods.
"""

import duckdb
from datetime import datetime, timedelta
import random
from pathlib import Path


def create_its_test_data():
    """Generate synthetic behavioral events for ITS testing."""

    # Configuration
    user_id = "test-its-user-001"
    intervention_date = datetime(2025, 10, 1)
    db_path = Path("/Users/kyin/Projects/Americano/apps/data/behavioral_events.duckdb")

    # Ensure data directory exists
    db_path.parent.mkdir(parents=True, exist_ok=True)

    # Connect to DuckDB
    print(f"Connecting to DuckDB at: {db_path}")
    conn = duckdb.connect(str(db_path))

    # Create schema and table if not exists
    print("Creating schema and table...")
    conn.execute("""
        CREATE SCHEMA IF NOT EXISTS research;
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS research.behavioral_events (
            userId VARCHAR,
            eventType VARCHAR,
            timestamp TIMESTAMP,
            sessionPerformanceScore DOUBLE,
            intervention_active BOOLEAN,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Clear existing test data for this user
    conn.execute("""
        DELETE FROM research.behavioral_events
        WHERE userId = ?;
    """, [user_id])
    print(f"Cleared existing data for user: {user_id}")

    # Generate pre-intervention data (15 sessions, ~70 mean score)
    print("Generating pre-intervention data...")
    pre_events = []
    for i in range(15):
        session_timestamp = intervention_date - timedelta(days=30-i*2)  # Every 2 days
        # Score around 70 with some variance
        score = max(60, min(90, random.gauss(70, 5)))
        pre_events.append({
            'userId': user_id,
            'eventType': 'session_completed',
            'timestamp': session_timestamp,
            'sessionPerformanceScore': round(score, 2),
            'intervention_active': False
        })

    # Generate post-intervention data (15 sessions, ~80 mean score - showing improvement)
    print("Generating post-intervention data...")
    post_events = []
    for i in range(15):
        session_timestamp = intervention_date + timedelta(days=i*2)  # Every 2 days
        # Score around 80 with some variance (showing improvement)
        score = max(60, min(90, random.gauss(80, 5)))
        post_events.append({
            'userId': user_id,
            'eventType': 'session_completed',
            'timestamp': session_timestamp,
            'sessionPerformanceScore': round(score, 2),
            'intervention_active': True
        })

    all_events = pre_events + post_events

    # Insert data
    print(f"Inserting {len(all_events)} behavioral events...")
    conn.executemany("""
        INSERT INTO research.behavioral_events
        (userId, eventType, timestamp, sessionPerformanceScore, intervention_active)
        VALUES (?, ?, ?, ?, ?);
    """, [(e['userId'], e['eventType'], e['timestamp'], e['sessionPerformanceScore'], e['intervention_active'])
          for e in all_events])

    # Verify insertion
    result = conn.execute("""
        SELECT
            COUNT(*) as total_events,
            SUM(CASE WHEN intervention_active = FALSE THEN 1 ELSE 0 END) as pre_intervention,
            SUM(CASE WHEN intervention_active = TRUE THEN 1 ELSE 0 END) as post_intervention,
            AVG(CASE WHEN intervention_active = FALSE THEN sessionPerformanceScore END) as pre_avg_score,
            AVG(CASE WHEN intervention_active = TRUE THEN sessionPerformanceScore END) as post_avg_score
        FROM research.behavioral_events
        WHERE userId = ?;
    """, [user_id]).fetchone()

    print("\n" + "="*60)
    print("✅ Test Data Created Successfully!")
    print("="*60)
    print(f"User ID: {user_id}")
    print(f"Intervention Date: {intervention_date.date()}")
    print(f"Total Events: {result[0]}")
    print(f"Pre-intervention Events: {result[1]} (avg score: {result[3]:.2f})")
    print(f"Post-intervention Events: {result[2]} (avg score: {result[4]:.2f})")
    print(f"Score Improvement: {result[4] - result[3]:.2f} points")
    print("="*60)

    # Show sample data
    print("\nSample Data (first 5 pre, last 5 post):")
    sample = conn.execute("""
        (SELECT * FROM research.behavioral_events
         WHERE userId = ? AND intervention_active = FALSE
         ORDER BY timestamp LIMIT 5)
        UNION ALL
        (SELECT * FROM research.behavioral_events
         WHERE userId = ? AND intervention_active = TRUE
         ORDER BY timestamp DESC LIMIT 5)
        ORDER BY timestamp;
    """, [user_id, user_id]).fetchall()

    print("\nTimestamp           | Score | Intervention")
    print("-" * 50)
    for row in sample:
        print(f"{row[2]} | {row[3]:5.2f} | {'Yes' if row[4] else 'No'}")

    conn.close()
    print(f"\nDatabase location: {db_path}")
    print("\n🎯 Ready to test ITS endpoint with this data!")


if __name__ == "__main__":
    create_its_test_data()
