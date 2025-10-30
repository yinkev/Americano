"""
API routes for Story 4.6 - Comprehensive Understanding Analytics.

Provides endpoints for:
- Daily insights and weekly summaries
- Intervention suggestions based on patterns
- Time-to-mastery estimates
- Success probability predictions
- Comprehensive recommendations (all-in-one)
- Predictive analytics (exam success, forgetting risk, mastery dates)
- Comprehension patterns analysis
- Longitudinal progress tracking
- Cross-objective correlations
- Peer benchmarking
"""

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import datetime

from src.database import get_db_session
from src.analytics.models import (
    # Request models
    AnalyticsRequest,
    PatternsRequest,
    LongitudinalRequest,
    PredictionsRequest,
    CorrelationsRequest,
    PeerBenchmarkRequest,
    RecommendationsRequest,
    # Response models
    RecommendationData,
    DailyInsight,
    WeeklyTopObjective,
    InterventionSuggestion,
    TimeToMasteryEstimate,
    UnderstandingPrediction,
    ComprehensionPattern,
    LongitudinalMetric,
    CorrelationMatrix,
    PeerBenchmark,
    ComparisonResult,
    DimensionComparison,
    DashboardSummary,
    TrendPoint,
)
from src.analytics.recommendations import RecommendationEngine
from src.analytics.predictive_analytics import PredictiveAnalyticsEngine
from src.analytics.comprehension_analyzer import ComprehensionPatternAnalyzer
from src.analytics.progress_tracker import LongitudinalProgressTracker
from src.analytics.correlation_analyzer import CrossObjectiveAnalyzer
from src.analytics.benchmarking import PeerBenchmarkingEngine


# Create router
router = APIRouter(prefix="/analytics", tags=["analytics"])


# ============================================================================
# Helper Functions
# ============================================================================

async def _fetch_user_patterns(user_id: str, session: AsyncSession) -> dict:
    """
    Fetch user's comprehension patterns for intervention suggestions.

    In production, this queries the database for pattern data.
    """
    from sqlalchemy import text

    query = text("""
        SELECT
            COUNT(CASE WHEN vr.calibration_delta > 15 THEN 1 END) as overconfident_count,
            AVG(CASE WHEN vp.dimension = 'reasoning' THEN vr.score * 100 END) as avg_reasoning,
            AVG(vr.score * 100) as avg_retention,
            COUNT(CASE WHEN avg_score < 70 THEN 1 END) as bottleneck_count,
            0 as regression_count
        FROM validation_responses vr
        JOIN validation_prompts vp ON vr.prompt_id = vp.id
        WHERE vr.user_id = :user_id
          AND vr.responded_at >= NOW() - INTERVAL '90 days'
    """)

    result = await session.execute(query, {"user_id": user_id})
    row = result.fetchone()

    if not row:
        return {
            "overconfident_count": 0,
            "avg_reasoning": 70.0,
            "avg_retention": 70.0,
            "bottleneck_count": 0,
            "regression_count": 0
        }

    return {
        "overconfident_count": row.overconfident_count,
        "avg_reasoning": row.avg_reasoning or 70.0,
        "avg_retention": row.avg_retention or 70.0,
        "bottleneck_count": row.bottleneck_count,
        "regression_count": row.regression_count
    }


async def _fetch_objective_performance(
    user_id: str,
    objective_id: str,
    session: AsyncSession
) -> tuple[float, float]:
    """
    Fetch current score and weekly trend for an objective.

    Returns: (current_score, trend_per_week)
    """
    from sqlalchemy import text

    query = text("""
        WITH weekly_scores AS (
            SELECT
                DATE_TRUNC('week', vr.responded_at) as week,
                AVG(vr.score * 100) as avg_score
            FROM validation_responses vr
            JOIN validation_prompts vp ON vr.prompt_id = vp.id
            WHERE vr.user_id = :user_id
              AND vp.objective_id = :objective_id
              AND vr.responded_at >= NOW() - INTERVAL '90 days'
            GROUP BY week
            ORDER BY week DESC
        )
        SELECT
            (SELECT avg_score FROM weekly_scores LIMIT 1) as current_score,
            CASE
                WHEN COUNT(*) >= 2 THEN
                    (MAX(avg_score) - MIN(avg_score)) / NULLIF(COUNT(*) - 1, 0)
                ELSE 0
            END as trend
        FROM weekly_scores
    """)

    result = await session.execute(query, {
        "user_id": user_id,
        "objective_id": objective_id
    })
    row = result.fetchone()

    if not row or row.current_score is None:
        return (65.0, 0.0)  # Default values

    return (row.current_score, row.trend or 0.0)


