# Pandera Schema Implementation Guide

**ADR-006: Research Analytics Infrastructure - Task 2.1**
**Date:** 2025-10-26
**Author:** Claude Code
**Status:** Implementation Guide

## Overview

This guide provides concrete patterns for implementing Pandera schemas for data validation in the ML service, with a focus on the `BehavioralEvent` table. It answers all 6 questions from your implementation planning.

## Table of Contents

1. [Schema Organization](#1-schema-organization)
2. [Column Validation Rules](#2-column-validation-rules)
3. [Enum Synchronization](#3-enum-synchronization)
4. [Cross-Column Validation](#4-cross-column-validation)
5. [Error Handling Strategies](#5-error-handling-strategies)
6. [JSON Field Validation](#6-json-field-validation)
7. [Usage Examples](#7-usage-examples)

---

## 1. Schema Organization

**Recommendation:** One file per table with centralized index

### Directory Structure

```
apps/ml-service/
├── app/
│   └── schemas/
│       ├── __init__.py              # Exports all schemas
│       ├── behavioral_events.py     # BehavioralEvent schema
│       ├── struggle_predictions.py  # StrugglePrediction schema
│       └── enums.py                 # Shared enum definitions
└── tests/
    └── schemas/
        └── test_behavioral_events.py
```

### Rationale

- **One file per table**: Keeps schemas focused and maintainable
- **Separate enums file**: Single source of truth for Prisma enum values
- **Centralized index**: Easy imports (`from app.schemas import BehavioralEventSchema`)

---

## 2. Column Validation Rules for BehavioralEvent

### Complete Schema with All Validation Rules

```python
# apps/ml-service/app/schemas/behavioral_events.py

"""
Pandera schema for BehavioralEvent table validation.

Validates data exported from behavioral_events table before DVC versioning.
Implements fail-fast validation to catch data quality issues early.

ADR-006: Research Analytics Infrastructure
"""

import pandera as pa
from pandera.typing import Series
import pandas as pd
from datetime import datetime
from typing import Optional

from .enums import EventType, CompletionQuality, EngagementLevel


class BehavioralEventSchema(pa.DataFrameModel):
    """
    Schema for behavioral_events table.

    Corresponds to Prisma model:
    ```prisma
    model BehavioralEvent {
      id                      String             @id @default(cuid())
      userId                  String
      eventType               EventType
      eventData               Json
      timestamp               DateTime           @default(now())
      completionQuality       CompletionQuality?
      contentType             String?
      dayOfWeek               Int?
      difficultyLevel         String?
      engagementLevel         EngagementLevel?
      sessionPerformanceScore Int?
      timeOfDay               Int?
      experimentPhase         String?
      randomizationSeed       Int?
      contextMetadataId       String?
    }
    ```
    """

    # ==================== REQUIRED FIELDS ====================

    id: Series[str] = pa.Field(
        str_matches=r"^c[a-z0-9]{24}$",  # CUID format: c + 24 alphanumeric
        nullable=False,
        coerce=True,
        description="Primary key in CUID format"
    )

    userId: Series[str] = pa.Field(
        str_matches=r"^c[a-z0-9]{24}$",
        nullable=False,
        coerce=True,
        description="Foreign key to users table (CUID format)"
    )

    eventType: Series[str] = pa.Field(
        isin=EventType.values(),  # Validates against Prisma enum
        nullable=False,
        coerce=True,
        description="Type of behavioral event (from Prisma EventType enum)"
    )

    eventData: Series[object] = pa.Field(
        nullable=False,
        description="JSON event data (dict or JSON string)"
    )

    timestamp: Series[pd.Timestamp] = pa.Field(
        nullable=False,
        coerce=True,
        description="When event occurred (ISO 8601 timestamp)"
    )

    # ==================== OPTIONAL FIELDS ====================

    completionQuality: Optional[Series[str]] = pa.Field(
        isin=CompletionQuality.values(),
        nullable=True,
        coerce=True,
        description="Quality of completion (RUSHED, NORMAL, THOROUGH)"
    )

    contentType: Optional[Series[str]] = pa.Field(
        nullable=True,
        description="Type of content (e.g., 'flashcard', 'clinical_scenario')"
    )

    dayOfWeek: Optional[Series[int]] = pa.Field(
        ge=0,
        le=6,
        nullable=True,
        description="Day of week (0=Monday, 6=Sunday)"
    )

    difficultyLevel: Optional[Series[str]] = pa.Field(
        nullable=True,
        description="Difficulty level (free text or 'BASIC', 'INTERMEDIATE', 'ADVANCED')"
    )

    engagementLevel: Optional[Series[str]] = pa.Field(
        isin=EngagementLevel.values(),
        nullable=True,
        coerce=True,
        description="Engagement level (LOW, MEDIUM, HIGH)"
    )

    sessionPerformanceScore: Optional[Series[int]] = pa.Field(
        ge=0,
        le=100,
        nullable=True,
        description="Performance score 0-100"
    )

    timeOfDay: Optional[Series[int]] = pa.Field(
        ge=0,
        le=23,
        nullable=True,
        description="Hour of day (0-23)"
    )

    # ==================== EXPERIMENT FIELDS (ADR-006) ====================

    experimentPhase: Optional[Series[str]] = pa.Field(
        nullable=True,
        description="Experiment phase identifier (e.g., 'baseline', 'intervention_A')"
    )

    randomizationSeed: Optional[Series[int]] = pa.Field(
        nullable=True,
        description="Randomization seed for reproducibility"
    )

    contextMetadataId: Optional[Series[str]] = pa.Field(
        nullable=True,
        description="Foreign key to context metadata table"
    )

    # ==================== CUSTOM VALIDATION CHECKS ====================

    @pa.check("timestamp", name="timestamp_not_future")
    def timestamp_not_in_future(cls, timestamp: Series[pd.Timestamp]) -> Series[bool]:
        """Timestamps should not be in the future (data integrity check)."""
        return timestamp <= pd.Timestamp.now()

    @pa.check("timestamp", name="timestamp_reasonable")
    def timestamp_reasonable(cls, timestamp: Series[pd.Timestamp]) -> Series[bool]:
        """Timestamps should be within last 5 years (sanity check)."""
        five_years_ago = pd.Timestamp.now() - pd.Timedelta(days=5 * 365)
        return timestamp >= five_years_ago

    class Config:
        """Pandera configuration."""
        strict = "filter"  # Remove columns not in schema
        coerce = True      # Coerce types when possible
        ordered = False    # Column order doesn't matter


# ==================== VALIDATION FUNCTIONS ====================

def validate_behavioral_events(
    df: pd.DataFrame,
    strict: bool = True,
    raise_on_error: bool = True
) -> pd.DataFrame:
    """
    Validate BehavioralEvent DataFrame against schema.

    Args:
        df: DataFrame to validate
        strict: If True, reject entire DataFrame on any error
                If False, log warnings and drop invalid rows
        raise_on_error: If True, raise exception on validation failure
                        If False, return original DataFrame with validation metadata

    Returns:
        Validated DataFrame (or original if validation fails and raise_on_error=False)

    Raises:
        pa.errors.SchemaError: If validation fails and raise_on_error=True

    Example:
        >>> df = pd.read_parquet("data/raw/behavioral_events_latest.parquet")
        >>> validated_df = validate_behavioral_events(df, strict=True)
    """
    try:
        validated = BehavioralEventSchema.validate(
            df,
            lazy=False if strict else True,  # Fail fast in strict mode
        )

        print(f"✅ Validation passed: {len(validated)} rows")
        return validated

    except pa.errors.SchemaError as e:
        if raise_on_error:
            print(f"❌ Validation failed:")
            print(e)
            raise
        else:
            print(f"⚠️  Validation failed (non-strict mode):")
            print(e)
            return df


def validate_with_report(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Validate and return detailed validation report.

    Returns:
        Tuple of (validated_df, report_dict)

    Example:
        >>> df = pd.read_parquet("data/raw/behavioral_events_latest.parquet")
        >>> validated, report = validate_with_report(df)
        >>> print(f"Valid rows: {report['valid_rows']}/{report['total_rows']}")
    """
    report = {
        "total_rows": len(df),
        "valid_rows": 0,
        "invalid_rows": 0,
        "errors": [],
        "warnings": []
    }

    try:
        validated = BehavioralEventSchema.validate(df, lazy=True)
        report["valid_rows"] = len(validated)
        return validated, report

    except pa.errors.SchemaErrors as e:
        # Collect all validation errors
        for failure_case in e.failure_cases.itertuples():
            report["errors"].append({
                "column": failure_case.column,
                "check": failure_case.check,
                "index": failure_case.index,
                "failure_case": failure_case.failure_case
            })

        report["invalid_rows"] = len(e.failure_cases)
        report["valid_rows"] = len(df) - report["invalid_rows"]

        return df, report
```

### Validation Priority Breakdown

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| `id` | String | ✅ Yes | CUID regex `^c[a-z0-9]{24}$` |
| `userId` | String | ✅ Yes | CUID regex |
| `eventType` | Enum | ✅ Yes | Must be in EventType enum |
| `eventData` | JSON | ✅ Yes | Must be dict or JSON string |
| `timestamp` | DateTime | ✅ Yes | Not in future, within 5 years |
| `completionQuality` | Enum | ❌ No | If present, must be in enum |
| `dayOfWeek` | Int | ❌ No | Range 0-6 |
| `timeOfDay` | Int | ❌ No | Range 0-23 |
| `sessionPerformanceScore` | Int | ❌ No | Range 0-100 |
| `engagementLevel` | Enum | ❌ No | If present, must be in enum |

---

## 3. Enum Synchronization

**Problem:** Keep Pandera enums synchronized with Prisma schema
**Solution:** Generate Python enums from Prisma schema

### Enum Definition File

```python
# apps/ml-service/app/schemas/enums.py

"""
Enum definitions synchronized with Prisma schema.

These enums are extracted from prisma/schema.prisma and should be
updated whenever the Prisma schema changes.

IMPORTANT: Run `make sync-enums` after modifying Prisma enums.

ADR-006: Research Analytics Infrastructure
"""

from enum import Enum
from typing import List


class PrismaEnum:
    """Base class for Prisma enum wrappers."""

    @classmethod
    def values(cls) -> List[str]:
        """Return list of enum values for Pandera validation."""
        return [member.value for member in cls]


class EventType(str, Enum, PrismaEnum):
    """
    Corresponds to Prisma enum EventType.

    ```prisma
    enum EventType {
      MISSION_STARTED
      MISSION_COMPLETED
      CARD_REVIEWED
      VALIDATION_COMPLETED
      SESSION_STARTED
      SESSION_ENDED
      LECTURE_UPLOADED
      SEARCH_PERFORMED
      GRAPH_VIEWED
      RECOMMENDATION_VIEWED
      RECOMMENDATION_CLICKED
      RECOMMENDATION_DISMISSED
      RECOMMENDATION_RATED
    }
    ```
    """
    MISSION_STARTED = "MISSION_STARTED"
    MISSION_COMPLETED = "MISSION_COMPLETED"
    CARD_REVIEWED = "CARD_REVIEWED"
    VALIDATION_COMPLETED = "VALIDATION_COMPLETED"
    SESSION_STARTED = "SESSION_STARTED"
    SESSION_ENDED = "SESSION_ENDED"
    LECTURE_UPLOADED = "LECTURE_UPLOADED"
    SEARCH_PERFORMED = "SEARCH_PERFORMED"
    GRAPH_VIEWED = "GRAPH_VIEWED"
    RECOMMENDATION_VIEWED = "RECOMMENDATION_VIEWED"
    RECOMMENDATION_CLICKED = "RECOMMENDATION_CLICKED"
    RECOMMENDATION_DISMISSED = "RECOMMENDATION_DISMISSED"
    RECOMMENDATION_RATED = "RECOMMENDATION_RATED"


class CompletionQuality(str, Enum, PrismaEnum):
    """
    Corresponds to Prisma enum CompletionQuality.

    ```prisma
    enum CompletionQuality {
      RUSHED
      NORMAL
      THOROUGH
    }
    ```
    """
    RUSHED = "RUSHED"
    NORMAL = "NORMAL"
    THOROUGH = "THOROUGH"


class EngagementLevel(str, Enum, PrismaEnum):
    """
    Corresponds to Prisma enum EngagementLevel.

    ```prisma
    enum EngagementLevel {
      LOW
      MEDIUM
      HIGH
    }
    ```
    """
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


# ==================== USAGE EXAMPLES ====================

# For Pandera validation
# isin=EventType.values()  # Returns ["MISSION_STARTED", "MISSION_COMPLETED", ...]

# For Python code
# if event_type == EventType.MISSION_COMPLETED:
#     ...
```

### Enum Synchronization Strategy

**Option 1: Manual Copy (Recommended for MVP)**

```bash
# 1. Update prisma/schema.prisma
# 2. Manually update app/schemas/enums.py
# 3. Run tests to verify
pytest tests/schemas/test_enums.py
```

**Option 2: Automated Generation (Future Enhancement)**

```python
# scripts/sync_prisma_enums.py (Future enhancement)

"""
Generate Python enums from Prisma schema.

Usage:
    python scripts/sync_prisma_enums.py
"""

import re
from pathlib import Path

PRISMA_SCHEMA = Path("prisma/schema.prisma")
ENUM_OUTPUT = Path("app/schemas/enums.py")

def extract_enums(schema_content: str) -> dict:
    """Extract enum definitions from Prisma schema."""
    enum_pattern = r"enum (\w+) \{([^}]+)\}"
    matches = re.findall(enum_pattern, schema_content, re.MULTILINE)

    enums = {}
    for enum_name, enum_body in matches:
        values = [v.strip() for v in enum_body.strip().split("\n") if v.strip()]
        enums[enum_name] = values

    return enums

# ... (implementation details)
```

**Option 3: Use Prisma Client Enums (If Available)**

```python
# If Prisma Python client exposes enums (check documentation)
from prisma.enums import EventType as PrismaEventType

# Convert to Pandera-compatible list
event_type_values = [e.value for e in PrismaEventType]
```

---

## 4. Cross-Column Validation

### Custom Cross-Column Checks

```python
# Add to BehavioralEventSchema class

@pa.dataframe_check(name="experiment_phase_requires_metadata")
def experiment_phase_validation(cls, df: pd.DataFrame) -> Series[bool]:
    """
    If experimentPhase is set, contextMetadataId should also be set.

    Business rule: Experimental events require metadata tracking.
    """
    has_phase = df["experimentPhase"].notna()
    has_metadata = df["contextMetadataId"].notna()

    # If has phase, must have metadata
    # If no phase, metadata is optional
    return ~has_phase | has_metadata


@pa.dataframe_check(name="completion_quality_requires_completion_event")
def completion_quality_validation(cls, df: pd.DataFrame) -> Series[bool]:
    """
    completionQuality should only be set for completion events.

    Business rule: Only MISSION_COMPLETED, SESSION_ENDED, etc. have quality scores.
    """
    completion_events = [
        "MISSION_COMPLETED",
        "SESSION_ENDED",
        "VALIDATION_COMPLETED"
    ]

    has_quality = df["completionQuality"].notna()
    is_completion_event = df["eventType"].isin(completion_events)

    # If has quality, must be completion event
    return ~has_quality | is_completion_event


@pa.dataframe_check(name="session_performance_requires_session_event")
def session_performance_validation(cls, df: pd.DataFrame) -> Series[bool]:
    """
    sessionPerformanceScore should only be set for session events.
    """
    session_events = [
        "SESSION_STARTED",
        "SESSION_ENDED",
        "MISSION_COMPLETED"
    ]

    has_score = df["sessionPerformanceScore"].notna()
    is_session_event = df["eventType"].isin(session_events)

    return ~has_score | is_session_event
```

### When to Add Cross-Column Validation

✅ **Add when:**
- Business logic requires field dependencies
- Data integrity depends on relationships
- Helps catch instrumentation bugs

❌ **Don't add when:**
- Rule is too complex (move to separate data quality check)
- Performance impact is too high
- Rule changes frequently (makes schema brittle)

---

## 5. Error Handling Strategies

### Strategy Comparison

| Mode | Use Case | Behavior | Performance |
|------|----------|----------|-------------|
| **Strict** | Production ETL, Model Training | Fail entire DataFrame on any error | Fast (fail-fast) |
| **Non-Strict** | Data exploration, Development | Drop invalid rows, continue | Slower (checks all) |
| **Lazy** | Data profiling, Debugging | Collect all errors before failing | Slowest (full scan) |

### Implementation

```python
# apps/ml-service/app/schemas/validators.py

"""
Validation utilities with different error handling strategies.

ADR-006: Research Analytics Infrastructure
"""

import pandas as pd
import pandera as pa
from typing import Optional, Literal
from dataclasses import dataclass

from .behavioral_events import BehavioralEventSchema


@dataclass
class ValidationResult:
    """Result of validation operation."""
    success: bool
    validated_df: Optional[pd.DataFrame]
    error_count: int
    warning_count: int
    errors: list[dict]
    warnings: list[dict]

    def summary(self) -> str:
        """Human-readable summary."""
        if self.success:
            return f"✅ Validation passed ({len(self.validated_df)} rows)"
        else:
            return f"❌ Validation failed ({self.error_count} errors, {self.warning_count} warnings)"


class BehavioralEventValidator:
    """
    Validator with multiple error handling modes.

    Usage:
        validator = BehavioralEventValidator(mode="strict")
        result = validator.validate(df)

        if result.success:
            print(f"Valid data: {len(result.validated_df)} rows")
        else:
            print(result.summary())
            for error in result.errors:
                print(f"  - {error['column']}: {error['message']}")
    """

    def __init__(
        self,
        mode: Literal["strict", "non-strict", "lazy"] = "strict",
        raise_on_error: bool = True
    ):
        self.mode = mode
        self.raise_on_error = raise_on_error

    def validate(self, df: pd.DataFrame) -> ValidationResult:
        """
        Validate DataFrame with configured mode.

        Args:
            df: DataFrame to validate

        Returns:
            ValidationResult with validated data and error details
        """
        errors = []
        warnings = []

        try:
            if self.mode == "strict":
                # Fail fast on first error
                validated = BehavioralEventSchema.validate(df, lazy=False)
                return ValidationResult(
                    success=True,
                    validated_df=validated,
                    error_count=0,
                    warning_count=0,
                    errors=[],
                    warnings=[]
                )

            elif self.mode == "non-strict":
                # Drop invalid rows, log warnings
                try:
                    validated = BehavioralEventSchema.validate(df, lazy=True)

                    # Check which rows were dropped
                    dropped_count = len(df) - len(validated)
                    if dropped_count > 0:
                        warnings.append({
                            "type": "dropped_rows",
                            "count": dropped_count,
                            "message": f"Dropped {dropped_count} invalid rows"
                        })

                    return ValidationResult(
                        success=True,
                        validated_df=validated,
                        error_count=0,
                        warning_count=len(warnings),
                        errors=[],
                        warnings=warnings
                    )

                except pa.errors.SchemaErrors as e:
                    # Collect all errors but continue
                    for failure in e.failure_cases.itertuples():
                        errors.append({
                            "column": failure.column,
                            "check": failure.check,
                            "index": failure.index,
                            "message": str(failure.failure_case)
                        })

                    # Filter out invalid rows
                    invalid_indices = e.failure_cases["index"].unique()
                    validated = df.drop(invalid_indices)

                    return ValidationResult(
                        success=False,
                        validated_df=validated,
                        error_count=len(errors),
                        warning_count=0,
                        errors=errors,
                        warnings=[]
                    )

            elif self.mode == "lazy":
                # Collect all errors, don't drop rows
                validated = BehavioralEventSchema.validate(df, lazy=True)
                return ValidationResult(
                    success=True,
                    validated_df=validated,
                    error_count=0,
                    warning_count=0,
                    errors=[],
                    warnings=[]
                )

        except pa.errors.SchemaError as e:
            errors.append({
                "type": "schema_error",
                "message": str(e)
            })

            if self.raise_on_error:
                raise

            return ValidationResult(
                success=False,
                validated_df=None,
                error_count=len(errors),
                warning_count=0,
                errors=errors,
                warnings=[]
            )


# ==================== CONVENIENCE FUNCTIONS ====================

def validate_strict(df: pd.DataFrame) -> pd.DataFrame:
    """
    Strict validation: fail entire DataFrame on any error.

    Use for: Production ETL, model training data preparation
    """
    validator = BehavioralEventValidator(mode="strict", raise_on_error=True)
    result = validator.validate(df)
    return result.validated_df


def validate_permissive(df: pd.DataFrame) -> tuple[pd.DataFrame, ValidationResult]:
    """
    Permissive validation: drop invalid rows, return cleaned data + report.

    Use for: Data exploration, development, ad-hoc analysis
    """
    validator = BehavioralEventValidator(mode="non-strict", raise_on_error=False)
    result = validator.validate(df)
    return result.validated_df, result
```

---

## 6. JSON Field Validation

### Approach: Structural Validation Only

```python
# Add to BehavioralEventSchema

@pa.check("eventData", name="eventData_is_dict_or_json")
def event_data_is_valid_json(cls, event_data: Series[object]) -> Series[bool]:
    """
    Validate eventData is dict or valid JSON string.

    Does NOT validate contents (too dynamic), only structure.
    """
    import json

    def is_valid(value):
        if pd.isna(value):
            return False  # eventData is required

        if isinstance(value, dict):
            return True

        if isinstance(value, str):
            try:
                json.loads(value)
                return True
            except (json.JSONDecodeError, TypeError):
                return False

        return False

    return event_data.apply(is_valid)


# Optional: Type-level validation for specific event types
@pa.check("eventData", name="eventData_has_required_keys")
def event_data_has_keys(cls, df: pd.DataFrame) -> Series[bool]:
    """
    Optional: Check eventData has expected keys per event type.

    Example rules:
    - MISSION_COMPLETED must have { missionId, duration, objectivesCompleted }
    - CARD_REVIEWED must have { cardId, rating, timeSpent }
    """
    def validate_by_type(row):
        event_type = row["eventType"]
        event_data = row["eventData"]

        if not isinstance(event_data, dict):
            return False

        # Define required keys per event type
        required_keys = {
            "MISSION_COMPLETED": ["missionId", "duration"],
            "CARD_REVIEWED": ["cardId", "rating"],
            # ... add more as needed
        }

        if event_type in required_keys:
            return all(key in event_data for key in required_keys[event_type])

        # If event type not in map, skip validation
        return True

    return df.apply(validate_by_type, axis=1)
```

### JSON Validation Decision Matrix

| Validation Level | Pros | Cons | Recommendation |
|------------------|------|------|----------------|
| **None** | Fast, flexible | No quality checks | ❌ Too risky |
| **Type only** (dict/string) | Simple, fast | Misses malformed data | ✅ **START HERE** |
| **Structure** (has keys) | Catches missing fields | Schema drift issues | ⚠️ Use selectively |
| **Full schema** | Complete validation | Too brittle, slow | ❌ Too complex |

**Recommendation:** Start with type validation, add key checks only for critical event types.

---

## 7. Usage Examples

### Example 1: Validate Parquet Export

```python
# scripts/validate_export.py

"""
Validate Parquet export after running export_behavioral_events.py

Usage:
    python scripts/validate_export.py data/raw/behavioral_events_latest.parquet
"""

import sys
import pandas as pd
from app.schemas.behavioral_events import validate_strict

def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_export.py <parquet_file>")
        sys.exit(1)

    parquet_path = sys.argv[1]

    print(f"📊 Loading {parquet_path}...")
    df = pd.read_parquet(parquet_path)
    print(f"   Loaded {len(df)} rows")

    print(f"\n🔍 Running validation...")
    try:
        validated = validate_strict(df)
        print(f"✅ Validation passed: {len(validated)} rows")
        sys.exit(0)

    except Exception as e:
        print(f"❌ Validation failed:")
        print(e)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Example 2: Integrate with DVC Pipeline

```yaml
# dvc.yaml (Future enhancement)

stages:
  export:
    cmd: python scripts/export_behavioral_events.py --days 90
    deps:
      - scripts/export_behavioral_events.py
    outs:
      - data/raw/behavioral_events_latest.parquet

  validate:
    cmd: python scripts/validate_export.py data/raw/behavioral_events_latest.parquet
    deps:
      - scripts/validate_export.py
      - data/raw/behavioral_events_latest.parquet
      - app/schemas/behavioral_events.py
    metrics:
      - validation_report.json:
          cache: false
```

### Example 3: Pytest Integration

```python
# tests/schemas/test_behavioral_events.py

"""
Test BehavioralEvent schema validation.

ADR-006: Research Analytics Infrastructure
"""

import pytest
import pandas as pd
from datetime import datetime, timedelta

from app.schemas.behavioral_events import (
    BehavioralEventSchema,
    validate_strict,
    validate_permissive
)
from app.schemas.enums import EventType, CompletionQuality


class TestBehavioralEventSchema:
    """Test suite for BehavioralEvent schema."""

    @pytest.fixture
    def valid_event_row(self):
        """Create a valid BehavioralEvent row."""
        return {
            "id": "c" + "a" * 24,
            "userId": "c" + "b" * 24,
            "eventType": "MISSION_COMPLETED",
            "eventData": {"missionId": "m123", "duration": 45},
            "timestamp": datetime.now(),
            "completionQuality": "NORMAL",
            "contentType": "flashcard",
            "dayOfWeek": 1,
            "difficultyLevel": "INTERMEDIATE",
            "engagementLevel": "HIGH",
            "sessionPerformanceScore": 85,
            "timeOfDay": 14,
            "experimentPhase": "baseline",
            "randomizationSeed": 42,
            "contextMetadataId": "ctx123"
        }

    def test_valid_event_passes_validation(self, valid_event_row):
        """Test that valid event passes validation."""
        df = pd.DataFrame([valid_event_row])
        validated = validate_strict(df)
        assert len(validated) == 1

    def test_invalid_cuid_fails(self, valid_event_row):
        """Test that invalid CUID format fails validation."""
        valid_event_row["id"] = "invalid_cuid"
        df = pd.DataFrame([valid_event_row])

        with pytest.raises(pa.errors.SchemaError):
            validate_strict(df)

    def test_invalid_enum_fails(self, valid_event_row):
        """Test that invalid enum value fails validation."""
        valid_event_row["eventType"] = "INVALID_EVENT"
        df = pd.DataFrame([valid_event_row])

        with pytest.raises(pa.errors.SchemaError):
            validate_strict(df)

    def test_day_of_week_range(self, valid_event_row):
        """Test dayOfWeek must be 0-6."""
        valid_event_row["dayOfWeek"] = 7  # Invalid (Sunday is 6)
        df = pd.DataFrame([valid_event_row])

        with pytest.raises(pa.errors.SchemaError):
            validate_strict(df)

    def test_time_of_day_range(self, valid_event_row):
        """Test timeOfDay must be 0-23."""
        valid_event_row["timeOfDay"] = 24  # Invalid
        df = pd.DataFrame([valid_event_row])

        with pytest.raises(pa.errors.SchemaError):
            validate_strict(df)

    def test_future_timestamp_fails(self, valid_event_row):
        """Test that future timestamps fail validation."""
        valid_event_row["timestamp"] = datetime.now() + timedelta(days=1)
        df = pd.DataFrame([valid_event_row])

        with pytest.raises(pa.errors.SchemaError):
            validate_strict(df)

    def test_optional_fields_can_be_null(self, valid_event_row):
        """Test that optional fields can be null."""
        valid_event_row["completionQuality"] = None
        valid_event_row["contentType"] = None
        valid_event_row["dayOfWeek"] = None

        df = pd.DataFrame([valid_event_row])
        validated = validate_strict(df)
        assert len(validated) == 1

    def test_permissive_mode_drops_invalid_rows(self, valid_event_row):
        """Test that permissive mode drops invalid rows instead of failing."""
        # Create DataFrame with 2 valid rows and 1 invalid
        valid_row_1 = valid_event_row.copy()
        valid_row_2 = valid_event_row.copy()
        invalid_row = valid_event_row.copy()
        invalid_row["eventType"] = "INVALID"

        df = pd.DataFrame([valid_row_1, invalid_row, valid_row_2])

        validated, result = validate_permissive(df)

        assert len(validated) == 2  # 2 valid rows remain
        assert result.warning_count > 0
```

---

## Quick Decision Guide

### Use This Guide to Decide:

1. **Schema Organization**
   - ✅ One file per table (`behavioral_events.py`)
   - ✅ Centralized enums (`enums.py`)
   - ✅ Central index (`__init__.py`)

2. **Column Validation Priority**
   - **High Priority:** Required fields (id, userId, eventType, timestamp)
   - **Medium Priority:** Range checks (dayOfWeek, timeOfDay, sessionPerformanceScore)
   - **Low Priority:** Optional enums (completionQuality, engagementLevel)

3. **Enum Sync Strategy**
   - **MVP:** Manual copy (update enums.py when Prisma changes)
   - **Future:** Automated generation script

4. **Cross-Column Rules**
   - ✅ Add: `experimentPhase` → requires `contextMetadataId`
   - ✅ Add: `completionQuality` → only for completion events
   - ❌ Skip: Complex business logic (move to separate checks)

5. **Error Handling Mode**
   - **Production ETL:** Strict mode (fail-fast)
   - **Development:** Non-strict mode (drop invalid rows)
   - **Data Profiling:** Lazy mode (collect all errors)

6. **JSON Field Validation**
   - ✅ Type check: Is dict or valid JSON string
   - ⚠️ Key check: Only for critical event types
   - ❌ Full schema: Too brittle for MVP

---

## Next Steps

1. **Create schema files:**
   ```bash
   mkdir -p apps/ml-service/app/schemas
   touch apps/ml-service/app/schemas/__init__.py
   touch apps/ml-service/app/schemas/enums.py
   touch apps/ml-service/app/schemas/behavioral_events.py
   ```

2. **Copy code from this guide:**
   - `enums.py` → Section 3
   - `behavioral_events.py` → Section 2
   - `validators.py` → Section 5

3. **Write tests:**
   ```bash
   mkdir -p apps/ml-service/tests/schemas
   touch apps/ml-service/tests/schemas/test_behavioral_events.py
   ```

4. **Test with real data:**
   ```bash
   python scripts/export_behavioral_events.py --days 30
   python scripts/validate_export.py data/raw/behavioral_events_latest.parquet
   ```

5. **Integrate with DVC pipeline** (future enhancement)

---

## References

- **ADR-006:** Research Analytics Infrastructure
- **Pandera Docs:** https://pandera.readthedocs.io/
- **Prisma Schema:** `apps/ml-service/prisma/schema.prisma`
- **Export Script:** `apps/ml-service/scripts/export_behavioral_events.py`
