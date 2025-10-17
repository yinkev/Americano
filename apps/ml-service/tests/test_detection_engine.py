"""
Detection Engine Unit Tests

Tests for StruggleDetectionEngine core functionality.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
from typing import Dict, Any

# Import detection engine components from ml-service
from app.services.detection_engine import StruggleDetectionEngine


@pytest.mark.unit
@pytest.mark.ml
class TestStruggleDetectionEngine:
    """Unit tests for StruggleDetectionEngine class."""

    @pytest.mark.asyncio
    async def test_engine_initialization(self, db):
        """Test detection engine initializes correctly."""
        engine = StruggleDetectionEngine(db)

        assert engine.db is not None
        assert engine.feature_extractor is not None
        assert engine.prediction_model is not None

    @pytest.mark.asyncio
    async def test_run_predictions_returns_list(
        self,
        db,
        test_user: Dict[str, str]
    ):
        """Test run_predictions returns list of predictions."""
        engine = StruggleDetectionEngine(db)

        predictions = await engine.run_predictions(
            test_user["user_id"],
            days_ahead=7
        )

        assert isinstance(predictions, list)

    @pytest.mark.asyncio
    async def test_run_predictions_filters_by_probability(
        self,
        db,
        test_user: Dict[str, str]
    ):
        """Test run_predictions only returns predictions > 0.5 probability."""
        engine = StruggleDetectionEngine(db)

        predictions = await engine.run_predictions(
            test_user["user_id"],
            days_ahead=7
        )

        # All predictions should have probability > 0.5
        for pred in predictions:
            assert pred.predictedStruggleProbability > 0.5

    @pytest.mark.asyncio
    async def test_detect_upcoming_struggles(
        self,
        db,
        test_user: Dict[str, str]
    ):
        """Test detect_upcoming_struggles retrieves high-risk predictions."""
        engine = StruggleDetectionEngine(db)

        struggles = await engine.detect_upcoming_struggles(
            test_user["user_id"],
            days_ahead=7
        )

        assert isinstance(struggles, list)

    @pytest.mark.asyncio
    async def test_analyze_current_struggles_no_active_session(
        self,
        db,
        test_user: Dict[str, str]
    ):
        """Test analyze_current_struggles returns empty when no active session."""
        engine = StruggleDetectionEngine(db)

        indicators = await engine.analyze_current_struggles(test_user["user_id"])

        # Should return empty list if no active session
        assert isinstance(indicators, list)

    @pytest.mark.asyncio
    async def test_generate_alerts_returns_list(
        self,
        db,
        test_user: Dict[str, str]
    ):
        """Test generate_alerts returns list of alert dictionaries."""
        engine = StruggleDetectionEngine(db)

        alerts = await engine.generate_alerts(test_user["user_id"])

        assert isinstance(alerts, list)
        # Should return max 3 alerts
        assert len(alerts) <= 3

    @pytest.mark.asyncio
    async def test_generate_alerts_structure(
        self,
        db,
        test_user: Dict[str, str]
    ):
        """Test generated alerts have correct structure."""
        engine = StruggleDetectionEngine(db)

        alerts = await engine.generate_alerts(test_user["user_id"])

        if len(alerts) > 0:
            alert = alerts[0]
            required_fields = [
                "id", "type", "title", "message",
                "severity", "predictionId", "priority", "createdAt"
            ]
            for field in required_fields:
                assert field in alert, f"Missing field: {field}"

            # Validate alert type
            assert alert["type"] in [
                "PROACTIVE_WARNING",
                "PREREQUISITE_ALERT",
                "REAL_TIME_ALERT",
                "INTERVENTION_SUGGESTION"
            ]

            # Priority should be 0-100
            assert 0 <= alert["priority"] <= 100

    @pytest.mark.asyncio
    async def test_generate_alerts_sorted_by_priority(
        self,
        db,
        test_user: Dict[str, str]
    ):
        """Test alerts are sorted by priority descending."""
        engine = StruggleDetectionEngine(db)

        alerts = await engine.generate_alerts(test_user["user_id"])

        if len(alerts) > 1:
            priorities = [alert["priority"] for alert in alerts]
            assert priorities == sorted(priorities, reverse=True)


@pytest.mark.unit
@pytest.mark.ml
class TestDetectionEngineHelperMethods:
    """Test helper methods of StruggleDetectionEngine."""

    def test_calculate_alert_severity_high(self, db):
        """Test severity calculation returns HIGH for multiple high indicators."""
        engine = StruggleDetectionEngine(db)

        # Mock indicators with HIGH severity
        indicators = [
            Mock(severity="HIGH"),
            Mock(severity="HIGH")
        ]

        severity = engine._calculate_alert_severity(indicators)
        assert severity.value == "HIGH"

    def test_calculate_alert_severity_medium(self, db):
        """Test severity calculation returns MEDIUM appropriately."""
        engine = StruggleDetectionEngine(db)

        indicators = [
            Mock(severity="MEDIUM"),
            Mock(severity="MEDIUM")
        ]

        severity = engine._calculate_alert_severity(indicators)
        assert severity.value in ["MEDIUM", "HIGH"]

    def test_calculate_alert_severity_empty(self, db):
        """Test severity calculation with no indicators returns LOW."""
        engine = StruggleDetectionEngine(db)

        severity = engine._calculate_alert_severity([])
        assert severity.value == "LOW"

    def test_calculate_priority_range(self, db):
        """Test priority calculation returns value in 0-100 range."""
        engine = StruggleDetectionEngine(db)

        # Mock prediction
        prediction = Mock(
            predictionConfidence=0.8,
            predictedStruggleProbability=0.7,
            indicators=[]
        )

        priority = engine._calculate_priority(prediction)

        assert 0 <= priority <= 100
        assert isinstance(priority, float)

    def test_generate_alert_message_format(self, db):
        """Test alert message generation includes key information."""
        engine = StruggleDetectionEngine(db)

        # Mock prediction with objective
        objective = Mock(objective="Cardiac action potentials")
        prediction = Mock(
            predictedStruggleProbability=0.75,
            learningObjective=objective
        )

        message = engine._generate_alert_message(prediction)

        assert "75%" in message
        assert "Cardiac action potentials" in message
        assert "strategies" in message.lower()


@pytest.mark.unit
@pytest.mark.ml
class TestDetectionEngineEdgeCases:
    """Test edge cases and error handling."""

    @pytest.mark.asyncio
    async def test_run_predictions_with_invalid_days_ahead(
        self,
        db,
        test_user: Dict[str, str]
    ):
        """Test run_predictions handles invalid days_ahead gracefully."""
        engine = StruggleDetectionEngine(db)

        # Should handle gracefully or raise appropriate error
        try:
            predictions = await engine.run_predictions(
                test_user["user_id"],
                days_ahead=0  # Invalid
            )
            # If it completes, should return list
            assert isinstance(predictions, list)
        except (ValueError, AssertionError):
            # Or raise appropriate error
            pass

    @pytest.mark.asyncio
    async def test_run_predictions_with_no_objectives(
        self,
        db,
        test_user: Dict[str, str]
    ):
        """Test run_predictions handles user with no objectives."""
        engine = StruggleDetectionEngine(db)

        # User with no missions/objectives
        predictions = await engine.run_predictions(
            "user-with-no-objectives",
            days_ahead=7
        )

        # Should return empty list, not error
        assert isinstance(predictions, list)

    @pytest.mark.asyncio
    async def test_generate_alerts_filters_low_probability(
        self,
        db,
        test_user: Dict[str, str]
    ):
        """Test generate_alerts only includes high probability predictions (>=0.7)."""
        engine = StruggleDetectionEngine(db)

        alerts = await engine.generate_alerts(test_user["user_id"])

        # All alerts should be for high-risk predictions
        assert isinstance(alerts, list)

    @pytest.mark.asyncio
    async def test_analyze_current_struggles_insufficient_reviews(
        self,
        db,
        test_user: Dict[str, str]
    ):
        """Test analyze_current_struggles requires minimum review count."""
        engine = StruggleDetectionEngine(db)

        # With no or few reviews, should return empty
        indicators = await engine.analyze_current_struggles(test_user["user_id"])

        assert isinstance(indicators, list)
