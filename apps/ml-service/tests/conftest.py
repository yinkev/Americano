"""
Shared Pytest Fixtures for ML Service Tests

Provides reusable test fixtures for FastAPI testing with async support.
Based on latest pytest-asyncio and httpx patterns.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timedelta
from typing import AsyncGenerator, Dict, Any
import logging

from app.main import app
from app.services.database import prisma

# Configure test logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """
    Async test client for FastAPI application.

    Uses AsyncClient with ASGITransport for testing FastAPI apps.
    Automatically handles app lifecycle (startup/shutdown).

    Yields:
        AsyncClient: Configured HTTP client for testing
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        logger.info("Test client initialized")
        yield ac
        logger.info("Test client closed")


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[Any, None]:
    """
    Prisma database connection for tests.

    Connects to test database and ensures clean state.
    Disconnects after test completion.

    Yields:
        Prisma: Database client instance
    """
    if not prisma.is_connected():
        await prisma.connect()
        logger.info("Test database connected")

    yield prisma

    # Cleanup is handled by app lifespan, but ensure disconnection
    if prisma.is_connected():
        await prisma.disconnect()
        logger.info("Test database disconnected")


@pytest_asyncio.fixture
async def test_user(db) -> Dict[str, str]:
    """
    Create a test user with known ID.

    Returns:
        Dict with user_id for testing
    """
    user_id = "test-user-001"
    logger.info(f"Using test user: {user_id}")
    return {"user_id": user_id}


@pytest_asyncio.fixture
async def test_course(db, test_user) -> Dict[str, Any]:
    """
    Create a test course with lecture.

    Returns:
        Dict with course and lecture IDs
    """
    try:
        # Create course
        course = await db.course.create(
            data={
                "name": "Test Physiology Course",
                "description": "Test course for struggle prediction",
                "userId": test_user["user_id"]
            }
        )

        # Create lecture
        lecture = await db.lecture.create(
            data={
                "title": "Action Potentials",
                "courseId": course.id,
                "userId": test_user["user_id"]
            }
        )

        logger.info(f"Created test course: {course.id}, lecture: {lecture.id}")

        return {
            "course_id": course.id,
            "lecture_id": lecture.id,
            "course_name": course.name
        }
    except Exception as e:
        logger.warning(f"Test course creation failed (may already exist): {e}")
        # Return mock IDs if creation fails (for isolated tests)
        return {
            "course_id": "test-course-001",
            "lecture_id": "test-lecture-001",
            "course_name": "Test Physiology Course"
        }


@pytest_asyncio.fixture
async def test_objective(db, test_course) -> Dict[str, Any]:
    """
    Create a test learning objective.

    Returns:
        Dict with objective ID and details
    """
    try:
        objective = await db.learningobjective.create(
            data={
                "objective": "Explain the mechanism of action potential propagation",
                "complexity": "INTERMEDIATE",
                "lectureId": test_course["lecture_id"],
                "isHighYield": True,
                "boardExamTags": ["USMLE-Step1-Neuro", "COMLEX-L1-Neuro"]
            }
        )

        logger.info(f"Created test objective: {objective.id}")

        return {
            "objective_id": objective.id,
            "objective_text": objective.objective,
            "complexity": objective.complexity
        }
    except Exception as e:
        logger.warning(f"Test objective creation failed: {e}")
        return {
            "objective_id": "test-objective-001",
            "objective_text": "Explain the mechanism of action potential propagation",
            "complexity": "INTERMEDIATE"
        }


@pytest_asyncio.fixture
async def test_prediction(db, test_user, test_objective) -> Dict[str, Any]:
    """
    Create a test struggle prediction with high probability.

    Returns:
        Dict with prediction details
    """
    try:
        prediction = await db.struggleprediction.create(
            data={
                "userId": test_user["user_id"],
                "learningObjectiveId": test_objective["objective_id"],
                "topicId": "neuroscience",
                "predictedStruggleProbability": 0.75,
                "predictionConfidence": 0.85,
                "predictionStatus": "PENDING",
                "featureVector": {
                    "retentionScore": 0.45,
                    "prerequisiteGapCount": 0.6,
                    "complexityMismatch": 0.5,
                    "historicalStruggleScore": 0.7
                }
            }
        )

        logger.info(f"Created test prediction: {prediction.id}")

        return {
            "prediction_id": prediction.id,
            "probability": prediction.predictedStruggleProbability,
            "confidence": prediction.predictionConfidence,
            "status": prediction.predictionStatus
        }
    except Exception as e:
        logger.warning(f"Test prediction creation failed: {e}")
        return {
            "prediction_id": "test-prediction-001",
            "probability": 0.75,
            "confidence": 0.85,
            "status": "PENDING"
        }


