// Test script to debug API errors
import { prisma } from './src/lib/db';
import { MasteryLevel } from './src/generated/prisma';

async function testMasterySummary() {
  try {
    const userId = 'kevy@americano.dev';

    console.log('Testing mastery summary API logic...');
    console.log('User ID:', userId);

    // Fetch all objectives for user
    const objectives = await prisma.learningObjective.findMany({
      where: {
        lecture: {
          userId,
        },
      },
      select: {
        masteryLevel: true,
      },
    });

    console.log('Found objectives:', objectives.length);
    console.log('Objectives:', objectives);

    // Count by mastery level
    const counts = {
      notStarted: 0,
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      mastered: 0,
    };

    objectives.forEach((obj) => {
      switch (obj.masteryLevel) {
        case MasteryLevel.NOT_STARTED:
          counts.notStarted++;
          break;
        case MasteryLevel.BEGINNER:
          counts.beginner++;
          break;
        case MasteryLevel.INTERMEDIATE:
          counts.intermediate++;
          break;
        case MasteryLevel.ADVANCED:
          counts.advanced++;
          break;
        case MasteryLevel.MASTERED:
          counts.mastered++;
          break;
      }
    });

    const totalObjectives = objectives.length;

    // Calculate percentages
    const percentages = {
      [MasteryLevel.NOT_STARTED]: totalObjectives > 0
        ? (counts.notStarted / totalObjectives) * 100
        : 0,
      [MasteryLevel.BEGINNER]: totalObjectives > 0
        ? (counts.beginner / totalObjectives) * 100
        : 0,
      [MasteryLevel.INTERMEDIATE]: totalObjectives > 0
        ? (counts.intermediate / totalObjectives) * 100
        : 0,
      [MasteryLevel.ADVANCED]: totalObjectives > 0
        ? (counts.advanced / totalObjectives) * 100
        : 0,
      [MasteryLevel.MASTERED]: totalObjectives > 0
        ? (counts.mastered / totalObjectives) * 100
        : 0,
    };

    const result = {
      ...counts,
      totalObjectives,
      percentages,
    };

    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('✅ API logic works correctly');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMasterySummary();
