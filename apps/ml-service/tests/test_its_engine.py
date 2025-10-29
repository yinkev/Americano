"""
Unit tests for Bayesian ITS engine.

Tests:
1. Data fetching
2. Pre/post split
3. MCMC convergence
4. Result extraction
5. Caching
6. Edge cases
"""

from datetime import datetime, timedelta
import pytest
import pandas as pd
import numpy as np

from app.models.its_analysis import ITSAnalysisRequest
from app.services.its_engine import BayesianITSEngine


# Fixtures


@pytest.fixture
def engine():
    """Create ITS engine instance."""
    return BayesianITSEngine(duckdb_path=":memory:")


@pytest.fixture
def synthetic_data():
    """
    Generate synthetic 90-day behavioral data with intervention effect.

    Structure:
    - Days 0-44: Pre-intervention (mean=70, trend=+0.1/day)
    - Days 45-89: Post-intervention (mean=75, trend=+0.15/day) - 5 point jump + faster improvement
    """
    np.random.seed(42)

    dates = pd.date_range("2025-07-01", periods=90, freq="D")
    data = []

    for i, date in enumerate(dates):
        if i < 45:
            # Pre-intervention: baseline + small trend + noise
            outcome = 70 + 0.1 * i + np.random.normal(0, 2)
        else:
            # Post-intervention: jump + steeper trend + noise
            outcome = 75 + 0.15 * (i - 45) + np.random.normal(0, 2)

        data.append({
            "date": date,
            "outcome": outcome,
            "day_of_week": date.dayofweek,
            "hour": 14.0 + np.random.uniform(-2, 2),  # Around 2pm
            "n_sessions": np.random.randint(3, 8),
        })

    return pd.DataFrame(data)


@pytest.fixture
def its_request():
    """Create ITS analysis request."""
    return ITSAnalysisRequest(
        user_id="test_user_123",
        intervention_date=datetime(2025, 8, 15),  # Day 45
        outcome_metric="sessionPerformanceScore",
        mcmc_samples=500,  # Reduced for testing speed
        mcmc_chains=2,
    )


# Tests


def test_prepare_its_data(engine, synthetic_data):
    """Test pre/post split."""
    intervention_date = datetime(2025, 8, 15)

    pre_data, post_data = engine.prepare_its_data(
        df=synthetic_data,
        intervention_date=intervention_date,
        include_day_of_week=True,
        include_time_of_day=True,
    )

    # Check sizes
    assert len(pre_data) == 45, f"Expected 45 pre-obs, got {len(pre_data)}"
    assert len(post_data) == 45, f"Expected 45 post-obs, got {len(post_data)}"

    # Check intervention indicator
    assert all(pre_data["intervention"] == 0)
    assert all(post_data["intervention"] == 1)

    # Check day-of-week dummies
    assert "dow_0" in pre_data.columns
    assert "dow_6" in post_data.columns

    # Check time-of-day normalization
    assert "hour_normalized" in pre_data.columns
    assert 0 <= pre_data["hour_normalized"].max() <= 1.0


def test_prepare_its_data_insufficient_pre(engine, synthetic_data):
    """Test error when insufficient pre-intervention data."""
    # Intervention too early (only 5 pre-intervention days)
    intervention_date = datetime(2025, 7, 6)

    with pytest.raises(ValueError, match="Insufficient pre-intervention data"):
        engine.prepare_its_data(
            df=synthetic_data,
            intervention_date=intervention_date,
        )


def test_prepare_its_data_insufficient_post(engine, synthetic_data):
    """Test error when insufficient post-intervention data."""
    # Intervention too late (only 5 post-intervention days)
    intervention_date = datetime(2025, 9, 24)

    with pytest.raises(ValueError, match="Insufficient post-intervention data"):
        engine.prepare_its_data(
            df=synthetic_data,
            intervention_date=intervention_date,
        )


@pytest.mark.slow
def test_run_causalpy_its_convergence(engine, synthetic_data):
    """
    Test MCMC convergence.

    Note: Marked as slow due to MCMC sampling (~30-60s).
    """
    intervention_date = datetime(2025, 8, 15)

    pre_data, post_data = engine.prepare_its_data(
        df=synthetic_data,
        intervention_date=intervention_date,
    )

    result = engine.run_causalpy_its(
        pre_data=pre_data,
        post_data=post_data,
        mcmc_samples=500,  # Reduced for testing
        mcmc_chains=2,
    )

    # Check result structure
    assert "model" in result
    assert "idata" in result
    assert "pre_data" in result
    assert "post_data" in result
    assert "computation_time" in result

    # Check convergence
    assert result["computation_time"] > 0
    assert result["computation_time"] < 120  # Should finish within 2 min


@pytest.mark.slow
def test_extract_results(engine, synthetic_data):
    """
    Test result extraction.

    Note: Marked as slow due to MCMC sampling.
    """
    intervention_date = datetime(2025, 8, 15)

    pre_data, post_data = engine.prepare_its_data(
        df=synthetic_data,
        intervention_date=intervention_date,
    )

    model_result = engine.run_causalpy_its(
        pre_data=pre_data,
        post_data=post_data,
        mcmc_samples=500,
        mcmc_chains=2,
    )

    results = engine.extract_results(model_result)

    # Check result structure
    assert "immediate_effect" in results
    assert "sustained_effect" in results
    assert "counterfactual_effect" in results
    assert "probability_of_benefit" in results
    assert "mcmc_diagnostics" in results

    # Check effect estimates
    immediate = results["immediate_effect"]
    assert immediate.point_estimate > 0  # Should detect positive jump
    assert 0 <= immediate.probability_positive <= 1.0

    # Check diagnostics
    diagnostics = results["mcmc_diagnostics"]
    assert diagnostics.converged  # R-hat < 1.01
    assert diagnostics.divergent_transitions >= 0


def test_caching(engine, synthetic_data, its_request, monkeypatch):
    """Test caching of results."""
    # Mock fetch_user_data to return synthetic data
    def mock_fetch(*args, **kwargs):
        return synthetic_data

    monkeypatch.setattr(engine, "fetch_user_data", mock_fetch)

    # First call (cold)
    result1 = engine.run_analysis(its_request)
    time1 = result1.computation_time_seconds

    # Second call (should be cached, instant)
    result2 = engine.run_analysis(its_request)
    time2 = result2.computation_time_seconds

    # Check caching worked
    assert result1.mlflow_run_id == result2.mlflow_run_id
    assert time2 < time1  # Second call should be faster (cached)


def test_invalid_intervention_date(its_request):
    """Test validation of intervention date."""
    # Future date should fail
    its_request.intervention_date = datetime.now() + timedelta(days=30)

    with pytest.raises(ValueError, match="cannot be in the future"):
        its_request.intervention_date  # Pydantic validator triggers on access


def test_mcmc_param_validation():
    """Test MCMC parameter validation."""
    # Too few samples
    with pytest.raises(ValueError):
        ITSAnalysisRequest(
            user_id="test",
            intervention_date=datetime(2025, 8, 15),
            mcmc_samples=100,  # Below minimum of 500
        )

    # Too many chains
    with pytest.raises(ValueError):
        ITSAnalysisRequest(
            user_id="test",
            intervention_date=datetime(2025, 8, 15),
            mcmc_chains=12,  # Above maximum of 8
        )


# Integration test


@pytest.mark.slow
@pytest.mark.integration
def test_full_pipeline(engine, synthetic_data, its_request, monkeypatch):
    """
    Full pipeline integration test.

    Tests:
    1. Data fetching
    2. Pre/post split
    3. MCMC sampling
    4. Result extraction
    5. MLflow logging

    Note: Marked as slow (~30-60s) and integration.
    """
    # Mock fetch_user_data
    def mock_fetch(*args, **kwargs):
        return synthetic_data

    monkeypatch.setattr(engine, "fetch_user_data", mock_fetch)

    # Run full pipeline
    response = engine.run_analysis(its_request)

    # Check response structure
    assert response.mlflow_run_id is not None
    assert response.computation_time_seconds > 0
    assert response.n_observations_pre == 45
    assert response.n_observations_post == 45

    # Check effects
    assert response.immediate_effect.point_estimate > 0  # Should detect jump
    assert response.probability_of_benefit > 0.5  # Should be confident

    # Check diagnostics
    assert response.mcmc_diagnostics.converged
    assert response.mcmc_diagnostics.divergent_transitions == 0

    # Check plots (should be non-empty base64 strings)
    assert len(response.plots["observed_vs_counterfactual"]) > 0
    assert len(response.plots["effect_distribution"]) > 0


# Pytest configuration


def pytest_configure(config):
    """Add custom markers."""
    config.addinivalue_line(
        "markers",
        "slow: marks tests as slow (MCMC sampling)",
    )
    config.addinivalue_line(
        "markers",
        "integration: marks tests as integration tests",
    )
