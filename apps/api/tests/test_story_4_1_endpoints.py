#!/usr/bin/env python3
"""
Test script for Story 4.1 validation endpoints.

Tests:
1. POST /validation/generate-prompt - Prompt generation with template variation
2. POST /validation/evaluate - Comprehension evaluation with calibration

Usage:
    python test_story_4_1_endpoints.py
"""

import httpx
import asyncio
import json
from typing import Dict, Any


# Configuration
BASE_URL = "http://localhost:8001"
TIMEOUT = 30.0


async def test_health_check() -> bool:
    """Test the health check endpoint."""
    print("\n" + "="*80)
    print("TEST 1: Health Check")
    print("="*80)

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            response = await client.get(f"{BASE_URL}/health")
            response.raise_for_status()

            data = response.json()
            print(f"✅ Health check passed: {data}")
            print(f"   Status: {data['status']}")
            print(f"   Service: {data.get('service', 'N/A')}")
            print(f"   Version: {data.get('version', 'N/A')}")
            return True

        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return False


async def test_generate_prompt() -> Dict[str, Any] | None:
    """Test prompt generation endpoint."""
    print("\n" + "="*80)
    print("TEST 2: Prompt Generation")
    print("="*80)

    # Test data
    request_data = {
        "objective_id": "obj_test_123",
        "objective_text": "Explain the cardiac conduction system and how it coordinates the heartbeat"
    }

    print(f"\n📤 Request:")
    print(f"   Objective ID: {request_data['objective_id']}")
    print(f"   Objective: {request_data['objective_text']}")

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            response = await client.post(
                f"{BASE_URL}/validation/generate-prompt",
                json=request_data
            )
            response.raise_for_status()

            data = response.json()
            print(f"\n📥 Response:")
            print(f"   Prompt Type: {data['prompt_type']}")
            print(f"   Prompt Text: {data['prompt_text'][:150]}...")
            print(f"   Expected Criteria: {len(data['expected_criteria'])} items")
            print(f"      - {data['expected_criteria'][0] if data['expected_criteria'] else 'None'}")

            print(f"\n✅ Prompt generation successful!")
            print(f"   Generated {data['prompt_type']} style prompt")

            return data

        except httpx.HTTPStatusError as e:
            print(f"❌ HTTP Error: {e.response.status_code}")
            print(f"   Response: {e.response.text}")
            return None
        except Exception as e:
            print(f"❌ Prompt generation failed: {e}")
            return None