async def _get_objective_name(objective_id: str, session: AsyncSession) -> str:
    """Get objective name by ID."""
    from sqlalchemy import text

    query = text("SELECT objective FROM learning_objectives WHERE id = :objective_id")
    result = await session.execute(query, {"objective_id": objective_id})
    row = result.fetchone()

    return row.objective if row else f"Objective {objective_id}"


# ============================================================================
# Daily Insight & Weekly Summary Endpoints
# ============================================================================

@router.post(
    "/daily-insight",
    response_model=DailyInsight,
    status_code=status.HTTP_200_OK,
    summary="Get daily insight",
    description="""
    Get single highest-priority recommendation for today.

    Priority scoring:
    1. Dangerous gaps (overconfidence + low score)
    2. Bottleneck objectives (blocking others)
    3. Weaknesses (bottom 10%)
    4. Optimization opportunities

    Returns a single actionable insight with 2-4 action items.
    """
)
async def get_daily_insight(
    request: RecommendationsRequest,
    session: AsyncSession = Depends(get_db_session)
) -> DailyInsight:
    """
    Get single highest-priority recommendation for today.

    Args:
        request: RecommendationsRequest with user_id
        session: Database session

    Returns:
        DailyInsight with priority objective, action items, estimated time

    Raises:
        HTTPException: 500 if daily insight generation fails
    """
    try:
        engine = RecommendationEngine(session)
        insight = await engine.generate_daily_insight(request.user_id)
        return insight
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Daily insight generation failed: {str(e)}"
        )


@router.post(
    "/weekly-summary",
    response_model=List[WeeklyTopObjective],
    status_code=status.HTTP_200_OK,
    summary="Get weekly summary",
    description="""
    Get top 3 objectives to focus on this week.

    Uses ChatMock (GPT-5) via instructor to generate AI rationale for each objective.

    Returns exactly 3 objectives with:
    - ChatMock-generated rationale (50-200 chars)
    - Estimated study hours
    - Objective ID and name
    """
)
async def get_weekly_summary(
    request: RecommendationsRequest,
    session: AsyncSession = Depends(get_db_session)
) -> List[WeeklyTopObjective]:
    """
    Get top 3 objectives for the week.

    Args:
        request: RecommendationsRequest with user_id
        session: Database session

    Returns:
        List of 3 WeeklyTopObjective with AI-generated rationales

    Raises:
        HTTPException: 500 if weekly summary generation fails
    """
    try:
        engine = RecommendationEngine(session)
        top3 = await engine.generate_weekly_summary(request.user_id)
        return top3
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Weekly summary generation failed: {str(e)}"
        )


# ============================================================================
# Intervention & Time Estimation Endpoints
# ============================================================================

@router.post(
    "/interventions",
    response_model=List[InterventionSuggestion],
    status_code=status.HTTP_200_OK,
    summary="Get intervention suggestions",
    description="""
    Get pattern-based intervention recommendations.

    Analyzes user patterns to detect:
    - Overconfidence → More failure challenges
    - Weak reasoning → Clinical scenarios
    - Poor retention → Spaced repetition
    - Bottleneck detected → Foundational review
    - Regression detected → Immediate review

    Returns prioritized interventions with estimated time commitments.
    """
)
async def get_interventions(
    request: RecommendationsRequest,
    session: AsyncSession = Depends(get_db_session)
) -> List[InterventionSuggestion]:
    """
    Get pattern-based intervention recommendations.

    Args:
        request: RecommendationsRequest with user_id
        session: Database session

    Returns:
        List of InterventionSuggestion with pattern detection and recommendations

    Raises:
        HTTPException: 500 if intervention generation fails
    """
    try:
        engine = RecommendationEngine(session)

        # Fetch user patterns
        patterns = await _fetch_user_patterns(request.user_id, session)

        interventions = await engine.generate_intervention_suggestions(patterns)
        return interventions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Intervention generation failed: {str(e)}"
        )


