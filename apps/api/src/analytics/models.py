"""
Pydantic models for Story 4.6 - Comprehensive Understanding Analytics.

All models use Pydantic V2 with Field validators, type hints, and JSON schema support.
These models serialize to TypeScript interfaces for Next.js integration.
"""

from datetime import datetime
from typing import List, Dict, Optional, Literal, Any
from pydantic import BaseModel, Field, field_validator


# ============================================================================
# Predictive Analytics Models
# ============================================================================

class ExamSuccessPrediction(BaseModel):
    """
    Prediction of exam success probability using logistic regression.

    Features: comprehension (30%), reasoning (35%), mastery (20%), calibration (15%)
    """
    probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Predicted probability of passing exam (0-1 scale)"
    )
    confidence_interval: tuple[float, float] = Field(
        ...,
        description="95% confidence interval for prediction"
    )
    contributing_factors: Dict[str, float] = Field(
        ...,
        description="Feature contributions: {comprehension, reasoning, mastery, calibration}"
    )
    recommendation: str = Field(
        ...,
        description="AI-generated recommendation based on prediction"
    )


class ForgettingRiskPrediction(BaseModel):
    """
    Forgetting risk calculation using Ebbinghaus forgetting curve: R = e^(-t/S).

    Where:
    - R = retention probability
    - t = days since last review
    - S = strength (based on mastery level and review history)
    """
    objective_id: str
    objective_name: str
    retention_probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Probability of retaining knowledge (0-1 scale)"
    )
    days_since_review: int = Field(..., ge=0)
    strength_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Knowledge strength based on mastery and review frequency"
    )
    risk_level: Literal["low", "moderate", "high", "critical"] = Field(
        ...,
        description="Categorized forgetting risk"
    )
    recommended_review_date: datetime


class MasteryDatePrediction(BaseModel):
    """
    Predicted date to reach 80% mastery using linear regression extrapolation.
    """
    objective_id: str
    objective_name: str
    current_score: float = Field(..., ge=0.0, le=100.0)
    predicted_mastery_date: Optional[datetime] = Field(
        None,
        description="Predicted date to reach 80% threshold (None if already mastered or insufficient data)"
    )
    days_to_mastery: Optional[int] = Field(
        None,
        ge=0,
        description="Estimated days until mastery"
    )
    weekly_improvement_rate: float = Field(
        ...,
        description="Average weekly improvement in percentage points"
    )
    confidence: Literal["high", "moderate", "low"] = Field(
        ...,
        description="Prediction confidence based on data points and consistency"
    )


class ModelAccuracy(BaseModel):
    """Model performance metrics for prediction accuracy tracking."""
    metric_name: str
    mean_absolute_error: float = Field(..., ge=0.0)
    r_squared: float = Field(..., ge=0.0, le=1.0, description="R² score")
    sample_size: int = Field(..., ge=0)
    last_updated: datetime


class UnderstandingPrediction(BaseModel):
    """
    Comprehensive prediction data for all analytics.
    """
    user_id: str
    exam_success: ExamSuccessPrediction
    forgetting_risks: List[ForgettingRiskPrediction]
    mastery_dates: List[MasteryDatePrediction]
    model_accuracy: Dict[str, ModelAccuracy] = Field(
        ...,
        description="Accuracy metrics for each prediction model"
    )
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Comprehension Pattern Models
# ============================================================================

class ObjectiveStrength(BaseModel):
    """Top performing objective (top 10% percentile)."""
    objective_id: str
    objective_name: str
    score: float = Field(..., ge=0.0, le=100.0)
    percentile_rank: float = Field(..., ge=90.0, le=100.0)


class ObjectiveWeakness(BaseModel):
    """Underperforming objective (bottom 10% percentile)."""
    objective_id: str
    objective_name: str
    score: float = Field(..., ge=0.0, le=100.0)
    percentile_rank: float = Field(..., ge=0.0, le=10.0)


class CalibrationIssue(BaseModel):
    """Confidence calibration mismatch."""
    objective_id: str
    objective_name: str
    calibration_delta: float = Field(
        ...,
        description="Difference between confidence and performance (positive = overconfident)"
    )
    category: Literal["overconfident", "underconfident", "dangerous_gap"]
    description: str


