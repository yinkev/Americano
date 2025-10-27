"""
Visualization utilities for Bayesian ITS analysis.

This module provides publication-ready plots for:
1. Observed vs Counterfactual (main ITS plot)
2. Posterior Predictive Check (model validation)
3. Effect Distribution (posterior of causal effect)
4. MCMC Diagnostics (trace plots, R-hat, ESS)

All plots are returned as base64-encoded PNG strings for JSON API responses.
"""

import base64
from io import BytesIO
from typing import Dict, Any

import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
import arviz as az
from matplotlib.figure import Figure


# Set publication-ready style
sns.set_style("whitegrid")
plt.rcParams.update({
    "font.size": 10,
    "axes.labelsize": 12,
    "axes.titlesize": 14,
    "xtick.labelsize": 10,
    "ytick.labelsize": 10,
    "legend.fontsize": 10,
    "figure.dpi": 150,
})


def _fig_to_base64(fig: Figure) -> str:
    """
    Convert matplotlib figure to base64-encoded PNG string.

    Args:
        fig: Matplotlib figure

    Returns:
        Base64-encoded PNG string
    """
    buffer = BytesIO()
    fig.savefig(buffer, format="png", bbox_inches="tight", dpi=150)
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.read()).decode("utf-8")
    plt.close(fig)
    return img_base64


def plot_observed_vs_counterfactual(
    model_result: Dict[str, Any],
) -> str:
    """
    Plot observed data vs counterfactual prediction.

    This is the main ITS visualization showing:
    - Pre-intervention observed data (blue)
    - Post-intervention observed data (orange)
    - Counterfactual prediction (dashed red) - what would have happened without intervention
    - Credible intervals (shaded region)
    - Intervention line (vertical dashed)

    Args:
        model_result: Output from BayesianITSEngine.run_causalpy_its()

    Returns:
        Base64-encoded PNG string
    """
    fig, ax = plt.subplots(figsize=(12, 6))

    pre_data = model_result["pre_data"]
    post_data = model_result["post_data"]
    model = model_result["model"]

    # Plot pre-intervention data
    ax.scatter(
        pre_data["time"],
        pre_data["outcome"],
        color="steelblue",
        alpha=0.6,
        label="Pre-intervention",
        s=50,
    )

    # Plot post-intervention data
    ax.scatter(
        post_data["time"],
        post_data["outcome"],
        color="darkorange",
        alpha=0.6,
        label="Post-intervention",
        s=50,
    )

    # Plot counterfactual (if available from CausalPy)
    if hasattr(model, "y_counterfactual"):
        counterfactual = model.y_counterfactual
        ax.plot(
            post_data["time"],
            counterfactual.mean(axis=0),
            "r--",
            linewidth=2,
            label="Counterfactual (no intervention)",
        )

        # Add credible interval
        ci_lower = np.percentile(counterfactual, 2.5, axis=0)
        ci_upper = np.percentile(counterfactual, 97.5, axis=0)
        ax.fill_between(
            post_data["time"],
            ci_lower,
            ci_upper,
            color="red",
            alpha=0.2,
            label="95% CI",
        )

    # Intervention line
    intervention_time = pre_data["time"].max()
    ax.axvline(
        intervention_time,
        color="black",
        linestyle="--",
        linewidth=2,
        label="Intervention",
    )

    # Labels and legend
    ax.set_xlabel("Days Since Start", fontsize=12)
    ax.set_ylabel("Outcome (Performance Score)", fontsize=12)
    ax.set_title(
        "Bayesian ITS: Observed vs Counterfactual",
        fontsize=14,
        fontweight="bold",
    )
    ax.legend(loc="best", frameon=True, shadow=True)
    ax.grid(True, alpha=0.3)

    return _fig_to_base64(fig)


def plot_posterior_predictive_check(
    model_result: Dict[str, Any],
) -> str:
    """
    Plot posterior predictive check (PPC).

    This validates model fit by comparing:
    - Observed data (histogram)
    - Posterior predictive samples (overlaid lines)

    A good fit means posterior predictions match observed data distribution.

    Args:
        model_result: Output from BayesianITSEngine.run_causalpy_its()

    Returns:
        Base64-encoded PNG string
    """
    fig, ax = plt.subplots(figsize=(10, 6))

    idata = model_result["idata"]

    # Use ArviZ for PPC plot
    az.plot_ppc(idata, ax=ax, mean=False, num_pp_samples=100)

    ax.set_title(
        "Posterior Predictive Check",
        fontsize=14,
        fontweight="bold",
    )
    ax.set_xlabel("Outcome (Performance Score)", fontsize=12)
    ax.set_ylabel("Density", fontsize=12)
    ax.grid(True, alpha=0.3)

    return _fig_to_base64(fig)