@router.get(
    "/time-to-mastery/{objective_id}",
    response_model=Optional[TimeToMasteryEstimate],
    status_code=status.HTTP_200_OK,
    summary="Estimate time to mastery",
    description="""
    Estimate hours needed to reach mastery (80% threshold) for an objective.

    Uses linear extrapolation from recent performance trends.

    Returns None if:
    - Already mastered (>= 80%)
    - Insufficient data (< 3 data points)
    - Negative trend (mastery unlikely)
    """
)
async def get_time_to_mastery(
    objective_id: str,
    user_id: str,
    session: AsyncSession = Depends(get_db_session)
) -> Optional[TimeToMasteryEstimate]:
    """
    Estimate hours needed to reach mastery for an objective.

    Args:
        objective_id: Learning objective ID
        user_id: User ID
        session: Database session

    Returns:
        TimeToMasteryEstimate or None if mastery unlikely

    Raises:
        HTTPException: 500 if time estimation fails
    """
    try:
        engine = RecommendationEngine(session)

        # Fetch current score and trend
        current_score, trend = await _fetch_objective_performance(user_id, objective_id, session)

        hours = await engine.estimate_time_to_mastery(objective_id, current_score, trend)

        if hours is None:
            return None  # Mastery unlikely (negative trend)

        # Get objective name
        objective_name = await _get_objective_name(objective_id, session)

        return TimeToMasteryEstimate(
            objective_id=objective_id,
            objective_name=objective_name,
            current_score=current_score,
            hours_to_mastery=float(hours),
            weeks_to_mastery=round(hours / 7, 1)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Time estimation failed: {str(e)}"
        )


@router.get(
    "/success-probability/{objective_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Predict success probability",
    description="""
    Predict probability of mastery given planned study time.

    Uses historical performance data and planned hours to estimate success.

    Confidence levels:
    - high: >= 75% probability
    - medium: 50-74% probability
    - low: < 50% probability
    """
)
async def get_success_probability(
    objective_id: str,
    user_id: str,
    planned_hours: int,
    session: AsyncSession = Depends(get_db_session)
) -> dict:
    """
    Predict probability of mastery given planned study time.

    Args:
        objective_id: Learning objective ID
        user_id: User ID
        planned_hours: Planned study hours
        session: Database session

    Returns:
        Dictionary with success probability and confidence level

    Raises:
        HTTPException: 500 if probability prediction fails
    """
    try:
        engine = RecommendationEngine(session)

        probability = await engine.predict_success_probability(objective_id, planned_hours)

        # Determine confidence level
        if probability >= 0.75:
            confidence = "high"
        elif probability >= 0.50:
            confidence = "medium"
        else:
            confidence = "low"

        return {
            "objective_id": objective_id,
            "planned_study_hours": planned_hours,
            "success_probability": round(probability, 2),
            "confidence_level": confidence
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Probability prediction failed: {str(e)}"
        )


# ============================================================================
# Comprehensive Recommendations (All-in-One)
# ============================================================================

@router.post(
    "/recommendations",
    response_model=RecommendationData,
    status_code=status.HTTP_200_OK,
    summary="Get comprehensive recommendations",
    description="""
    Get all recommendations in a single response.

    Includes:
    - Daily insight (highest priority)
    - Weekly top 3 objectives
    - Intervention suggestions
    - Time-to-mastery estimates
    - Exam success probability

    Uses ChatMock (GPT-5) via instructor for AI-generated insights.
    """
)
async def get_comprehensive_recommendations(
    request: RecommendationsRequest,
    session: AsyncSession = Depends(get_db_session)
) -> RecommendationData:
    """
    Get all recommendations in a single response.

    Args:
        request: RecommendationsRequest with user_id
        session: Database session

    Returns:
        RecommendationData with all analytics and recommendations

    Raises:
        HTTPException: 500 if comprehensive recommendations fail
    """
    try:
        engine = RecommendationEngine(session)

        # Generate all recommendations
        daily_insight = await engine.generate_daily_insight(request.user_id)
        weekly_top3 = await engine.generate_weekly_summary(request.user_id)

        # Fetch patterns and generate interventions
        patterns = await _fetch_user_patterns(request.user_id, session)
        interventions = await engine.generate_intervention_suggestions(patterns)

        # Calculate time estimates for top objectives
        time_estimates = []
        for obj in weekly_top3:
            current_score, trend = await _fetch_objective_performance(
                request.user_id, obj.objective_id, session
            )
            hours = await engine.estimate_time_to_mastery(obj.objective_id, current_score, trend)
            if hours:
                time_estimates.append(TimeToMasteryEstimate(
                    objective_id=obj.objective_id,
                    objective_name=obj.objective_name,
                    current_score=current_score,
                    hours_to_mastery=float(hours),
                    weeks_to_mastery=round(hours / 7, 1)
                ))

        # Calculate overall exam success probability
        # In production, use PredictiveAnalyticsEngine for this
        predictive_engine = PredictiveAnalyticsEngine(session)
        predictions = await predictive_engine.generate_predictions(request.user_id)
        exam_probability = predictions.exam_success.probability

        return RecommendationData(
            user_id=request.user_id,
            daily_insight=daily_insight,
            weekly_top3=weekly_top3,
            interventions=interventions,
            time_estimates=time_estimates,
            exam_success_probability=exam_probability
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Comprehensive recommendations failed: {str(e)}"
        )


