"""
Shared test fixtures and configuration for Epic 4 E2E tests.

Provides:
- Database and session fixtures
- Test user management
- HTTP client fixtures (sync and async)
- Mock data generators
- Service startup/shutdown management
"""

import pytest
import asyncio
import time
from typing import AsyncGenerator, Generator
from datetime import datetime, timedelta
import httpx
from fastapi.testclient import TestClient

from main import app
from src.database import init_db, close_db


# ============================================================================
# Pytest Configuration
# ============================================================================

pytest_plugins = ("pytest_asyncio",)


def pytest_configure(config):
    """Configure pytest with async support and register markers."""
    config.addinivalue_line(
        "markers",
        "e2e: mark test as end-to-end integration test"
    )
    config.addinivalue_line(
        "markers",
        "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers",
        "critical: mark test as critical for Epic 4 completion"
    )


# ============================================================================
# Event Loop and Async Fixtures
# ============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ============================================================================
# HTTP Client Fixtures
# ============================================================================

@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """
    Synchronous TestClient for FastAPI testing.

    Yields:
        TestClient: FastAPI TestClient instance
    """
    test_client = TestClient(app)
    yield test_client
    # Cleanup handled automatically by TestClient


@pytest.fixture
async def async_client():
    """
    Asynchronous HTTPX client for testing.

    Uses TestClient with AsyncClient for async HTTP requests to the FastAPI app.

    Yields:
        httpx.AsyncClient: Async HTTP client wrapped for FastAPI
    """
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://testserver"
    ) as client:
        yield client


# ============================================================================
# Test Data Fixtures
# ============================================================================

@pytest.fixture
def sample_objective() -> dict:
    """
    Sample learning objective for testing.

    Returns:
        dict: Objective with id and text
    """
    return {
        "objective_id": "obj_cardiac_001",
        "objective_text": "Explain the cardiac conduction system and its role in generating and conducting electrical impulses in the heart.",
        "complexity": "INTERMEDIATE"
    }


@pytest.fixture
def sample_user_answer() -> str:
    """
    Sample user explanation for comprehension evaluation.

    Returns:
        str: Medical explanation of cardiac conduction
    """
    return """
    The cardiac conduction system is like an electrical circuit in the heart. It starts with the SA node,
    which acts as the heart's natural pacemaker. The electrical signal travels through the atria, causing
    them to contract, then moves to the AV node. From there, it goes down the bundle of His and Purkinje
    fibers to make the ventricles contract. This coordinated sequence ensures blood pumps efficiently.
    """


@pytest.fixture
def weak_user_answer() -> str:
    """
    Sample weak user explanation for testing low-score evaluation.

    Returns:
        str: Incomplete medical explanation
    """
    return "The heart has electricity and it beats. The electrical signals make the heart pump."


@pytest.fixture
def clinical_scenario_params() -> dict:
    """
    Parameters for clinical scenario generation testing.

    Returns:
        dict: Scenario parameters including objective, tags, difficulty
    """
    return {
        "objective_id": "obj_cardiology_001",
        "objective_text": "Diagnose and manage acute myocardial infarction",
        "board_exam_tags": ["USMLE-Step2-Cardiology", "COMLEX-L2-IM"],
        "difficulty": "INTERMEDIATE"
    }


@pytest.fixture
def adaptive_session_params() -> dict:
    """
    Parameters for adaptive assessment session.

    Returns:
        dict: Session parameters for adaptive testing
    """
    return {
        "user_id": "user_adaptive_001",
        "objective_id": "obj_adaptive_001",
        "initial_theta": 0.0,  # Default IRT ability
        "min_difficulty": -2.0,
        "max_difficulty": 2.0
    }


# ============================================================================
# Service and Database Fixtures
# ============================================================================

@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    """
    Session-scoped fixture to initialize database once per test session.

    Yields:
        None
    """
    await init_db()
    yield
    await close_db()


# ============================================================================
# Test User Management
# ============================================================================

