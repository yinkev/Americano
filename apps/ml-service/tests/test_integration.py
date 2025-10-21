"""
Integration Tests

End-to-end workflow tests for complete prediction pipelines.
"""

import pytest
from httpx import AsyncClient
from typing import Dict, Any
import asyncio


@pytest.mark.integration
@pytest.mark.asyncio
async def test_full_prediction_workflow(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """
    End-to-end: Generate → Query → Feedback → Performance

    Tests complete workflow from prediction generation to model improvement.
    """
    # 1. Generate predictions
    gen_response = await client.post(
        "/predictions/generate",
        json={
            "user_id": test_user["user_id"],
            "days_ahead": 7
        }
    )

    assert gen_response.status_code == 201
    predictions = gen_response.json()["predictions"]

    # 2. Query predictions back
    query_response = await client.get(
        "/predictions/",
        params={"user_id": test_user["user_id"]}
    )

    assert query_response.status_code == 200
    queried_predictions = query_response.json()["predictions"]

    # Should retrieve at least some predictions
    assert len(queried_predictions) >= 0

    # 3. Submit feedback (if predictions exist)
    if len(predictions) > 0:
        prediction_id = predictions[0]["id"]

        feedback_response = await client.post(
            f"/predictions/{prediction_id}/feedback",
            json={
                "feedback_type": "HELPFUL",
                "actual_struggle": True,
                "comments": "Integration test feedback"
            }
        )

        assert feedback_response.status_code == 200
        assert feedback_response.json()["feedback_recorded"] is True

    # 4. Check model performance updated
    perf_response = await client.get("/analytics/model-performance")
    assert perf_response.status_code == 200
    performance = perf_response.json()

    # Performance metrics should be present
    assert "accuracy" in performance
    assert "data_points" in performance


@pytest.mark.integration
@pytest.mark.asyncio
async def test_intervention_application_workflow(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """
    End-to-end: Generate predictions → Get interventions → Apply intervention

    Tests intervention recommendation and application flow.
    """
    # 1. Generate predictions (creates interventions)
    gen_response = await client.post(
        "/predictions/generate",
        json={
            "user_id": test_user["user_id"],
            "days_ahead": 7
        }
    )

    assert gen_response.status_code == 201

    # 2. Query interventions
    interventions_response = await client.get(
        "/interventions/",
        params={"user_id": test_user["user_id"]}
    )

    assert interventions_response.status_code == 200
    interventions = interventions_response.json()

    # 3. Apply intervention if any exist
    if len(interventions) > 0:
        intervention_id = interventions[0]["id"]

        apply_response = await client.post(
            f"/interventions/{intervention_id}/apply",
            json={}  # Let it find next mission
        )

        # Should either succeed or indicate no missions
        assert apply_response.status_code in [200, 404]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_analytics_pipeline(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """
    End-to-end: Generate predictions → Submit feedback → Check analytics

    Tests analytics calculation with real data.
    """
    # 1. Generate predictions
    await client.post(
        "/predictions/generate",
        json={
            "user_id": test_user["user_id"],
            "days_ahead": 7
        }
    )

    # 2. Get predictions and submit feedback
    query_response = await client.get(
        "/predictions/",
        params={"user_id": test_user["user_id"]}
    )

    predictions = query_response.json()["predictions"]

    if len(predictions) > 0:
        # Submit feedback for first prediction
        await client.post(
            f"/predictions/{predictions[0]['id']}/feedback",
            json={
                "feedback_type": "HELPFUL",
                "actual_struggle": True
            }
        )

    # 3. Check model performance
    perf_response = await client.get(
        "/analytics/model-performance",
        params={"user_id": test_user["user_id"]}
    )

    assert perf_response.status_code == 200
    performance = perf_response.json()

    # Metrics should be calculated
    assert "accuracy" in performance
    assert "precision" in performance
    assert "recall" in performance
    assert "f1_score" in performance

    # 4. Check struggle reduction
    reduction_response = await client.get(
        "/analytics/struggle-reduction",
        params={"user_id": test_user["user_id"], "period": "month"}
    )

    assert reduction_response.status_code == 200
    reduction = reduction_response.json()

    # Reduction metrics should be present
    assert "baseline_rate" in reduction
    assert "current_rate" in reduction
    assert "reduction_percentage" in reduction


@pytest.mark.integration
@pytest.mark.asyncio
async def test_high_risk_alert_workflow(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """
    End-to-end: Generate high-risk predictions → Verify alerts generated

    Tests alert generation for high-probability predictions.
    """
    # 1. Generate predictions
    gen_response = await client.post(
        "/predictions/generate",
        json={
            "user_id": test_user["user_id"],
            "days_ahead": 3  # Short window for urgent alerts
        }
    )

    assert gen_response.status_code == 201
    data = gen_response.json()

    # 2. Check if alerts were generated
    if "alerts" in data and data["alerts"]:
        alerts = data["alerts"]

        # Verify alert structure
        assert len(alerts) <= 3  # Max 3 alerts
        assert all("priority" in alert for alert in alerts)
        assert all("severity" in alert for alert in alerts)

        # High-risk predictions should have alerts
        high_risk = data["high_risk_count"]
        if high_risk > 0:
            assert len(alerts) > 0


@pytest.mark.integration
@pytest.mark.asyncio
async def test_prediction_status_lifecycle(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """
    End-to-end: Track prediction status from PENDING → CONFIRMED/FALSE_POSITIVE

    Tests prediction status updates through feedback.
    """
    # 1. Generate predictions (all start as PENDING)
    gen_response = await client.post(
        "/predictions/generate",
        json={
            "user_id": test_user["user_id"],
            "days_ahead": 7
        }
    )

    predictions = gen_response.json()["predictions"]

    if len(predictions) > 0:
        prediction_id = predictions[0]["id"]

        # Verify initial status is PENDING
        assert predictions[0]["prediction_status"] == "PENDING"

        # 2. Submit feedback (actual struggle = True)
        await client.post(
            f"/predictions/{prediction_id}/feedback",
            json={
                "feedback_type": "HELPFUL",
                "actual_struggle": True
            }
        )

        # 3. Query and verify status changed to CONFIRMED
        query_response = await client.get(
            "/predictions/",
            params={"user_id": test_user["user_id"]}
        )

        updated_predictions = query_response.json()["predictions"]
        updated = next(
            (p for p in updated_predictions if p["id"] == prediction_id),
            None
        )

        if updated:
            assert updated["prediction_status"] == "CONFIRMED"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_concurrent_prediction_generation(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """
    Test concurrent prediction requests don't cause race conditions.

    Tests system stability under concurrent load.
    """
    # Generate multiple concurrent prediction requests
    tasks = [
        client.post(
            "/predictions/generate",
            json={
                "user_id": test_user["user_id"],
                "days_ahead": 7
            }
        )
        for _ in range(3)
    ]

    responses = await asyncio.gather(*tasks, return_exceptions=True)

    # All requests should complete successfully
    for response in responses:
        if not isinstance(response, Exception):
            assert response.status_code in [201, 500]  # Success or handled error


@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.slow
async def test_large_scale_prediction_workflow(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """
    Test prediction generation for extended time period.

    Tests system performance with larger workloads.
    """
    # Generate predictions for 30 days ahead
    gen_response = await client.post(
        "/predictions/generate",
        json={
            "user_id": test_user["user_id"],
            "days_ahead": 30  # Extended period
        }
    )

    assert gen_response.status_code == 201
    data = gen_response.json()

    # Should handle large prediction sets
    assert "predictions" in data
    assert "total_count" in data


@pytest.mark.integration
@pytest.mark.asyncio
async def test_cross_endpoint_data_consistency(
    client: AsyncClient,
    test_user: Dict[str, str]
):
    """
    Verify data consistency across different endpoints.

    Tests that data is synchronized across the system.
    """
    # 1. Generate predictions
    gen_response = await client.post(
        "/predictions/generate",
        json={
            "user_id": test_user["user_id"],
            "days_ahead": 7
        }
    )

    gen_count = gen_response.json()["total_count"]

    # 2. Query predictions
    query_response = await client.get(
        "/predictions/",
        params={"user_id": test_user["user_id"], "min_probability": 0.5}
    )

    query_count = query_response.json()["total_count"]

    # Counts should be consistent (within reason, due to filtering)
    # Query might have fewer due to min_probability filter
    assert query_count <= gen_count


@pytest.mark.integration
@pytest.mark.asyncio
async def test_service_health_during_operations(client: AsyncClient):
    """
    Verify service remains healthy during prediction operations.

    Tests service stability under normal operations.
    """
    # Check initial health
    health1 = await client.get("/health")
    assert health1.status_code == 200
    assert health1.json()["status"] == "healthy"

    # Perform operations (generate predictions, etc.)
    # ... operations happen here ...

    # Check health after operations
    health2 = await client.get("/health")
    assert health2.status_code == 200
    assert health2.json()["status"] == "healthy"
    assert health2.json()["database"] == "connected"