# ============================================================================
# Predictive Analytics Endpoints
# ============================================================================

@router.post(
    "/predictions",
    response_model=UnderstandingPrediction,
    status_code=status.HTTP_200_OK,
    summary="Get predictive analytics",
    description="""
    Get comprehensive predictive analytics for user.

    Includes:
    - Exam success prediction (logistic regression)
    - Forgetting risk predictions (Ebbinghaus curve)
    - Mastery date predictions (linear extrapolation)
    - Model accuracy metrics (MAE, R² scores)

    Uses scipy for statistical analysis (Pearson correlation, linear regression).
    """
)
async def get_predictions(
    request: PredictionsRequest,
    session: AsyncSession = Depends(get_db_session)
) -> UnderstandingPrediction:
    """
    Get comprehensive predictive analytics.

    Args:
        request: PredictionsRequest with user_id, date_range, exam_type
        session: Database session

    Returns:
        UnderstandingPrediction with all predictions and model accuracy

    Raises:
        HTTPException: 500 if predictions fail
    """
    try:
        engine = PredictiveAnalyticsEngine(session)
        predictions = await engine.generate_predictions(request.user_id)
        return predictions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Predictions failed: {str(e)}"
        )


# ============================================================================
# Comprehension Patterns Endpoints
# ============================================================================

@router.post(
    "/patterns",
    response_model=ComprehensionPattern,
    status_code=status.HTTP_200_OK,
    summary="Analyze comprehension patterns",
    description="""
    Analyze user's comprehension patterns.

    Identifies:
    - Strengths (top 10% percentile objectives)
    - Weaknesses (bottom 10% percentile objectives)
    - Calibration issues (overconfidence, underconfidence, dangerous gaps)
    - AI-generated insights (3-5 insights from ChatMock via instructor)

    Uses percentile ranking and calibration delta analysis.
    """
)
async def get_comprehension_patterns(
    request: PatternsRequest,
    session: AsyncSession = Depends(get_db_session)
) -> ComprehensionPattern:
    """
    Analyze user's comprehension patterns.

    Args:
        request: PatternsRequest with user_id, date_range
        session: Database session

    Returns:
        ComprehensionPattern with strengths, weaknesses, calibration issues, AI insights

    Raises:
        HTTPException: 500 if patterns analysis fails
    """
    try:
        analyzer = ComprehensionPatternAnalyzer(session)
        patterns = await analyzer.analyze_patterns(request.user_id, request.date_range)
        return patterns
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Patterns analysis failed: {str(e)}"
        )


# ============================================================================
# Longitudinal Progress Endpoints
# ============================================================================

@router.post(
    "/longitudinal",
    response_model=LongitudinalMetric,
    status_code=status.HTTP_200_OK,
    summary="Track longitudinal progress",
    description="""
    Track historical progress over time.

    Includes:
    - Time series metrics (timestamps, scores, confidence)
    - Milestones (mastery verified, major improvements, streaks)
    - Regressions (performance declines in mastered topics)
    - Growth trajectories (linear regression predictions)
    - Improvement rates (weekly/monthly trends)

    Uses scipy linear regression for trajectory analysis.
    """
)
async def get_longitudinal_metrics(
    request: LongitudinalRequest,
    session: AsyncSession = Depends(get_db_session)
) -> LongitudinalMetric:
    """
    Track historical progress over time.

    Args:
        request: LongitudinalRequest with user_id, date_range, dimensions
        session: Database session

    Returns:
        LongitudinalMetric with time series, milestones, regressions, trajectories

    Raises:
        HTTPException: 500 if longitudinal tracking fails
    """
    try:
        tracker = LongitudinalProgressTracker(session)
        metrics = await tracker.track_progress(
            request.user_id,
            request.date_range,
            request.dimensions
        )
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Longitudinal tracking failed: {str(e)}"
        )