class TestUserManager:
    """Manages test users for E2E testing."""

    def __init__(self):
        self.created_users = []

    async def create_test_user(
        self,
        user_id: str = None,
        email: str = None,
        name: str = "Test User"
    ) -> dict:
        """
        Create a test user.

        Args:
            user_id: Unique user identifier (auto-generated if None)
            email: User email address
            name: User display name

        Returns:
            dict: Created user data
        """
        if not user_id:
            user_id = f"test_user_{int(time.time() * 1000)}"

        if not email:
            email = f"{user_id}@test.example.com"

        user_data = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "created_at": datetime.now().isoformat()
        }

        self.created_users.append(user_id)
        return user_data

    async def cleanup_users(self):
        """Clean up all created test users."""
        # In production, delete users from database
        self.created_users.clear()


@pytest.fixture
def user_manager() -> TestUserManager:
    """
    Test user manager for creating and cleaning up test users.

    Yields:
        TestUserManager: User management instance
    """
    manager = TestUserManager()
    yield manager
    # Cleanup is called after each test


# ============================================================================
# Performance and Timing Fixtures
# ============================================================================

@pytest.fixture
def timer():
    """
    Simple timer for measuring request/response times.

    Returns:
        dict: Timer utilities
    """
    return {
        "start": lambda: time.time(),
        "elapsed": lambda start: time.time() - start
    }


class PerformanceValidator:
    """Validates performance constraints for E2E tests."""

    # Performance thresholds (in seconds)
    THRESHOLDS = {
        "prompt_generation": 3.0,
        "evaluation": 3.0,
        "scenario_generation": 4.0,
        "scenario_evaluation": 4.0,
        "dashboard_load": 2.0,
        "adaptive_next_question": 1.0,
        "analytics_query": 2.0,
    }

    @staticmethod
    def assert_performance(operation: str, elapsed_time: float):
        """
        Assert that operation completed within threshold.

        Args:
            operation: Type of operation being measured
            elapsed_time: Actual elapsed time in seconds

        Raises:
            AssertionError: If operation exceeded threshold
        """
        threshold = PerformanceValidator.THRESHOLDS.get(operation, 5.0)
        assert elapsed_time < threshold, \
            f"{operation} took {elapsed_time:.2f}s (threshold: {threshold}s)"


@pytest.fixture
def performance_validator() -> PerformanceValidator:
    """
    Performance validator for E2E tests.

    Yields:
        PerformanceValidator: Performance validation utilities
    """
    return PerformanceValidator()


# ============================================================================
# Data Validation Fixtures
# ============================================================================

class ResponseValidator:
    """Validates API response structure and data."""

    @staticmethod
    def assert_evaluation_result(result: dict):
        """
        Validate EvaluationResult response structure.

        Args:
            result: Evaluation result from API

        Raises:
            AssertionError: If structure is invalid
        """
        required_fields = [
            "overall_score",
            "terminology_score",
            "relationships_score",
            "application_score",
            "clarity_score",
            "strengths",
            "gaps",
            "calibration_delta",
            "calibration_note"
        ]

        for field in required_fields:
            assert field in result, f"Missing required field: {field}"

        # Validate score ranges
        assert 0 <= result["overall_score"] <= 100, "overall_score out of range"
        assert 0 <= result["terminology_score"] <= 100, "terminology_score out of range"
        assert 0 <= result["relationships_score"] <= 100, "relationships_score out of range"
        assert 0 <= result["application_score"] <= 100, "application_score out of range"
        assert 0 <= result["clarity_score"] <= 100, "clarity_score out of range"

        # Validate list fields
        assert isinstance(result["strengths"], list), "strengths must be list"
        assert isinstance(result["gaps"], list), "gaps must be list"
        assert len(result["strengths"]) > 0, "strengths must not be empty"
        assert len(result["gaps"]) > 0, "gaps must not be empty"

    @staticmethod
    def assert_prompt_generation_result(result: dict):
        """
        Validate PromptGenerationResponse structure.

        Args:
            result: Prompt generation result from API

        Raises:
            AssertionError: If structure is invalid
        """
        required_fields = ["prompt_text", "prompt_type", "expected_criteria"]

        for field in required_fields:
            assert field in result, f"Missing required field: {field}"

        assert len(result["prompt_text"]) > 0, "prompt_text must not be empty"
        assert result["prompt_type"] in ["Direct Question", "Clinical Scenario", "Teaching Simulation"], \
            f"Invalid prompt_type: {result['prompt_type']}"
        assert isinstance(result["expected_criteria"], list), "expected_criteria must be list"
        assert len(result["expected_criteria"]) > 0, "expected_criteria must not be empty"

    @staticmethod
    def assert_dashboard_data(dashboard: dict):
        """
        Validate dashboard response structure.

        Args:
            dashboard: Dashboard data from API

        Raises:
            AssertionError: If structure is invalid
        """
        required_fields = [
            "total_questions",
            "total_sessions",
            "overall_score",
            "mastery_breakdown",
            "recent_trends",
            "calibration_status"
        ]

        for field in required_fields:
            assert field in dashboard, f"Missing required dashboard field: {field}"

        assert dashboard["total_questions"] >= 0, "total_questions must be non-negative"
        assert dashboard["total_sessions"] >= 0, "total_sessions must be non-negative"
        assert 0 <= dashboard["overall_score"] <= 100, "overall_score out of range"


