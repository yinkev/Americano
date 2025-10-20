"""
Check available training data in database for struggle prediction validation.
"""
import asyncio
import os
from pathlib import Path
import sys

# Add apps/ml-service to path
sys.path.insert(0, str(Path(__file__).parent / "apps" / "web"))

# Set up environment
os.environ['DATABASE_URL'] = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/americano')

from prisma import Prisma

async def check_data():
    prisma = Prisma()
    await prisma.connect()
    
    print("=" * 80)
    print("DATABASE TRAINING DATA ASSESSMENT")
    print("=" * 80)
    
    # Check StrugglePrediction table
    total_predictions = await prisma.struggleprediction.count()
    print(f"\nTotal StrugglePrediction records: {total_predictions}")
    
    labeled_predictions = await prisma.struggleprediction.count(
        where={'actualOutcome': {'not': None}}
    )
    print(f"Labeled predictions (actualOutcome != NULL): {labeled_predictions}")
    
    # Check PredictionFeedback
    feedback_count = await prisma.predictionfeedback.count()
    print(f"PredictionFeedback records: {feedback_count}")
    
    # Check BehavioralEvent for user-kevy
    kevy_events = await prisma.behavioralevent.count(
        where={'userId': 'user-kevy'}
    )
    print(f"BehavioralEvent records for user-kevy: {kevy_events}")
    
    # Check total users with behavioral data
    total_behavioral_events = await prisma.behavioralevent.count()
    print(f"Total BehavioralEvent records: {total_behavioral_events}")
    
    # Sample a few predictions to see structure
    print("\n" + "=" * 80)
    print("SAMPLE DATA STRUCTURE")
    print("=" * 80)
    
    sample_predictions = await prisma.struggleprediction.find_many(
        take=3,
        include={
            'user': True,
            'learningObjective': True
        }
    )
    
    if sample_predictions:
        for i, pred in enumerate(sample_predictions, 1):
            print(f"\nSample {i}:")
            print(f"  ID: {pred.id}")
            print(f"  User: {pred.userId}")
            print(f"  Objective: {pred.learningObjectiveId}")
            print(f"  Predicted Probability: {pred.predictedStruggleProbability}")
            print(f"  Actual Outcome: {pred.actualOutcome}")
            print(f"  Has Feature Vector: {pred.featureVector is not None}")
    else:
        print("No predictions found in database")
    
    print("\n" + "=" * 80)
    print("ASSESSMENT")
    print("=" * 80)
    
    if labeled_predictions >= 100:
        print(f"✅ SUFFICIENT DATA: {labeled_predictions} labeled samples (>= 100)")
        print("   Recommendation: Use real data for validation")
    elif labeled_predictions >= 50:
        print(f"⚠️  BORDERLINE DATA: {labeled_predictions} labeled samples (50-99)")
        print("   Recommendation: Supplement with synthetic data")
    else:
        print(f"❌ INSUFFICIENT DATA: {labeled_predictions} labeled samples (< 50)")
        print("   Recommendation: Generate synthetic labeled dataset")
    
    await prisma.disconnect()
    
    return labeled_predictions

if __name__ == "__main__":
    count = asyncio.run(check_data())
    sys.exit(0 if count >= 50 else 1)
