"""
Tests for the Confidence Calibration Engine.

Tests calibration delta calculation, classification logic, and historical trend tracking.
"""

import pytest
from src.validation.calibrator import ConfidenceCalibrator, CalibrationAnalysis


class TestCalibrationDeltaCalculation:
    """Test Task 9.2: Calibration delta calculation."""

    def test_confidence_normalization(self):
        """Test confidence level normalization from 1-5 to 0-100 scale."""
        calibrator = ConfidenceCalibrator()

        # Confidence 1 (Very Uncertain) → 0
        result = calibrator.calculate_calibration(confidence_level=1, score=50)
        assert result.delta == -50  # 0 - 50

        # Confidence 2 → 25
        result = calibrator.calculate_calibration(confidence_level=2, score=50)
        assert result.delta == -25  # 25 - 50

        # Confidence 3 (Moderate) → 50
        result = calibrator.calculate_calibration(confidence_level=3, score=50)
        assert result.delta == 0  # 50 - 50

        # Confidence 4 → 75
        result = calibrator.calculate_calibration(confidence_level=4, score=50)
        assert result.delta == 25  # 75 - 50

        # Confidence 5 (Very Confident) → 100
        result = calibrator.calculate_calibration(confidence_level=5, score=50)
        assert result.delta == 50  # 100 - 50

    def test_delta_calculation_overconfident(self):
        """Test delta calculation for overconfident case."""
        calibrator = ConfidenceCalibrator()

        # User very confident (5 → 100) but scored low (40)
        result = calibrator.calculate_calibration(confidence_level=5, score=40)

        assert result.delta == 60  # 100 - 40
        assert result.delta > 0  # Positive delta = overconfident

    def test_delta_calculation_underconfident(self):
        """Test delta calculation for underconfident case."""
        calibrator = ConfidenceCalibrator()

        # User uncertain (1 → 0) but scored high (85)
        result = calibrator.calculate_calibration(confidence_level=1, score=85)

        assert result.delta == -85  # 0 - 85
        assert result.delta < 0  # Negative delta = underconfident

    def test_delta_calculation_calibrated(self):
        """Test delta calculation for well-calibrated case."""
        calibrator = ConfidenceCalibrator()

        # User moderately confident (3 → 50) and scored 55 (within threshold)
        result = calibrator.calculate_calibration(confidence_level=3, score=55)

        assert result.delta == -5  # 50 - 55
        assert abs(result.delta) <= 15  # Within calibration threshold


class TestCalibrationClassification:
    """Test Task 9.3: Calibration classification logic."""

    def test_overconfident_classification(self):
        """Test overconfident classification (delta > 15)."""
        calibrator = ConfidenceCalibrator()

        # Delta = 60 (well over threshold)
        result = calibrator.calculate_calibration(confidence_level=5, score=40)
        assert result.classification == "Overconfident"

        # Delta = 16 (just over threshold)
        result = calibrator.calculate_calibration(confidence_level=3, score=34)
        assert result.classification == "Overconfident"

    def test_underconfident_classification(self):
        """Test underconfident classification (delta < -15)."""
        calibrator = ConfidenceCalibrator()

        # Delta = -85 (well under threshold)
        result = calibrator.calculate_calibration(confidence_level=1, score=85)
        assert result.classification == "Underconfident"

        # Delta = -16 (just under threshold)
        result = calibrator.calculate_calibration(confidence_level=3, score=66)
        assert result.classification == "Underconfident"

    def test_calibrated_classification(self):
        """Test calibrated classification (-15 <= delta <= 15)."""
        calibrator = ConfidenceCalibrator()

        # Delta = 0 (perfect calibration)
        result = calibrator.calculate_calibration(confidence_level=3, score=50)
        assert result.classification == "Calibrated"

        # Delta = 10 (within threshold, positive)
        result = calibrator.calculate_calibration(confidence_level=3, score=40)
        assert result.classification == "Calibrated"

        # Delta = -10 (within threshold, negative)
        result = calibrator.calculate_calibration(confidence_level=3, score=60)
        assert result.classification == "Calibrated"

        # Boundary test: Delta = 15 (exactly at threshold, should be calibrated)
        result = calibrator.calculate_calibration(confidence_level=3, score=35)
        assert result.classification == "Calibrated"

        # Boundary test: Delta = -15 (exactly at threshold, should be calibrated)
        result = calibrator.calculate_calibration(confidence_level=3, score=65)
        assert result.classification == "Calibrated"


class TestCalibrationNotes:
    """Test Task 9.4: Calibration note generation."""

    def test_overconfident_note(self):
        """Test overconfident calibration note."""
        calibrator = ConfidenceCalibrator()

        result = calibrator.calculate_calibration(confidence_level=5, score=40)

        assert result.classification == "Overconfident"
        assert "beware overconfidence" in result.note.lower()
        assert "more confident than" in result.note.lower()

    def test_underconfident_note(self):
        """Test underconfident calibration note."""
        calibrator = ConfidenceCalibrator()

        result = calibrator.calculate_calibration(confidence_level=1, score=85)

        assert result.classification == "Underconfident"
        assert "trust yourself" in result.note.lower()
        assert "stronger than you think" in result.note.lower()

    def test_calibrated_note(self):
        """Test calibrated calibration note."""
        calibrator = ConfidenceCalibrator()

        result = calibrator.calculate_calibration(confidence_level=3, score=55)

        assert result.classification == "Calibrated"
        assert "well calibrated" in result.note.lower()
        assert "matches" in result.note.lower()


class TestHistoricalCalibration:
    """Test Task 9.5: Historical calibration tracking."""

    def test_no_historical_data(self):
        """Test calibration with no historical data."""
        calibrator = ConfidenceCalibrator()

        result = calibrator.calculate_calibration(
            confidence_level=3,
            score=50,
            historical_deltas=None
        )

        assert result.historical_avg_delta is None
        assert result.trend is None

    def test_insufficient_historical_data(self):
        """Test calibration with insufficient historical data (< 3 attempts)."""
        calibrator = ConfidenceCalibrator()

        # Only 2 historical deltas (need at least 3)
        result = calibrator.calculate_calibration(
            confidence_level=3,
            score=50,
            historical_deltas=[10, 15]
        )

        assert result.historical_avg_delta is None
        assert result.trend is None

    def test_historical_average_calculation(self):
        """Test historical average delta calculation."""
        calibrator = ConfidenceCalibrator()

        historical_deltas = [20, 25, 30, 15, 10]
        result = calibrator.calculate_calibration(
            confidence_level=3,
            score=50,
            historical_deltas=historical_deltas
        )

        expected_avg = sum(historical_deltas) / len(historical_deltas)
        assert result.historical_avg_delta == expected_avg
        assert result.historical_avg_delta == 20.0

    def test_historical_average_with_negatives(self):
        """Test historical average with negative deltas."""
        calibrator = ConfidenceCalibrator()

        historical_deltas = [-10, -20, 5, 15, -5]
        result = calibrator.calculate_calibration(
            confidence_level=3,
            score=50,
            historical_deltas=historical_deltas
        )

        expected_avg = sum(historical_deltas) / len(historical_deltas)
        assert result.historical_avg_delta == expected_avg
        assert result.historical_avg_delta == -3.0


class TestHistoricalTrends:
    """Test Task 9.6: Historical trend tracking."""

    def test_improving_trend(self):
        """Test IMPROVING trend detection (absolute delta decreasing)."""
        calibrator = ConfidenceCalibrator()

        # Historical deltas showing improvement (moving toward 0)
        # Older: [30, 25], Recent: [20, 15, 10]
        # Older avg = 27.5, Recent avg = 15, Improvement = 12.5 > 5
        historical_deltas = [30, 25, 20, 15, 10]

        result = calibrator.calculate_calibration(
            confidence_level=3,
            score=50,
            historical_deltas=historical_deltas
        )

        assert result.trend == "IMPROVING"

    def test_worsening_trend(self):
        """Test WORSENING trend detection (absolute delta increasing)."""
        calibrator = ConfidenceCalibrator()

        # Historical deltas showing worsening (moving away from 0)
        # Older: [5, 10], Recent: [15, 20, 25]
        # Older avg = 7.5, Recent avg = 20, Improvement = -12.5 < -5
        historical_deltas = [5, 10, 15, 20, 25]

        result = calibrator.calculate_calibration(
            confidence_level=3,
            score=50,
            historical_deltas=historical_deltas
        )

        assert result.trend == "WORSENING"

    def test_stable_trend(self):
        """Test STABLE trend detection (no significant change)."""
        calibrator = ConfidenceCalibrator()

        # Historical deltas showing stability
        # Older: [10, 12], Recent: [11, 10, 12]
        # Older avg = 11, Recent avg = 11, Improvement = 0 (within ±5)
        historical_deltas = [10, 12, 11, 10, 12]

        result = calibrator.calculate_calibration(
            confidence_level=3,
            score=50,
            historical_deltas=historical_deltas
        )

        assert result.trend == "STABLE"

    def test_trend_with_exactly_3_datapoints(self):
        """Test trend calculation with exactly 3 historical deltas."""
        calibrator = ConfidenceCalibrator()

        # With exactly 3 points, all are "recent", no "older"
        # Should result in STABLE (no older data to compare)
        historical_deltas = [10, 15, 20]

        result = calibrator.calculate_calibration(
            confidence_level=3,
            score=50,
            historical_deltas=historical_deltas
        )

        # Recent avg = older avg when len == 3, so improvement = 0
        assert result.trend == "STABLE"

    def test_trend_with_negative_deltas_improving(self):
        """Test IMPROVING trend with negative deltas (underconfident getting better)."""
        calibrator = ConfidenceCalibrator()

        # User was very underconfident, now less so (moving toward 0)
        # Older: [-30, -25], Recent: [-20, -15, -10]
        # Older avg = -27.5 (abs = 27.5), Recent avg = -15 (abs = 15)
        # Improvement = 27.5 - 15 = 12.5 > 5
        historical_deltas = [-30, -25, -20, -15, -10]

        result = calibrator.calculate_calibration(
            confidence_level=3,
            score=50,
            historical_deltas=historical_deltas
        )

        assert result.trend == "IMPROVING"

    def test_trend_with_mixed_deltas(self):
        """Test trend with mixed positive/negative deltas."""
        calibrator = ConfidenceCalibrator()

        # Mixed deltas showing improvement (absolute values decreasing)
        # Older: [20, -25], Recent: [10, -5, 8]
        # Older avg = -2.5 (abs = 2.5), Recent avg = 4.33 (abs = 4.33)
        # Improvement = 2.5 - 4.33 = -1.83 (within ±5, should be STABLE)
        historical_deltas = [20, -25, 10, -5, 8]

        result = calibrator.calculate_calibration(
            confidence_level=3,
            score=50,
            historical_deltas=historical_deltas
        )

        assert result.trend == "STABLE"


class TestCalibrationAnalysisModel:
    """Test CalibrationAnalysis Pydantic model."""

    def test_calibration_analysis_creation(self):
        """Test creating CalibrationAnalysis model."""
        analysis = CalibrationAnalysis(
            delta=15.5,
            classification="Overconfident",
            note="Test note",
            historical_avg_delta=10.0,
            trend="IMPROVING"
        )

        assert analysis.delta == 15.5
        assert analysis.classification == "Overconfident"
        assert analysis.note == "Test note"
        assert analysis.historical_avg_delta == 10.0
        assert analysis.trend == "IMPROVING"

    def test_calibration_analysis_without_optional_fields(self):
        """Test creating CalibrationAnalysis without historical fields."""
        analysis = CalibrationAnalysis(
            delta=-5.0,
            classification="Calibrated",
            note="Well calibrated"
        )

        assert analysis.delta == -5.0
        assert analysis.classification == "Calibrated"
        assert analysis.note == "Well calibrated"
        assert analysis.historical_avg_delta is None
        assert analysis.trend is None


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_perfect_calibration(self):
        """Test perfect calibration (confidence exactly matches score)."""
        calibrator = ConfidenceCalibrator()

        # Confidence 3 (50 normalized) matches score 50
        result = calibrator.calculate_calibration(confidence_level=3, score=50)

        assert result.delta == 0
        assert result.classification == "Calibrated"

    def test_minimum_confidence_maximum_score(self):
        """Test minimum confidence with maximum score."""
        calibrator = ConfidenceCalibrator()

        result = calibrator.calculate_calibration(confidence_level=1, score=100)

        assert result.delta == -100  # 0 - 100
        assert result.classification == "Underconfident"

    def test_maximum_confidence_minimum_score(self):
        """Test maximum confidence with minimum score."""
        calibrator = ConfidenceCalibrator()

        result = calibrator.calculate_calibration(confidence_level=5, score=0)

        assert result.delta == 100  # 100 - 0
        assert result.classification == "Overconfident"

    def test_boundary_delta_positive_threshold(self):
        """Test delta exactly at positive threshold boundary (15)."""
        calibrator = ConfidenceCalibrator()

        # Delta = 15 (should be calibrated, not overconfident)
        result = calibrator.calculate_calibration(confidence_level=3, score=35)

        assert result.delta == 15
        assert result.classification == "Calibrated"

    def test_boundary_delta_negative_threshold(self):
        """Test delta exactly at negative threshold boundary (-15)."""
        calibrator = ConfidenceCalibrator()

        # Delta = -15 (should be calibrated, not underconfident)
        result = calibrator.calculate_calibration(confidence_level=3, score=65)

        assert result.delta == -15
        assert result.classification == "Calibrated"

    def test_large_historical_dataset(self):
        """Test with large historical dataset."""
        calibrator = ConfidenceCalibrator()

        # 20 historical deltas showing clear improvement
        historical_deltas = list(range(50, 30, -1))  # [50, 49, 48, ..., 31]

        result = calibrator.calculate_calibration(
            confidence_level=3,
            score=50,
            historical_deltas=historical_deltas
        )

        assert result.trend == "IMPROVING"
        assert result.historical_avg_delta is not None
        assert len(historical_deltas) == 20
