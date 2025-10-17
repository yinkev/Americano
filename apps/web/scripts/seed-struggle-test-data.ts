/**
 * Story 5.2 Task 13: Test Data Seeding Script
 *
 * Creates synthetic user data with known struggle patterns for comprehensive testing:
 *
 * Test User: kevy@americano.dev
 * - 6+ weeks of study history
 * - Clear pattern: Struggles with physiology (30% retention), strong in anatomy (85%)
 * - Missing prerequisite: Cell membrane transport (not studied)
 * - Upcoming objective: Action potentials (requires membrane transport)
 * - Expected prediction: HIGH struggle probability (>0.7) due to prerequisite gap
 */

import { PrismaClient } from '@/generated/prisma';
import {
  ProcessingStatus,
  ObjectiveComplexity,
  MasteryLevel,
  ReviewRating,
  MissionStatus,
  EventType,
  EngagementLevel,
  CompletionQuality,
  BehavioralPatternType,
  InsightType
} from '@/generated/prisma';
import { subDays, addDays, addHours, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

const TEST_USER_EMAIL = 'kevy@americano.dev';

async function main() {
  console.log('🧪 Starting test data seeding for Story 5.2...\n');

  // Clean up existing test data
  console.log('🧹 Cleaning up existing test data...');
  const existingUser = await prisma.user.findUnique({
    where: { email: TEST_USER_EMAIL }
  });

  if (existingUser) {
    await prisma.user.delete({
      where: { id: existingUser.id }
    });
    console.log('✅ Cleaned up existing test user\n');
  }

  // Step 1: Create test user
  console.log('👤 Creating test user...');
  const user = await prisma.user.create({
    data: {
      email: TEST_USER_EMAIL,
      name: 'Kevin (Test User)',
      defaultMissionMinutes: 50,
      behavioralAnalysisEnabled: true,
      learningStyleProfilingEnabled: true
    }
  });
  console.log(`✅ Created user: ${user.email} (ID: ${user.id})\n`);

  // Step 2: Create courses
  console.log('📚 Creating courses...');
  const anatomyCourse = await prisma.course.create({
    data: {
      userId: user.id,
      name: 'Human Anatomy',
      code: 'ANAT 501',
      term: 'Fall 2025',
      color: 'oklch(0.7 0.15 145)' // Green for anatomy (strong area)
    }
  });

  const physiologyCourse = await prisma.course.create({
    data: {
      userId: user.id,
      name: 'Human Physiology',
      code: 'PHYS 502',
      term: 'Fall 2025',
      color: 'oklch(0.6 0.15 25)' // Red for physiology (struggle area)
    }
  });
  console.log(`✅ Created 2 courses: Anatomy (strong), Physiology (struggle)\n`);

  // Step 3: Create lectures
  console.log('📖 Creating lectures...');
  const anatomyLecture = await prisma.lecture.create({
    data: {
      userId: user.id,
      courseId: anatomyCourse.id,
      title: 'Musculoskeletal System',
      fileName: 'anatomy_lecture_1.pdf',
      fileUrl: '/test-data/anatomy_lecture_1.pdf',
      fileSize: 5242880,
      processingStatus: ProcessingStatus.COMPLETED,
      processedAt: subDays(new Date(), 42), // 6 weeks ago
      weekNumber: 1,
      topicTags: ['anatomy', 'musculoskeletal']
    }
  });

  const physiologyLecture = await prisma.lecture.create({
    data: {
      userId: user.id,
      courseId: physiologyCourse.id,
      title: 'Neurophysiology Basics',
      fileName: 'physiology_lecture_1.pdf',
      fileUrl: '/test-data/physiology_lecture_1.pdf',
      fileSize: 4194304,
      processingStatus: ProcessingStatus.COMPLETED,
      processedAt: subDays(new Date(), 42),
      weekNumber: 1,
      topicTags: ['physiology', 'neuroscience']
    }
  });
  console.log(`✅ Created 2 lectures\n`);

  // Step 4: Create learning objectives
  console.log('🎯 Creating learning objectives...');

  // ANATOMY OBJECTIVES (strong area - high mastery)
  const anatomyObjective1 = await prisma.learningObjective.create({
    data: {
      lectureId: anatomyLecture.id,
      objective: 'Describe the structure and function of skeletal muscle fibers',
      complexity: ObjectiveComplexity.INTERMEDIATE,
      pageStart: 1,
      pageEnd: 5,
      isHighYield: true,
      boardExamTags: ['USMLE-Step1-Anatomy', 'COMLEX-L1-Musculoskeletal'],
      masteryLevel: MasteryLevel.MASTERED,
      totalStudyTimeMs: 3600000, // 1 hour
      lastStudiedAt: subDays(new Date(), 35),
      weaknessScore: 0.15 // Strong (low weakness)
    }
  });

  const anatomyObjective2 = await prisma.learningObjective.create({
    data: {
      lectureId: anatomyLecture.id,
      objective: 'Explain the anatomical features of major muscle groups',
      complexity: ObjectiveComplexity.BASIC,
      pageStart: 6,
      pageEnd: 10,
      isHighYield: false,
      boardExamTags: ['USMLE-Step1-Anatomy'],
      masteryLevel: MasteryLevel.ADVANCED,
      totalStudyTimeMs: 2700000, // 45 minutes
      lastStudiedAt: subDays(new Date(), 30),
      weaknessScore: 0.20
    }
  });

  // PHYSIOLOGY OBJECTIVES (struggle area - low mastery)
  const membraneTransportObjective = await prisma.learningObjective.create({
    data: {
      lectureId: physiologyLecture.id,
      objective: 'Explain cell membrane transport mechanisms (passive and active transport)',
      complexity: ObjectiveComplexity.BASIC,
      pageStart: 1,
      pageEnd: 8,
      isHighYield: true,
      boardExamTags: ['USMLE-Step1-Physiology', 'COMLEX-L1-Cell-Biology'],
      masteryLevel: MasteryLevel.NOT_STARTED, // MISSING PREREQUISITE
      totalStudyTimeMs: 0,
      lastStudiedAt: null,
      weaknessScore: 1.0 // Maximum weakness (not studied)
    }
  });

  const actionPotentialObjective = await prisma.learningObjective.create({
    data: {
      lectureId: physiologyLecture.id,
      objective: 'Describe the generation and propagation of action potentials in neurons',
      complexity: ObjectiveComplexity.ADVANCED,
      pageStart: 9,
      pageEnd: 20,
      isHighYield: true,
      boardExamTags: ['USMLE-Step1-Physiology', 'NBME-Neuroscience', 'COMLEX-L1-Neurophysiology'],
      masteryLevel: MasteryLevel.BEGINNER, // Will struggle due to missing prerequisite
      totalStudyTimeMs: 1800000, // 30 minutes (below average)
      lastStudiedAt: subDays(new Date(), 21),
      weaknessScore: 0.75 // High weakness
    }
  });

  const synapticTransmissionObjective = await prisma.learningObjective.create({
    data: {
      lectureId: physiologyLecture.id,
      objective: 'Explain synaptic transmission and neurotransmitter release',
      complexity: ObjectiveComplexity.ADVANCED,
      pageStart: 21,
      pageEnd: 30,
      isHighYield: true,
      boardExamTags: ['USMLE-Step1-Physiology', 'USMLE-Step2-Neurology'],
      masteryLevel: MasteryLevel.BEGINNER,
      totalStudyTimeMs: 2400000, // 40 minutes
      lastStudiedAt: subDays(new Date(), 14),
      weaknessScore: 0.70
    }
  });

  // Create prerequisite relationships
  console.log('🔗 Creating prerequisite relationships...');
  await prisma.objectivePrerequisite.create({
    data: {
      objectiveId: actionPotentialObjective.id,
      prerequisiteId: membraneTransportObjective.id,
      strength: 1.0 // Strong prerequisite dependency
    }
  });

  await prisma.objectivePrerequisite.create({
    data: {
      objectiveId: synapticTransmissionObjective.id,
      prerequisiteId: actionPotentialObjective.id,
      strength: 0.9
    }
  });
  console.log(`✅ Created ${6} learning objectives with prerequisite relationships\n`);

  // Step 5: Create flashcards and reviews
  console.log('🎴 Creating flashcards and reviews...');

  // Anatomy cards (STRONG PERFORMANCE - 85% retention)
  const anatomyCards = await Promise.all([
    prisma.card.create({
      data: {
        courseId: anatomyCourse.id,
        lectureId: anatomyLecture.id,
        objectiveId: anatomyObjective1.id,
        front: 'What are the three types of muscle fibers?',
        back: 'Type I (slow-twitch), Type IIa (fast-twitch oxidative), Type IIb (fast-twitch glycolytic)',
        cardType: 'BASIC',
        difficulty: 3.2,
        stability: 21.5, // High stability
        retrievability: 0.85,
        lastReviewedAt: subDays(new Date(), 7),
        nextReviewAt: addDays(new Date(), 14),
        reviewCount: 8,
        lapseCount: 1 // Few lapses
      }
    }),
    prisma.card.create({
      data: {
        courseId: anatomyCourse.id,
        lectureId: anatomyLecture.id,
        objectiveId: anatomyObjective2.id,
        front: 'Describe the structure of the sarcomere',
        back: 'Z-line to Z-line, contains actin (thin) and myosin (thick) filaments, I-band, A-band, H-zone',
        cardType: 'BASIC',
        difficulty: 2.8,
        stability: 28.3,
        retrievability: 0.88,
        lastReviewedAt: subDays(new Date(), 5),
        nextReviewAt: addDays(new Date(), 20),
        reviewCount: 10,
        lapseCount: 0 // Perfect record
      }
    })
  ]);

  // Physiology cards (WEAK PERFORMANCE - 30% retention)
  const physiologyCards = await Promise.all([
    prisma.card.create({
      data: {
        courseId: physiologyCourse.id,
        lectureId: physiologyLecture.id,
        objectiveId: actionPotentialObjective.id,
        front: 'What are the phases of an action potential?',
        back: 'Resting state, Depolarization (Na+ influx), Repolarization (K+ efflux), Hyperpolarization, Return to resting',
        cardType: 'BASIC',
        difficulty: 8.5, // High difficulty
        stability: 2.1, // Low stability
        retrievability: 0.30, // Low retention
        lastReviewedAt: subDays(new Date(), 3),
        nextReviewAt: addDays(new Date(), 2), // Short interval
        reviewCount: 6,
        lapseCount: 4 // Many lapses
      }
    }),
    prisma.card.create({
      data: {
        courseId: physiologyCourse.id,
        lectureId: physiologyLecture.id,
        objectiveId: synapticTransmissionObjective.id,
        front: 'Explain the role of voltage-gated calcium channels in synaptic transmission',
        back: 'Open during depolarization, Ca2+ influx triggers vesicle fusion and neurotransmitter release',
        cardType: 'BASIC',
        difficulty: 9.2,
        stability: 1.8,
        retrievability: 0.25,
        lastReviewedAt: subDays(new Date(), 2),
        nextReviewAt: addDays(new Date(), 1),
        reviewCount: 5,
        lapseCount: 3
      }
    })
  ]);

  // Create review history (6 weeks of data)
  console.log('📝 Creating review history (6 weeks)...');
  const reviewCount = { anatomy: 0, physiology: 0 };

  for (let daysAgo = 42; daysAgo >= 1; daysAgo -= 2) {
    // Anatomy reviews (GOOD performance)
    for (const card of anatomyCards) {
      const rating = Math.random() > 0.15 ? ReviewRating.GOOD : ReviewRating.EASY; // 85% good or better
      await prisma.review.create({
        data: {
          userId: user.id,
          cardId: card.id,
          rating,
          timeSpentMs: Math.floor(5000 + Math.random() * 3000), // 5-8 seconds
          reviewedAt: subDays(new Date(), daysAgo),
          difficultyBefore: card.difficulty,
          stabilityBefore: card.stability,
          difficultyAfter: card.difficulty - 0.1,
          stabilityAfter: card.stability + 1.2
        }
      });
      reviewCount.anatomy++;
    }

    // Physiology reviews (POOR performance)
    if (daysAgo <= 28) { // Only last 4 weeks (less study time)
      for (const card of physiologyCards) {
        const rating = Math.random() > 0.7 ? ReviewRating.AGAIN : ReviewRating.HARD; // 70% failures
        await prisma.review.create({
          data: {
            userId: user.id,
            cardId: card.id,
            rating,
            timeSpentMs: Math.floor(15000 + Math.random() * 10000), // 15-25 seconds (struggling)
            reviewedAt: subDays(new Date(), daysAgo),
            difficultyBefore: card.difficulty,
            stabilityBefore: card.stability,
            difficultyAfter: card.difficulty + 0.2,
            stabilityAfter: Math.max(1.0, card.stability - 0.5)
          }
        });
        reviewCount.physiology++;
      }
    }
  }
  console.log(`✅ Created ${reviewCount.anatomy} anatomy reviews (85% retention)`);
  console.log(`✅ Created ${reviewCount.physiology} physiology reviews (30% retention)\n`);

  // Step 6: Create performance metrics
  console.log('📊 Creating performance metrics...');
  for (let daysAgo = 30; daysAgo >= 0; daysAgo -= 1) {
    const date = subDays(startOfDay(new Date()), daysAgo);

    // Anatomy metrics (strong)
    await prisma.performanceMetric.create({
      data: {
        userId: user.id,
        learningObjectiveId: anatomyObjective1.id,
        date,
        retentionScore: 0.85 + (Math.random() * 0.10 - 0.05), // 80-90%
        studyTimeMs: Math.floor(600000 + Math.random() * 300000), // 10-15 minutes
        reviewCount: 3,
        correctReviews: 3,
        incorrectReviews: 0
      }
    });

    // Physiology metrics (weak)
    if (daysAgo <= 21) { // Less consistent study
      await prisma.performanceMetric.create({
        data: {
          userId: user.id,
          learningObjectiveId: actionPotentialObjective.id,
          date,
          retentionScore: 0.30 + (Math.random() * 0.10 - 0.05), // 25-35%
          studyTimeMs: Math.floor(900000 + Math.random() * 600000), // 15-25 minutes (more time, less effective)
          reviewCount: 4,
          correctReviews: 1,
          incorrectReviews: 3
        }
      });
    }
  }
  console.log(`✅ Created 30 days of performance metrics\n`);

  // Step 7: Create study sessions and behavioral events
  console.log('🧠 Creating study sessions and behavioral events...');
  for (let daysAgo = 42; daysAgo >= 1; daysAgo -= 3) {
    const sessionStart = addHours(subDays(new Date(), daysAgo), 19); // 7 PM sessions
    const sessionEnd = addHours(sessionStart, 1); // 1-hour sessions

    const session = await prisma.studySession.create({
      data: {
        userId: user.id,
        startedAt: sessionStart,
        completedAt: sessionEnd,
        durationMs: 3600000,
        reviewsCompleted: 8,
        newCardsStudied: 2,
        sessionNotes: daysAgo <= 7 ? 'Struggling with neurophysiology concepts' : null
      }
    });

    // Session performance based on topic
    const isAnatomySession = daysAgo % 2 === 0;
    const performanceScore = isAnatomySession ? 85 : 35;

    await prisma.behavioralEvent.create({
      data: {
        userId: user.id,
        eventType: EventType.SESSION_COMPLETED,
        eventData: {
          sessionId: session.id,
          objectivesCompleted: isAnatomySession ? 2 : 1,
          reviewAccuracy: isAnatomySession ? 0.85 : 0.30
        },
        timestamp: sessionEnd,
        sessionPerformanceScore: performanceScore,
        engagementLevel: isAnatomySession ? EngagementLevel.HIGH : EngagementLevel.MEDIUM,
        completionQuality: isAnatomySession ? CompletionQuality.THOROUGH : CompletionQuality.NORMAL,
        timeOfDay: 19,
        dayOfWeek: sessionStart.getDay(),
        contentType: 'flashcard',
        difficultyLevel: isAnatomySession ? 'medium' : 'hard'
      }
    });
  }
  console.log(`✅ Created 14 study sessions with behavioral events\n`);

  // Step 8: Create behavioral patterns (from Story 5.1)
  console.log('🔍 Creating behavioral patterns...');

  await prisma.behavioralPattern.create({
    data: {
      userId: user.id,
      patternType: BehavioralPatternType.OPTIMAL_STUDY_TIME,
      patternName: 'Evening peak performance',
      confidence: 0.85,
      evidence: {
        timeWindow: '19:00-21:00',
        avgPerformance: 75,
        sessionCount: 14
      },
      occurrenceCount: 14
    }
  });

  await prisma.behavioralPattern.create({
    data: {
      userId: user.id,
      patternType: BehavioralPatternType.FORGETTING_CURVE,
      patternName: 'High forgetting rate in physiology',
      confidence: 0.90,
      evidence: {
        topicArea: 'physiology',
        courseId: physiologyCourse.id,
        avgRetention: 0.30,
        reviewCount: reviewCount.physiology
      },
      occurrenceCount: 10
    }
  });

  await prisma.behavioralPattern.create({
    data: {
      userId: user.id,
      patternType: BehavioralPatternType.SESSION_DURATION_PREFERENCE,
      patternName: 'Optimal 60-minute sessions',
      confidence: 0.78,
      evidence: {
        optimalDuration: 60,
        performanceCorrelation: 0.72
      },
      occurrenceCount: 14
    }
  });

  console.log(`✅ Created 3 behavioral patterns\n`);

  // Step 9: Create user learning profile
  console.log('👤 Creating user learning profile...');
  await prisma.userLearningProfile.create({
    data: {
      userId: user.id,
      preferredStudyTimes: [
        { dayOfWeek: 1, startHour: 19, endHour: 21 }, // Monday 7-9 PM
        { dayOfWeek: 3, startHour: 19, endHour: 21 }, // Wednesday 7-9 PM
        { dayOfWeek: 5, startHour: 19, endHour: 21 }  // Friday 7-9 PM
      ],
      averageSessionDuration: 60,
      optimalSessionDuration: 60,
      contentPreferences: {
        lectures: 0.3,
        flashcards: 0.5,
        validation: 0.1,
        clinicalReasoning: 0.1
      },
      learningStyleProfile: {
        visual: 0.6,
        auditory: 0.1,
        kinesthetic: 0.2,
        reading: 0.1
      },
      personalizedForgettingCurve: {
        R0: 0.9,
        k: 0.25, // Fast forgetting rate (struggle indicator)
        halfLife: 2.8
      },
      dataQualityScore: 0.85 // High data quality (6 weeks of data)
    }
  });
  console.log(`✅ Created user learning profile\n`);

  // Step 10: Create upcoming exam
  console.log('📅 Creating upcoming exam...');
  await prisma.exam.create({
    data: {
      userId: user.id,
      courseId: physiologyCourse.id,
      name: 'Neurophysiology Midterm',
      date: addDays(new Date(), 7), // 7 days from now
      coverageTopics: ['action-potentials', 'synaptic-transmission', 'neurotransmitters']
    }
  });
  console.log(`✅ Created upcoming exam in 7 days\n`);

  // Step 11: Create pending mission with action potential objective
  console.log('🎯 Creating pending mission for prediction test...');
  await prisma.mission.create({
    data: {
      userId: user.id,
      date: addDays(new Date(), 2), // 2 days from now
      status: MissionStatus.PENDING,
      estimatedMinutes: 50,
      objectives: [
        {
          objectiveId: actionPotentialObjective.id,
          estimatedMinutes: 50,
          completed: false
        }
      ],
      reviewCardCount: 4,
      newContentCount: 0
    }
  });
  console.log(`✅ Created pending mission with action potential objective\n`);

  // Summary
  console.log('✅ TEST DATA SEEDING COMPLETE!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 TEST DATA SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✓ User: ${TEST_USER_EMAIL}`);
  console.log(`✓ Study History: 6 weeks (42 days)`);
  console.log(`✓ Courses: 2 (Anatomy - strong, Physiology - weak)`);
  console.log(`✓ Learning Objectives: 5`);
  console.log(`  • Anatomy (MASTERED): 2 objectives, 85% retention`);
  console.log(`  • Physiology (STRUGGLING): 3 objectives, 30% retention`);
  console.log(`✓ Missing Prerequisite: Cell membrane transport (NOT_STARTED)`);
  console.log(`✓ Target Objective: Action potentials (BEGINNER, 75% weakness)`);
  console.log(`✓ Flashcards: 4 (${anatomyCards.length} anatomy, ${physiologyCards.length} physiology)`);
  console.log(`✓ Review History: ${reviewCount.anatomy + reviewCount.physiology} reviews`);
  console.log(`✓ Study Sessions: 14 sessions (evening preference, 60-min optimal)`);
  console.log(`✓ Behavioral Patterns: 3 patterns detected`);
  console.log(`✓ Upcoming Exam: 7 days (Neurophysiology Midterm)`);
  console.log(`✓ Pending Mission: 2 days (Action potentials)`);
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('🎯 EXPECTED PREDICTION RESULTS:');
  console.log('  ➤ Objective: "Action potentials"');
  console.log('  ➤ Probability: >0.7 (HIGH)');
  console.log('  ➤ Confidence: >0.75');
  console.log('  ➤ Top Features:');
  console.log('    • prerequisiteGapCount: 1.0 (missing membrane transport)');
  console.log('    • historicalStruggleScore: 0.8-0.9 (past physiology struggles)');
  console.log('    • retentionScore: 0.3 (low retention in topic area)');
  console.log('    • complexityMismatch: 0.6+ (ADVANCED objective, BEGINNER level)');
  console.log('  ➤ Recommended Interventions:');
  console.log('    • PREREQUISITE_REVIEW (priority: 9)');
  console.log('    • DIFFICULTY_PROGRESSION (priority: 8)');
  console.log('    • SPACED_REPETITION_BOOST (priority: 6)');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('🧪 NEXT STEPS FOR TESTING:');
  console.log('  1. Run feature extraction:');
  console.log(`     POST /api/test/feature-extraction`);
  console.log(`     Body: { userId: "${user.id}", objectiveId: "${actionPotentialObjective.id}" }`);
  console.log('');
  console.log('  2. Generate predictions:');
  console.log(`     POST /api/analytics/predictions/generate`);
  console.log(`     Body: { userId: "${user.id}", daysAhead: 7 }`);
  console.log('');
  console.log('  3. View predictions:');
  console.log(`     GET /api/analytics/predictions?minProbability=0.7`);
  console.log('');
  console.log('  4. Apply intervention:');
  console.log(`     POST /api/analytics/interventions/:id/apply`);
  console.log('');
  console.log('  5. Complete mission and provide feedback:');
  console.log(`     POST /api/analytics/predictions/:id/feedback`);
  console.log('     Body: { actualStruggle: true, feedbackType: "HELPFUL" }');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`💾 Test user ID: ${user.id}`);
  console.log(`💾 Action potential objective ID: ${actionPotentialObjective.id}`);
  console.log(`💾 Membrane transport prerequisite ID: ${membraneTransportObjective.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