class AIInsight(BaseModel):
    """
    Structured AI-generated insight from ChatMock (GPT-5) via instructor.

    Format: category-observation-action
    """
    category: Literal["strength", "weakness", "pattern", "recommendation"]
    observation: str = Field(
        ...,
        min_length=10,
        max_length=200,
        description="What the AI observed in the data"
    )
    action: str = Field(
        ...,
        min_length=10,
        max_length=200,
        description="Recommended action for the learner"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="AI confidence in this insight"
    )


class ComprehensionPattern(BaseModel):
    """Comprehensive analysis of user's comprehension patterns."""
    user_id: str
    strengths: List[ObjectiveStrength]
    weaknesses: List[ObjectiveWeakness]
    calibration_issues: List[CalibrationIssue]
    ai_insights: List[AIInsight] = Field(
        ...,
        min_length=3,
        max_length=5,
        description="3-5 AI-generated insights from ChatMock"
    )
    analysis_date_range: tuple[datetime, datetime]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Longitudinal Progress Models
# ============================================================================

class Milestone(BaseModel):
    """Significant achievement in learning journey."""
    objective_id: str
    objective_name: str
    milestone_type: Literal["mastery_verified", "major_improvement", "streak_achieved"]
    date_achieved: datetime
    description: str
    score_before: Optional[float] = None
    score_after: Optional[float] = None


class Regression(BaseModel):
    """Performance decline in previously mastered topic."""
    objective_id: str
    objective_name: str
    score_before: float = Field(..., ge=0.0, le=100.0)
    score_after: float = Field(..., ge=0.0, le=100.0)
    decline_amount: float = Field(..., gt=0.0, description="Percentage point decline")
    date_detected: datetime
    possible_causes: List[str]


class GrowthTrajectory(BaseModel):
    """Linear regression prediction of growth."""
    objective_id: str
    objective_name: str
    slope: float = Field(..., description="Weekly improvement rate")
    intercept: float
    r_squared: float = Field(..., ge=0.0, le=1.0)
    predicted_days_to_mastery: Optional[int] = None


class ImprovementRate(BaseModel):
    """Calculated improvement rates."""
    period: Literal["week", "month"]
    rate: float = Field(..., description="Percentage point improvement per period")
    trend: Literal["accelerating", "stable", "decelerating"]


class LongitudinalMetric(BaseModel):
    """Historical progress tracking over time."""
    user_id: str
    metrics: List[Dict[str, float]] = Field(
        ...,
        description="Time series data: [{timestamp, score, confidence, ...}]"
    )
    milestones: List[Milestone]
    regressions: List[Regression]
    growth_trajectory: List[GrowthTrajectory]
    improvement_rates: Dict[str, ImprovementRate] = Field(
        ...,
        description="Rates by period: {week: ImprovementRate, month: ImprovementRate}"
    )
    date_range: tuple[datetime, datetime]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Cross-Objective Correlation Models
# ============================================================================

class CorrelationMatrix(BaseModel):
    """
    Pearson correlation coefficient matrix for all objectives.

    Matrix format: [[objective_pairs], [correlation_values]]
    """
    user_id: str
    matrix: List[List[float]] = Field(
        ...,
        description="NxN correlation matrix where N = number of objectives"
    )
    objective_ids: List[str] = Field(
        ...,
        description="Ordered list of objective IDs corresponding to matrix indices"
    )
    objective_names: List[str]
    foundational_objectives: List[Dict[str, Any]] = Field(
        ...,
        description="High positive correlation (>0.5) with many others"
    )
    bottleneck_objectives: List[Dict[str, Any]] = Field(
        ...,
        description="Low score + negative correlation pattern"
    )
    recommended_study_sequence: List[str] = Field(
        ...,
        description="Ordered list of objective IDs prioritizing foundational objectives"
    )
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Peer Benchmarking Models
# ============================================================================

