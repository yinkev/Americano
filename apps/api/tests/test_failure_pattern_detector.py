"""
Tests for FailurePatternDetector (Story 4.3 Task 6).

Tests AC#6: Performance Pattern Analysis
- Groups failed concepts by category
- Detects systematic errors
- Generates remediation recommendations
- Returns patterns ranked by frequency
"""

import pytest
from datetime import datetime, timedelta
from src.challenge.failure_pattern_detector import FailurePatternDetector
from src.challenge.models import ControlledFailureRecord


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def detector():
    """Create detector with default settings (min_frequency=3)."""
    return FailurePatternDetector(min_frequency=3)


@pytest.fixture
def sample_failures():
    """
    Create sample failure records for testing.

    Includes:
    - 5 failures in Pharmacology (course)
    - 4 failures with "ACE inhibitors" topic tag
    - 3 failures with "Cardiology" board exam tag
    - 3 failures on same concept (systematic error)
    """
    base_time = datetime.utcnow()

    failures = []

    # Category pattern: 5 failures in Pharmacology
    for i in range(5):
        failures.append(ControlledFailureRecord(
            id=f"fail_pharm_{i}",
            user_id="user123",
            objective_id=f"obj_pharm_{i}",
            prompt_id=f"prompt_pharm_{i}",
            is_correct=False,
            score=0.45,
            confidence_level=4,  # Overconfident
            responded_at=base_time - timedelta(days=i),
            concept_name=f"Pharmacology Concept {i}",
            course_name="Pharmacology",
            topic_tags=["drug_classes"],
            board_exam_tags=["USMLE_Step1"],
        ))

    # Topic pattern: 4 failures with "ACE inhibitors" tag
    for i in range(4):
        failures.append(ControlledFailureRecord(
            id=f"fail_ace_{i}",
            user_id="user123",
            objective_id=f"obj_ace_{i}",
            prompt_id=f"prompt_ace_{i}",
            is_correct=False,
            score=0.50,
            confidence_level=3,
            responded_at=base_time - timedelta(days=i),
            concept_name="ACE Inhibitors",
            course_name="Pharmacology",
            topic_tags=["ACE_inhibitors", "antihypertensives"],
            board_exam_tags=["Cardiology"],
        ))

    # Systematic error: 3 failures on same concept
    for i in range(3):
        failures.append(ControlledFailureRecord(
            id=f"fail_sys_{i}",
            user_id="user123",
            objective_id="obj_sympath",  # Same objective
            prompt_id=f"prompt_sympath_{i}",
            is_correct=False,
            score=0.40,
            confidence_level=5,  # High overconfidence
            responded_at=base_time - timedelta(days=i),
            concept_name="Sympathetic vs Parasympathetic",
            course_name="Neuroscience",
            topic_tags=["autonomic_nervous_system"],
            board_exam_tags=["Neuroscience"],
        ))

    return failures


# ============================================================================
# Test: Pattern Detection
# ============================================================================

@pytest.mark.asyncio
async def test_detect_patterns_with_sufficient_failures(detector, sample_failures):
    """Test pattern detection with sufficient failure data."""
    patterns = await detector.detect_patterns(
        user_id="user123",
        failures=sample_failures,
        lookback_days=30
    )

    # Should detect multiple patterns
    assert len(patterns) > 0, "Should detect patterns from sufficient failures"

    # Patterns should be sorted by frequency (descending)
    if len(patterns) > 1:
        for i in range(len(patterns) - 1):
            assert patterns[i].frequency >= patterns[i + 1].frequency

    # Check required fields
    for pattern in patterns:
        assert pattern.user_id == "user123"
        assert pattern.pattern_type in ["category", "topic", "systematic_error", "board_exam_tag"]
        assert len(pattern.pattern_description) > 0
        assert pattern.frequency >= detector.min_frequency


@pytest.mark.asyncio
async def test_category_patterns(detector, sample_failures):
    """Test category-based pattern detection."""
    patterns = await detector.detect_patterns(
        user_id="user123",
        failures=sample_failures,
        lookback_days=30
    )

    category_patterns = [p for p in patterns if p.pattern_type == "category"]
    pharm_patterns = [p for p in category_patterns if "Pharmacology" in p.pattern_description]

    assert len(pharm_patterns) > 0, "Should detect Pharmacology category pattern"
    assert pharm_patterns[0].frequency >= 5