# ============================================================================
# Cross-Objective Correlation Endpoints
# ============================================================================

@router.post(
    "/correlations",
    response_model=CorrelationMatrix,
    status_code=status.HTTP_200_OK,
    summary="Analyze cross-objective correlations",
    description="""
    Analyze Pearson correlation coefficients between objectives.

    Uses scipy.stats.pearsonr for statistical correlation analysis.

    Identifies:
    - Foundational objectives (high positive correlation > 0.5 with many others)
    - Bottleneck objectives (low score + negative correlation pattern)
    - Recommended study sequence (prioritizing foundational objectives)

    Returns NxN correlation matrix where N = number of objectives.
    """
)
async def get_correlations(
    request: CorrelationsRequest,
    session: AsyncSession = Depends(get_db_session)
) -> CorrelationMatrix:
    """
    Analyze cross-objective correlations.

    Args:
        request: CorrelationsRequest with user_id
        session: Database session

    Returns:
        CorrelationMatrix with Pearson coefficients, foundational/bottleneck objectives

    Raises:
        HTTPException: 500 if correlation analysis fails
    """
    try:
        analyzer = CrossObjectiveAnalyzer(session)
        matrix = await analyzer.analyze_correlations(request.user_id)
        return matrix
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Correlation analysis failed: {str(e)}"
        )


# ============================================================================
# Peer Benchmarking Endpoints
# ============================================================================

@router.post(
    "/peer-benchmark",
    response_model=PeerBenchmark,
    status_code=status.HTTP_200_OK,
    summary="Compare performance with peers",
    description="""
    Compare user's performance with anonymized peer data.

    Requires minimum 50 users for validity.

    Includes:
    - Peer distribution (mean, median, std_dev, quartiles, IQR, whiskers)
    - User percentile ranking
    - Relative strengths (top 25% performance)
    - Relative weaknesses (bottom 25% performance)

    Box plot visualization data provided for frontend charting.
    """
)
async def get_peer_benchmark(
    request: PeerBenchmarkRequest,
    session: AsyncSession = Depends(get_db_session)
) -> PeerBenchmark:
    """
    Compare user's performance with anonymized peer data.

    Args:
        request: PeerBenchmarkRequest with user_id, optional objective_id
        session: Database session

    Returns:
        PeerBenchmark with distribution, percentiles, relative strengths/weaknesses

    Raises:
        HTTPException: 400 if insufficient peer data (< 50 users)
        HTTPException: 500 if benchmarking fails
    """
    try:
        engine = PeerBenchmarkingEngine(session)
        benchmark = await engine.generate_benchmark(
            request.user_id,
            request.objective_id
        )
        return benchmark
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient peer data: {str(ve)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Peer benchmarking failed: {str(e)}"
        )


# ============================================================================
# Dashboard Summary Endpoint (Endpoint 7/8)
# ============================================================================

