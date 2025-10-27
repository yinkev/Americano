"""
Pydantic models for ABAB Randomization Analysis.

Defines request/response schemas for ABAB reversal design endpoints.
Implements validation rules and type safety for API contracts.

Created: 2025-10-27T10:50:00-07:00
Part of: Day 7-8 Research Analytics Implementation (ADR-006)
"""

from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class ABABAnalysisRequest(BaseModel):
    """
    Request schema for ABAB randomization analysis.

    Validates input parameters for permutation test analysis of ABAB reversal designs.
    """

    user_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="User ID for whom to run ABAB analysis",
        examples=["user_abc123"],
    )

    protocol_id: str = Field(
        default="default",
        min_length=1,
        max_length=100,
        description="Experiment protocol identifier (for future multi-protocol support)",
        examples=["abab_protocol_001"],
    )

    outcome_metric: str = Field(
        default="sessionPerformanceScore",
        description="Outcome variable column name from behavioral_events table",
        examples=["sessionPerformanceScore", "completionRate", "accuracyScore"],
    )

    n_permutations: int = Field(
        default=10000,
        ge=1000,
        le=50000,
        description="Number of permutation iterations for randomization test (1,000-50,000)",
    )

    seed: Optional[int] = Field(
        default=None,
        ge=0,
        description="Random seed for reproducibility (optional)",
        examples=[42, 12345],
    )

    @field_validator("outcome_metric")
    @classmethod
    def validate_outcome_metric(cls, v: str) -> str:
        """Validate outcome metric is a valid column name."""
        # Allow alphanumeric + underscore (standard SQL column names)
        if not v.replace("_", "").isalnum():
            raise ValueError(
                f"Invalid outcome_metric: {v}. Must be alphanumeric with underscores."
            )
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "user_id": "user_abc123",
                "protocol_id": "abab_protocol_001",
                "outcome_metric": "sessionPerformanceScore",
                "n_permutations": 10000,
                "seed": 42,
            }
        }
    }


class WWCDetails(BaseModel):
    """
    WWC SCED standards validation details.

    Contains criterion-by-criterion validation results and overall rating.
    """

    # Criterion results
    phase_pairs: int = Field(description="Number of phase pairs (ABAB = 2)")
    criterion_phase_pairs: bool = Field(description="Meets phase pairs criterion (≥2)")

    min_observations_per_phase: int = Field(
        description="Minimum observations in any phase"
    )
    criterion_sufficient_data: bool = Field(
        description="Meets data sufficiency criterion (≥5 per phase)"
    )

    immediate_change_detected: bool = Field(
        description="Immediate change detected at B→A transitions"
    )
    criterion_immediate_change: bool = Field(
        description="Meets immediate change criterion"
    )

    similar_baseline_phases: bool = Field(
        description="Baseline phases have similar patterns"
    )
    similar_intervention_phases: bool = Field(
        description="Intervention phases have similar patterns"
    )
    criterion_similar_patterns: bool = Field(
        description="Meets similar patterns criterion"
    )

    overlap_percentage: float = Field(
        description="Percentage overlap between baseline and intervention"
    )
    criterion_minimal_overlap: bool = Field(
        description="Meets minimal overlap criterion (≤25%)"
    )

    p_value: float = Field(description="Permutation test p-value")
    criterion_statistically_significant: bool = Field(
        description="Meets statistical significance criterion (p < 0.05)"
    )

    # Effect size
    cohens_d: float = Field(description="Cohen's d effect size")
    effect_size_interpretation: str = Field(
        description="Effect size interpretation (negligible, small, medium, large)"
    )

    # Overall rating
    wwc_rating: str = Field(
        description="Overall WWC evidence rating",
        examples=[
            "Meets Standards",
            "Meets Standards with Reservations",
            "Does Not Meet Standards",
        ],
    )
    passes_wwc: bool = Field(
        description="True if meets WWC 'Meets Standards' criterion"
    )


class ABABAnalysisResponse(BaseModel):
    """
    Response schema for ABAB randomization analysis.

    Contains complete analysis results including effects, p-values, WWC validation, and provenance.
    """

    observed_effect: float = Field(
        description="Observed mean difference (Intervention - Baseline)",
        examples=[15.2, -3.5, 0.0],
    )

    p_value: float = Field(
        ge=0.0,
        le=1.0,
        description="Two-tailed permutation test p-value",
        examples=[0.001, 0.049, 0.123],
    )

    cohens_d: float = Field(
        description="Cohen's d effect size (standardized mean difference)",
        examples=[0.8, 1.2, 0.3],
    )

    permutation_distribution: List[float] = Field(
        description="Array of permuted effect sizes from randomization test",
        max_length=50000,
    )

    n_observations_per_phase: Dict[str, int] = Field(
        description="Number of observations in each ABAB phase",
        examples=[
            {
                "baseline_1": 15,
                "intervention_A_1": 15,
                "baseline_2": 15,
                "intervention_A_2": 15,
            }
        ],
    )

    passes_sced_standards: bool = Field(
        description="True if analysis meets WWC SCED 'Meets Standards' criteria"
    )

    wwc_details: WWCDetails = Field(
        description="Detailed WWC SCED standards validation results"
    )

    mlflow_run_id: str = Field(
        description="MLflow tracking run ID for provenance and reproducibility",
        examples=["abc123def456"],
    )

    computation_time_seconds: float = Field(
        ge=0.0,
        description="Total computation time in seconds",
        examples=[5.2, 12.7],
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "observed_effect": 15.2,
                "p_value": 0.001,
                "cohens_d": 1.2,
                "permutation_distribution": [0.5, -1.2, 2.3],  # Truncated for brevity
                "n_observations_per_phase": {
                    "baseline_1": 15,
                    "intervention_A_1": 15,
                    "baseline_2": 15,
                    "intervention_A_2": 15,
                },
                "passes_sced_standards": True,
                "wwc_details": {
                    "phase_pairs": 2,
                    "criterion_phase_pairs": True,
                    "min_observations_per_phase": 15,
                    "criterion_sufficient_data": True,
                    "immediate_change_detected": True,
                    "criterion_immediate_change": True,
                    "similar_baseline_phases": True,
                    "similar_intervention_phases": True,
                    "criterion_similar_patterns": True,
                    "overlap_percentage": 10.0,
                    "criterion_minimal_overlap": True,
                    "p_value": 0.001,
                    "criterion_statistically_significant": True,
                    "cohens_d": 1.2,
                    "effect_size_interpretation": "large",
                    "wwc_rating": "Meets Standards",
                    "passes_wwc": True,
                },
                "mlflow_run_id": "abc123def456",
                "computation_time_seconds": 5.2,
            }
        }
    }