def plot_effect_distribution(
    results: Dict[str, Any],
) -> str:
    """
    Plot posterior distribution of causal effect.

    Shows:
    - Histogram of posterior samples
    - Credible intervals (shaded)
    - Probability mass > 0 (benefit)
    - Probability mass < 0 (harm)

    Args:
        results: Output from BayesianITSEngine.extract_results()

    Returns:
        Base64-encoded PNG string
    """
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    # Immediate effect
    immediate = results["immediate_effect"]
    ax = axes[0]

    # Generate samples for visualization (approximate from CI)
    # In reality, we'd want actual posterior samples
    mean = immediate.point_estimate
    std = (immediate.ci_upper - immediate.ci_lower) / (2 * 1.96)
    samples = np.random.normal(mean, std, 10000)

    ax.hist(samples, bins=50, density=True, alpha=0.7, color="steelblue")
    ax.axvline(mean, color="red", linestyle="--", linewidth=2, label="Mean")
    ax.axvline(immediate.ci_lower, color="orange", linestyle="--", linewidth=1.5, label="95% CI")
    ax.axvline(immediate.ci_upper, color="orange", linestyle="--", linewidth=1.5)
    ax.axvline(0, color="black", linestyle="-", linewidth=1, alpha=0.5)

    ax.set_xlabel("Immediate Effect", fontsize=12)
    ax.set_ylabel("Density", fontsize=12)
    ax.set_title(
        f"Immediate Effect\nP(benefit) = {immediate.probability_positive:.2%}",
        fontsize=12,
        fontweight="bold",
    )
    ax.legend(loc="best")
    ax.grid(True, alpha=0.3)

    # Counterfactual effect
    counterfactual = results["counterfactual_effect"]
    ax = axes[1]

    mean = counterfactual.point_estimate
    std = (counterfactual.ci_upper - counterfactual.ci_lower) / (2 * 1.96)
    samples = np.random.normal(mean, std, 10000)

    ax.hist(samples, bins=50, density=True, alpha=0.7, color="darkorange")
    ax.axvline(mean, color="red", linestyle="--", linewidth=2, label="Mean")
    ax.axvline(counterfactual.ci_lower, color="blue", linestyle="--", linewidth=1.5, label="95% CI")
    ax.axvline(counterfactual.ci_upper, color="blue", linestyle="--", linewidth=1.5)
    ax.axvline(0, color="black", linestyle="-", linewidth=1, alpha=0.5)

    ax.set_xlabel("Counterfactual Effect", fontsize=12)
    ax.set_ylabel("Density", fontsize=12)
    ax.set_title(
        f"Counterfactual Effect\nP(benefit) = {counterfactual.probability_positive:.2%}",
        fontsize=12,
        fontweight="bold",
    )
    ax.legend(loc="best")
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    return _fig_to_base64(fig)


def plot_mcmc_diagnostics(
    model_result: Dict[str, Any],
    results: Dict[str, Any],
) -> str:
    """
    Plot MCMC diagnostics.

    Shows:
    - Trace plots (sampling history per chain)
    - R-hat values (convergence diagnostic)
    - Effective sample size (ESS)

    Good convergence:
    - R-hat < 1.01 for all parameters
    - ESS > 1000 for all parameters
    - No divergent transitions

    Args:
        model_result: Output from BayesianITSEngine.run_causalpy_its()
        results: Output from BayesianITSEngine.extract_results()

    Returns:
        Base64-encoded PNG string
    """
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    idata = model_result["idata"]
    diagnostics = results["mcmc_diagnostics"]

    # 1. Trace plot
    az.plot_trace(idata, axes=axes[0, :], compact=False)
    axes[0, 0].set_title("Trace Plots", fontsize=12, fontweight="bold")

    # 2. R-hat values
    ax = axes[1, 0]
    rhat_values = list(diagnostics.r_hat.values())
    rhat_labels = list(diagnostics.r_hat.keys())

    colors = ["green" if r < 1.01 else "red" for r in rhat_values]
    ax.barh(rhat_labels, rhat_values, color=colors, alpha=0.7)
    ax.axvline(1.01, color="red", linestyle="--", linewidth=2, label="Threshold (1.01)")
    ax.set_xlabel("R-hat", fontsize=12)
    ax.set_title("R-hat Convergence Diagnostic", fontsize=12, fontweight="bold")
    ax.legend(loc="best")
    ax.grid(True, alpha=0.3, axis="x")

    # 3. Effective sample size
    ax = axes[1, 1]
    ess_values = list(diagnostics.effective_sample_size.values())
    ess_labels = list(diagnostics.effective_sample_size.keys())

    colors = ["green" if e > 1000 else "orange" for e in ess_values]
    ax.barh(ess_labels, ess_values, color=colors, alpha=0.7)
    ax.axvline(1000, color="orange", linestyle="--", linewidth=2, label="Target (1000)")
    ax.set_xlabel("Effective Sample Size", fontsize=12)
    ax.set_title("Effective Sample Size (ESS)", fontsize=12, fontweight="bold")
    ax.legend(loc="best")
    ax.grid(True, alpha=0.3, axis="x")

    plt.tight_layout()
    return _fig_to_base64(fig)


def generate_all_plots(
    model_result: Dict[str, Any],
    results: Dict[str, Any],
) -> Dict[str, str]:
    """
    Generate all ITS plots.

    Args:
        model_result: Output from BayesianITSEngine.run_causalpy_its()
        results: Output from BayesianITSEngine.extract_results()

    Returns:
        Dictionary of base64-encoded PNG strings:
            - observed_vs_counterfactual
            - posterior_predictive_check
            - effect_distribution
            - mcmc_diagnostics
    """
    return {
        "observed_vs_counterfactual": plot_observed_vs_counterfactual(model_result),
        "posterior_predictive_check": plot_posterior_predictive_check(model_result),
        "effect_distribution": plot_effect_distribution(results),
        "mcmc_diagnostics": plot_mcmc_diagnostics(model_result, results),
    }