async def test_evaluate_comprehension(prompt_data: Dict[str, Any] | None = None) -> Dict[str, Any] | None:
    """Test comprehension evaluation endpoint."""
    print("\n" + "="*80)
    print("TEST 3: Comprehension Evaluation")
    print("="*80)

    # Test data - strong explanation
    request_data = {
        "prompt_id": "prompt_test_456",
        "user_answer": """The cardiac conduction system is like an electrical wiring system in your heart.

It starts with the SA node (sinoatrial node), which acts like the heart's natural pacemaker. This sends out electrical signals that make the upper chambers (atria) squeeze and push blood down to the lower chambers (ventricles).

Then, the signal travels through a special pathway to the AV node (atrioventricular node), which acts like a relay station. It briefly delays the signal so the lower chambers can fill with blood.

Finally, the signal races down special fibers called the bundle of His and Purkinje fibers, which spread throughout the ventricles and make them contract powerfully to pump blood to your lungs and the rest of your body.

This coordinated electrical activity ensures your heart beats in the right rhythm - about 60-100 times per minute when you're resting.""",
        "confidence_level": 4,  # Confident (1-5 scale)
        "objective_text": "Explain the cardiac conduction system and how it coordinates the heartbeat"
    }

    print(f"\n📤 Request:")
    print(f"   Prompt ID: {request_data['prompt_id']}")
    print(f"   Confidence Level: {request_data['confidence_level']}/5")
    print(f"   Answer Length: {len(request_data['user_answer'])} characters")
    print(f"   Answer Preview: {request_data['user_answer'][:100]}...")

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            response = await client.post(
                f"{BASE_URL}/validation/evaluate",
                json=request_data
            )
            response.raise_for_status()

            data = response.json()
            print(f"\n📥 Response:")
            print(f"   Overall Score: {data['overall_score']}/100")
            print(f"   Subscores:")
            print(f"      - Terminology: {data['terminology_score']}/100 (20% weight)")
            print(f"      - Relationships: {data['relationships_score']}/100 (30% weight)")
            print(f"      - Application: {data['application_score']}/100 (30% weight)")
            print(f"      - Clarity: {data['clarity_score']}/100 (20% weight)")

            print(f"\n   Strengths ({len(data['strengths'])} items):")
            for i, strength in enumerate(data['strengths'], 1):
                print(f"      {i}. {strength}")

            print(f"\n   Gaps ({len(data['gaps'])} items):")
            for i, gap in enumerate(data['gaps'], 1):
                print(f"      {i}. {gap}")

            print(f"\n   Calibration:")
            print(f"      Delta: {data['calibration_delta']:.1f}")
            print(f"      Note: {data['calibration_note']}")

            # Verify weighted score calculation
            calculated_score = (
                data['terminology_score'] * 0.20 +
                data['relationships_score'] * 0.30 +
                data['application_score'] * 0.30 +
                data['clarity_score'] * 0.20
            )

            if abs(calculated_score - data['overall_score']) < 1:
                print(f"\n✅ Evaluation successful!")
                print(f"   Weighted score calculation verified: {calculated_score:.1f} ≈ {data['overall_score']}")
            else:
                print(f"\n⚠️  Weighted score mismatch!")
                print(f"   Calculated: {calculated_score:.1f}")
                print(f"   Returned: {data['overall_score']}")

            return data

        except httpx.HTTPStatusError as e:
            print(f"❌ HTTP Error: {e.response.status_code}")
            print(f"   Response: {e.response.text}")
            return None
        except Exception as e:
            print(f"❌ Evaluation failed: {e}")
            return None


async def test_weak_explanation() -> Dict[str, Any] | None:
    """Test evaluation with a weak explanation to verify gap detection."""
    print("\n" + "="*80)
    print("TEST 4: Weak Explanation (Gap Detection)")
    print("="*80)

    # Test data - weak explanation with gaps
    request_data = {
        "prompt_id": "prompt_test_789",
        "user_answer": "The heart has electricity that makes it beat. It starts at the top and goes to the bottom. The SA node starts it and then it goes down.",
        "confidence_level": 2,  # Low confidence
        "objective_text": "Explain the cardiac conduction system and how it coordinates the heartbeat"
    }

    print(f"\n📤 Request:")
    print(f"   Confidence Level: {request_data['confidence_level']}/5 (low)")
    print(f"   Answer: {request_data['user_answer']}")

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            response = await client.post(
                f"{BASE_URL}/validation/evaluate",
                json=request_data
            )
            response.raise_for_status()

            data = response.json()
            print(f"\n📥 Response:")
            print(f"   Overall Score: {data['overall_score']}/100 (expected: 0-59)")

            if data['overall_score'] < 60:
                print(f"✅ Correctly identified as 'Needs Review'")
            else:
                print(f"⚠️  Score higher than expected for weak explanation")

            print(f"\n   Gaps detected:")
            for i, gap in enumerate(data['gaps'], 1):
                print(f"      {i}. {gap}")

            return data

        except Exception as e:
            print(f"❌ Weak explanation test failed: {e}")
            return None


