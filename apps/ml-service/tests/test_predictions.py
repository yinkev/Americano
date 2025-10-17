"""
Prediction Endpoints Tests

Tests for 3 prediction endpoints:
- POST /predictions/generate
- GET /predictions
- POST /predictions/{id}/feedback
"""

import pytest
from httpx import AsyncClient
from typing import Dict, Any


# ==================== POST /predictions/generate ====================

@pytest.mark.asyncio
@pytest.mark.api
async def test_generate_predictions_success(client: AsyncClient, test_user: Dict[str, str]):
    """Test successful prediction generation."""
    response = await client.post(
        "/predictions/generate",
        json={
            "user_id": test_user["user_id"],
            "days_ahead": 7
        }
    )

    assert response.status_code == 201
    data = response.json()

    assert "predictions" in data
    assert isinstance(data["predictions"], list)
    assert "total_count" in data
    assert "high_risk_count" in data
    assert "medium_risk_count" in data
    assert "low_risk_count" in data

    # Risk counts should sum to total
    assert data["total_count"] == (
        data["high_risk_count"] + data["medium_risk_count"] + data["low_risk_count"]
    )


@pytest.mark.asyncio
@pytest.mark.api
async def test_generate_predictions_custom_days_ahead(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test prediction generation with custom days_ahead parameter."""
    response = await client.post(
        "/predictions/generate",
        json={
            "user_id": test_user["user_id"],
            "days_ahead": 14  # Two weeks ahead
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert isinstance(data["predictions"], list)


@pytest.mark.asyncio
@pytest.mark.api
async def test_generate_predictions_invalid_days_ahead(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test prediction generation rejects invalid days_ahead."""
    response = await client.post(
        "/predictions/generate",
        json={
            "user_id": test_user["user_id"],
            "days_ahead": -5  # Negative days
        }
    )

    # Should fail validation or handle gracefully
    assert response.status_code in [400, 422, 500]


@pytest.mark.asyncio
@pytest.mark.api
async def test_generate_predictions_missing_user_id(client: AsyncClient):
    """Test prediction generation requires user_id."""
    response = await client.post(
        "/predictions/generate",
        json={
            "days_ahead": 7
        }
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_generate_predictions_nonexistent_user(client: AsyncClient):
    """Test prediction generation with nonexistent user."""
    response = await client.post(
        "/predictions/generate",
        json={
            "user_id": "nonexistent-user-999",
            "days_ahead": 7
        }
    )

    # Should complete (may return empty predictions)
    assert response.status_code in [201, 404]


@pytest.mark.asyncio
@pytest.mark.api
async def test_generate_predictions_response_structure(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test prediction response has correct structure."""
    response = await client.post(
        "/predictions/generate",
        json={
            "user_id": test_user["user_id"],
            "days_ahead": 7
        }
    )

    assert response.status_code == 201
    data = response.json()

    # Check each prediction has required fields
    if data["predictions"]:
        pred = data["predictions"][0]
        required_fields = [
            "id", "user_id", "prediction_date",
            "predicted_struggle_probability", "prediction_confidence",
            "prediction_status", "risk_level", "feature_vector"
        ]
        for field in required_fields:
            assert field in pred, f"Missing field: {field}"

        # Validate probability range
        assert 0.0 <= pred["predicted_struggle_probability"] <= 1.0
        assert 0.0 <= pred["prediction_confidence"] <= 1.0

        # Validate risk level
        assert pred["risk_level"] in ["LOW", "MEDIUM", "HIGH"]


# ==================== GET /predictions ====================

@pytest.mark.asyncio
@pytest.mark.api
async def test_get_predictions_success(client: AsyncClient, test_user: Dict[str, str]):
    """Test successful prediction query."""
    response = await client.get(
        "/predictions/",
        params={"user_id": test_user["user_id"]}
    )

    assert response.status_code == 200
    data = response.json()

    assert "predictions" in data
    assert isinstance(data["predictions"], list)
    assert "total_count" in data


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_predictions_with_status_filter(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test prediction query with status filter."""
    response = await client.get(
        "/predictions/",
        params={
            "user_id": test_user["user_id"],
            "status": "PENDING"
        }
    )

    assert response.status_code == 200
    data = response.json()

    # All returned predictions should have PENDING status
    for pred in data["predictions"]:
        assert pred["prediction_status"] == "PENDING"


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_predictions_with_min_probability(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test prediction query with minimum probability filter."""
    response = await client.get(
        "/predictions/",
        params={
            "user_id": test_user["user_id"],
            "min_probability": 0.7
        }
    )

    assert response.status_code == 200
    data = response.json()

    # All returned predictions should meet minimum probability
    for pred in data["predictions"]:
        assert pred["predicted_struggle_probability"] >= 0.7


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_predictions_missing_user_id(client: AsyncClient):
    """Test prediction query requires user_id."""
    response = await client.get("/predictions/")

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_predictions_sorted_by_date(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """Test predictions are sorted by date ascending."""
    response = await client.get(
        "/predictions/",
        params={"user_id": test_user["user_id"]}
    )

    assert response.status_code == 200
    data = response.json()

    if len(data["predictions"]) > 1:
        dates = [pred["prediction_date"] for pred in data["predictions"]]
        # Check dates are in ascending order
        assert dates == sorted(dates)


# ==================== POST /predictions/{id}/feedback ====================

@pytest.mark.asyncio
@pytest.mark.api
async def test_submit_feedback_success(
    client: AsyncClient,
    test_prediction: Dict[str, Any]
):
    """Test successful feedback submission."""
    response = await client.post(
        f"/predictions/{test_prediction['prediction_id']}/feedback",
        json={
            "feedback_type": "HELPFUL",
            "actual_struggle": True,
            "comments": "The prediction was accurate and helpful"
        }
    )

    assert response.status_code == 200
    data = response.json()

    assert data["feedback_recorded"] is True
    assert data["prediction_id"] == test_prediction["prediction_id"]
    assert "feedback_id" in data
    assert "message" in data


@pytest.mark.asyncio
@pytest.mark.api
async def test_submit_feedback_updates_prediction_status(
    client: AsyncClient,
    test_prediction: Dict[str, Any],
    test_user: Dict[str, str]
):
    """Test feedback updates prediction status to CONFIRMED or FALSE_POSITIVE."""
    # Submit feedback indicating struggle
    response = await client.post(
        f"/predictions/{test_prediction['prediction_id']}/feedback",
        json={
            "feedback_type": "HELPFUL",
            "actual_struggle": True
        }
    )

    assert response.status_code == 200

    # Query predictions and verify status updated
    query_response = await client.get(
        "/predictions/",
        params={"user_id": test_user["user_id"]}
    )

    data = query_response.json()
    updated_pred = next(
        (p for p in data["predictions"] if p["id"] == test_prediction["prediction_id"]),
        None
    )

    if updated_pred:
        assert updated_pred["prediction_status"] in ["CONFIRMED", "FALSE_POSITIVE"]


@pytest.mark.asyncio
@pytest.mark.api
async def test_submit_feedback_false_positive(
    client: AsyncClient,
    test_prediction: Dict[str, Any]
):
    """Test feedback submission for false positive."""
    response = await client.post(
        f"/predictions/{test_prediction['prediction_id']}/feedback",
        json={
            "feedback_type": "INACCURATE",
            "actual_struggle": False,
            "comments": "I didn't struggle at all"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["feedback_recorded"] is True


@pytest.mark.asyncio
@pytest.mark.api
async def test_submit_feedback_nonexistent_prediction(client: AsyncClient):
    """Test feedback submission for nonexistent prediction."""
    response = await client.post(
        "/predictions/nonexistent-prediction-999/feedback",
        json={
            "feedback_type": "HELPFUL",
            "actual_struggle": True
        }
    )

    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.api
async def test_submit_feedback_missing_required_fields(
    client: AsyncClient,
    test_prediction: Dict[str, Any]
):
    """Test feedback submission requires all fields."""
    response = await client.post(
        f"/predictions/{test_prediction['prediction_id']}/feedback",
        json={
            "feedback_type": "HELPFUL"
            # Missing actual_struggle
        }
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_submit_feedback_invalid_type(
    client: AsyncClient,
    test_prediction: Dict[str, Any]
):
    """Test feedback submission rejects invalid feedback type."""
    response = await client.post(
        f"/predictions/{test_prediction['prediction_id']}/feedback",
        json={
            "feedback_type": "INVALID_TYPE",
            "actual_struggle": True
        }
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_submit_feedback_with_optional_comments(
    client: AsyncClient,
    test_prediction: Dict[str, Any]
):
    """Test feedback submission with optional comments field."""
    # Without comments
    response = await client.post(
        f"/predictions/{test_prediction['prediction_id']}/feedback",
        json={
            "feedback_type": "HELPFUL",
            "actual_struggle": True
        }
    )

    assert response.status_code == 200