class PeerDistribution(BaseModel):
    """
    Statistical distribution of peer performance for box plot visualization.

    Includes quartiles, IQR, and whiskers for outlier detection.
    """
    mean: float
    median: float  # same as p50
    std_dev: float
    quartiles: Dict[str, float] = Field(
        ...,
        description="{p25, p50, p75} percentile values"
    )
    # Box plot specific fields
    q1: float = Field(..., description="First quartile (p25)")
    q2: float = Field(..., description="Second quartile (p50, median)")
    q3: float = Field(..., description="Third quartile (p75)")
    iqr: float = Field(..., description="Interquartile range (q3 - q1)")
    whisker_low: float = Field(..., description="Lower whisker: q1 - 1.5*iqr")
    whisker_high: float = Field(..., description="Upper whisker: q3 + 1.5*iqr")
    sample_size: int = Field(..., ge=50, description="Minimum 50 users for validity")
    last_calculated: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp of last calculation"
    )


class RelativePerformance(BaseModel):
    """User's position relative to peers."""
    objective_id: str
    objective_name: str
    user_score: float
    user_percentile: float = Field(..., ge=0.0, le=100.0)
    category: Literal["top_quartile", "above_average", "below_average", "bottom_quartile"]


class RelativeStrength(BaseModel):
    """Objective where user performs better than average."""
    objective_id: str
    objective_name: str
    user_percentile: float = Field(..., ge=0.0, le=100.0)
    peer_avg: float = Field(..., ge=0.0, le=100.0)
    advantage: float = Field(
        ...,
        description="user_percentile - avg_percentile (positive value)"
    )


class RelativeWeakness(BaseModel):
    """Objective where user performs below average."""
    objective_id: str
    objective_name: str
    user_percentile: float = Field(..., ge=0.0, le=100.0)
    peer_avg: float = Field(..., ge=0.0, le=100.0)
    disadvantage: float = Field(
        ...,
        description="avg_percentile - user_percentile (positive value)"
    )


class PeerBenchmark(BaseModel):
    """Peer comparison data (anonymized, minimum 50 users)."""
    user_id: str
    objective_id: Optional[str] = Field(
        None,
        description="Specific objective ID or None for overall comparison"
    )
    peer_distribution: PeerDistribution
    user_percentile: float = Field(..., ge=0.0, le=100.0)
    relative_strengths: List[RelativePerformance] = Field(
        ...,
        description="Objectives where user is in top 25%"
    )
    relative_weaknesses: List[RelativePerformance] = Field(
        ...,
        description="Objectives where user is in bottom 25%"
    )
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Recommendation Models
# ============================================================================

class InterventionSuggestion(BaseModel):
    """Personalized intervention based on detected patterns."""
    pattern_detected: Literal[
        "overconfidence",
        "weak_reasoning",
        "poor_retention",
        "bottleneck_detected",
        "regression_detected"
    ]
    intervention_type: Literal[
        "more_failure_challenges",
        "clinical_scenarios",
        "spaced_repetition",
        "foundational_review",
        "immediate_review"
    ]
    description: str
    priority: Literal["high", "medium", "low"]
    estimated_time_hours: float = Field(..., gt=0.0)


class TimeToMasteryEstimate(BaseModel):
    """Estimated time required to reach mastery for each objective."""
    objective_id: str
    objective_name: str
    current_score: float
    hours_to_mastery: float = Field(
        ...,
        gt=0.0,
        description="Estimated study hours to reach 80% threshold"
    )
    weeks_to_mastery: float


class DailyInsight(BaseModel):
    """
    Single daily recommendation (highest priority).

    Priority scoring:
    1. Dangerous gaps (overconfidence + low score)
    2. Bottleneck objectives (blocking others)
    3. Weaknesses (bottom 10%)
    4. Optimization opportunities
    """
    user_id: str
    priority_objective_id: str
    priority_objective_name: str
    insight_category: Literal["dangerous_gap", "bottleneck", "weakness", "optimization"]
    title: str = Field(..., min_length=10, max_length=100)
    description: str = Field(..., min_length=50, max_length=300)
    action_items: List[str] = Field(
        ...,
        min_length=2,
        max_length=4,
        description="2-4 specific action items"
    )
    estimated_time_minutes: int = Field(..., gt=0, le=120)
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class WeeklyTopObjective(BaseModel):
    """One of top 3 objectives to focus on this week."""
    objective_id: str
    objective_name: str
    rationale: str = Field(
        ...,
        min_length=50,
        max_length=200,
        description="ChatMock-generated rationale for prioritizing this objective"
    )
    estimated_hours: float = Field(..., gt=0.0)