async def test_overconfident_calibration() -> Dict[str, Any] | None:
    """Test calibration detection for overconfidence."""
    print("\n" + "="*80)
    print("TEST 5: Overconfidence Calibration")
    print("="*80)

    # Test data - overconfident (high confidence, moderate answer)
    request_data = {
        "prompt_id": "prompt_test_101",
        "user_answer": "The cardiac conduction system uses electrical signals. The SA node starts the signal, then it goes to the AV node, and then to the ventricles.",
        "confidence_level": 5,  # Very confident
        "objective_text": "Explain the cardiac conduction system and how it coordinates the heartbeat"
    }

    print(f"\n📤 Request:")
    print(f"   Confidence Level: {request_data['confidence_level']}/5 (very confident)")
    print(f"   Answer Quality: Moderate (partial explanation)")

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            response = await client.post(
                f"{BASE_URL}/validation/evaluate",
                json=request_data
            )
            response.raise_for_status()

            data = response.json()
            print(f"\n📥 Response:")
            print(f"   Overall Score: {data['overall_score']}/100")
            print(f"   Confidence (normalized): {(request_data['confidence_level'] - 1) * 25}/100")
            print(f"   Calibration Delta: {data['calibration_delta']:.1f}")
            print(f"   Calibration Note: {data['calibration_note']}")

            if data['calibration_delta'] > 15:
                print(f"\n✅ Overconfidence detected correctly!")
            else:
                print(f"\n⚠️  Calibration delta lower than expected")

            return data

        except Exception as e:
            print(f"❌ Overconfidence test failed: {e}")
            return None


async def test_template_variation() -> None:
    """Test that multiple prompts generate different template types."""
    print("\n" + "="*80)
    print("TEST 6: Template Variation (10 generations)")
    print("="*80)

    request_data = {
        "objective_id": "obj_variation_test",
        "objective_text": "Explain the cardiac conduction system and how it coordinates the heartbeat"
    }

    template_counts = {
        "Direct Question": 0,
        "Clinical Scenario": 0,
        "Teaching Simulation": 0
    }

    print(f"\nGenerating 10 prompts to verify template variation...")

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        for i in range(10):
            try:
                response = await client.post(
                    f"{BASE_URL}/validation/generate-prompt",
                    json=request_data
                )
                response.raise_for_status()
                data = response.json()

                template_type = data['prompt_type']
                template_counts[template_type] += 1
                print(f"   {i+1}. {template_type}")

            except Exception as e:
                print(f"   {i+1}. ❌ Failed: {e}")

    print(f"\n📊 Template Distribution:")
    for template, count in template_counts.items():
        percentage = (count / 10) * 100
        bar = "█" * int(percentage / 5)
        print(f"   {template:20s}: {count:2d}/10 ({percentage:5.1f}%) {bar}")

    # Verify all templates were used
    if all(count > 0 for count in template_counts.values()):
        print(f"\n✅ Template variation confirmed - all 3 types generated!")
    else:
        print(f"\n⚠️  Not all template types were generated in 10 attempts")
        unused = [t for t, c in template_counts.items() if c == 0]
        print(f"   Unused templates: {', '.join(unused)}")


async def main():
    """Run all tests."""
    print("\n" + "╔" + "="*78 + "╗")
    print("║" + " "*20 + "STORY 4.1 ENDPOINT TESTS" + " "*34 + "║")
    print("╚" + "="*78 + "╝")

    # Test 1: Health check
    health_ok = await test_health_check()
    if not health_ok:
        print("\n❌ API is not running. Start with:")
        print("   cd /Users/kyin/Projects/Americano-epic4/apps/api")
        print("   uvicorn main:app --reload --port 8001")
        return

    # Test 2: Prompt generation
    prompt_data = await test_generate_prompt()

    # Test 3: Strong explanation evaluation
    eval_strong = await test_evaluate_comprehension(prompt_data)

    # Test 4: Weak explanation (gap detection)
    eval_weak = await test_weak_explanation()

    # Test 5: Overconfidence calibration
    eval_overconfident = await test_overconfident_calibration()

    # Test 6: Template variation
    await test_template_variation()

    # Summary
    print("\n" + "╔" + "="*78 + "╗")
    print("║" + " "*30 + "TEST SUMMARY" + " "*36 + "║")
    print("╚" + "="*78 + "╝")

    tests_passed = sum([
        health_ok,
        prompt_data is not None,
        eval_strong is not None,
        eval_weak is not None,
        eval_overconfident is not None,
    ])

    print(f"\n   Tests Passed: {tests_passed}/5")
    print(f"   Status: {'✅ ALL TESTS PASSED' if tests_passed == 5 else '⚠️  SOME TESTS FAILED'}")

    print(f"\n" + "="*80)
    print("Documentation: /Users/kyin/Projects/Americano-epic4/apps/api/README.md")
    print("API Docs: http://localhost:8001/docs")
    print("="*80 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
