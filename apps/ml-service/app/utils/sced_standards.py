"""
What Works Clearinghouse (WWC) SCED Standards Checker

Validates Single-Case Experimental Design (SCED) studies against WWC standards.
Implements criteria from WWC Procedures Handbook v4.1 (2022).

Reference:
- Kratochwill, T. R., et al. (2021). What Works Clearinghouse Standards Handbook, Version 4.1
- https://ies.ed.gov/ncee/wwc/Handbooks

Created: 2025-10-27T10:40:00-07:00
Part of: Day 7-8 Research Analytics Implementation (ADR-006)
"""

from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from numpy.typing import NDArray


class WWCSCEDChecker:
    """
    WWC SCED Standards Checker for ABAB reversal designs.

    Validates experimental rigor according to What Works Clearinghouse guidelines.

    WWC Standards for ABAB Reversal Designs:
    1. At least 2 phase pairs (ABAB = 2 pairs: B1-A1, B2-A2) ✓
    2. At least 5 data points per phase (minimum)
    3. Immediate change in level when intervention introduced/withdrawn
    4. Similar patterns within conditions (stable baseline, similar intervention effects)
    5. Minimal phase overlap (≤25% overlap for "Meets Standards")

    Evidence Standards:
    - Meets Standards: All criteria met, p < 0.05, minimal overlap
    - Meets Standards with Reservations: Most criteria met, p < 0.10
    - Does Not Meet Standards: Fails key criteria or p ≥ 0.10
    """

    @staticmethod
    def check_sced_standards(
        df: pd.DataFrame,
        observed_effect: float,
        p_value: float,
        cohens_d: float,
    ) -> Tuple[bool, Dict]:
        """
        Check if ABAB design meets WWC SCED standards.

        Args:
            df: DataFrame with experimentPhase and outcome columns
            observed_effect: Observed mean difference (A - B)
            p_value: Two-tailed permutation test p-value
            cohens_d: Cohen's d effect size

        Returns:
            Tuple of (passes_wwc: bool, details: dict)
                - passes_wwc: True if meets WWC "Meets Standards" criteria
                - details: Dict with individual criterion checks and evidence rating
        """
        details = {}

        # Criterion 1: At least 2 phase pairs (ABAB always has 2)
        phase_pairs = 2  # B1-A1, B2-A2
        details["phase_pairs"] = phase_pairs
        details["criterion_phase_pairs"] = phase_pairs >= 2

        # Criterion 2: At least 5 data points per phase (WWC minimum)
        phase_counts = df.groupby("experimentPhase").size()
        min_phase_size = phase_counts.min()
        details["min_observations_per_phase"] = int(min_phase_size)
        details["criterion_sufficient_data"] = min_phase_size >= 5

        # Criterion 3: Immediate change in level
        # Check if first 2 observations in A1 differ from last 2 in B1
        immediate_change = WWCSCEDChecker._check_immediate_change(df)
        details["immediate_change_detected"] = immediate_change
        details["criterion_immediate_change"] = immediate_change

        # Criterion 4: Similar patterns within conditions
        # Check if baseline phases (B1, B2) have similar variance
        # Check if intervention phases (A1, A2) have similar variance
        similar_baselines, similar_interventions = WWCSCEDChecker._check_similar_patterns(df)
        details["similar_baseline_phases"] = similar_baselines
        details["similar_intervention_phases"] = similar_interventions
        details["criterion_similar_patterns"] = similar_baselines and similar_interventions

        # Criterion 5: Minimal overlap between phases
        # Calculate percentage of A observations below median of B (or vice versa)
        overlap_percentage = WWCSCEDChecker._calculate_overlap(df)
        details["overlap_percentage"] = float(overlap_percentage)
        details["criterion_minimal_overlap"] = overlap_percentage <= 25.0

        # Statistical criterion: p < 0.05 for "Meets Standards"
        details["p_value"] = p_value
        details["criterion_statistically_significant"] = p_value < 0.05

        # Effect size interpretation (Cohen's d)
        details["cohens_d"] = cohens_d
        details["effect_size_interpretation"] = WWCSCEDChecker._interpret_cohens_d(cohens_d)

        # Overall WWC rating
        wwc_rating = WWCSCEDChecker._determine_wwc_rating(details)
        details["wwc_rating"] = wwc_rating
        details["passes_wwc"] = wwc_rating == "Meets Standards"

        return details["passes_wwc"], details

    @staticmethod
    def _check_immediate_change(df: pd.DataFrame) -> bool:
        """
        Check for immediate change in level at intervention points.

        Compares last 2 observations of baseline with first 2 of intervention.
        Immediate change = noticeable shift within 1-2 data points.

        Args:
            df: DataFrame with experimentPhase and outcome columns

        Returns:
            True if immediate change detected at B1→A1 or B2→A2 transitions
        """
        try:
            # Get data by phase
            b1 = df[df["experimentPhase"] == "baseline_1"]["outcome"].values
            a1 = df[df["experimentPhase"] == "intervention_A_1"]["outcome"].values
            b2 = df[df["experimentPhase"] == "baseline_2"]["outcome"].values
            a2 = df[df["experimentPhase"] == "intervention_A_2"]["outcome"].values

            # Check B1 → A1 transition
            b1_last2 = b1[-2:].mean() if len(b1) >= 2 else b1[-1]
            a1_first2 = a1[:2].mean() if len(a1) >= 2 else a1[0]
            change_1 = abs(a1_first2 - b1_last2)

            # Check B2 → A2 transition
            b2_last2 = b2[-2:].mean() if len(b2) >= 2 else b2[-1]
            a2_first2 = a2[:2].mean() if len(a2) >= 2 else a2[0]
            change_2 = abs(a2_first2 - b2_last2)

            # Calculate within-phase standard deviation for context
            all_baselines = np.concatenate([b1, b2])
            baseline_sd = np.std(all_baselines, ddof=1)

            # Immediate change if shift > 0.5 SD at either transition
            threshold = 0.5 * baseline_sd if baseline_sd > 0 else 1.0
            return (change_1 > threshold) or (change_2 > threshold)

        except Exception:
            return False

    @staticmethod
    def _check_similar_patterns(df: pd.DataFrame) -> Tuple[bool, bool]:
        """
        Check if patterns are similar within baseline and intervention phases.

        Uses coefficient of variation (CV) to compare variability across phases.
        Similar patterns = CV difference < 50% between phase pairs.

        Args:
            df: DataFrame with experimentPhase and outcome columns

        Returns:
            Tuple of (similar_baselines: bool, similar_interventions: bool)
        """
        try:
            # Get data by phase
            b1 = df[df["experimentPhase"] == "baseline_1"]["outcome"].values
            a1 = df[df["experimentPhase"] == "intervention_A_1"]["outcome"].values
            b2 = df[df["experimentPhase"] == "baseline_2"]["outcome"].values
            a2 = df[df["experimentPhase"] == "intervention_A_2"]["outcome"].values

            # Coefficient of variation (CV = SD / Mean)
            def cv(data):
                mean = np.mean(data)
                if mean == 0:
                    return 0.0
                return np.std(data, ddof=1) / abs(mean)

            cv_b1 = cv(b1)
            cv_b2 = cv(b2)
            cv_a1 = cv(a1)
            cv_a2 = cv(a2)

            # Similar if CV difference < 50% (relative)
            similar_baselines = abs(cv_b1 - cv_b2) / max(cv_b1, cv_b2, 0.01) < 0.5 if max(cv_b1, cv_b2) > 0 else True
            similar_interventions = abs(cv_a1 - cv_a2) / max(cv_a1, cv_a2, 0.01) < 0.5 if max(cv_a1, cv_a2) > 0 else True

            return similar_baselines, similar_interventions

        except Exception:
            return False, False

    @staticmethod
    def _calculate_overlap(df: pd.DataFrame) -> float:
        """
        Calculate percentage overlap between baseline and intervention phases.

        Overlap = percentage of intervention data points that fall within
        the range of baseline data (or vice versa, whichever is larger).

        Low overlap (< 25%) supports causal inference.

        Args:
            df: DataFrame with experimentPhase and outcome columns

        Returns:
            Overlap percentage (0-100)
        """
        try:
            # Get all baseline and intervention data
            baseline_data = df[
                df["experimentPhase"].isin(["baseline_1", "baseline_2"])
            ]["outcome"].values

            intervention_data = df[
                df["experimentPhase"].isin(["intervention_A_1", "intervention_A_2"])
            ]["outcome"].values

            # Calculate ranges
            baseline_min, baseline_max = baseline_data.min(), baseline_data.max()
            intervention_min, intervention_max = intervention_data.min(), intervention_data.max()

            # Count intervention points within baseline range
            intervention_overlap = np.sum(
                (intervention_data >= baseline_min) & (intervention_data <= baseline_max)
            )
            intervention_overlap_pct = (intervention_overlap / len(intervention_data)) * 100

            # Count baseline points within intervention range
            baseline_overlap = np.sum(
                (baseline_data >= intervention_min) & (baseline_data <= intervention_max)
            )
            baseline_overlap_pct = (baseline_overlap / len(baseline_data)) * 100

            # Return max overlap (more conservative)
            return float(max(intervention_overlap_pct, baseline_overlap_pct))

        except Exception:
            return 100.0  # Assume full overlap if calculation fails

    @staticmethod
    def _interpret_cohens_d(cohens_d: float) -> str:
        """
        Interpret Cohen's d effect size.

        Args:
            cohens_d: Cohen's d value

        Returns:
            Effect size interpretation string
        """
        abs_d = abs(cohens_d)
        if abs_d < 0.2:
            return "negligible"
        elif abs_d < 0.5:
            return "small"
        elif abs_d < 0.8:
            return "medium"
        else:
            return "large"

    @staticmethod
    def _determine_wwc_rating(details: Dict) -> str:
        """
        Determine overall WWC evidence rating.

        Rating criteria:
        - Meets Standards: All design criteria + p < 0.05 + overlap ≤ 25%
        - Meets Standards with Reservations: Most criteria + p < 0.10 + overlap ≤ 50%
        - Does Not Meet Standards: Fails key criteria or p ≥ 0.10

        Args:
            details: Dict with individual criterion results

        Returns:
            WWC rating string
        """
        # Count criteria met
        criteria = [
            details["criterion_phase_pairs"],
            details["criterion_sufficient_data"],
            details["criterion_immediate_change"],
            details["criterion_similar_patterns"],
            details["criterion_minimal_overlap"],
            details["criterion_statistically_significant"],
        ]
        criteria_met = sum(criteria)

        # Meets Standards: All 6 criteria
        if criteria_met == 6:
            return "Meets Standards"

        # Meets Standards with Reservations: 4-5 criteria + p < 0.10
        if criteria_met >= 4 and details["p_value"] < 0.10:
            return "Meets Standards with Reservations"

        # Does Not Meet Standards
        return "Does Not Meet Standards"


def check_sced_standards(
    df: pd.DataFrame,
    observed_effect: float,
    p_value: float,
    cohens_d: float,
) -> Tuple[bool, Dict]:
    """
    Convenience function to check WWC SCED standards.

    Args:
        df: DataFrame with experimentPhase and outcome columns
        observed_effect: Observed mean difference (A - B)
        p_value: Two-tailed permutation test p-value
        cohens_d: Cohen's d effect size

    Returns:
        Tuple of (passes_wwc: bool, details: dict)
    """
    return WWCSCEDChecker.check_sced_standards(df, observed_effect, p_value, cohens_d)
