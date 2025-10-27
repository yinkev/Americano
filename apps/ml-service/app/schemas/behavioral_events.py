"""
Pandera schema for BehavioralEvent table validation.

Validates data exported from behavioral_events table before DVC versioning.
Implements fail-fast validation to catch data quality issues early.

ADR-006: Research Analytics Infrastructure
"""

import pandera as pa
from pandera.typing import Series
import pandas as pd
from typing import Optional

from .enums import EventType, CompletionQuality, EngagementLevel


class BehavioralEventSchema(pa.DataFrameModel):
    """
    Schema for behavioral_events table.

    Corresponds to Prisma model BehavioralEvent with validation rules
    for research analytics integrity.
    """

    # ==================== REQUIRED FIELDS ====================

    id: Series[str] = pa.Field(
        str_matches=r"^c[a-z0-9]{24}$",  # CUID format
        nullable=False,
        coerce=True,
        description="Primary key in CUID format",
    )

    userId: Series[str] = pa.Field(
        str_matches=r"^c[a-z0-9]{24}$",
        nullable=False,
        coerce=True,
        description="Foreign key to users table (CUID format)",
    )

    eventType: Series[str] = pa.Field(
        isin=EventType.values(),
        nullable=False,
        coerce=True,
        description="Type of behavioral event (from Prisma EventType enum)",
    )

    eventData: Series[object] = pa.Field(
        nullable=False, description="JSON event data (dict or JSON string)"
    )

    timestamp: Series[pd.Timestamp] = pa.Field(
        nullable=False,
        coerce=True,
        description="When event occurred (ISO 8601 timestamp)",
    )

    # ==================== OPTIONAL FIELDS ====================

    completionQuality: Optional[Series[str]] = pa.Field(
        isin=CompletionQuality.values(),
        nullable=True,
        coerce=True,
        description="Quality of completion (RUSHED, NORMAL, THOROUGH)",
    )

    contentType: Optional[Series[str]] = pa.Field(
        nullable=True, description="Type of content (e.g., 'flashcard')"
    )

    dayOfWeek: Optional[Series[int]] = pa.Field(
        ge=0, le=6, nullable=True, description="Day of week (0=Monday, 6=Sunday)"
    )

    difficultyLevel: Optional[Series[str]] = pa.Field(
        nullable=True, description="Difficulty level (free text or enum)"
    )

    engagementLevel: Optional[Series[str]] = pa.Field(
        isin=EngagementLevel.values(),
        nullable=True,
        coerce=True,
        description="Engagement level (LOW, MEDIUM, HIGH)",
    )

    sessionPerformanceScore: Optional[Series[int]] = pa.Field(
        ge=0, le=100, nullable=True, description="Performance score 0-100"
    )

    timeOfDay: Optional[Series[int]] = pa.Field(
        ge=0, le=23, nullable=True, description="Hour of day (0-23)"
    )

    # ==================== EXPERIMENT FIELDS (ADR-006) ====================

    experimentPhase: Optional[Series[str]] = pa.Field(
        nullable=True,
        isin=["baseline_1", "intervention_A_1", "baseline_2", "intervention_A_2"],
        description="ABAB reversal design phase label for SCED analysis (Day 8)",
    )

    randomizationSeed: Optional[Series[int]] = pa.Field(
        nullable=True, description="Randomization seed for reproducibility"
    )

    contextMetadataId: Optional[Series[str]] = pa.Field(
        nullable=True, description="Foreign key to context metadata table"
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

    @pa.dataframe_check(name="experiment_phase_requires_metadata")
    def experiment_phase_validation(cls, df: pd.DataFrame) -> Series[bool]:
        """If experimentPhase is set, contextMetadataId should be set."""
        has_phase = df["experimentPhase"].notna()
        has_metadata = df["contextMetadataId"].notna()
        return ~has_phase | has_metadata

    class Config:
        """Pandera configuration."""

        strict = "filter"  # Remove columns not in schema
        coerce = True  # Coerce types when possible
        ordered = False  # Column order doesn't matter


# ==================== VALIDATION FUNCTIONS ====================


def validate_behavioral_events(
    df: pd.DataFrame, strict: bool = True, raise_on_error: bool = True
) -> pd.DataFrame:
    """
    Validate BehavioralEvent DataFrame against schema.

    Args:
        df: DataFrame to validate
        strict: If True, reject entire DataFrame on any error
        raise_on_error: If True, raise exception on validation failure

    Returns:
        Validated DataFrame

    Raises:
        pa.errors.SchemaError: If validation fails and raise_on_error=True

    Example:
        >>> df = pd.read_parquet("data/raw/behavioral_events_latest.parquet")
        >>> validated = validate_behavioral_events(df, strict=True)
    """
    try:
        validated = BehavioralEventSchema.validate(
            df,
            lazy=False if strict else True,
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
        >>> print(f"Valid: {report['valid_rows']}/{report['total_rows']}")
    """
    report = {
        "total_rows": len(df),
        "valid_rows": 0,
        "invalid_rows": 0,
        "errors": [],
    }

    try:
        validated = BehavioralEventSchema.validate(df, lazy=True)
        report["valid_rows"] = len(validated)
        return validated, report

    except pa.errors.SchemaErrors as e:
        # Collect all validation errors
        for failure_case in e.failure_cases.itertuples():
            report["errors"].append(
                {
                    "column": failure_case.column,
                    "check": failure_case.check,
                    "index": failure_case.index,
                    "failure_case": failure_case.failure_case,
                }
            )

        report["invalid_rows"] = len(e.failure_cases)
        report["valid_rows"] = len(df) - report["invalid_rows"]

        return df, report
