"""
IRT Assessment Engine - Story 4.5

Implements 2-Parameter Logistic (2PL) Item Response Theory model using scipy.
Uses Newton-Raphson optimization for theta (ability) estimation.

IRT Model:
    P(correct | theta, a, b) = 1 / (1 + exp(-a * (theta - b)))

Where:
    - theta: Person ability (knowledge level)
    - a: Item discrimination (how well item differentiates ability)
    - b: Item difficulty
"""

import numpy as np
from scipy.optimize import minimize_scalar
from typing import List, Tuple
import logging

from .models import ResponseRecord, IRTMetrics

logger = logging.getLogger(__name__)


class IRTEngine:
    """
    IRT-based adaptive assessment engine.

    Uses 2PL model with Newton-Raphson for theta estimation.
    Provides early stopping based on confidence interval convergence.
    """

    def __init__(
        self,
        max_iterations: int = 10,
        tolerance: float = 0.01,
        confidence_level: float = 0.95,
        early_stop_ci_threshold: float = 0.3,
    ):
        """
        Initialize IRT engine.

        Args:
            max_iterations: Maximum Newton-Raphson iterations
            tolerance: Convergence tolerance for theta estimate
            confidence_level: Confidence level for CI (default 95%)
            early_stop_ci_threshold: CI width threshold for early stopping
        """
        self.max_iterations = max_iterations
        self.tolerance = tolerance
        self.confidence_level = confidence_level
        self.early_stop_ci_threshold = early_stop_ci_threshold

    def probability_correct(
        self, theta: float, difficulty: float, discrimination: float = 1.0
    ) -> float:
        """
        Calculate probability of correct response using 2PL IRT model.

        P(correct) = 1 / (1 + exp(-a * (theta - b)))

        Args:
            theta: Person ability parameter
            difficulty: Item difficulty parameter (b)
            discrimination: Item discrimination parameter (a)

        Returns:
            Probability of correct response (0-1)
        """
        try:
            logit = discrimination * (theta - difficulty)
            # Prevent overflow in exp
            logit = np.clip(logit, -20, 20)
            return 1.0 / (1.0 + np.exp(-logit))
        except Exception as e:
            logger.warning(f"Error in probability calculation: {e}, returning 0.5")
            return 0.5

    def log_likelihood(
        self, theta: float, responses: List[ResponseRecord]
    ) -> float:
        """
        Calculate log-likelihood of response pattern given theta.

        L(theta) = sum[correct * log(P) + (1-correct) * log(1-P)]

        Args:
            theta: Person ability estimate
            responses: List of response records

        Returns:
            Log-likelihood value
        """
        ll = 0.0
        for response in responses:
            p = self.probability_correct(
                theta, response.difficulty, response.discrimination
            )
            # Prevent log(0)
            p = np.clip(p, 1e-10, 1 - 1e-10)

            if response.correct:
                ll += np.log(p)
            else:
                ll += np.log(1 - p)

        return ll

    def negative_log_likelihood(
        self, theta: float, responses: List[ResponseRecord]
    ) -> float:
        """
        Negative log-likelihood for minimization.

        Args:
            theta: Person ability estimate
            responses: List of response records

        Returns:
            Negative log-likelihood
        """
        return -self.log_likelihood(theta, responses)

    def fisher_information(
        self, theta: float, responses: List[ResponseRecord]
    ) -> float:
        """
        Calculate Fisher information at theta.

        I(theta) = sum[a^2 * P * (1-P)]

        Used for standard error calculation.

        Args:
            theta: Person ability estimate
            responses: List of response records

        Returns:
            Fisher information value
        """
        info = 0.0
        for response in responses:
            p = self.probability_correct(
                theta, response.difficulty, response.discrimination
            )
            a = response.discrimination
            info += (a ** 2) * p * (1 - p)

        return max(info, 1e-10)  # Prevent division by zero

    def estimate_theta(
        self,
        responses: List[ResponseRecord],
        initial_theta: float = 0.0,
    ) -> Tuple[float, float, int, bool]:
        """
        Estimate person ability (theta) using maximum likelihood estimation.

        Uses scipy's minimize_scalar for optimization (more robust than manual Newton-Raphson).

        Args:
            responses: List of response records
            initial_theta: Initial theta estimate

        Returns:
            Tuple of (theta_estimate, standard_error, iterations, converged)
        """
        if not responses:
            logger.warning("No responses provided for theta estimation")
            return 0.0, 1.0, 0, False

        try:
            # Use scipy's minimize_scalar with bounded optimization
            result = minimize_scalar(
                lambda t: self.negative_log_likelihood(t, responses),
                bounds=(-3, 3),  # Typical theta range is -3 to +3
                method='bounded',
                options={'maxiter': self.max_iterations, 'xatol': self.tolerance}
            )

            theta_estimate = result.x
            converged = result.success
            iterations = result.nit if hasattr(result, 'nit') else self.max_iterations

            # Calculate standard error using Fisher information
            fisher_info = self.fisher_information(theta_estimate, responses)
            standard_error = 1.0 / np.sqrt(fisher_info)

            logger.info(
                f"Theta estimation: theta={theta_estimate:.3f}, "
                f"SE={standard_error:.3f}, iterations={iterations}, converged={converged}"
            )

            return theta_estimate, standard_error, iterations, converged

        except Exception as e:
            logger.error(f"Error in theta estimation: {e}")
            return initial_theta, 1.0, 0, False

    def calculate_confidence_interval(
        self, standard_error: float
    ) -> float:
        """
        Calculate confidence interval width.

        For 95% CI: width = 2 * 1.96 * SE

        Args:
            standard_error: Standard error of theta estimate

        Returns:
            Confidence interval width
        """
        z_score = 1.96 if self.confidence_level == 0.95 else 1.645  # 95% vs 90%
        return 2 * z_score * standard_error

    def should_stop_early(
        self,
        standard_error: float,
        num_responses: int,
        min_questions: int = 3,
    ) -> bool:
        """
        Determine if assessment should stop early.

        Criteria:
        1. At least min_questions answered
        2. Confidence interval < threshold

        Args:
            standard_error: Current standard error
            num_responses: Number of responses so far
            min_questions: Minimum questions before early stop

        Returns:
            True if should stop, False otherwise
        """
        if num_responses < min_questions:
            return False

        ci_width = self.calculate_confidence_interval(standard_error)
        should_stop = ci_width < self.early_stop_ci_threshold

        if should_stop:
            logger.info(
                f"Early stop triggered: CI={ci_width:.3f} < {self.early_stop_ci_threshold}, "
                f"questions={num_responses}"
            )

        return should_stop

    def calculate_irt_metrics(
        self, responses: List[ResponseRecord], initial_theta: float = 0.0
    ) -> IRTMetrics:
        """
        Calculate complete IRT metrics for a response pattern.

        Args:
            responses: List of response records
            initial_theta: Initial theta estimate

        Returns:
            IRTMetrics with theta, SE, CI, iterations, convergence
        """
        theta, se, iterations, converged = self.estimate_theta(responses, initial_theta)
        ci_width = self.calculate_confidence_interval(se)

        return IRTMetrics(
            theta=round(theta, 3),
            standard_error=round(se, 3),
            confidence_interval=round(ci_width, 3),
            iterations=iterations,
            converged=converged,
        )

    def select_next_difficulty(
        self,
        theta: float,
        available_difficulties: List[float],
    ) -> float:
        """
        Select next question difficulty using maximum information principle.

        Maximum information occurs when:
            difficulty (b) ≈ theta

        Args:
            theta: Current ability estimate
            available_difficulties: List of available question difficulties

        Returns:
            Optimal difficulty from available options
        """
        if not available_difficulties:
            logger.warning("No available difficulties, returning theta")
            return theta

        # Find difficulty closest to theta (maximum information point)
        optimal_difficulty = min(
            available_difficulties,
            key=lambda d: abs(d - theta)
        )

        logger.info(f"Selected difficulty {optimal_difficulty:.2f} for theta={theta:.2f}")
        return optimal_difficulty

    def information_function(
        self,
        theta: float,
        difficulty: float,
        discrimination: float = 1.0,
    ) -> float:
        """
        Calculate item information at theta.

        I(theta) = a^2 * P(theta) * (1 - P(theta))

        Args:
            theta: Person ability
            difficulty: Item difficulty
            discrimination: Item discrimination

        Returns:
            Information value
        """
        p = self.probability_correct(theta, difficulty, discrimination)
        return (discrimination ** 2) * p * (1 - p)