@router.get(
    "/understanding/dashboard",
    response_model=DashboardSummary,
    status_code=status.HTTP_200_OK,
    summary="Get comprehensive dashboard summary",
    description="""
    Get high-level dashboard summary aggregating all Epic 4 validation metrics.

    Aggregates data from:
    - Story 4.1: Comprehension validation (terminology, relationships, application, clarity)
    - Story 4.2: Clinical reasoning scenarios
    - Story 4.3: Controlled failure challenges
    - Story 4.4: Confidence calibration tracking
    - Story 4.5: Adaptive difficulty matching (IRT)

    Returns:
    - Overall score (weighted average across all dimensions)
    - Total sessions and questions completed
    - Mastery breakdown (beginner < 60, proficient 60-85, expert > 85)
    - Recent trends (last 7 days)
    - Calibration status (well-calibrated, overconfident, underconfident)
    - Top 3 strengths and improvement areas

    Time range: Defaults to 7d, can be overridden via time_range query param.
    """
)
async def get_dashboard_summary(
    user_id: str,
    time_range: Optional[str] = "7d",
    session: AsyncSession = Depends(get_db_session)
) -> DashboardSummary:
    """
    Get comprehensive dashboard summary for user.

    Args:
        user_id: User ID
        time_range: Time range filter (7d, 30d, 90d, 1y, all)
        session: Database session

    Returns:
        DashboardSummary with aggregated metrics

    Raises:
        HTTPException: 500 if dashboard generation fails
    """
    try:
        from sqlalchemy import text
        from datetime import timedelta

        # Calculate date range
        time_range_mapping = {
            "7d": 7,
            "30d": 30,
            "90d": 90,
            "1y": 365,
            "all": None
        }
        days = time_range_mapping.get(time_range, 7)

        # Build WHERE clause for time filtering
        time_filter = ""
        if days:
            time_filter = f"AND vr.responded_at >= NOW() - INTERVAL '{days} days'"

        # ====================================================================
        # 1. Overall Score (weighted average across all dimensions)
        # ====================================================================
        query_overall = text(f"""
            SELECT AVG(vr.score * 100) as overall_score
            FROM validation_responses vr
            WHERE vr.user_id = :user_id
              {time_filter}
        """)
        result = await session.execute(query_overall, {"user_id": user_id})
        row = result.fetchone()
        overall_score = float(row.overall_score) if row and row.overall_score else 0.0

        # ====================================================================
        # 2. Total Sessions and Questions
        # ====================================================================
        query_counts = text(f"""
            SELECT
                COUNT(DISTINCT ls.id) as total_sessions,
                COUNT(vr.id) as total_questions
            FROM validation_responses vr
            LEFT JOIN learning_sessions ls ON vr.session_id = ls.id
            WHERE vr.user_id = :user_id
              {time_filter}
        """)
        result = await session.execute(query_counts, {"user_id": user_id})
        row = result.fetchone()
        total_sessions = int(row.total_sessions) if row else 0
        total_questions = int(row.total_questions) if row else 0

        # ====================================================================
        # 3. Mastery Breakdown (beginner, proficient, expert)
        # ====================================================================
        query_mastery = text(f"""
            SELECT
                vp.objective_id,
                AVG(vr.score * 100) as avg_score
            FROM validation_responses vr
            JOIN validation_prompts vp ON vr.prompt_id = vp.id
            WHERE vr.user_id = :user_id
              {time_filter}
            GROUP BY vp.objective_id
        """)
        result = await session.execute(query_mastery, {"user_id": user_id})
        rows = result.fetchall()

        mastery_breakdown = {
            "beginner": 0,
            "proficient": 0,
            "expert": 0
        }

        for row in rows:
            score = row.avg_score
            if score < 60:
                mastery_breakdown["beginner"] += 1
            elif score < 85:
                mastery_breakdown["proficient"] += 1
            else:
                mastery_breakdown["expert"] += 1

        # ====================================================================
        # 4. Recent Trends (last 7 days)
        # ====================================================================
        query_trends = text("""
            SELECT
                DATE(vr.responded_at) as date,
                AVG(vr.score * 100) as avg_score
            FROM validation_responses vr
            WHERE vr.user_id = :user_id
              AND vr.responded_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(vr.responded_at)
            ORDER BY date ASC
        """)
        result = await session.execute(query_trends, {"user_id": user_id})
        rows = result.fetchall()

        recent_trends = [
            TrendPoint(date=row.date, score=float(row.avg_score))
            for row in rows
        ]

        # ====================================================================
        # 5. Calibration Status
        # ====================================================================
        query_calibration = text(f"""
            SELECT AVG(vr.calibration_delta) as avg_calibration_delta
            FROM validation_responses vr
            WHERE vr.user_id = :user_id
              AND vr.calibration_delta IS NOT NULL
              {time_filter}
        """)
        result = await session.execute(query_calibration, {"user_id": user_id})
        row = result.fetchone()
        avg_calibration_delta = float(row.avg_calibration_delta) if row and row.avg_calibration_delta else 0.0

        # Determine calibration status
        if avg_calibration_delta > 15:
            calibration_status = "overconfident"
        elif avg_calibration_delta < -15:
            calibration_status = "underconfident"
        else:
            calibration_status = "well-calibrated"

        # ====================================================================
        # 6. Top Strengths (top 3 objectives by score)
        # ====================================================================
        query_strengths = text(f"""
            SELECT
                vp.objective_id,
                lo.objective as objective_name,
                AVG(vr.score * 100) as avg_score
            FROM validation_responses vr
            JOIN validation_prompts vp ON vr.prompt_id = vp.id
            JOIN learning_objectives lo ON vp.objective_id = lo.id
            WHERE vr.user_id = :user_id
              {time_filter}
            GROUP BY vp.objective_id, lo.objective
            ORDER BY avg_score DESC
            LIMIT 3
        """)
        result = await session.execute(query_strengths, {"user_id": user_id})
        rows = result.fetchall()
        top_strengths = [row.objective_name for row in rows]

        # ====================================================================
        # 7. Improvement Areas (bottom 3 objectives by score)
        # ====================================================================
        query_weaknesses = text(f"""
            SELECT
                vp.objective_id,
                lo.objective as objective_name,
                AVG(vr.score * 100) as avg_score
            FROM validation_responses vr
            JOIN validation_prompts vp ON vr.prompt_id = vp.id
            JOIN learning_objectives lo ON vp.objective_id = lo.id
            WHERE vr.user_id = :user_id
              {time_filter}
            GROUP BY vp.objective_id, lo.objective
            ORDER BY avg_score ASC
            LIMIT 3
        """)
        result = await session.execute(query_weaknesses, {"user_id": user_id})
        rows = result.fetchall()
        improvement_areas = [row.objective_name for row in rows]

        # ====================================================================
        # Construct Response
        # ====================================================================
        return DashboardSummary(
            overall_score=overall_score,
            total_sessions=total_sessions,
            total_questions=total_questions,
            mastery_breakdown=mastery_breakdown,
            recent_trends=recent_trends,
            calibration_status=calibration_status,
            top_strengths=top_strengths,
            improvement_areas=improvement_areas
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dashboard summary generation failed: {str(e)}"
        )


