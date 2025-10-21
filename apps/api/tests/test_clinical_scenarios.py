"""
Test cases for Story 4.2: Clinical Reasoning Scenarios.

Tests the clinical scenario generation and evaluation endpoints
with mock data to avoid actual OpenAI API calls during testing.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from pydantic import BaseModel

# Import the FastAPI app
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from src.validation.models import (
    ScenarioGenerationRequest,
    ScenarioGenerationResponse,
    ClinicalEvaluationRequest,
    ClinicalEvaluationResult,
    CaseStructure,
    CompetencyScores
)

# Create test client
client = TestClient(app)


class TestClinicalScenarioGeneration:
    """Test cases for clinical scenario generation endpoint."""

    def test_generate_scenario_success(self):
        """Test successful scenario generation with valid request."""
        request_data = {
            "objective_id": "obj_12345",
            "objective_text": "Understand the pathophysiology and management of acute myocardial infarction",
            "board_exam_tags": ["USMLE-Step2-Cardiology", "COMLEX-L2-Cardiovascular"],
            "difficulty": "INTERMEDIATE"
        }

        # Mock the scenario generator to avoid actual OpenAI calls
        mock_response = ScenarioGenerationResponse(
            scenario_id="scenario_abc123def456",
            objective_id="obj_12345",
            scenario_type="DIAGNOSIS",
            difficulty="INTERMEDIATE",
            case_text=CaseStructure(
                chief_complaint="Chest pain",
                demographics={"age": 65, "sex": "M", "occupation": "retired"},
                history={
                    "presenting": "Sudden onset substernal chest pain radiating to left arm",
                    "past": "Hypertension, hyperlipidemia",
                    "medications": ["Lisinopril", "Atorvastatin"],
                    "allergies": "NKDA",
                    "social": "Former smoker, quit 10 years ago",
                    "family": "Father had MI at age 60"
                },
                physical_exam={
                    "vitals": {"BP": "160/95", "HR": "102", "RR": "22", "T": "37.1°C"},
                    "general": "Diaphoretic, anxious appearing",
                    "cardiovascular": "S4 gallop, no murmurs",
                    "respiratory": "Clear bilaterally"
                },
                labs={
                    "available": False,
                    "options": ["ECG", "Cardiac enzymes", "CBC", "BMP", "CXR"]
                },
                questions=[
                    {
                        "stage": "initial",
                        "prompt": "What is the most appropriate next step?",
                        "options": ["Order ECG", "Give nitroglycerin", "Start aspirin", "Wait and observe"],
                        "correctAnswer": "Order ECG",
                        "reasoning": "ECG is first-line for suspected ACS to evaluate for ST changes"
                    }
                ]
            ),
            board_exam_topic="Cardiovascular Medicine"
        )

        with patch('src.validation.routes.scenario_generator.generate_scenario', new_callable=AsyncMock) as mock_generate:
            mock_generate.return_value = mock_response

            response = client.post("/validation/scenarios/generate", json=request_data)

            assert response.status_code == 200
            data = response.json()
            assert data["scenario_id"] == "scenario_abc123def456"
            assert data["objective_id"] == "obj_12345"
            assert data["scenario_type"] == "DIAGNOSIS"
            assert data["difficulty"] == "INTERMEDIATE"
            assert "case_text" in data
            assert data["board_exam_topic"] == "Cardiovascular Medicine"

    def test_generate_scenario_difficulty_levels(self):
        """Test scenario generation with different difficulty levels."""
        for difficulty in ["BASIC", "INTERMEDIATE", "ADVANCED"]:
            request_data = {
                "objective_id": f"obj_{difficulty.lower()}",
                "objective_text": "Test objective for difficulty testing",
                "board_exam_tags": ["USMLE-Step2-Internal-Medicine"],
                "difficulty": difficulty
            }

            mock_response = ScenarioGenerationResponse(
                scenario_id=f"scenario_{difficulty.lower()}",
                objective_id=request_data["objective_id"],
                scenario_type="DIAGNOSIS",
                difficulty=difficulty,
                case_text=CaseStructure(
                    chief_complaint=f"Test case for {difficulty} difficulty",
                    demographics={"age": 45, "sex": "F"},
                    history={"presenting": "Test history"},
                    physical_exam={"vitals": {"BP": "120/80"}},
                    labs={"available": False, "options": []},
                    questions=[]
                ),
                board_exam_topic="Internal Medicine"
            )

            with patch('src.validation.routes.scenario_generator.generate_scenario', new_callable=AsyncMock) as mock_generate:
                mock_generate.return_value = mock_response

                response = client.post("/validation/scenarios/generate", json=request_data)
                assert response.status_code == 200
                data = response.json()
                assert data["difficulty"] == difficulty

    def test_generate_scenario_invalid_request(self):
        """Test scenario generation with invalid request data."""
        # Missing required fields
        invalid_request = {
            "objective_id": "obj_123",
            # Missing objective_text, board_exam_tags
        }

        response = client.post("/validation/scenarios/generate", json=invalid_request)
        assert response.status_code == 422  # Validation error

    def test_generate_scenario_invalid_difficulty(self):
        """Test scenario generation with invalid difficulty level."""
        request_data = {
            "objective_id": "obj_123",
            "objective_text": "Test objective",
            "board_exam_tags": ["USMLE-Step2-Cardiology"],
            "difficulty": "INVALID"
        }

        response = client.post("/validation/scenarios/generate", json=request_data)
        assert response.status_code == 422  # Validation error


class TestClinicalReasoningEvaluation:
    """Test cases for clinical reasoning evaluation endpoint."""

    def test_evaluate_reasoning_success(self):
        """Test successful clinical reasoning evaluation."""
        request_data = {
            "scenario_id": "scenario_abc123",
            "user_choices": {
                "initial": "Order ECG",
                "ecg_results": "Start aspirin and nitroglycerin",
                "treatment": "Activate cath lab"
            },
            "user_reasoning": "Patient presents with classic ACS symptoms. ECG is first diagnostic step, then immediate anti-ischemic therapy.",
            "time_spent": 480,
            "case_summary": "65M with chest pain, diaphoretic, S4 gallop. Suspected acute MI."
        }

        mock_evaluation = ClinicalEvaluationResult(
            overall_score=85,
            competency_scores=CompetencyScores(
                data_gathering=90,
                diagnosis=85,
                management=80,
                clinical_reasoning=85
            ),
            strengths=[
                "Recognized classic ACS presentation quickly",
                "Followed appropriate diagnostic pathway (ECG first)",
                "Initiated evidence-based anti-ischemic therapy"
            ],
            weaknesses=[
                "Could have asked more specific chest pain characteristics",
                "Did not mention contraindications for nitroglycerin"
            ],
            missed_findings=["No specific mention of pain radiation pattern"],
            cognitive_biases=[],
            optimal_pathway="Immediate ECG, start aspirin/nitroglycerin, activate cath lab for suspected STEMI",
            teaching_points=[
                "Review MONA therapy and contraindications - UpToDate ACS guidelines",
                "Practice door-to-balloon time targets - AHA/ACC protocols"
            ]
        )

        with patch('src.validation.routes.scenario_evaluator.evaluate_reasoning', new_callable=AsyncMock) as mock_evaluate:
            mock_evaluate.return_value = mock_evaluation

            response = client.post("/validation/scenarios/evaluate", json=request_data)

            assert response.status_code == 200
            data = response.json()
            assert data["overall_score"] == 85
            assert "competency_scores" in data
            assert data["competency_scores"]["data_gathering"] == 90
            assert len(data["strengths"]) >= 2
            assert len(data["teaching_points"]) >= 2

    def test_evaluate_reasoning_with_biases(self):
        """Test evaluation that detects cognitive biases."""
        request_data = {
            "scenario_id": "scenario_abc123",
            "user_choices": {
                "initial": "Immediately treat for GERD without ECG",
                "symptoms": "Give PPIs",
                "followup": "Schedule endoscopy"
            },
            "user_reasoning": "This sounds like typical GERD chest pain. No need for cardiac workup given atypical symptoms.",
            "time_spent": 300,
            "case_summary": "65M with chest pain, diaphoretic, S4 gallop. Suspected acute MI."
        }

        mock_evaluation = ClinicalEvaluationResult(
            overall_score=45,
            competency_scores=CompetencyScores(
                data_gathering=40,
                diagnosis=35,
                management=50,
                clinical_reasoning=55
            ),
            strengths=[
                "Considered alternative diagnoses",
                "Attempted to provide systematic reasoning"
            ],
            weaknesses=[
                "Missed critical cardiac red flags",
                "Premature closure on GERD diagnosis",
                "Did not obtain basic cardiac workup"
            ],
            missed_findings=["Diaphoresis, S4 gallop, age > 60"],
            cognitive_biases=["Anchoring bias", "Premature closure", "Availability bias"],
            optimal_pathway="Immediate cardiac workup for chest pain in elderly patient with red flags",
            teaching_points=[
                "Review ACS red flags and when not to miss - NEJM Chest Pain Guidelines",
                "Practice cognitive bias awareness - JAMA Clinical Reasoning series"
            ]
        )

        with patch('src.validation.routes.scenario_evaluator.evaluate_reasoning', new_callable=AsyncMock) as mock_evaluate:
            mock_evaluate.return_value = mock_evaluation

            response = client.post("/validation/scenarios/evaluate", json=request_data)

            assert response.status_code == 200
            data = response.json()
            assert data["overall_score"] == 45
            assert len(data["cognitive_biases"]) > 0
            assert "Anchoring bias" in str(data["cognitive_biases"])

    def test_evaluate_reasoning_invalid_request(self):
        """Test evaluation with invalid request data."""
        invalid_request = {
            "scenario_id": "scenario_123",
            # Missing required fields
        }

        response = client.post("/validation/scenarios/evaluate", json=invalid_request)
        assert response.status_code == 422  # Validation error


class TestScenarioRetrieval:
    """Test cases for scenario retrieval endpoint."""

    def test_get_scenario_success(self):
        """Test successful scenario retrieval."""
        scenario_id = "scenario_abc123def456"

        response = client.get(f"/validation/scenarios/{scenario_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["scenario_id"] == scenario_id
        assert "case_text" in data
        assert "scenario_type" in data

    def test_get_scenario_not_found(self):
        """Test scenario retrieval with invalid ID."""
        invalid_id = "invalid_scenario_id"

        response = client.get(f"/validation/scenarios/{invalid_id}")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_scenario_empty_id(self):
        """Test scenario retrieval with empty ID."""
        response = client.get("/validation/scenarios/")
        assert response.status_code == 404  # Not found (route doesn't exist)


class TestClinicalMetrics:
    """Test cases for clinical metrics endpoint."""

    def test_get_metrics_default(self):
        """Test metrics retrieval with default parameters."""
        response = client.get("/validation/scenarios/metrics")

        assert response.status_code == 200
        data = response.json()
        assert "period" in data
        assert "competency_averages" in data
        assert "overall_average" in data
        assert "weak_competencies" in data
        assert "scenario_type_distribution" in data
        assert "board_exam_coverage" in data
        assert "recent_performance" in data

    def test_get_metrics_with_filters(self):
        """Test metrics retrieval with query parameters."""
        params = {
            "dateRange": "7days",
            "scenarioType": "DIAGNOSIS"
        }

        response = client.get("/validation/scenarios/metrics", params=params)

        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "7days"
        assert "scenario_type_filter" in data

    def test_get_metrics_different_ranges(self):
        """Test metrics with different date ranges."""
        for date_range in ["7days", "30days", "90days"]:
            response = client.get("/validation/scenarios/metrics", params={"dateRange": date_range})

            assert response.status_code == 200
            data = response.json()
            assert data["period"] == date_range


class TestErrorHandling:
    """Test cases for error handling and edge cases."""

    def test_service_unavailable_scenario_generation(self):
        """Test handling when OpenAI service is unavailable during scenario generation."""
        request_data = {
            "objective_id": "obj_123",
            "objective_text": "Test objective",
            "board_exam_tags": ["USMLE-Step2-Cardiology"],
            "difficulty": "INTERMEDIATE"
        }

        with patch('src.validation.routes.scenario_generator.generate_scenario', new_callable=AsyncMock) as mock_generate:
            mock_generate.side_effect = Exception("OpenAI API unavailable")

            response = client.post("/validation/scenarios/generate", json=request_data)
            assert response.status_code == 500
            assert "failed" in response.json()["detail"].lower()

    def test_service_unavailable_evaluation(self):
        """Test handling when OpenAI service is unavailable during evaluation."""
        request_data = {
            "scenario_id": "scenario_123",
            "user_choices": {"test": "choice"},
            "user_reasoning": "Test reasoning",
            "time_spent": 300,
            "case_summary": "Test case"
        }

        with patch('src.validation.routes.scenario_evaluator.evaluate_reasoning', new_callable=AsyncMock) as mock_evaluate:
            mock_evaluate.side_effect = Exception("OpenAI API unavailable")

            response = client.post("/validation/scenarios/evaluate", json=request_data)
            assert response.status_code == 500
            assert "failed" in response.json()["detail"].lower()


class TestHealthEndpoint:
    """Test cases for health check endpoint."""

    def test_health_check(self):
        """Test health check endpoint."""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
        assert "version" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])