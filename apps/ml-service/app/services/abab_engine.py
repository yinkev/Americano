"""
ABAB Randomization Test Engine

Implements randomization inference for ABAB reversal designs (single-case experimental design).
Uses permutation tests to assess causal effects with 10,000+ iterations for robust p-values.

Reference:
- Edgington, E.S., & Onghena, P. (2007). Randomization Tests (4th ed.)
- Kratochwill et al. (2021). WWC Standards for SCED (What Works Clearinghouse)

Created: 2025-10-27T10:30:00-07:00
Part of: Day 7-8 Research Analytics Implementation (ADR-006)
"""

import time
from functools import lru_cache
from typing import Dict, List, Optional, Tuple

import duckdb
import mlflow
import numpy as np
import pandas as pd
from numpy.typing import NDArray

from app.utils.sced_standards import check_sced_standards


class ABABRandomizationEngine:
    """
    ABAB Randomization Test Engine for n=1 Experiments.

    Implements permutation-based causal inference for ABAB reversal designs.
    Computes:
    - Observed effect (mean A - mean baseline)
    - Permutation distribution (10,000+ iterations)
    - P-value (proportion of permutations ≥ observed effect)
    - Cohen's d effect size
    - WWC SCED standards compliance

    Example:
        >>> engine = ABABRandomizationEngine(db_path="data/behavioral_events.duckdb")
        >>> result = engine.run_analysis(
        ...     user_id="user123",
        ...     protocol_id="abab_001",
        ...     outcome_metric="sessionPerformanceScore",
        ...     n_permutations=10000,
        ... )
        >>> print(f"P-value: {result['p_value']:.4f}")
        >>> print(f"Effect size: {result['cohens_d']:.2f}")
    """

    def __init__(
        self,
        db_path: str = "data/behavioral_events.duckdb",
        mlflow_tracking_uri: Optional[str] = None,
    ):
        """
        Initialize ABAB engine.

        Args:
            db_path: Path to DuckDB database with behavioral_events table
            mlflow_tracking_uri: MLflow tracking URI (defaults to local ./mlruns)
        """
        self.db_path = db_path
        self.mlflow_tracking_uri = mlflow_tracking_uri or "file:./mlruns"
        mlflow.set_tracking_uri(self.mlflow_tracking_uri)

    def fetch_abab_data(
        self, user_id: str, protocol_id: str, outcome_metric: str = "sessionPerformanceScore"
    ) -> pd.DataFrame:
        """
        Fetch ABAB data from DuckDB.

        Queries behavioral_events table for user's ABAB experiment data,
        filtering by experimentPhase and ordering by timestamp.

        Args:
            user_id: User ID
            protocol_id: Experiment protocol ID (for future use)
            outcome_metric: Column name for outcome variable

        Returns:
            DataFrame with columns: timestamp, experimentPhase, outcome

        Raises:
            ValueError: If insufficient data or missing phases
        """
        conn = duckdb.connect(self.db_path, read_only=True)

        query = f"""
        SELECT
            timestamp,
            experimentPhase,
            {outcome_metric} AS outcome
        FROM behavioral_events
        WHERE
            userId = ?
            AND experimentPhase IS NOT NULL
            AND {outcome_metric} IS NOT NULL
        ORDER BY timestamp ASC
        """

        df = conn.execute(query, [user_id]).df()
        conn.close()

        if df.empty:
            raise ValueError(f"No ABAB data found for user {user_id}")

        # Validate all 4 phases present
        required_phases = ["baseline_1", "intervention_A_1", "baseline_2", "intervention_A_2"]
        present_phases = df["experimentPhase"].unique()
        missing_phases = set(required_phases) - set(present_phases)

        if missing_phases:
            raise ValueError(
                f"Incomplete ABAB design: missing phases {missing_phases}. "
                f"Need all 4 phases for valid analysis."
            )

        # Validate minimum observations per phase (WWC guideline: ≥5 per phase)
        phase_counts = df["experimentPhase"].value_counts()
        insufficient_phases = phase_counts[phase_counts < 5].index.tolist()

        if insufficient_phases:
            raise ValueError(
                f"Insufficient data in phases {insufficient_phases}. "
                f"Need ≥5 observations per phase for WWC standards."
            )

        return df

    def calculate_observed_effect(self, df: pd.DataFrame) -> float:
        """
        Calculate observed ABAB effect.

        Computes mean difference between intervention (A) and baseline (B) phases:
            Effect = Mean(A1, A2) - Mean(B1, B2)

        Args:
            df: DataFrame with experimentPhase and outcome columns

        Returns:
            Observed effect size (positive = intervention beneficial)
        """
        # Intervention phases
        a_data = df[
            df["experimentPhase"].isin(["intervention_A_1", "intervention_A_2"])
        ]["outcome"].values

        # Baseline phases
        b_data = df[
            df["experimentPhase"].isin(["baseline_1", "baseline_2"])
        ]["outcome"].values

        return float(np.mean(a_data) - np.mean(b_data))

    def run_permutation_test(
        self,
        df: pd.DataFrame,
        n_permutations: int = 10000,
        seed: Optional[int] = None,
    ) -> Tuple[float, NDArray[np.float64]]:
        """
        Run randomization test with permutations.

        Implements randomization inference:
        1. Compute observed effect
        2. Randomly shuffle phase labels n_permutations times
        3. Compute effect for each permutation
        4. P-value = proportion of permutations ≥ observed effect

        Args:
            df: DataFrame with experimentPhase and outcome columns
            n_permutations: Number of permutation iterations (default: 10,000)
            seed: Random seed for reproducibility

        Returns:
            Tuple of (p_value, permutation_distribution)
        """
        rng = np.random.default_rng(seed)

        # Observed effect
        observed_effect = self.calculate_observed_effect(df)

        # Extract outcome data
        outcomes = df["outcome"].values
        n_obs = len(outcomes)

        # Determine split points (number of observations in each phase)
        phase_sizes = df.groupby("experimentPhase", sort=False).size().values

        # Vectorized permutation test
        permutation_effects = np.zeros(n_permutations)

        for i in range(n_permutations):
            # Shuffle outcomes
            shuffled = rng.permutation(outcomes)

            # Reconstruct phases with shuffled data
            splits = np.cumsum(phase_sizes)[:-1]
            phase_data = np.split(shuffled, splits)

            # Compute effect: Mean(A1, A2) - Mean(B1, B2)
            # Assuming phase order: baseline_1, intervention_A_1, baseline_2, intervention_A_2
            mean_a = (np.mean(phase_data[1]) + np.mean(phase_data[3])) / 2
            mean_b = (np.mean(phase_data[0]) + np.mean(phase_data[2])) / 2

            permutation_effects[i] = mean_a - mean_b

        # Two-tailed p-value
        p_value = np.mean(np.abs(permutation_effects) >= np.abs(observed_effect))

        return float(p_value), permutation_effects

    def calculate_cohens_d(self, a_data: NDArray, b_data: NDArray) -> float:
        """
        Calculate Cohen's d effect size.

        Cohen's d = (Mean(A) - Mean(B)) / Pooled_SD

        Interpretation:
        - 0.2: Small effect
        - 0.5: Medium effect
        - 0.8: Large effect

        Args:
            a_data: Intervention phase data
            b_data: Baseline phase data

        Returns:
            Cohen's d effect size
        """
        mean_a = np.mean(a_data)
        mean_b = np.mean(b_data)

        # Pooled standard deviation
        n_a, n_b = len(a_data), len(b_data)
        var_a, var_b = np.var(a_data, ddof=1), np.var(b_data, ddof=1)
        pooled_sd = np.sqrt(((n_a - 1) * var_a + (n_b - 1) * var_b) / (n_a + n_b - 2))

        if pooled_sd == 0:
            return 0.0

        return float((mean_a - mean_b) / pooled_sd)

    @lru_cache(maxsize=128)
    def run_analysis_cached(
        self,
        user_id: str,
        protocol_id: str,
        outcome_metric: str,
        n_permutations: int,
        seed: Optional[int],
    ) -> Dict:
        """
        Cached wrapper for run_analysis (for repeated queries).

        LRU cache with 128 entry limit to avoid memory bloat.
        """
        return self._run_analysis_impl(
            user_id, protocol_id, outcome_metric, n_permutations, seed
        )

    def run_analysis(
        self,
        user_id: str,
        protocol_id: str = "default",
        outcome_metric: str = "sessionPerformanceScore",
        n_permutations: int = 10000,
        seed: Optional[int] = None,
    ) -> Dict:
        """
        Run complete ABAB randomization analysis.

        Steps:
        1. Fetch ABAB data from DuckDB
        2. Validate phases and sample sizes
        3. Calculate observed effect
        4. Run permutation test
        5. Compute Cohen's d
        6. Log to MLflow
        7. Return results

        Args:
            user_id: User ID
            protocol_id: Experiment protocol ID
            outcome_metric: Outcome variable column name
            n_permutations: Number of permutation iterations (1,000-50,000)
            seed: Random seed for reproducibility

        Returns:
            Dict with:
                - observed_effect: Mean difference (A - B)
                - p_value: Two-tailed p-value
                - cohens_d: Effect size
                - permutation_distribution: Array of permuted effects
                - n_observations_per_phase: Dict of phase sample sizes
                - mlflow_run_id: MLflow tracking run ID
                - computation_time_seconds: Total time

        Raises:
            ValueError: If data validation fails (missing phases, insufficient data)
        """
        return self._run_analysis_impl(
            user_id, protocol_id, outcome_metric, n_permutations, seed
        )

    def _run_analysis_impl(
        self,
        user_id: str,
        protocol_id: str,
        outcome_metric: str,
        n_permutations: int,
        seed: Optional[int],
    ) -> Dict:
        """Internal implementation of run_analysis (for caching)."""
        start_time = time.time()

        # 1. Fetch data
        df = self.fetch_abab_data(user_id, protocol_id, outcome_metric)

        # 2. Calculate observed effect
        observed_effect = self.calculate_observed_effect(df)

        # 3. Run permutation test
        p_value, permutation_dist = self.run_permutation_test(df, n_permutations, seed)

        # 4. Calculate Cohen's d
        a_data = df[
            df["experimentPhase"].isin(["intervention_A_1", "intervention_A_2"])
        ]["outcome"].values
        b_data = df[
            df["experimentPhase"].isin(["baseline_1", "baseline_2"])
        ]["outcome"].values
        cohens_d = self.calculate_cohens_d(a_data, b_data)

        # 5. Phase sample sizes
        phase_counts = df.groupby("experimentPhase").size().to_dict()

        # 6. Check WWC SCED standards
        passes_wwc, wwc_details = check_sced_standards(
            df=df,
            observed_effect=observed_effect,
            p_value=p_value,
            cohens_d=cohens_d,
        )

        # 7. Log to MLflow
        mlflow_run_id = self._log_to_mlflow(
            user_id=user_id,
            protocol_id=protocol_id,
            outcome_metric=outcome_metric,
            observed_effect=observed_effect,
            p_value=p_value,
            cohens_d=cohens_d,
            n_permutations=n_permutations,
            phase_counts=phase_counts,
            wwc_rating=wwc_details["wwc_rating"],
            passes_wwc=passes_wwc,
            seed=seed,
        )

        computation_time = time.time() - start_time

        return {
            "observed_effect": observed_effect,
            "p_value": p_value,
            "cohens_d": cohens_d,
            "permutation_distribution": permutation_dist.tolist(),
            "n_observations_per_phase": phase_counts,
            "passes_sced_standards": passes_wwc,
            "wwc_details": wwc_details,
            "mlflow_run_id": mlflow_run_id,
            "computation_time_seconds": computation_time,
        }

    def _log_to_mlflow(
        self,
        user_id: str,
        protocol_id: str,
        outcome_metric: str,
        observed_effect: float,
        p_value: float,
        cohens_d: float,
        n_permutations: int,
        phase_counts: Dict[str, int],
        wwc_rating: str,
        passes_wwc: bool,
        seed: Optional[int],
    ) -> str:
        """
        Log ABAB analysis to MLflow.

        Args:
            (all analysis parameters and results)

        Returns:
            MLflow run ID
        """
        with mlflow.start_run() as run:
            # Log parameters
            mlflow.log_param("user_id", user_id)
            mlflow.log_param("protocol_id", protocol_id)
            mlflow.log_param("outcome_metric", outcome_metric)
            mlflow.log_param("n_permutations", n_permutations)
            mlflow.log_param("seed", seed if seed is not None else "random")

            # Log metrics
            mlflow.log_metric("observed_effect", observed_effect)
            mlflow.log_metric("p_value", p_value)
            mlflow.log_metric("cohens_d", cohens_d)

            # Log phase sample sizes
            for phase, count in phase_counts.items():
                mlflow.log_metric(f"n_{phase}", count)

            # Log tags
            mlflow.set_tag("analysis_type", "ABAB_randomization")
            mlflow.set_tag("user_id", user_id)
            mlflow.set_tag("significant", "yes" if p_value < 0.05 else "no")
            mlflow.set_tag("wwc_rating", wwc_rating)
            mlflow.set_tag("passes_wwc", "yes" if passes_wwc else "no")

            return run.info.run_id