# ============================================================================
# Comparison Analytics Endpoint (Endpoint 8/8 - FINAL)
# ============================================================================

@router.get(
    "/understanding/comparison",
    response_model=ComparisonResult,
    status_code=status.HTTP_200_OK,
    summary="Compare user performance with peers",
    description="""
    Compare user's performance with peer group across 4 dimensions.

    Uses scipy.stats.percentileofscore for percentile calculations.

    Dimensions analyzed:
    - Terminology: Correct medical terms usage
    - Relationships: Concept connections
    - Application: Clinical scenario application
    - Clarity: Patient-friendly explanations

    Returns:
    - Overall percentile rank
    - Per-dimension comparisons
    - Strengths (user > peer_avg)
    - Gaps (user < peer_avg - 0.5*std_dev)

    Requires minimum 50 users in peer group for validity.
    """
)
async def get_comparison_analytics(
    user_id: str,
    peer_group: Optional[str] = "all",
    session: AsyncSession = Depends(get_db_session)
) -> ComparisonResult:
    """
    Compare user's performance with peer group.

    Args:
        user_id: User ID to compare
        peer_group: Peer group filter ("all", "cohort", "course", etc.)
        session: Database session

    Returns:
        ComparisonResult with percentile rankings and dimension comparisons

    Raises:
        HTTPException: 400 if insufficient peer data (< 50 users)
        HTTPException: 500 if comparison analysis fails
    """
    from scipy.stats import percentileofscore
    from sqlalchemy import text
    import numpy as np

    try:
        # ===================================================================
        # Step 1: Fetch user's scores
        # ===================================================================
        user_query = text("""
            SELECT
                AVG(CASE WHEN dimension = 'terminology' THEN score * 100 END) as terminology,
                AVG(CASE WHEN dimension = 'relationships' THEN score * 100 END) as relationships,
                AVG(CASE WHEN dimension = 'application' THEN score * 100 END) as application,
                AVG(CASE WHEN dimension = 'clarity' THEN score * 100 END) as clarity,
                AVG(score * 100) as overall
            FROM validation_responses vr
            JOIN validation_prompts vp ON vr.prompt_id = vp.id
            WHERE vr.user_id = :user_id
              AND vr.responded_at >= NOW() - INTERVAL '90 days'
        """)

        user_result = await session.execute(user_query, {"user_id": user_id})
        user_row = user_result.fetchone()

        if not user_row or user_row.overall is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No validation data found for user {user_id}"
            )

        user_scores = {
            "terminology": user_row.terminology or 70.0,
            "relationships": user_row.relationships or 70.0,
            "application": user_row.application or 70.0,
            "clarity": user_row.clarity or 70.0,
            "overall": user_row.overall
        }

        # ===================================================================
        # Step 2: Fetch peer group scores
        # ===================================================================
        peer_query = text("""
            SELECT
                vr.user_id,
                AVG(CASE WHEN dimension = 'terminology' THEN score * 100 END) as terminology,
                AVG(CASE WHEN dimension = 'relationships' THEN score * 100 END) as relationships,
                AVG(CASE WHEN dimension = 'application' THEN score * 100 END) as application,
                AVG(CASE WHEN dimension = 'clarity' THEN score * 100 END) as clarity,
                AVG(score * 100) as overall
            FROM validation_responses vr
            JOIN validation_prompts vp ON vr.prompt_id = vp.id
            WHERE vr.responded_at >= NOW() - INTERVAL '90 days'
            GROUP BY vr.user_id
            HAVING COUNT(DISTINCT vr.id) >= 5
        """)

        peer_result = await session.execute(peer_query)
        peer_rows = peer_result.fetchall()

        # Check minimum peer group size
        if len(peer_rows) < 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient peer data: {len(peer_rows)} users (minimum 50 required)"
            )

        # ===================================================================
        # Step 3: Calculate peer statistics per dimension
        # ===================================================================
        dimensions = ["terminology", "relationships", "application", "clarity"]
        peer_data = {dim: [] for dim in dimensions}
        peer_overall = []

        for row in peer_rows:
            for dim in dimensions:
                score = getattr(row, dim, None)
                if score is not None:
                    peer_data[dim].append(score)
            if row.overall is not None:
                peer_overall.append(row.overall)

        # Calculate peer averages and std_devs
        peer_stats = {}
        for dim in dimensions:
            if peer_data[dim]:
                peer_stats[dim] = {
                    "mean": float(np.mean(peer_data[dim])),
                    "std": float(np.std(peer_data[dim]))
                }
            else:
                peer_stats[dim] = {"mean": 70.0, "std": 10.0}

        peer_overall_mean = float(np.mean(peer_overall)) if peer_overall else 70.0
        peer_overall_std = float(np.std(peer_overall)) if peer_overall else 10.0

        # ===================================================================
        # Step 4: Calculate percentiles using scipy.stats.percentileofscore
        # ===================================================================
        dimension_comparisons = []
        strengths = []
        gaps = []

        for dim in dimensions:
            if peer_data[dim]:
                # Use scipy for percentile calculation
                percentile = percentileofscore(peer_data[dim], user_scores[dim], kind='rank')
            else:
                percentile = 50.0  # Default if no peer data

            dimension_comparisons.append(DimensionComparison(
                dimension=dim,
                user_score=user_scores[dim],
                peer_average=peer_stats[dim]["mean"],
                percentile=float(percentile)
            ))

            # Identify strengths (user > peer_avg)
            if user_scores[dim] > peer_stats[dim]["mean"]:
                strengths.append(dim)

            # Identify gaps (user < peer_avg - 0.5*std_dev)
            gap_threshold = peer_stats[dim]["mean"] - (0.5 * peer_stats[dim]["std"])
            if user_scores[dim] < gap_threshold:
                gaps.append(dim)

        # Calculate overall percentile
        if peer_overall:
            overall_percentile = percentileofscore(peer_overall, user_scores["overall"], kind='rank')
        else:
            overall_percentile = 50.0

        # ===================================================================
        # Step 5: Return ComparisonResult
        # ===================================================================
        return ComparisonResult(
            user_percentile=float(overall_percentile),
            user_score=user_scores["overall"],
            peer_average=peer_overall_mean,
            peer_std_dev=peer_overall_std,
            dimension_comparisons=dimension_comparisons,
            strengths_vs_peers=strengths,
            gaps_vs_peers=gaps,
            peer_group_size=len(peer_rows)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Comparison analysis failed: {str(e)}"
        )


# ============================================================================
# Health Check Endpoint
# ============================================================================

@router.get(
    "/health",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Analytics service health check",
    description="Check if analytics service is operational"
)
async def health_check() -> dict:
    """Analytics service health check endpoint."""
    return {
        "status": "healthy",
        "service": "understanding-analytics",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }
