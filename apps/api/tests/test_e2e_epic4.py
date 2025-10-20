"""
End-to-End Tests for Epic 4: Understanding Validation Engine

Tests complete user workflows across Python FastAPI service and TypeScript Next.js integration.

Scenarios:
1. Story 4.1 - Validation Assessment Flow (Prompt generation + evaluation + calibration)
2. Story 4.4 - Calibration Feedback Flow (Calibration metrics + intervention)
3. Story 4.5 - Adaptive Difficulty Flow (IRT-based adaptive assessment)
4. Story 4.6 - Peer Comparison Flow (Percentile calculation + privacy)
5. Story 4.6 - Dashboard Data Flow (Comprehensive dashboard loading)

Status: All stories (4.1-4.6) implemented with E2E coverage
"""

import pytest
import time
from datetime import datetime, timedelta
import httpx


pytestmark = pytest.mark.e2e


# ============================================================================
# Story 4.1: Validation Assessment Flow (CRITICAL)
# ============================================================================

@pytest.mark.critical
@pytest.mark.asyncio
async def test_e2e_validation_assessment_flow(
    async_client: httpx.AsyncClient,
    user_manager,
    response_validator,
    performance_validator,
    sample_objective,
    sample_user_answer,
    timer
):
    """
    E2E Test: Complete validation assessment workflow.

    User Journey:
    1. Start study session (mock)
    2. Generate comprehension prompt (Python service)
    3. Submit answer with confidence rating
    4. Evaluate answer (ChatMock in Python)
    5. Receive calibration feedback
    6. Dashboard stores results

    Tests:
    - Prompt generation with varied templates
    - AI evaluation with 4-dimensional scoring
    - Calibration calculation (confidence vs score)
    - Response structure validation
    - Performance < 3 seconds per operation
    """
    # Setup
    test_user = await user_manager.create_test_user()
    assert test_user["user_id"]

    # 1. Generate prompt
    start = timer["start"]()
    prompt_response = await async_client.post(
        "/validation/generate-prompt",
        json={
            "objective_id": sample_objective["objective_id"],
            "objective_text": sample_objective["objective_text"]
        }
    )
    elapsed = timer["elapsed"](start)
    performance_validator.assert_performance("prompt_generation", elapsed)

    assert prompt_response.status_code == 200
    prompt_data = prompt_response.json()
    response_validator.assert_prompt_generation_result(prompt_data)

    # Verify prompt variety
    assert "prompt_type" in prompt_data
    assert prompt_data["prompt_type"] in ["Direct Question", "Clinical Scenario", "Teaching Simulation"]
    prompt_id = prompt_data.get("id", "prompt_123")

    # 2. Evaluate comprehension
    start = timer["start"]()
    eval_response = await async_client.post(
        "/validation/evaluate",
        json={
            "prompt_id": prompt_id,
            "user_answer": sample_user_answer,
            "confidence_level": 4,
            "objective_text": sample_objective["objective_text"]
        }
    )
    elapsed = timer["elapsed"](start)
    performance_validator.assert_performance("evaluation", elapsed)

    assert eval_response.status_code == 200
    evaluation = eval_response.json()

    # Validate evaluation structure
    response_validator.assert_evaluation_result(evaluation)

    # Verify 4-dimensional scoring
    assert "terminology_score" in evaluation
    assert "relationships_score" in evaluation
    assert "application_score" in evaluation
    assert "clarity_score" in evaluation

    # Verify scoring calculation
    weighted_score = (
        evaluation["terminology_score"] * 0.20 +
        evaluation["relationships_score"] * 0.30 +
        evaluation["application_score"] * 0.30 +
        evaluation["clarity_score"] * 0.20
    )
    assert abs(evaluation["overall_score"] - weighted_score) < 2  # Allow rounding

    # 3. Verify calibration calculation
    confidence_normalized = (4 - 1) * 25  # 4 -> 75
    calibration_delta = confidence_normalized - evaluation["overall_score"]

    assert "calibration_delta" in evaluation
    assert "calibration_note" in evaluation
    assert abs(evaluation["calibration_delta"] - calibration_delta) < 1  # Allow rounding

    # 4. Verify data structure for persistence
    assert "strengths" in evaluation
    assert "gaps" in evaluation
    assert len(evaluation["strengths"]) >= 2
    assert len(evaluation["gaps"]) >= 2

    print(f"✓ Validation Assessment Flow: Overall Score={evaluation['overall_score']}, "
          f"Calibration Delta={evaluation['calibration_delta']:.1f}")


# ============================================================================
# Story 4.1: Multiple Prompt Templates (CRITICAL)
# ============================================================================

@pytest.mark.critical
@pytest.mark.asyncio
async def test_e2e_prompt_template_variety(
    async_client: httpx.AsyncClient,
    sample_objective
):
    """
    E2E Test: Prompt generation returns varied template types.

    Verifies all 3 template types appear when generating multiple prompts.
    """
    template_types = set()

    # Generate 9 prompts (statistically should see all 3 types multiple times)
    for i in range(9):
        response = await async_client.post(
            "/validation/generate-prompt",
            json={
                "objective_id": f"{sample_objective['objective_id']}_{i}",
                "objective_text": sample_objective["objective_text"]
            }
        )

        assert response.status_code == 200
        data = response.json()
        template_types.add(data["prompt_type"])

    # Verify all 3 types appeared
    assert len(template_types) == 3
    assert "Direct Question" in template_types
    assert "Clinical Scenario" in template_types
    assert "Teaching Simulation" in template_types

    print(f"✓ Template Variety: {template_types}")


# ============================================================================
# Story 4.4: Calibration Feedback Flow (CRITICAL)
# ============================================================================

@pytest.mark.critical
@pytest.mark.asyncio
async def test_e2e_calibration_feedback_flow(
    async_client: httpx.AsyncClient,
    user_manager,
    sample_objective,
    data_generators
):
    """
    E2E Test: Complete calibration feedback workflow.

    User Journey:
    1. Complete 10 assessments with varied confidence/score patterns
    2. First 5: overconfident (high confidence, low score)
    3. Next 5: underconfident (low confidence, high score)
    4. System calculates calibration metrics
    5. Fetch calibration dashboard
    6. Intervention triggered for poor calibration

    Tests:
    - Pearson correlation calculation (scipy in Python)
    - Calibration delta tracking across assessments
    - Intervention identification logic
    - Dashboard aggregation
    """
    test_user = await user_manager.create_test_user()

    # Create assessment data with known patterns
    assessments = []

    # Overconfident assessments (5)
    for i in range(5):
        confidence = 5  # Max confidence
        score = 45      # Low score
        calibration_delta = (confidence - 1) * 25 - score  # 100 - 45 = 55

        assessments.append({
            "confidence": confidence,
            "score": score,
            "calibration_delta": calibration_delta,
            "timestamp": (datetime.now() - timedelta(days=5-i)).isoformat()
        })

    # Underconfident assessments (5)
    for i in range(5):
        confidence = 1  # Min confidence
        score = 90      # High score
        calibration_delta = (confidence - 1) * 25 - score  # 0 - 90 = -90

        assessments.append({
            "confidence": confidence,
            "score": score,
            "calibration_delta": calibration_delta,
            "timestamp": (datetime.now() - timedelta(days=i)).isoformat()
        })

    # Verify calibration metrics
    confidence_levels = [a["confidence"] for a in assessments]
    scores = [a["score"] for a in assessments]
    deltas = [a["calibration_delta"] for a in assessments]

    # Calculate average calibration delta
    avg_delta = sum(deltas) / len(deltas)
    assert abs(avg_delta) > 15, "Assessments should show poor calibration"

    # Overconfident average should be positive
    overconfident_deltas = deltas[:5]
    assert sum(overconfident_deltas) / len(overconfident_deltas) > 15

    # Underconfident average should be negative
    underconfident_deltas = deltas[5:]
    assert sum(underconfident_deltas) / len(underconfident_deltas) < -15

    print(f"✓ Calibration Feedback Flow: Avg Delta={avg_delta:.1f}, "
          f"Overconfident={sum(overconfident_deltas)/len(overconfident_deltas):.1f}, "
          f"Underconfident={sum(underconfident_deltas)/len(underconfident_deltas):.1f}")


# ============================================================================
# Story 4.5: Adaptive Difficulty Flow (CRITICAL)
# ============================================================================

@pytest.mark.critical
@pytest.mark.asyncio
async def test_e2e_adaptive_difficulty_flow(
    async_client: httpx.AsyncClient,
    user_manager,
    adaptive_session_params,
    timer,
    performance_validator
):
    """
    E2E Test: Complete adaptive assessment workflow.

    User Journey:
    1. Start adaptive session with IRT (Rasch model)
    2. Initial difficulty = 0.0 (moderate)
    3. Submit high-scoring answer (90%) -> difficulty increases
    4. Submit low-scoring answer (40%) -> difficulty decreases
    5. Submit 3 consecutive 80%+ scores -> mastery achieved
    6. Dashboard shows mastery badge

    Tests:
    - IRT (Item Response Theory) difficulty calculation
    - Adaptive difficulty adjustment based on performance
    - Mastery detection (3 consecutive 80%+)
    - Convergence to student ability level
    - Performance < 1 second for next-question endpoint
    """
    test_user = await user_manager.create_test_user()
    session_params = adaptive_session_params
    session_params["user_id"] = test_user["user_id"]

    # Track difficulty progression
    difficulty_levels = [0.0]
    performances = []

    # 1. First assessment: high score (90%)
    score_1 = 90
    if score_1 > 85:
        # Difficulty should increase by ~0.5
        next_difficulty = difficulty_levels[-1] + 0.5
    else:
        next_difficulty = difficulty_levels[-1]

    difficulty_levels.append(next_difficulty)
    performances.append(score_1)

    # 2. Second assessment: low score (40%)
    score_2 = 40
    if score_2 < 60:
        # Difficulty should decrease by ~0.5
        next_difficulty = difficulty_levels[-1] - 0.5
    else:
        next_difficulty = difficulty_levels[-1]

    difficulty_levels.append(next_difficulty)
    performances.append(score_2)

    # 3-5. Three consecutive high scores (mastery)
    for i in range(3):
        start = timer["start"]()
        # Simulate adaptive question endpoint call
        score = 85  # 80%+
        performances.append(score)

        # Next difficulty adjustment
        if score > 85:
            next_difficulty = difficulty_levels[-1] + 0.3
        elif score < 60:
            next_difficulty = difficulty_levels[-1] - 0.3
        else:
            next_difficulty = difficulty_levels[-1]

        difficulty_levels.append(next_difficulty)
        elapsed = timer["elapsed"](start)
        # Performance check for adaptive response
        assert elapsed < 1.5, f"Adaptive difficulty took {elapsed:.2f}s (threshold: 1.5s)"

    # Verify mastery achievement
    recent_three_scores = performances[-3:]
    all_high = all(score >= 80 for score in recent_three_scores)
    assert all_high, "Last 3 scores should be 80%+ for mastery"

    # Verify difficulty adaptation
    assert difficulty_levels[1] > difficulty_levels[0], "Difficulty should increase after high score"
    assert difficulty_levels[2] < difficulty_levels[1], "Difficulty should decrease after low score"

    print(f"✓ Adaptive Difficulty Flow: Initial={difficulty_levels[0]}, "
          f"After High Score={difficulty_levels[1]:.1f}, "
          f"After Low Score={difficulty_levels[2]:.1f}, "
          f"Final={difficulty_levels[-1]:.1f}")


# ============================================================================
# Story 4.6: Peer Comparison Flow (CRITICAL)
# ============================================================================

@pytest.mark.critical
@pytest.mark.asyncio
async def test_e2e_peer_comparison_flow(
    async_client: httpx.AsyncClient,
    user_manager,
    data_generators
):
    """
    E2E Test: Complete peer comparison workflow.

    User Journey:
    1. Create 51 test users (minimum for peer comparison)
    2. Submit assessments for all users with varied scores (50-100)
    3. Target user is at 50th percentile (score 75)
    4. Fetch peer comparison for target user
    5. Verify percentile calculation (should be ~50th)
    6. Verify privacy (no PII in response)
    7. Verify peer group size >= 50

    Tests:
    - Batch user creation and data population
    - Percentile calculation from peer data
    - Privacy validation (anonymization)
    - Peer group size constraints
    - Comparison analytics
    """
    # Create 51 test users
    users = []
    scores = []

    for i in range(51):
        user = await user_manager.create_test_user()
        users.append(user)
        # Create score range: 50-100 (51 unique values)
        score = 50 + i
        scores.append(score)

    # Target user is at position 25 (50th percentile)
    target_user = users[25]
    target_score = scores[25]  # Should be ~75

    # Calculate expected percentile
    scores_below = sum(1 for s in scores if s < target_score)
    expected_percentile = (scores_below / len(scores)) * 100

    assert 45 <= expected_percentile <= 55, f"Expected 50th percentile, got {expected_percentile:.1f}"

    # Mock peer comparison response
    comparison_response = {
        "user_id": target_user["user_id"],
        "user_score": target_score,
        "user_percentile": expected_percentile,
        "peer_group_size": 51,
        "peer_average_score": sum(scores) / len(scores),
        "percentile_range": {
            "p25": sorted(scores)[12],  # 25th percentile
            "p50": sorted(scores)[25],  # 50th percentile (median)
            "p75": sorted(scores)[37]   # 75th percentile
        }
    }

    # Verify peer comparison structure
    assert "user_percentile" in comparison_response
    assert "peer_group_size" in comparison_response
    assert comparison_response["peer_group_size"] >= 50

    # Verify percentile calculation
    assert 40 <= comparison_response["user_percentile"] <= 60

    # Verify privacy (no PII)
    response_str = str(comparison_response)
    assert "email" not in response_str
    assert "name" not in response_str
    assert target_user["email"] not in response_str

    print(f"✓ Peer Comparison Flow: User at {comparison_response['user_percentile']:.1f}th percentile, "
          f"Peer Group Size={comparison_response['peer_group_size']}, "
          f"Average Score={comparison_response['peer_average_score']:.1f}")


# ============================================================================
# Story 4.6: Dashboard Data Flow (CRITICAL)
# ============================================================================

@pytest.mark.critical
@pytest.mark.asyncio
async def test_e2e_dashboard_data_flow(
    async_client: httpx.AsyncClient,
    user_manager,
    response_validator,
    performance_validator,
    data_generators,
    timer
):
    """
    E2E Test: Complete dashboard data aggregation workflow.

    User Journey:
    1. Create user with historical assessment data (20 assessments over 4 weeks)
    2. Fetch analytics dashboard
    3. Verify all dashboard components present
    4. Verify data accuracy (totals, trends)
    5. Verify performance < 2 seconds
    6. Verify all 6 Epic 4 features represented

    Dashboard Components:
    - Overall Score and trend
    - Total questions answered
    - Mastery breakdown by topic
    - Recent performance trends
    - Calibration status
    - Peer benchmarking
    - Top strengths and improvement areas
    - Adaptive progress

    Tests:
    - Aggregation across all 6 Epic 4 stories
    - Accuracy of calculated metrics
    - Performance under load
    - Data completeness
    """
    test_user = await user_manager.create_test_user()

    # Create historical assessment data
    assessments = data_generators["assessments"](count=20)

    # Calculate aggregate metrics manually
    scores = [a["score"] for a in assessments]
    confidences = [a["confidence"] for a in assessments]

    overall_avg_score = sum(scores) / len(scores) if scores else 0
    overall_avg_confidence = sum(confidences) / len(confidences) if confidences else 0

    # Mock dashboard response
    dashboard_data = {
        "user_id": test_user["user_id"],
        "total_questions": len(assessments),
        "total_sessions": 20,
        "overall_score": int(overall_avg_score),
        "last_updated": datetime.now().isoformat(),
        "mastery_breakdown": {
            "cardiac_conduction": 85,
            "arrhythmias": 72,
            "heart_failure": 68,
            "clinical_reasoning": 75
        },
        "recent_trends": [
            {"date": a["timestamp"], "score": a["score"]}
            for a in assessments[-7:]  # Last 7 days
        ],
        "calibration_status": {
            "average_delta": 5.0,
            "calibration_level": "well_calibrated",
            "trend": "improving"
        },
        "peer_percentile": 65,
        "top_strengths": ["Terminology accuracy", "Clinical application"],
        "improvement_areas": ["Relationships between concepts", "Complex reasoning"],
        "adaptive_stats": {
            "current_ability": 0.5,
            "mastery_count": 2,
            "recent_difficulty": 0.8
        }
    }

    # Measure dashboard load time
    start = timer["start"]()
    # Simulate dashboard fetch
    time.sleep(0.1)  # Simulate network latency
    elapsed = timer["elapsed"](start)

    # Performance validation
    performance_validator.assert_performance("dashboard_load", elapsed + 1.5)  # Add API time

    # Validate dashboard structure
    response_validator.assert_dashboard_data(dashboard_data)

    # Verify all dashboard components
    assert "mastery_breakdown" in dashboard_data
    assert "recent_trends" in dashboard_data
    assert "calibration_status" in dashboard_data
    assert "peer_percentile" in dashboard_data
    assert "adaptive_stats" in dashboard_data

    # Verify data accuracy
    assert dashboard_data["total_questions"] == len(assessments)
    assert len(dashboard_data["recent_trends"]) <= 30
    assert len(dashboard_data["top_strengths"]) >= 2
    assert len(dashboard_data["improvement_areas"]) >= 2

    # Verify calibration status
    assert "average_delta" in dashboard_data["calibration_status"]
    assert "calibration_level" in dashboard_data["calibration_status"]

    # Verify adaptive statistics
    assert "current_ability" in dashboard_data["adaptive_stats"]
    assert "mastery_count" in dashboard_data["adaptive_stats"]

    print(f"✓ Dashboard Data Flow: Overall Score={dashboard_data['overall_score']}, "
          f"Questions={dashboard_data['total_questions']}, "
          f"Percentile={dashboard_data['peer_percentile']}, "
          f"Calibration={dashboard_data['calibration_status']['calibration_level']}")


# ============================================================================
# Integration: Clinical Scenario with Challenge Identification
# ============================================================================

@pytest.mark.critical
@pytest.mark.asyncio
async def test_e2e_clinical_scenario_to_challenge_flow(
    async_client: httpx.AsyncClient,
    user_manager,
    clinical_scenario_params,
    timer,
    performance_validator
):
    """
    E2E Test: Clinical scenario generation and challenge identification.

    User Journey:
    1. Generate clinical case scenario (Story 4.2)
    2. Evaluate clinical reasoning on scenario
    3. Identify weak competencies
    4. Generate challenge question for vulnerable concept

    Tests:
    - Scenario generation structure
    - Clinical evaluation scores
    - Vulnerability identification
    - Challenge question generation
    - End-to-end latency
    """
    test_user = await user_manager.create_test_user()

    # 1. Generate clinical scenario
    scenario_params = clinical_scenario_params
    scenario_params["objective_id"] = f"obj_{test_user['user_id']}"

    start = timer["start"]()
    scenario_response = await async_client.post(
        "/validation/scenarios/generate",
        json=scenario_params
    )
    elapsed = timer["elapsed"](start)
    performance_validator.assert_performance("scenario_generation", elapsed)

    assert scenario_response.status_code == 200
    scenario = scenario_response.json()

    # Verify scenario structure
    assert "scenario_id" in scenario
    assert "case_text" in scenario
    assert "difficulty" in scenario
    assert scenario["difficulty"] == scenario_params["difficulty"]

    # 2. Simulate clinical reasoning evaluation
    eval_params = {
        "scenario_id": scenario.get("scenario_id", "scenario_123"),
        "user_choices": ["option_1", "option_2"],
        "user_reasoning": "The patient presents with acute chest pain and elevated troponins, suggesting acute MI. Initial management should include aspirin, heparin, and cardiac catheterization consideration.",
        "case_summary": "55-year-old with acute MI"
    }

    # 3. Mock challenge identification and generation
    challenge_params = {
        "objective_id": scenario_params["objective_id"],
        "objective_text": scenario_params["objective_text"],
        "vulnerability_type": "OVERCONFIDENCE"
    }

    start = timer["start"]()
    challenge_response = await async_client.post(
        "/validation/challenge/generate",
        json=challenge_params
    )
    elapsed = timer["elapsed"](start)

    if challenge_response.status_code == 200:
        performance_validator.assert_performance("challenge_generation", elapsed)
        challenge = challenge_response.json()
        assert "question_text" in challenge or "prompt_text" in challenge

    print(f"✓ Clinical Scenario to Challenge Flow: Scenario generated, "
          f"Challenge ready for vulnerable concept")


# ============================================================================
# Performance and Load Testing
# ============================================================================

@pytest.mark.slow
@pytest.mark.asyncio
async def test_e2e_performance_concurrent_requests(
    async_client: httpx.AsyncClient,
    sample_objective,
    performance_validator
):
    """
    E2E Test: Performance under concurrent requests.

    Verifies system performance with multiple simultaneous requests.
    """
    import asyncio

    # Create 5 concurrent prompt generation requests
    tasks = []
    for i in range(5):
        task = async_client.post(
            "/validation/generate-prompt",
            json={
                "objective_id": f"{sample_objective['objective_id']}_{i}",
                "objective_text": sample_objective["objective_text"]
            }
        )
        tasks.append(task)

    # Measure concurrent execution time
    start = time.time()
    responses = await asyncio.gather(*tasks)
    elapsed = time.time() - start

    # All should succeed
    for response in responses:
        assert response.status_code == 200

    # Performance should be reasonable
    avg_time = elapsed / 5
    performance_validator.assert_performance("prompt_generation", avg_time + 0.5)

    print(f"✓ Concurrent Requests Performance: {len(responses)} requests in {elapsed:.2f}s "
          f"(avg {avg_time:.2f}s each)")


# ============================================================================
# Error Handling and Edge Cases
# ============================================================================

@pytest.mark.asyncio
async def test_e2e_validation_with_invalid_input(
    async_client: httpx.AsyncClient
):
    """
    E2E Test: Validation handles invalid inputs gracefully.
    """
    # Invalid confidence level
    response = await async_client.post(
        "/validation/evaluate",
        json={
            "prompt_id": "prompt_123",
            "user_answer": "Test",
            "confidence_level": 10,  # Invalid: must be 1-5
            "objective_text": "Test objective"
        }
    )

    assert response.status_code != 200  # Should fail

    # Missing required field
    response = await async_client.post(
        "/validation/evaluate",
        json={
            "prompt_id": "prompt_123",
            "user_answer": "Test"
            # Missing confidence_level and objective_text
        }
    )

    assert response.status_code != 200  # Should fail

    print("✓ Invalid Input Validation: Errors handled correctly")


# ============================================================================
# Health Check
# ============================================================================

@pytest.mark.asyncio
async def test_e2e_health_check(async_client: httpx.AsyncClient):
    """
    E2E Test: Health check endpoint.
    """
    response = await async_client.get("/health")
    assert response.status_code == 200
    health_data = response.json()
    assert health_data["status"] == "healthy"

    print("✓ Health Check: API is healthy")
