"""
FastAPI routes for Bayesian Interrupted Time Series (ITS) analysis.

This module provides endpoints for:
- POST /analytics/its/analyze: Run ITS analysis
- GET /analytics/its/history/{user_id}: Get past ITS analyses
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
import mlflow

from app.models.its_analysis import ITSAnalysisRequest, ITSAnalysisResponse
from app.services.its_engine import BayesianITSEngine


router = APIRouter(
    prefix="/analytics/its",
    tags=["ITS Analysis"],
)

# Initialize ITS engine with correct database path
its_engine = BayesianITSEngine(duckdb_path="data/behavioral_events.duckdb")


@router.post(
    "/analyze",
    response_model=ITSAnalysisResponse,
    summary="Run Bayesian ITS Analysis",
    description="""
    Run Bayesian Interrupted Time Series (ITS) analysis for n=1 self-experimentation.

    This endpoint:
    1. Fetches user behavioral data from DuckDB
    2. Splits data into pre/post intervention periods
    3. Runs CausalPy PrePostNEGD model with PyMC MCMC sampling
    4. Extracts causal effects with credible intervals
    5. Logs results to MLflow for provenance tracking
    6. Returns effects, diagnostics, and plots

    **Minimum Requirements:**
    - At least 8 observations (days) in pre-intervention period
    - At least 8 observations (days) in post-intervention period
    - Optimal: 20-30+ observations per period (90 days total is excellent)

    **MCMC Configuration:**
    - Default: 2000 draws × 4 chains = 8000 total samples
    - Computation time: 60-120 seconds (cold start)
    - Convergence threshold: R-hat < 1.01

    **Outputs:**
    - Immediate effect: Level change at intervention
    - Sustained effect: Slope change post-intervention
    - Counterfactual effect: Observed vs predicted (no intervention)
    - Probability of benefit: P(effect > 0)
    - MCMC diagnostics: R-hat, ESS, divergent transitions
    - Plots: Observed vs counterfactual, PPC, effect distribution, diagnostics

    **Error Handling:**
    - 400: Insufficient data (< 8 observations per period)
    - 500: MCMC convergence failure (R-hat > 1.01)
    - 500: Other computation errors
    """,
    responses={
        200: {
            "description": "ITS analysis completed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "immediate_effect": {
                            "point_estimate": 5.2,
                            "ci_lower": 2.1,
                            "ci_upper": 8.3,
                            "probability_positive": 0.98,
                            "probability_negative": 0.02,
                        },
                        "sustained_effect": {
                            "point_estimate": 0.15,
                            "ci_lower": -0.05,
                            "ci_upper": 0.35,
                            "probability_positive": 0.87,
                            "probability_negative": 0.13,
                        },
                        "probability_of_benefit": 0.98,
                        "mcmc_diagnostics": {
                            "r_hat": {"intervention": 1.003, "slope": 1.001},
                            "effective_sample_size": {"intervention": 6500, "slope": 7200},
                            "divergent_transitions": 0,
                            "max_tree_depth": 10,
                            "converged": True,
                        },
                        "mlflow_run_id": "abc123def456",
                        "computation_time_seconds": 87.3,
                        "n_observations_pre": 45,
                        "n_observations_post": 45,
                    }
                }
            },
        },
        400: {
            "description": "Invalid request (insufficient data or bad parameters)",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Insufficient pre-intervention data: 5 days, need >= 8"
                    }
                }
            },
        },
        500: {
            "description": "MCMC convergence failure or computation error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "MCMC failed to converge: max R-hat = 1.15 (> 1.01)"
                    }
                }
            },
        },
    },
)
async def analyze_its(request: ITSAnalysisRequest) -> ITSAnalysisResponse:
    """
    Run Bayesian ITS analysis.

    Args:
        request: ITS analysis request with user_id, intervention_date, etc.

    Returns:
        ITS analysis response with effects, diagnostics, and plots

    Raises:
        HTTPException: 400 for invalid data, 500 for computation errors
    """
    try:
        result = its_engine.run_analysis(request)
        return result

    except ValueError as e:
        # Invalid data (insufficient observations, bad dates, etc.)
        raise HTTPException(status_code=400, detail=str(e))

    except RuntimeError as e:
        # MCMC convergence failure or other computation errors
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        # Unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during ITS analysis: {str(e)}",
        )


@router.get(
    "/history/{user_id}",
    summary="Get ITS Analysis History",
    description="""
    Fetch past ITS analyses for a user from MLflow.

    This endpoint queries MLflow to retrieve:
    - Past analysis run IDs
    - Parameters (intervention dates, MCMC config)
    - Metrics (effects, probabilities, diagnostics)
    - Timestamps (start time, duration)

    Results are sorted by start time (newest first).

    **Use Cases:**
    - View past experiments
    - Compare different interventions
    - Track analysis history over time
    - Retrieve cached results

    **Pagination:**
    - Default: 10 most recent runs
    - Max: 100 runs per request
    - Use `offset` for pagination
    """,
    responses={
        200: {
            "description": "ITS analysis history retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "user_id": "user123",
                        "total_runs": 15,
                        "runs": [
                            {
                                "run_id": "abc123",
                                "start_time": "2025-10-20T14:30:00Z",
                                "intervention_date": "2025-09-15",
                                "immediate_effect": 5.2,
                                "probability_of_benefit": 0.98,
                                "converged": True,
                            }
                        ],
                    }
                }
            },
        },
        404: {
            "description": "No ITS analyses found for user",
            "content": {
                "application/json": {
                    "example": {"detail": "No ITS analyses found for user user123"}
                }
            },
        },
    },
)
async def get_its_history(
    user_id: str,
    limit: int = Query(10, ge=1, le=100, description="Max runs to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
) -> JSONResponse:
    """
    Get ITS analysis history for a user.

    Args:
        user_id: User ID
        limit: Maximum number of runs to return (1-100)
        offset: Pagination offset

    Returns:
        JSON response with past ITS analyses

    Raises:
        HTTPException: 404 if no analyses found
    """
    try:
        # Query MLflow for past runs
        client = mlflow.tracking.MlflowClient()

        # Search for runs with user_id parameter
        runs = client.search_runs(
            experiment_ids=["0"],  # Default experiment
            filter_string=f"params.user_id = '{user_id}'",
            order_by=["start_time DESC"],
            max_results=limit,
        )

        if not runs:
            raise HTTPException(
                status_code=404,
                detail=f"No ITS analyses found for user {user_id}",
            )

        # Format results
        history = []
        for run in runs:
            run_data = {
                "run_id": run.info.run_id,
                "start_time": run.info.start_time,
                "intervention_date": run.data.params.get("intervention_date"),
                "immediate_effect": run.data.metrics.get("immediate_effect"),
                "sustained_effect": run.data.metrics.get("sustained_effect"),
                "counterfactual_effect": run.data.metrics.get("counterfactual_effect"),
                "probability_of_benefit": run.data.metrics.get("probability_of_benefit"),
                "max_rhat": run.data.metrics.get("max_rhat"),
                "converged": run.data.metrics.get("max_rhat", 2.0) < 1.01,
                "computation_time": run.data.metrics.get("computation_time"),
                "n_observations_pre": run.data.metrics.get("n_observations_pre"),
                "n_observations_post": run.data.metrics.get("n_observations_post"),
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
            detail=f"Error fetching ITS history: {str(e)}",
        )