@pytest.fixture
def response_validator() -> ResponseValidator:
    """
    Response validator for E2E tests.

    Yields:
        ResponseValidator: Response validation utilities
    """
    return ResponseValidator()


# ============================================================================
# Assertion Helpers
# ============================================================================

@pytest.fixture
def assert_helpers():
    """
    Common assertion helpers for E2E tests.

    Returns:
        dict: Helper assertion functions
    """
    def assert_status_code(response, expected_code: int):
        """Assert response status code."""
        assert response.status_code == expected_code, \
            f"Expected {expected_code}, got {response.status_code}: {response.text}"

    def assert_json_response(response):
        """Assert response is valid JSON."""
        try:
            return response.json()
        except Exception as e:
            pytest.fail(f"Response is not valid JSON: {response.text}")

    def assert_field_exists(obj: dict, field: str):
        """Assert field exists in object."""
        assert field in obj, f"Field '{field}' not found in {list(obj.keys())}"

    return {
        "status_code": assert_status_code,
        "json": assert_json_response,
        "field_exists": assert_field_exists
    }


# ============================================================================
# Database State Fixtures
# ============================================================================

class DatabaseState:
    """Manages database state for testing."""

    def __init__(self):
        self.created_records = []

    async def record_created(self, record_type: str, record_id: str):
        """Record a created database item for cleanup."""
        self.created_records.append({"type": record_type, "id": record_id})

    async def cleanup(self):
        """Clean up all created records."""
        # In production, delete records from database
        self.created_records.clear()


@pytest.fixture
async def database_state() -> DatabaseState:
    """
    Database state manager for E2E tests.

    Yields:
        DatabaseState: Database state management
    """
    state = DatabaseState()
    yield state
    await state.cleanup()


# ============================================================================
# Random Data Generators
# ============================================================================

@pytest.fixture
def data_generators():
    """
    Random data generators for test data.

    Returns:
        dict: Generator functions
    """
    import random
    import string

    def random_id(prefix: str = "test") -> str:
        """Generate random ID with prefix."""
        suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        return f"{prefix}_{suffix}"

    def random_score(min_val: int = 40, max_val: int = 100) -> int:
        """Generate random score within range."""
        return random.randint(min_val, max_val)

    def random_confidence(min_val: int = 1, max_val: int = 5) -> int:
        """Generate random confidence level (1-5)."""
        return random.randint(min_val, max_val)

    def random_assessment_data(count: int = 10):
        """Generate multiple random assessments."""
        assessments = []
        for _ in range(count):
            assessments.append({
                "confidence": random_confidence(),
                "score": random_score(),
                "timestamp": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
            })
        return assessments

    return {
        "id": random_id,
        "score": random_score,
        "confidence": random_confidence,
        "assessments": random_assessment_data
    }


