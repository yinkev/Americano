"""
Pydantic models for Bayesian Interrupted Time Series (ITS) analysis.

This module defines request and response schemas for the ITS analysis API,
following Codex MCP recommendations from 2025-10-27.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from pydantic import BaseModel, Field, field_validator


class ITSAnalysisRequest(BaseModel):
    """
    Request schema for Bayesian ITS analysis.

    Attributes:
        user_id: Unique identifier for the user
        intervention_date: Date when intervention was introduced
        outcome_metric: Name of outcome variable (e.g., "sessionPerformanceScore")
        include_day_of_week: Include day-of-week fixed effects
        include_time_of_day: Include time-of-day fixed effects
        mcmc_samples: Number of MCMC draws per chain (default: 2000)
        mcmc_chains: Number of MCMC chains (default: 4)
        start_date: Optional start date for analysis window
        end_date: Optional end date for analysis window
    """

    user_id: str = Field(..., description="User ID")
    intervention_date: datetime = Field(..., description="Intervention date (ISO 8601)")
    outcome_metric: str = Field(
        default="sessionPerformanceScore",
        description="Outcome variable name",
    )
    include_day_of_week: bool = Field(
        default=True,
        description="Include day-of-week fixed effects",
    )
    include_time_of_day: bool = Field(
        default=True,
        description="Include time-of-day fixed effects",
    )
    mcmc_samples: int = Field(
        default=2000,
        ge=500,
        le=10000,
        description="MCMC draws per chain",
    )
    mcmc_chains: int = Field(
        default=4,
        ge=2,
        le=8,
        description="Number of MCMC chains",
    )
    start_date: Optional[datetime] = Field(
        default=None,
        description="Start date for analysis window",
    )
    end_date: Optional[datetime] = Field(
        default=None,
        description="End date for analysis window",
    )

    @field_validator("intervention_date")
    @classmethod
    def validate_intervention_date(cls, v: datetime) -> datetime:
        """Ensure intervention_date is not in the future."""
        now = datetime.now(timezone.utc)
        v_aware = v if v.tzinfo else v.replace(tzinfo=timezone.utc)
        if v_aware > now:
            raise ValueError("intervention_date cannot be in the future")
        return v

    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, v: Optional[datetime], info) -> Optional[datetime]:
        """Ensure end_date is after start_date and intervention_date."""
        if v is None:
            return v

        values = info.data
        if "start_date" in values and values["start_date"] is not None:
            if v <= values["start_date"]:
                raise ValueError("end_date must be after start_date")

        if "intervention_date" in values:
            if v <= values["intervention_date"]:
                raise ValueError("end_date must be after intervention_date")

        return v


class CausalEffect(BaseModel):
    """
    Causal effect estimate with credible intervals.

    Attributes:
        point_estimate: Posterior mean or median
        ci_lower: Lower bound of 95% credible interval
        ci_upper: Upper bound of 95% credible interval
        probability_positive: P(effect > 0)
        probability_negative: P(effect < 0)
    """

    point_estimate: float = Field(..., description="Posterior mean/median")
    ci_lower: float = Field(..., description="95% CI lower bound")
    ci_upper: float = Field(..., description="95% CI upper bound")
    probability_positive: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="P(effect > 0)",
    )
    probability_negative: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="P(effect < 0)",
    )


class MCMCDiagnostics(BaseModel):
    """
    MCMC convergence diagnostics.

    Attributes:
        r_hat: Gelman-Rubin statistic (convergence if < 1.01)
        effective_sample_size: Effective sample size per parameter
        divergent_transitions: Number of divergent transitions
        max_tree_depth: Max tree depth reached
        converged: Overall convergence status
    """

    r_hat: Dict[str, float] = Field(
        ...,
        description="R-hat values per parameter",
    )
    effective_sample_size: Dict[str, float] = Field(
        ...,
        description="ESS per parameter",
    )
    divergent_transitions: int = Field(
        ...,
        ge=0,
        description="Number of divergent transitions",
    )
    max_tree_depth: int = Field(
        ...,
        ge=0,
        description="Max tree depth reached",
    )
    converged: bool = Field(
        ...,
        description="True if R-hat < 1.01 for all params",
    )


class ITSAnalysisResponse(BaseModel):
    """
    Response schema for Bayesian ITS analysis.

    Attributes:
        immediate_effect: Immediate post-intervention level change
        sustained_effect: Sustained post-intervention slope change
        counterfactual_effect: Overall effect vs counterfactual
        probability_of_benefit: P(any positive effect)
        mcmc_diagnostics: MCMC convergence diagnostics
        plots: Base64-encoded PNG plots
        mlflow_run_id: MLflow run ID for provenance
        computation_time_seconds: Total computation time
        n_observations_pre: Number of observations in pre-period
        n_observations_post: Number of observations in post-period
    """

    immediate_effect: CausalEffect = Field(
        ...,
        description="Immediate level change at intervention",
    )
    sustained_effect: CausalEffect = Field(
        ...,
        description="Sustained slope change post-intervention",
    )
    counterfactual_effect: CausalEffect = Field(
        ...,
        description="Overall effect vs counterfactual",
    )
    probability_of_benefit: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="P(any positive effect)",
    )
    mcmc_diagnostics: MCMCDiagnostics = Field(
        ...,
        description="MCMC convergence diagnostics",
    )
    plots: Dict[str, str] = Field(
        ...,
        description="Base64-encoded PNG plots",
    )
    mlflow_run_id: str = Field(
        ...,
        description="MLflow run ID",
    )
    computation_time_seconds: float = Field(
        ...,
        ge=0.0,
        description="Total computation time",
    )
    n_observations_pre: int = Field(
        ...,
        ge=0,
        description="Observations in pre-period",
    )
    n_observations_post: int = Field(
        ...,
        ge=0,
        description="Observations in post-period",
    )
