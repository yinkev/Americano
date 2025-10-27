"""
FastAPI routes for ABAB Randomization Analysis.

Provides endpoints for:
- POST /analytics/abab/analyze: Run ABAB permutation test
- GET /analytics/abab/history/{user_id}: Fetch past analyses from MLflow

Created: 2025-10-27T10:55:00-07:00
Part of: Day 7-8 Research Analytics Implementation (ADR-006)
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
import mlflow

from app.models.abab_analysis import ABABAnalysisRequest, ABABAnalysisResponse
from app.services.abab_engine import ABABRandomizationEngine


router = APIRouter(
    prefix="/analytics/abab",
    tags=["ABAB Analysis"],
)

# Initialize ABAB engine
abab_engine = ABABRandomizationEngine()


@router.post(
    "/analyze",
    response_model=ABABAnalysisResponse,
    summary="Run ABAB Randomization Test",
    description="""
    Run ABAB randomization test with permutation inference.

    This endpoint:
    1. Fetches user ABAB data from DuckDB (4 phases: B1, A1, B2, A2)
    2. Validates data quality (≥5 observations per phase)
    3. Calculates observed effect (Mean(A) - Mean(B))
    4. Runs permutation test (10,000 iterations by default)
    5. Computes Cohen's d effect size
    6. Validates against WWC SCED standards
    7. Logs results to MLflow
    8. Returns comprehensive analysis results

    **ABAB Reversal Design:**
    - B1 (Baseline 1): Initial baseline period
    - A1 (Intervention 1): First intervention period
    - B2 (Baseline 2): Return to baseline
    - A2 (Intervention 2): Second intervention period

    **Requirements:**
    - All 4 phases must be present in data
    - At least 5 observations per phase (WWC guideline)
    - Data tagged with experimentPhase field

    **WWC Standards:**
    The analysis checks 6 WWC SCED criteria:
    1. At least 2 phase pairs (ABAB = 2) ✓
    2. Sufficient data points (≥5 per phase)
    3. Immediate change at intervention points
    4. Similar patterns within conditions
    5. Minimal overlap between phases (≤25%)
    6. Statistical significance (p < 0.05)

    **Computation Time:**
    - 10,000 permutations: ~5-10 seconds
    - 50,000 permutations: ~20-30 seconds

    **Outputs:**
    - Observed effect with two-tailed p-value
    - Cohen's d effect size interpretation
    - WWC SCED standards compliance (Meets/With Reservations/Does Not Meet)
    - Permutation distribution for visualization
    - MLflow run ID for reproducibility
    """,
    responses={
        200: {
            "description": "ABAB analysis completed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "observed_effect": 15.2,
                        "p_value": 0.001,
                        "cohens_d": 1.2,
                        "permutation_distribution": "[...]",
                        "n_observations_per_phase": {
                            "baseline_1": 15,
                            "intervention_A_1": 15,
                            "baseline_2": 15,
                            "intervention_A_2": 15,
                        },
                        "passes_sced_standards": True,
                        "wwc_details": {
                            "wwc_rating": "Meets Standards",
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
                            "passes_wwc": True,
                        },
                        "mlflow_run_id": "abc123def456",
                        "computation_time_seconds": 5.2,
                    }
                }
            },
        },
        400: {
            "description": "Invalid request (missing phases, insufficient data)",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Incomplete ABAB design: missing phases {'baseline_2'}. Need all 4 phases for valid analysis."
                    }
                }
            },
        },
        500: {
            "description": "Computation error",
            "content": {
                "application/json": {
                    "example": {"detail": "Unexpected error during ABAB analysis: ..."}
                }
            },
        },
    },
)
async def analyze_abab(request: ABABAnalysisRequest) -> ABABAnalysisResponse:
    """
    Run ABAB randomization test.

    Args:
        request: ABAB analysis request with user_id, protocol_id, n_permutations, etc.

    Returns:
        ABAB analysis response with effects, p-values, WWC validation, and provenance

    Raises:
        HTTPException: 400 for invalid data, 500 for computation errors
    """
    try:
        result = abab_engine.run_analysis(
            user_id=request.user_id,
            protocol_id=request.protocol_id,
            outcome_metric=request.outcome_metric,
            n_permutations=request.n_permutations,
            seed=request.seed,
        )
        return ABABAnalysisResponse(**result)

    except ValueError as e:
        # Invalid data (missing phases, insufficient observations, etc.)
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        # Unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during ABAB analysis: {str(e)}",
        )


@router.get(
    "/history/{user_id}",
    summary="Get ABAB Analysis History",
    description="""
    Fetch past ABAB analyses for a user from MLflow.

    This endpoint queries MLflow to retrieve:
    - Past analysis run IDs
    - Parameters (user_id, protocol_id, n_permutations)
    - Metrics (observed effect, p-value, Cohen's d, WWC rating)
    - Timestamps (start time, computation duration)

    Results are sorted by start time (newest first).

    **Use Cases:**
    - View past experiments
    - Compare different protocols
    - Track analysis history over time
    - Retrieve cached results

    **Pagination:**
    - Default: 10 most recent runs
    - Max: 100 runs per request
    - Use `offset` for pagination
    """,
    responses={
        200: {
            "description": "ABAB analysis history retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "user_id": "user123",
                        "total_runs": 15,
                        "runs": [
                            {
                                "run_id": "abc123",
                                "start_time": "2025-10-20T14:30:00Z",
                                "protocol_id": "abab_protocol_001",
                                "observed_effect": 15.2,
                                "p_value": 0.001,
                                "cohens_d": 1.2,
                                "wwc_rating": "Meets Standards",
                                "passes_wwc": True,
                                "computation_time": 5.2,
                            }
                        ],
                    }
                }
            },
        },
        404: {
            "description": "No ABAB analyses found for user",
            "content": {
                "application/json": {
                    "example": {"detail": "No ABAB analyses found for user user123"}
                }
            },
        },
    },
)
async def get_abab_history(
    user_id: str,
    limit: int = Query(10, ge=1, le=100, description="Max runs to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
) -> JSONResponse:
    """
    Get ABAB analysis history for a user.

    Args:
        user_id: User ID
        limit: Maximum number of runs to return (1-100)
        offset: Pagination offset

    Returns:
        JSON response with past ABAB analyses

    Raises:
        HTTPException: 404 if no analyses found
    """
    try:
        # Query MLflow for past runs
        client = mlflow.tracking.MlflowClient()

        # Search for runs with user_id parameter
        runs = client.search_runs(
            experiment_ids=["0"],  # Default experiment
            filter_string=f"params.user_id = '{user_id}' AND tags.analysis_type = 'ABAB_randomization'",
            order_by=["start_time DESC"],
            max_results=limit,
        )

        if not runs:
            raise HTTPException(
                status_code=404,
                detail=f"No ABAB analyses found for user {user_id}",
            )

        # Format results
        history = []
        for run in runs:
            run_data = {
                "run_id": run.info.run_id,
                "start_time": run.info.start_time,
                "protocol_id": run.data.params.get("protocol_id"),
                "outcome_metric": run.data.params.get("outcome_metric"),
                "n_permutations": int(run.data.params.get("n_permutations", 0)),
                "observed_effect": run.data.metrics.get("observed_effect"),
                "p_value": run.data.metrics.get("p_value"),
                "cohens_d": run.data.metrics.get("cohens_d"),
                "wwc_rating": run.data.tags.get("wwc_rating"),
                "passes_wwc": run.data.tags.get("passes_wwc") == "yes",
                "computation_time": run.info.end_time - run.info.start_time if run.info.end_time else None,
            }
            history.append(run_data)

        return JSONResponse(
            content={
                "user_id": user_id,
                "total_runs": len(runs),
                "limit": limit,
                "offset": offset,
                "runs": history,
            }
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching ABAB history: {str(e)}",
        )
