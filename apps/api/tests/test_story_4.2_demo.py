#!/usr/bin/env python3
"""
Demo script to test Story 4.2 endpoints end-to-end.
Run this to verify the Python service is working correctly.

Usage:
    python test_story_4.2_demo.py
"""

import asyncio
import json
from src.validation.scenario_generator import ClinicalScenarioGenerator
from src.validation.scenario_evaluator import ClinicalReasoningEvaluator


async def test_scenario_generation():
    """Test scenario generation with a sample learning objective."""
    print("\n" + "=" * 70)
    print("TEST 1: Clinical Scenario Generation")
    print("=" * 70)

    generator = ClinicalScenarioGenerator()

    # Sample learning objective
    objective_id = "obj_demo_123"
    objective_text = "Understand the pathophysiology and management of acute myocardial infarction"
    board_exam_tags = ["USMLE-Step2-Cardiology", "COMLEX-L2-Cardiovascular"]
    difficulty = "INTERMEDIATE"

    print(f"\n📝 Generating scenario for objective: {objective_text[:50]}...")
    print(f"🎯 Difficulty: {difficulty}")
    print(f"📚 Board Exam Tags: {', '.join(board_exam_tags)}")

    try:
        scenario = await generator.generate_scenario(
            objective_id=objective_id,
            objective_text=objective_text,
            board_exam_tags=board_exam_tags,
            difficulty=difficulty
        )

        print(f"\n✅ Scenario generated successfully!")
        print(f"   Scenario ID: {scenario.scenario_id}")
        print(f"   Type: {scenario.scenario_type}")
        print(f"   Board Topic: {scenario.board_exam_topic}")
        print(f"\n   Chief Complaint: {scenario.case_text.chief_complaint}")
        print(f"   Demographics: {scenario.case_text.demographics}")
        print(f"   Questions: {len(scenario.case_text.questions)} decision points")

        # Pretty print first question
        if scenario.case_text.questions:
            q1 = scenario.case_text.questions[0]
            print(f"\n   First Question:")
            print(f"     Stage: {q1['stage']}")
            print(f"     Prompt: {q1['prompt']}")
            print(f"     Options: {len(q1['options'])} choices")

        return scenario

    except Exception as e:
        print(f"\n❌ Error generating scenario: {e}")
        return None


async def test_clinical_evaluation(scenario):
    """Test clinical reasoning evaluation with sample user response."""
    print("\n" + "=" * 70)
    print("TEST 2: Clinical Reasoning Evaluation")
    print("=" * 70)

    if not scenario:
        print("\n⚠️  Skipping evaluation test (no scenario generated)")
        return

    evaluator = ClinicalReasoningEvaluator()

    # Sample user choices and reasoning
    user_choices = {
        "initial": "Order ECG",
        "ecg_results": "Start aspirin and nitroglycerin",
        "treatment": "Activate cath lab for PCI"
    }

    user_reasoning = """
    Patient presents with classic acute coronary syndrome symptoms including
    chest pain, diaphoresis, and an S4 gallop on exam. The ECG is the first
    diagnostic step to evaluate for ST-elevation myocardial infarction.
    Given the high clinical suspicion, immediate anti-ischemic therapy with
    aspirin and nitroglycerin is warranted while preparing for possible
    percutaneous coronary intervention.
    """

    case_summary = f"{scenario.case_text.chief_complaint} - {scenario.case_text.demographics}"

    print(f"\n📝 Evaluating user's clinical reasoning...")
    print(f"   User Choices: {len(user_choices)} decision points")
    print(f"   Reasoning Length: {len(user_reasoning)} characters")

    try:
        evaluation = await evaluator.evaluate_reasoning(
            scenario_id=scenario.scenario_id,
            user_choices=user_choices,
            user_reasoning=user_reasoning,
            case_summary=case_summary
        )

        print(f"\n✅ Evaluation completed successfully!")
        print(f"\n   Overall Score: {evaluation.overall_score}/100")
        print(f"\n   Competency Scores:")
        print(f"     Data Gathering: {evaluation.competency_scores.data_gathering}/100")
        print(f"     Diagnosis: {evaluation.competency_scores.diagnosis}/100")
        print(f"     Management: {evaluation.competency_scores.management}/100")
        print(f"     Clinical Reasoning: {evaluation.competency_scores.clinical_reasoning}/100")

        print(f"\n   Strengths ({len(evaluation.strengths)}):")
        for i, strength in enumerate(evaluation.strengths, 1):
            print(f"     {i}. {strength}")

        print(f"\n   Weaknesses ({len(evaluation.weaknesses)}):")
        for i, weakness in enumerate(evaluation.weaknesses, 1):
            print(f"     {i}. {weakness}")

        if evaluation.cognitive_biases:
            print(f"\n   Cognitive Biases Detected ({len(evaluation.cognitive_biases)}):")
            for bias in evaluation.cognitive_biases:
                print(f"     - {bias}")
        else:
            print(f"\n   ✅ No cognitive biases detected")

        print(f"\n   Teaching Points ({len(evaluation.teaching_points)}):")
        for i, point in enumerate(evaluation.teaching_points, 1):
            print(f"     {i}. {point}")

        return evaluation

    except Exception as e:
        print(f"\n❌ Error evaluating reasoning: {e}")
        return None


async def main():
    """Run all demo tests."""
    print("\n" + "=" * 70)
    print("Story 4.2: Clinical Reasoning Scenario Assessment - Demo")
    print("=" * 70)
    print("\nThis demo tests the Python FastAPI service components:")
    print("  1. Clinical scenario generation (ClinicalScenarioGenerator)")
    print("  2. Clinical reasoning evaluation (ClinicalReasoningEvaluator)")
    print("\nNote: This uses the actual OpenAI API if OPENAI_API_KEY is set.")
    print("      Otherwise, you'll see errors (which is expected for demo).")

    # Test scenario generation
    scenario = await test_scenario_generation()

    # Test clinical evaluation (only if scenario generation succeeded)
    await test_clinical_evaluation(scenario)

    print("\n" + "=" * 70)
    print("Demo Complete!")
    print("=" * 70)
    print("\nNext Steps:")
    print("  1. Start FastAPI server: uvicorn main:app --reload --port 8001")
    print("  2. Visit interactive docs: http://localhost:8001/docs")
    print("  3. Test endpoints via Swagger UI")
    print("  4. Integrate with TypeScript Next.js application")
    print("\n")


if __name__ == "__main__":
    asyncio.run(main())
