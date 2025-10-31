"""Test coverage for the mock routers that back the web tier."""

from __future__ import annotations

from pathlib import Path
import sys

from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.main import app

client = TestClient(app)


def test_get_predictions_defaults():
    response = client.get("/predictions")
    assert response.status_code == 200
    payload = response.json()

    assert payload["success"] is True
    assert payload["dataSource"] == "mock"
    assert payload["count"] == len(payload["predictions"])
    assert all(pred["predictionStatus"] == "PENDING" for pred in payload["predictions"])


def test_get_predictions_validation():
    response = client.get("/predictions", params={"minProbability": 1.5})
    assert response.status_code == 422


def test_generate_predictions_success():
    response = client.post(
        "/predictions/generate",
        json={"userId": "mock-user@americano.dev", "daysAhead": 7},
    )
    assert response.status_code == 200
    payload = response.json()

    assert payload["success"] is True
    assert payload["dataSource"] == "mock"
    assert payload["predictions"]
    assert payload["alerts"]


def test_generate_predictions_requires_user():
    response = client.post("/predictions/generate", json={"daysAhead": 7})
    assert response.status_code == 422


def test_prediction_feedback_success():
    response = client.post(
        "/predictions/pred-123/feedback",
        json={"actualStruggle": True, "feedbackType": "HELPFUL"},
    )
    assert response.status_code == 200
    payload = response.json()

    assert payload["success"] is True
    assert payload["dataSource"] == "mock"
    assert payload["predictionId"] == "pred-123"


def test_interventions_success():
    response = client.get("/interventions", params={"userId": "mock-user@americano.dev"})
    assert response.status_code == 200
    payload = response.json()

    assert payload["success"] is True
    assert payload["dataSource"] == "mock"
    assert payload["count"] == len(payload["interventions"])
    assert all(item["userId"] == "mock-user@americano.dev" for item in payload["interventions"])


def test_model_performance_success():
    response = client.get("/model-performance", params={"userId": "mock-user@americano.dev"})
    assert response.status_code == 200
    payload = response.json()

    assert payload["success"] is True
    assert payload["dataSource"] == "mock"
    assert payload["userId"] == "mock-user@americano.dev"


def test_struggle_reduction_success():
    response = client.get(
        "/struggle-reduction",
        params={"userId": "mock-user@americano.dev", "period": "week"},
    )
    assert response.status_code == 200
    payload = response.json()

    assert payload["success"] is True
    assert payload["dataSource"] == "mock"
    assert payload["period"] == "week"

