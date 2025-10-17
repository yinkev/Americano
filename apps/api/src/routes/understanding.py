"""
API routes for Story 4.6 - Comprehensive Understanding Analytics.

Provides endpoints for:
- Comprehension pattern analysis (strengths, weaknesses, AI insights)
- Predictive analytics (exam success, forgetting risks, mastery dates)
- Longitudinal progress tracking (milestones, regressions, growth trajectories)
- Cross-objective correlations (Pearson correlation matrix, foundational/bottleneck objectives)
- Peer benchmarking (percentile rankings, relative strengths/weaknesses)
- Personalized recommendations (daily insights, weekly top 3, interventions)
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from src.database import get_db_session
from src.analytics.predictive_analytics import generate_predictions
from src.analytics.comprehension_analyzer import ComprehensionPatternAnalyzer
from src.analytics.correlation_analyzer import CrossObjectiveAnalyzer
from src.analytics.progress_tracker import LongitudinalProgressTracker
from src.analytics.benchmarking import PeerBenchmarkingEngine
from src.analytics.recommendations import RecommendationEngine
from src.analytics.models import (
    ComprehensionPattern,
    UnderstandingPrediction,
    LongitudinalMetric,
    CorrelationMatrix,
    PeerBenchmark,
    RecommendationData,
    PatternsRequest,
    PredictionsRequest,
    LongitudinalRequest,
    CorrelationsRequest,
    PeerBenchmarkRequest,
    RecommendationsRequest,
)


# ============================================================================
# Router Configuration
# ============================================================================

router = APIRouter(
    prefix="/analytics/understanding",
    tags=["understanding-analytics"]
)


# ============================================================================
# Endpoint 1: Comprehension Patterns Analysis
# ============================================================================

@router.post(
    "/patterns",
    response_model=ComprehensionPattern,
    status_code=status.HTTP_200_OK,
    summary="Analyze comprehension patterns",
    description="""
    Analyze user's comprehension patterns with AI insights.

    Returns:
    - Top 10% strengths (objectives where user excels)
    - Bottom 10% weaknesses (objectives needing improvement)
    - Calibration issues (overconfidence, underconfidence, dangerous gaps)
    - 3-5 AI-generated insights from ChatMock/GPT-5 (via instructor)

    Date range options: 7d, 30d (default), 90d
    """
)
async def analyze_patterns(request: PatternsRequest) -> ComprehensionPattern:
    """
    Analyze comprehension patterns with AI insights.

    Args:
        request: PatternsRequest with user_id and date_range

    Returns:
        ComprehensionPattern with strengths, weaknesses, calibration issues, and AI insights

    Raises:
        HTTPException: 400 if validation fails, 500 if analysis fails
    """
    try:
        async with get_db_session() as session:
            analyzer = ComprehensionPatternAnalyzer(session)
            result = await analyzer.analyze_patterns(request.user_id)
            return result

    except ValueError as e:
        # Validation errors (e.g., invalid user_id, insufficient data)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pattern analysis failed: {str(e)}"
        )


# ============================================================================
# Endpoint 2: Predictive Analytics
# ============================================================================

@router.post(
    "/predictions",
    response_model=UnderstandingPrediction,
    status_code=status.HTTP_200_OK,
    summary="Get ML predictions",
    description="""
    Get machine learning predictions for user performance.

    Includes:
    - Exam success probability (logistic regression with 95% confidence interval)
    - Forgetting risks (Ebbinghaus forgetting curve: R = e^(-t/S))
    - Mastery date predictions (linear regression extrapolation)
    - Model accuracy metrics (MAE, R² for each model)

    Features for exam success prediction:
    - Comprehension score (30%)
    - Clinical reasoning (35%)
    - Mastery verification (20%)
    - Calibration accuracy (15%)
    """
)
async def get_predictions(request: PredictionsRequest) -> UnderstandingPrediction:
    """
    Get ML predictions for exam success, forgetting risks, and mastery dates.

    Args:
        request: PredictionsRequest with user_id and optional exam_type

    Returns:
        UnderstandingPrediction with all analytics and model accuracy metrics

    Raises:
        HTTPException: 400 if validation fails, 500 if prediction fails
    """
    try:
        async with get_db_session() as session:
            predictions = await generate_predictions(
                session,
                request.user_id,
                request.exam_type
            )
            return predictions

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction generation failed: {str(e)}"
        )


# ============================================================================
# Endpoint 3: Longitudinal Progress Tracking
# ============================================================================

@router.post(
    "/longitudinal",
    response_model=LongitudinalMetric,
    status_code=status.HTTP_200_OK,
    summary="Get historical progress",
    description="""
    Get historical progress metrics with milestones and regressions.

    Returns:
    - Time series metrics (comprehension, reasoning, calibration, mastery)
    - Milestones (mastery verified, major improvement, streak achieved)
    - Regressions (performance declines in previously mastered topics)
    - Growth trajectories (linear regression predictions)
    - Improvement rates (weekly/monthly trends: accelerating, stable, decelerating)

    Dimensions tracked:
    - comprehension: Validation response scores
    - reasoning: Clinical scenario scores
    - calibration: Confidence vs. performance alignment
    - mastery: Verified mastery status
    """
)
async def get_progress(request: LongitudinalRequest) -> LongitudinalMetric:
    """
    Get historical progress with milestones and regressions.

    Args:
        request: LongitudinalRequest with user_id, dimensions, and date_range

    Returns:
        LongitudinalMetric with time series, milestones, regressions, and growth trajectories

    Raises:
        HTTPException: 400 if validation fails, 500 if tracking fails
    """
    try:
        async with get_db_session() as session:
            tracker = LongitudinalProgressTracker(session)

            # Fetch historical metrics
            metrics = await tracker.fetch_historical_metrics(
                request.user_id,
                request.dimensions,
                request.date_range
            )

            # Detect milestones and regressions
            milestones = await tracker.detect_milestones(metrics)
            regressions = await tracker.detect_regressions(metrics)

            # Calculate growth trajectories
            growth_trajectories = await tracker.calculate_growth_trajectories(metrics)

            # Calculate improvement rates
            improvement_rates = await tracker.calculate_improvement_rates(metrics)

            # Get date range
            date_range = await tracker.get_date_range(request.date_range)

            return LongitudinalMetric(
                user_id=request.user_id,
                metrics=metrics,
                milestones=milestones,
                regressions=regressions,
                growth_trajectory=growth_trajectories,
                improvement_rates=improvement_rates,
                date_range=date_range
            )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Progress tracking failed: {str(e)}"
        )


# ============================================================================
# Endpoint 4: Cross-Objective Correlations
# ============================================================================

@router.post(
    "/correlations",
    response_model=CorrelationMatrix,
    status_code=status.HTTP_200_OK,
    summary="Get objective correlations",
    description="""
    Get Pearson correlation matrix for all learning objectives.

    Identifies:
    - Foundational objectives (high positive correlation >0.5 with many others)
    - Bottleneck objectives (low score + negative correlation pattern)
    - Recommended study sequence (prioritizes foundational objectives)

    Correlation interpretation:
    - >0.5: Strong positive correlation (mastering one helps the other)
    - 0.3-0.5: Moderate positive correlation
    - -0.3 to 0.3: Weak or no correlation
    - <-0.3: Negative correlation (possible interference or confusion)

    Matrix format: NxN where N = number of objectives
    """
)
async def get_correlations(request: CorrelationsRequest) -> CorrelationMatrix:
    """
    Get cross-objective correlation matrix.

    Args:
        request: CorrelationsRequest with user_id

    Returns:
        CorrelationMatrix with Pearson coefficients, foundational/bottleneck objectives, and study sequence

    Raises:
        HTTPException: 400 if validation fails, 500 if correlation calculation fails
    """
    try:
        async with get_db_session() as session:
            analyzer = CrossObjectiveAnalyzer(session)

            # Calculate correlation matrix
            matrix = await analyzer.calculate_objective_correlations(request.user_id)

            # Identify foundational objectives (high positive correlation with many others)
            foundational = await analyzer.identify_foundational_objectives(matrix)

            # Identify bottleneck objectives (low score + negative correlation pattern)
            user_scores = await analyzer.get_user_scores(request.user_id)
            bottlenecks = await analyzer.identify_bottleneck_objectives(matrix, user_scores)

            # Generate recommended study sequence
            study_sequence = await analyzer.generate_study_sequence(
                matrix,
                foundational,
                bottlenecks
            )

            return CorrelationMatrix(
                user_id=request.user_id,
                matrix=matrix["matrix"],
                objective_ids=matrix["objective_ids"],
                objective_names=matrix["objective_names"],
                foundational_objectives=foundational,
                bottleneck_objectives=bottlenecks,
                recommended_study_sequence=study_sequence
            )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Correlation analysis failed: {str(e)}"
        )


# ============================================================================
# Endpoint 5: Peer Benchmarking
# ============================================================================

@router.post(
    "/peer-benchmark",
    response_model=PeerBenchmark,
    status_code=status.HTTP_200_OK,
    summary="Get peer comparison",
    description="""
    Get anonymized peer comparison statistics (minimum 50 users required).

    Returns:
    - Peer distribution (mean, median, std_dev, quartiles, IQR, whiskers for box plot)
    - User percentile (0-100 scale)
    - Relative strengths (objectives where user is in top 25%)
    - Relative weaknesses (objectives where user is in bottom 25%)

    Categories:
    - top_quartile (75th-100th percentile)
    - above_average (50th-75th percentile)
    - below_average (25th-50th percentile)
    - bottom_quartile (0-25th percentile)

    Privacy: All data is anonymized. Minimum 50 users required for statistical validity.
    """
)
async def get_peer_data(request: PeerBenchmarkRequest) -> PeerBenchmark:
    """
    Get peer comparison statistics (minimum 50 users).

    Args:
        request: PeerBenchmarkRequest with user_id and optional objective_id

    Returns:
        PeerBenchmark with distribution, percentile, and relative strengths/weaknesses

    Raises:
        HTTPException: 400 if insufficient peer data (<50 users), 500 if benchmarking fails
    """
    try:
        async with get_db_session() as session:
            engine = PeerBenchmarkingEngine(session)

            # Aggregate peer data (raises ValueError if <50 users)
            benchmark = await engine.aggregate_peer_data(
                request.user_id,
                request.objective_id
            )

            return benchmark

    except ValueError as e:
        # Insufficient peer data (< 50 users)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Peer benchmarking failed: {str(e)}"
        )


# ============================================================================
# Endpoint 6: Personalized Recommendations
# ============================================================================

@router.post(
    "/recommendations",
    response_model=RecommendationData,
    status_code=status.HTTP_200_OK,
    summary="Get AI recommendations",
    description="""
    Get AI-powered personalized study recommendations using ChatMock/GPT-5 via instructor.

    Returns:
    - Daily insight (single highest priority recommendation)
      - Priority: Dangerous gaps > Bottlenecks > Weaknesses > Optimizations
    - Weekly top 3 objectives (exactly 3 objectives to focus on this week)
    - Intervention suggestions (targeted actions based on detected patterns)
      - Overconfidence → More failure challenges
      - Weak reasoning → Clinical scenarios
      - Poor retention → Spaced repetition
      - Bottleneck detected → Foundational review
      - Regression detected → Immediate review
    - Time estimates (hours/weeks to mastery for each objective)
    - Exam success probability (0-1 scale)

    All text generated by ChatMock/GPT-5 with Pydantic validation via instructor library.
    """
)
async def get_recommendations(request: RecommendationsRequest) -> RecommendationData:
    """
    Get AI-powered study recommendations.

    Args:
        request: RecommendationsRequest with user_id

    Returns:
        RecommendationData with daily insight, weekly top 3, interventions, and time estimates

    Raises:
        HTTPException: 400 if validation fails, 500 if recommendation generation fails
    """
    try:
        async with get_db_session() as session:
            engine = RecommendationEngine(session)

            # Generate daily insight (highest priority)
            daily = await engine.generate_daily_insight(request.user_id)

            # Generate weekly top 3 objectives
            weekly = await engine.generate_weekly_summary(request.user_id)

            # Get comprehension patterns for intervention suggestions
            analyzer = ComprehensionPatternAnalyzer(session)
            patterns = await analyzer.analyze_patterns(request.user_id)

            # Generate intervention suggestions based on patterns
            interventions = await engine.generate_intervention_suggestions(patterns)

            # Calculate time estimates for each objective
            time_estimates = await engine.calculate_time_estimates(request.user_id)

            # Get exam success probability
            from src.analytics.predictive_analytics import PredictiveAnalyticsEngine
            predictor = PredictiveAnalyticsEngine(session)
            exam_prediction = await predictor.predict_exam_success(request.user_id)

            return RecommendationData(
                user_id=request.user_id,
                daily_insight=daily,
                weekly_top3=weekly,
                interventions=interventions,
                time_estimates=time_estimates,
                exam_success_probability=exam_prediction.probability
            )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation generation failed: {str(e)}"
        )