class RecommendationData(BaseModel):
    """
    Comprehensive personalized recommendations.

    Uses ChatMock (GPT-5) via instructor for AI-generated text.
    """
    user_id: str
    daily_insight: DailyInsight
    weekly_top3: List[WeeklyTopObjective] = Field(
        ...,
        min_length=3,
        max_length=3,
        description="Exactly 3 top objectives for the week"
    )
    interventions: List[InterventionSuggestion]
    time_estimates: List[TimeToMasteryEstimate]
    exam_success_probability: float = Field(..., ge=0.0, le=1.0)
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Request/Response Models for FastAPI Routes
# ============================================================================

class AnalyticsRequest(BaseModel):
    """Base request model for analytics endpoints."""
    user_id: str = Field(..., min_length=1, description="User ID or email")
    date_range: Optional[Literal["7d", "30d", "90d", "1y", "all"]] = "30d"


class PatternsRequest(AnalyticsRequest):
    """Request for comprehension patterns analysis."""
    pass


class LongitudinalRequest(AnalyticsRequest):
    """Request for historical progress tracking."""
    dimensions: List[Literal["comprehension", "reasoning", "calibration", "mastery"]] = Field(
        default_factory=lambda: ["comprehension", "reasoning", "calibration", "mastery"]
    )


class PredictionsRequest(AnalyticsRequest):
    """Request for predictive analytics."""
    exam_type: Optional[str] = Field(None, description="Specific exam to predict for")


class CorrelationsRequest(BaseModel):
    """Request for cross-objective correlations."""
    user_id: str


class PeerBenchmarkRequest(BaseModel):
    """Request for peer comparison."""
    user_id: str
    objective_id: Optional[str] = None


class RecommendationsRequest(BaseModel):
    """Request for AI recommendations."""
    user_id: str


# ============================================================================
# Dashboard & Comparison Models
# ============================================================================

class DashboardMetricSummary(BaseModel):
    """Summary of a single validation metric for dashboard display."""
    current_score: float = Field(..., ge=0.0, le=100.0, description="Current average score")
    trend: Literal["up", "down", "stable"] = Field(..., description="Trend direction")
    sparkline: List[float] = Field(..., description="Last 7 data points for mini chart")
    change_percentage: Optional[float] = Field(None, description="% change from previous period")


class MasterySummary(BaseModel):
    """Mastery status summary for dashboard."""
    count: int = Field(..., ge=0, description="Number of objectives at mastery level (>=80%)")
    total: int = Field(..., ge=0, description="Total number of objectives")
    percentage: float = Field(..., ge=0.0, le=100.0, description="Mastery percentage")


class DashboardResponse(BaseModel):
    """
    Dashboard overview with 6 metric summaries.

    Aggregates data from:
    - Story 4.1: Comprehension (validation prompts)
    - Story 4.2: Clinical reasoning (scenario performance)
    - Story 4.3: Controlled failure (challenge learning effectiveness)
    - Story 4.4: Calibration accuracy (confidence vs performance)
    - Story 4.5: Adaptive efficiency (IRT difficulty matching)
    - Mastery verification (objectives at >=80%)
    """
    user_id: str
    comprehension: DashboardMetricSummary
    reasoning: DashboardMetricSummary
    failure: DashboardMetricSummary
    calibration: DashboardMetricSummary
    adaptive: DashboardMetricSummary
    mastery: MasterySummary
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class MemorizationVsUnderstandingGap(BaseModel):
    """Objective showing gap between memorization and understanding."""
    objective_id: str
    objective_name: str
    memorization_score: float = Field(..., ge=0.0, le=100.0, description="Flashcard avg score")
    understanding_score: float = Field(..., ge=0.0, le=100.0, description="Validation avg score")
    gap: float = Field(..., description="memorization - understanding (positive = illusion of knowledge)")
    severity: Literal["high", "medium", "low"] = Field(
        ...,
        description="high: gap > 30, medium: gap > 20, low: gap <= 20"
    )


class ComparisonResponse(BaseModel):
    """
    Understanding vs memorization comparison.

    Compares:
    - Memorization proxy: Flashcard review performance (spaced repetition scores)
    - Understanding measure: Validation assessment scores (comprehension, reasoning)

    Identifies "Illusion of Knowledge" where flashcard performance is high but understanding is low.
    """
    user_id: str
    memorization_trend: List[Dict[str, Any]] = Field(
        ...,
        description="Time series: [{date, score}]"
    )
    understanding_trend: List[Dict[str, Any]] = Field(
        ...,
        description="Time series: [{date, score}]"
    )
    gaps: List[MemorizationVsUnderstandingGap] = Field(
        ...,
        description="Objectives with memorization-understanding gap"
    )
    correlation_coefficient: float = Field(
        ...,
        ge=-1.0,
        le=1.0,
        description="Pearson correlation between memorization and understanding"
    )
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class DashboardRequest(AnalyticsRequest):
    """Request for dashboard overview."""
    course_id: Optional[str] = Field(None, description="Filter by course")
    topic: Optional[str] = Field(None, description="Filter by topic tag")


class ComparisonRequest(AnalyticsRequest):
    """Request for memorization vs understanding comparison."""
    pass


# ============================================================================
# Dashboard Summary Models (Story 4.6 - Endpoint 7/8)
# ============================================================================

class TrendPoint(BaseModel):
    """Single data point in trend time series."""
    date: datetime
    score: float = Field(..., ge=0.0, le=100.0)


class DashboardSummary(BaseModel):
    """
    Comprehensive dashboard summary aggregating all Epic 4 validation metrics.

    Provides high-level overview with:
    - Overall understanding score (weighted average)
    - Total sessions and questions completed
    - Mastery level breakdown (beginner, proficient, expert)
    - Recent performance trends (last 7 days)
    - Calibration status assessment
    - Top strengths and improvement areas
    """
    overall_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Weighted average across all validation dimensions"
    )
    total_sessions: int = Field(..., ge=0, description="Total learning sessions completed")
    total_questions: int = Field(..., ge=0, description="Total validation questions answered")
    mastery_breakdown: Dict[str, int] = Field(
        ...,
        description="Count by level: {'beginner': N, 'proficient': N, 'expert': N}"
    )
    recent_trends: List[TrendPoint] = Field(
        ...,
        description="Last 7 days of overall scores"
    )
    calibration_status: Literal["well-calibrated", "overconfident", "underconfident"] = Field(
        ...,
        description="Overall confidence calibration assessment"
    )
    top_strengths: List[str] = Field(
        ...,
        min_length=0,
        max_length=3,
        description="Top 3 areas of strength (objective names)"
    )
    improvement_areas: List[str] = Field(
        ...,
        min_length=0,
        max_length=3,
        description="Top 3 areas needing improvement (objective names)"
    )
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Peer Comparison Models (Story 4.6 - Endpoint 8/8)
# ============================================================================

class DimensionComparison(BaseModel):
    """
    Per-dimension comparison between user and peers.

    Dimensions: terminology, relationships, application, clarity
    """
    dimension: str = Field(
        ...,
        description="Dimension name: terminology, relationships, application, clarity"
    )
    user_score: float = Field(..., ge=0.0, le=100.0)
    peer_average: float = Field(..., ge=0.0, le=100.0)
    percentile: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="User's percentile rank for this dimension (scipy percentileofscore)"
    )


class ComparisonResult(BaseModel):
    """
    Comparison analytics result comparing user performance with peer group.

    Uses scipy.stats.percentileofscore for percentile calculations.
    Minimum 50 users required for valid peer comparison.
    """
    user_percentile: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Overall percentile rank (scipy percentileofscore)"
    )
    user_score: float = Field(..., ge=0.0, le=100.0)
    peer_average: float = Field(..., ge=0.0, le=100.0)
    peer_std_dev: float = Field(..., ge=0.0)
    dimension_comparisons: List[DimensionComparison] = Field(
        ...,
        description="Per-dimension breakdown: terminology, relationships, application, clarity"
    )
    strengths_vs_peers: List[str] = Field(
        ...,
        description="Dimensions where user_score > peer_average"
    )
    gaps_vs_peers: List[str] = Field(
        ...,
        description="Dimensions where user_score < peer_avg - 0.5*std_dev"
    )
    peer_group_size: int = Field(..., ge=50, description="Number of users in peer group")
    generated_at: datetime = Field(default_factory=datetime.utcnow)