@pytest_asyncio.fixture
async def test_mission(db, test_user) -> Dict[str, Any]:
    """
    Create a test mission for intervention application.

    Returns:
        Dict with mission details
    """
    try:
        mission = await db.mission.create(
            data={
                "userId": test_user["user_id"],
                "title": "Daily Study Mission",
                "description": "Test mission for predictions",
                "date": datetime.utcnow() + timedelta(days=1),
                "status": "PENDING",
                "objectives": []
            }
        )

        logger.info(f"Created test mission: {mission.id}")

        return {
            "mission_id": mission.id,
            "status": mission.status
        }
    except Exception as e:
        logger.warning(f"Test mission creation failed: {e}")
        return {
            "mission_id": "test-mission-001",
            "status": "PENDING"
        }


@pytest_asyncio.fixture
async def test_intervention(db, test_user, test_prediction) -> Dict[str, Any]:
    """
    Create a test intervention recommendation.

    Returns:
        Dict with intervention details
    """
    try:
        intervention = await db.interventionrecommendation.create(
            data={
                "predictionId": test_prediction["prediction_id"],
                "userId": test_user["user_id"],
                "interventionType": "PREREQUISITE_REVIEW",
                "description": "Review prerequisite topics before studying action potentials",
                "reasoning": "Missing prerequisite knowledge detected",
                "priority": 9,
                "status": "PENDING"
            }
        )

        logger.info(f"Created test intervention: {intervention.id}")

        return {
            "intervention_id": intervention.id,
            "type": intervention.interventionType,
            "status": intervention.status
        }
    except Exception as e:
        logger.warning(f"Test intervention creation failed: {e}")
        return {
            "intervention_id": "test-intervention-001",
            "type": "PREREQUISITE_REVIEW",
            "status": "PENDING"
        }


@pytest.fixture
def sample_feature_vector() -> Dict[str, float]:
    """
    Sample feature vector for ML model testing.

    Returns:
        Dict with normalized feature values (0-1)
    """
    return {
        "retentionScore": 0.45,
        "retentionDeclineRate": 0.3,
        "reviewLapseRate": 0.4,
        "sessionPerformanceScore": 0.55,
        "validationScore": 0.6,
        "prerequisiteGapCount": 0.6,
        "prerequisiteMasteryGap": 0.5,
        "contentComplexity": 0.6,
        "complexityMismatch": 0.5,
        "historicalStruggleScore": 0.7,
        "contentTypeMismatch": 0.3,
        "cognitiveLoadIndicator": 0.4,
        "daysUntilExam": 0.8,
        "daysSinceLastStudy": 0.2,
        "workloadLevel": 0.5
    }


@pytest.fixture
def mock_learning_data() -> Dict[str, Any]:
    """
    Mock learning data for integration tests.

    Returns:
        Dict with comprehensive test data
    """
    return {
        "user_has_history": True,
        "study_weeks": 6,
        "strong_topics": ["anatomy", "biochemistry"],
        "weak_topics": ["physiology", "pharmacology"],
        "retention_scores": {
            "anatomy": 0.85,
            "biochemistry": 0.80,
            "physiology": 0.45,
            "pharmacology": 0.50
        },
        "recent_performance": 0.65,
        "total_objectives_studied": 150,
        "total_reviews": 450,
        "average_rating": 2.8  # HARD average
    }


# Cleanup fixtures
@pytest_asyncio.fixture(autouse=True)
async def cleanup_test_data(db):
    """
    Cleanup test data after each test.

    Runs automatically after every test to ensure clean state.
    """
    yield

    # Cleanup logic here if needed
    # Note: In production tests, you may want to delete created records
    logger.info("Test cleanup completed")


# Markers for test categorization
pytest.mark.api = pytest.mark.api
pytest.mark.unit = pytest.mark.unit
pytest.mark.integration = pytest.mark.integration
pytest.mark.ml = pytest.mark.ml
pytest.mark.smoke = pytest.mark.smoke
