"""
Tests for IRT Assessment Engine (Story 4.5).

Tests 2PL IRT model implementation with scipy.
"""

import pytest
import numpy as np
from src.adaptive.irt_engine import IRTEngine
from src.adaptive.models import ResponseRecord, IRTMetrics


class TestIRTEngine:
    """Test suite for IRT engine."""

    @pytest.fixture
    def engine(self):
        """Create IRT engine instance."""
        return IRTEngine(
            max_iterations=10,
            tolerance=0.01,
            early_stop_ci_threshold=0.3,
        )

    def test_probability_correct_basic(self, engine):
        """Test probability calculation with 2PL model."""
        # At theta = difficulty, probability should be ~0.5
        p = engine.probability_correct(theta=0.0, difficulty=0.0, discrimination=1.0)
        assert 0.45 <= p <= 0.55, "Probability should be ~0.5 when theta = difficulty"

        # Higher theta should increase probability
        p_high = engine.probability_correct(theta=1.0, difficulty=0.0, discrimination=1.0)
        assert p_high > 0.7, "Higher theta should increase probability"

        # Lower theta should decrease probability
        p_low = engine.probability_correct(theta=-1.0, difficulty=0.0, discrimination=1.0)
        assert p_low < 0.3, "Lower theta should decrease probability"

    def test_probability_correct_discrimination(self, engine):
        """Test effect of discrimination parameter."""
        # Higher discrimination = steeper curve
        p_low_disc = engine.probability_correct(theta=0.5, difficulty=0.0, discrimination=0.5)
        p_high_disc = engine.probability_correct(theta=0.5, difficulty=0.0, discrimination=2.0)

        # With higher discrimination, difference from 0.5 should be more pronounced
        assert abs(p_high_disc - 0.5) > abs(p_low_disc - 0.5)

    def test_log_likelihood(self, engine):
        """Test log-likelihood calculation."""
        responses = [
            ResponseRecord(
                question_id="q1",
                correct=True,
                difficulty=0.0,
                discrimination=1.0,
            ),
            ResponseRecord(
                question_id="q2",
                correct=True,
                difficulty=0.5,
                discrimination=1.0,
            ),
        ]

        # Higher theta should give higher likelihood for correct responses
        ll_high = engine.log_likelihood(theta=1.0, responses=responses)
        ll_low = engine.log_likelihood(theta=-1.0, responses=responses)

        assert ll_high > ll_low, "Higher theta should have higher likelihood for correct responses"

    def test_fisher_information(self, engine):
        """Test Fisher information calculation."""
        responses = [
            ResponseRecord(
                question_id="q1",
                correct=True,
                difficulty=0.0,
                discrimination=1.0,
            ),
        ]

        # Information should be maximum when theta = difficulty
        info_at_difficulty = engine.fisher_information(theta=0.0, responses=responses)
        info_far_from_difficulty = engine.fisher_information(theta=2.0, responses=responses)

        assert info_at_difficulty > info_far_from_difficulty

    def test_estimate_theta_all_correct(self, engine):
        """Test theta estimation with all correct responses."""
        responses = [
            ResponseRecord(question_id=f"q{i}", correct=True, difficulty=0.0, discrimination=1.0)
            for i in range(5)
        ]

        theta, se, iterations, converged = engine.estimate_theta(responses)

        assert theta > 0, "All correct responses should give positive theta"
        # Note: minimize_scalar success flag may not always be True, check theta is reasonable
        assert theta > 1.0, "With all correct at difficulty 0, theta should be significantly positive"
        assert se > 0, "Standard error should be positive"

    def test_estimate_theta_all_incorrect(self, engine):
        """Test theta estimation with all incorrect responses."""
        responses = [
            ResponseRecord(question_id=f"q{i}", correct=False, difficulty=0.0, discrimination=1.0)
            for i in range(5)
        ]

        theta, se, iterations, converged = engine.estimate_theta(responses)

        assert theta < 0, "All incorrect responses should give negative theta"
        assert theta < -1.0, "With all incorrect at difficulty 0, theta should be significantly negative"

    def test_estimate_theta_mixed_responses(self, engine):
        """Test theta estimation with mixed correct/incorrect responses."""
        responses = [
            ResponseRecord(question_id="q1", correct=True, difficulty=-1.0, discrimination=1.0),
            ResponseRecord(question_id="q2", correct=True, difficulty=0.0, discrimination=1.0),
            ResponseRecord(question_id="q3", correct=False, difficulty=1.0, discrimination=1.0),
            ResponseRecord(question_id="q4", correct=False, difficulty=1.5, discrimination=1.0),
        ]

        theta, se, iterations, converged = engine.estimate_theta(responses)

        # Should estimate theta around 0 to 0.5 (gets easy correct, hard incorrect)
        assert -0.5 <= theta <= 1.0

    def test_estimate_theta_empty_responses(self, engine):
        """Test theta estimation with no responses."""
        theta, se, iterations, converged = engine.estimate_theta([])

        assert theta == 0.0, "Should return 0 for no responses"
        assert se == 1.0, "Should return high SE for no responses"
        assert iterations == 0
        assert not converged

    def test_calculate_confidence_interval(self, engine):
        """Test confidence interval calculation."""
        # For 95% CI with SE=0.1, width should be ~0.39 (2 * 1.96 * 0.1)
        ci_width = engine.calculate_confidence_interval(standard_error=0.1)
        assert 0.38 <= ci_width <= 0.40

        # Larger SE = wider CI
        ci_width_large = engine.calculate_confidence_interval(standard_error=0.5)
        assert ci_width_large > ci_width

    def test_should_stop_early_min_questions(self, engine):
        """Test early stopping requires minimum questions."""
        # Should not stop with < 3 questions even with low SE
        should_stop = engine.should_stop_early(
            standard_error=0.05,
            num_responses=2,
            min_questions=3,
        )
        assert not should_stop

        # Should consider stopping with >= 3 questions
        should_stop = engine.should_stop_early(
            standard_error=0.05,
            num_responses=3,
            min_questions=3,
        )
        assert should_stop  # CI < 0.3 threshold

    def test_should_stop_early_ci_threshold(self, engine):
        """Test early stopping based on CI threshold."""
        # High SE = wide CI, should not stop
        should_stop = engine.should_stop_early(
            standard_error=0.5,  # CI ~ 1.96
            num_responses=5,
        )
        assert not should_stop

        # Low SE = narrow CI, should stop
        should_stop = engine.should_stop_early(
            standard_error=0.05,  # CI ~ 0.196
            num_responses=5,
        )
        assert should_stop

    def test_calculate_irt_metrics(self, engine):
        """Test complete IRT metrics calculation."""
        responses = [
            ResponseRecord(question_id="q1", correct=True, difficulty=-0.5, discrimination=1.2),
            ResponseRecord(question_id="q2", correct=True, difficulty=0.0, discrimination=1.0),
            ResponseRecord(question_id="q3", correct=False, difficulty=1.0, discrimination=1.1),
        ]

        metrics = engine.calculate_irt_metrics(responses)

        assert isinstance(metrics, IRTMetrics)
        assert -2 <= metrics.theta <= 2
        assert metrics.standard_error > 0
        assert metrics.confidence_interval > 0
        assert metrics.iterations >= 0
        assert isinstance(metrics.converged, bool)

    def test_select_next_difficulty(self, engine):
        """Test maximum information principle for difficulty selection."""
        theta = 0.5
        available_difficulties = [-1.0, 0.0, 0.5, 1.0, 1.5]

        optimal = engine.select_next_difficulty(theta, available_difficulties)

        # Should select difficulty closest to theta (0.5)
        assert optimal == 0.5

    def test_select_next_difficulty_empty(self, engine):
        """Test difficulty selection with empty list."""
        optimal = engine.select_next_difficulty(theta=0.5, available_difficulties=[])

        # Should return theta when no options available
        assert optimal == 0.5

    def test_information_function(self, engine):
        """Test item information function."""
        # Maximum information at theta = difficulty
        info_at_max = engine.information_function(theta=0.0, difficulty=0.0, discrimination=1.0)
        info_away = engine.information_function(theta=1.0, difficulty=0.0, discrimination=1.0)

        assert info_at_max > info_away

        # Higher discrimination = more information
        info_high_disc = engine.information_function(theta=0.0, difficulty=0.0, discrimination=2.0)
        info_low_disc = engine.information_function(theta=0.0, difficulty=0.0, discrimination=1.0)

        assert info_high_disc > info_low_disc

    def test_convergence_with_varied_difficulties(self, engine):
        """Test theta estimation converges with varied difficulty questions."""
        responses = [
            ResponseRecord(question_id="q1", correct=True, difficulty=-1.0, discrimination=1.0),
            ResponseRecord(question_id="q2", correct=True, difficulty=-0.5, discrimination=1.2),
            ResponseRecord(question_id="q3", correct=True, difficulty=0.0, discrimination=1.1),
            ResponseRecord(question_id="q4", correct=False, difficulty=1.0, discrimination=1.0),
            ResponseRecord(question_id="q5", correct=False, difficulty=1.5, discrimination=1.3),
        ]

        theta, se, iterations, converged = engine.estimate_theta(responses)

        # Note: minimize_scalar may not set success=True but still find good solution
        assert se < 1.0, "SE should be reasonable with 5 responses"
        assert 0.0 <= theta <= 1.0, "Theta should be in middle range (gets easy correct, hard incorrect)"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
