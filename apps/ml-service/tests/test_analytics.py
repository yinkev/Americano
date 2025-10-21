"""
Analytics Endpoints Tests

Tests for 2 analytics endpoints:
- GET /analytics/model-performance
- GET /analytics/struggle-reduction
"""

import pytest
from httpx import AsyncClient
from typing import Dict, Any


# ==================== GET /analytics/model-performance ====================

@pytest.mark.asyncio
@pytest.mark.api
async def test_get_model_performance_success(client: AsyncClient):
    """Test successful model performance query."""
    response = await client.get("/analytics/model-performance")

    assert response.status_code == 200
    data = response.json()

    required_fields = [
        "accuracy", "precision", "recall", "f1_score",
        "calibration", "model_type", "model_version",
        "last_updated", "data_points"
    ]
    for field in required_fields:
        assert field in data, f"Missing field: {field}"


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_model_performance_metrics_range(client: AsyncClient):
    """Test model performance metrics are in valid range."""
    response = await client.get("/analytics/model-performance")

    assert response.status_code == 200
    data = response.json()

    # All metrics should be 0-1
    assert 0.0 <= data["accuracy"] <= 1.0
    assert 0.0 <= data["precision"] <= 1.0
    assert 0.0 <= data["recall"] <= 1.0
    assert 0.0 <= data["f1_score"] <= 1.0


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_model_performance_calibration_structure(client: AsyncClient):
    """Test calibration data has correct structure."""
    response = await client.get("/analytics/model-performance")

    assert response.status_code == 200
    data = response.json()

    assert "calibration" in data
    calibration = data["calibration"]

    assert "prob_true" in calibration
    assert "prob_pred" in calibration
    assert isinstance(calibration["prob_true"], list)
    assert isinstance(calibration["prob_pred"], list)


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_model_performance_with_user_filter(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test model performance query with user filter."""
    response = await client.get(
        "/analytics/model-performance",
        params={"user_id": test_user["user_id"]}
    )

    assert response.status_code == 200
    data = response.json()

    # Should return metrics for specific user
    assert "accuracy" in data


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_model_performance_insufficient_data(client: AsyncClient):
    """Test model performance with insufficient data returns zeros."""
    # Query for nonexistent user (no data)
    response = await client.get(
        "/analytics/model-performance",
        params={"user_id": "user-with-no-data"}
    )

    assert response.status_code == 200
    data = response.json()

    # Should return 0 metrics when insufficient data
    if data["data_points"] < 10:
        assert data["accuracy"] == 0.0
        assert data["precision"] == 0.0
        assert data["recall"] == 0.0
        assert data["f1_score"] == 0.0


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_model_performance_includes_metadata(client: AsyncClient):
    """Test model performance includes model metadata."""
    response = await client.get("/analytics/model-performance")

    assert response.status_code == 200
    data = response.json()

    assert "model_type" in data
    assert "model_version" in data
    assert "last_updated" in data
    assert "data_points" in data

    # Model type should be valid
    assert data["model_type"] in ["rule-based", "logistic-regression", "ml"]


# ==================== GET /analytics/struggle-reduction ====================

@pytest.mark.asyncio
@pytest.mark.api
async def test_get_struggle_reduction_success(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test successful struggle reduction query."""
    response = await client.get(
        "/analytics/struggle-reduction",
        params={"user_id": test_user["user_id"]}
    )

    assert response.status_code == 200
    data = response.json()

    required_fields = [
        "baseline_rate", "current_rate", "reduction_percentage",
        "timeline", "intervention_effectiveness", "period"
    ]
    for field in required_fields:
        assert field in data, f"Missing field: {field}"


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_struggle_reduction_with_period_week(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test struggle reduction query with week period."""
    response = await client.get(
        "/analytics/struggle-reduction",
        params={
            "user_id": test_user["user_id"],
            "period": "week"
        }
    )

    assert response.status_code == 200
    data = response.json()

    assert data["period"] == "week"


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_struggle_reduction_with_period_month(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test struggle reduction query with month period."""
    response = await client.get(
        "/analytics/struggle-reduction",
        params={
            "user_id": test_user["user_id"],
            "period": "month"
        }
    )

    assert response.status_code == 200
    data = response.json()

    assert data["period"] == "month"


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_struggle_reduction_timeline_structure(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test struggle reduction timeline has correct structure."""
    response = await client.get(
        "/analytics/struggle-reduction",
        params={"user_id": test_user["user_id"]}
    )

    assert response.status_code == 200
    data = response.json()

    assert "timeline" in data
    assert isinstance(data["timeline"], list)

    if len(data["timeline"]) > 0:
        point = data["timeline"][0]
        required_fields = ["date", "struggle_rate", "struggles_count", "topics_studied"]
        for field in required_fields:
            assert field in point, f"Missing field: {field}"


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_struggle_reduction_intervention_effectiveness(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test intervention effectiveness data structure."""
    response = await client.get(
        "/analytics/struggle-reduction",
        params={"user_id": test_user["user_id"]}
    )

    assert response.status_code == 200
    data = response.json()

    assert "intervention_effectiveness" in data
    assert isinstance(data["intervention_effectiveness"], list)

    if len(data["intervention_effectiveness"]) > 0:
        item = data["intervention_effectiveness"][0]
        assert "intervention_type" in item
        assert "applications" in item
        assert "success_rate" in item

        # Success rate should be 0-1
        assert 0.0 <= item["success_rate"] <= 1.0


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_struggle_reduction_calculates_correctly(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test struggle reduction percentage calculation."""
    response = await client.get(
        "/analytics/struggle-reduction",
        params={"user_id": test_user["user_id"]}
    )

    assert response.status_code == 200
    data = response.json()

    baseline = data["baseline_rate"]
    current = data["current_rate"]
    reduction = data["reduction_percentage"]

    # Validate calculation
    if baseline > 0:
        expected_reduction = ((baseline - current) / baseline) * 100
        # Allow small floating point difference
        assert abs(reduction - expected_reduction) < 0.01


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_struggle_reduction_missing_user_id(client: AsyncClient):
    """Test struggle reduction query requires user_id."""
    response = await client.get("/analytics/struggle-reduction")

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_struggle_reduction_includes_counts(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test struggle reduction includes summary counts."""
    response = await client.get(
        "/analytics/struggle-reduction",
        params={"user_id": test_user["user_id"]}
    )

    assert response.status_code == 200
    data = response.json()

    assert "total_predictions" in data
    assert "total_interventions_applied" in data
    assert "user_feedback_count" in data

    # Counts should be non-negative
    assert data["total_predictions"] >= 0
    assert data["total_interventions_applied"] >= 0
    assert data["user_feedback_count"] >= 0


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_struggle_reduction_includes_date_range(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test struggle reduction includes date range information."""
    response = await client.get(
        "/analytics/struggle-reduction",
        params={"user_id": test_user["user_id"]}
    )

    assert response.status_code == 200
    data = response.json()

    assert "current_period_start" in data
    assert "current_period_end" in data

    # Dates should be valid ISO format
    from datetime import datetime
    datetime.fromisoformat(data["current_period_start"].replace("Z", "+00:00"))
    datetime.fromisoformat(data["current_period_end"].replace("Z", "+00:00"))
