// prisma/seed-epic5-integration.ts
// Comprehensive seed data for Stories 5.3, 5.4, 5.6 integration validation
// Generates 12+ weeks of realistic behavioral data for testing

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Epic 5 Integration Seed (Stories 5.3, 5.4, 5.6)...\n');

  // Get or create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'integration-test@americano.dev' },
    update: {},
    create: {
      email: 'integration-test@americano.dev',
      name: 'Integration Test User',
      behavioralAnalysisEnabled: true,
      learningStyleProfilingEnabled: true,
    },
  });
  console.log(`✓ Test user created: ${testUser.name} (${testUser.id})`);

  // Create test course
  const testCourse = await prisma.course.create({
    data: {
      userId: testUser.id,
      name: 'Medical Biochemistry',
      code: 'BIOC-501',
      term: 'Fall 2025',
    },
  });
  console.log(`✓ Test course created: ${testCourse.name}`);

  // Create learning objectives
  const objectives = await Promise.all([
    prisma.learningObjective.create({
      data: {
        lectureId: 'temp-lecture-1',
        objective: 'Understand glycolysis pathway and regulation',
        complexity: 'INTERMEDIATE',
        isHighYield: true,
        boardExamTags: ['USMLE Step 1', 'Biochemistry'],
        masteryLevel: 'INTERMEDIATE',
      },
    }),
    prisma.learningObjective.create({
      data: {
        lectureId: 'temp-lecture-2',
        objective: 'Master citric acid cycle intermediates',
        complexity: 'ADVANCED',
        isHighYield: true,
        boardExamTags: ['USMLE Step 1', 'Biochemistry'],
        masteryLevel: 'BEGINNER',
      },
    }),
  ]);
  console.log(`✓ Created ${objectives.length} learning objectives`);

  // Generate 12 weeks of behavioral data (84 days)
  const startDate = new Date('2025-01-01T00:00:00Z');
  const weeksToGenerate = 12;
  const behavioralEvents = [];
  const cognitiveLoadMetrics = [];
  const missions = [];

  console.log(`\n📊 Generating ${weeksToGenerate} weeks of behavioral data...`);

  for (let week = 0; week < weeksToGenerate; week++) {
    // 5 study sessions per week (Mon, Tue, Thu, Fri, Sat)
    const studyDays = [1, 2, 4, 5, 6]; // Day of week

    for (const dayOffset of studyDays) {
      const sessionDate = new Date(startDate);
      sessionDate.setDate(startDate.getDate() + week * 7 + dayOffset);

      // Vary study time (7 AM, 9 AM, or 2 PM)
      const studyHours = [7, 9, 14][Math.floor(Math.random() * 3)];
      sessionDate.setHours(studyHours, 0, 0, 0);

      // Session duration varies (30-90 minutes)
      const durationMinutes = 30 + Math.floor(Math.random() * 60);
      const durationMs = durationMinutes * 60 * 1000;

      // Performance varies (50-95)
      const performanceScore = 50 + Math.floor(Math.random() * 45);

      // Engagement level based on performance
      const engagementLevel =
        performanceScore > 80 ? 'HIGH' : performanceScore > 60 ? 'MEDIUM' : 'LOW';

      // Cognitive load varies (20-85)
      let cognitiveLoad = 20 + Math.floor(Math.random() * 65);

      // Simulate burnout risk: weeks 8-10 have higher load
      if (week >= 7 && week <= 9) {
        cognitiveLoad = Math.min(90, cognitiveLoad + 20); // Increased load during "exam prep"
      }

      // Create mission
      const mission = await prisma.mission.create({
        data: {
          userId: testUser.id,
          date: sessionDate,
          status: 'COMPLETED',
          estimatedMinutes: durationMinutes,
          completedAt: new Date(sessionDate.getTime() + durationMs),
          actualMinutes: durationMinutes + Math.floor((Math.random() - 0.5) * 10),
          objectives: JSON.stringify([
            {
              objectiveId: objectives[0].id,
              estimatedMinutes: Math.floor(durationMinutes * 0.6),
              completed: true,
            },
            {
              objectiveId: objectives[1].id,
              estimatedMinutes: Math.floor(durationMinutes * 0.4),
              completed: performanceScore > 60,
            },
          ]),
          reviewCardCount: Math.floor(Math.random() * 20) + 10,
          newContentCount: Math.floor(Math.random() * 5) + 2,
          successScore: performanceScore / 100,
          difficultyRating: Math.floor(Math.random() * 5) + 1,
          intensityLevel: cognitiveLoad > 70 ? 'HIGH' : cognitiveLoad > 40 ? 'MEDIUM' : 'LOW',
        },
      });

      missions.push(mission);

      // Create study session
      const studySession = await prisma.studySession.create({
        data: {
          userId: testUser.id,
          missionId: mission.id,
          startedAt: sessionDate,
          completedAt: new Date(sessionDate.getTime() + durationMs),
          durationMs: durationMs,
          reviewsCompleted: mission.reviewCardCount,
          newCardsStudied: mission.newContentCount,
        },
      });

      // Create behavioral event
      const behavioralEvent = await prisma.behavioralEvent.create({
        data: {
          userId: testUser.id,
          eventType: 'SESSION_ENDED',
          eventData: JSON.stringify({
            sessionId: studySession.id,
            missionId: mission.id,
            duration: durationMs,
          }),
          timestamp: new Date(sessionDate.getTime() + durationMs),
          sessionPerformanceScore: performanceScore,
          engagementLevel: engagementLevel,
          completionQuality: performanceScore > 75 ? 'THOROUGH' : 'NORMAL',
          timeOfDay: studyHours,
          dayOfWeek: sessionDate.getDay(),
          contentType: 'flashcard',
          difficultyLevel: cognitiveLoad > 70 ? 'hard' : cognitiveLoad > 40 ? 'medium' : 'easy',
          cognitiveLoadScore: cognitiveLoad,
          stressIndicators: JSON.stringify(
            cognitiveLoad > 70
              ? ['rapid_errors', 'long_latencies']
              : cognitiveLoad > 50
                ? ['moderate_latencies']
                : [],
          ),
          overloadDetected: cognitiveLoad > 80,
        },
      });

      behavioralEvents.push(behavioralEvent);

      // Create cognitive load metric
      const cognitiveLoadMetric = await prisma.cognitiveLoadMetric.create({
        data: {
          userId: testUser.id,
          sessionId: studySession.id,
          timestamp: new Date(sessionDate.getTime() + durationMs / 2),
          loadScore: cognitiveLoad,
          stressIndicators: JSON.stringify(
            cognitiveLoad > 70
              ? [
                  { type: 'error_rate', value: 0.4 },
                  { type: 'response_latency', value: 3500 },
                ]
              : [{ type: 'response_latency', value: 2000 }],
          ),
          confidenceLevel: 0.75 + Math.random() * 0.2,
        },
      });

      cognitiveLoadMetrics.push(cognitiveLoadMetric);
    }
  }

  console.log(`✓ Created ${missions.length} missions`);
  console.log(`✓ Created ${behavioralEvents.length} behavioral events`);
  console.log(`✓ Created ${cognitiveLoadMetrics.length} cognitive load metrics`);

  // Story 5.1: Create behavioral patterns
  const patterns = await Promise.all([
    prisma.behavioralPattern.create({
      data: {
        userId: testUser.id,
        patternType: 'OPTIMAL_STUDY_TIME',
        patternName: 'Morning peak performance (7-9 AM)',
        confidence: 0.87,
        evidence: JSON.stringify({
          sessions: behavioralEvents.filter((e) => e.timeOfDay && e.timeOfDay < 10).length,
          avgPerformance: 82,
          timeRange: '7-9 AM',
        }),
      },
    }),
    prisma.behavioralPattern.create({
      data: {
        userId: testUser.id,
        patternType: 'SESSION_DURATION_PREFERENCE',
        patternName: 'Optimal session length: 50 minutes',
        confidence: 0.79,
        evidence: JSON.stringify({
          sessions: 42,
          avgDuration: 50,
          performanceDropAfter: 60,
        }),
      },
    }),
    prisma.behavioralPattern.create({
      data: {
        userId: testUser.id,
        patternType: 'FORGETTING_CURVE',
        patternName: 'Personal forgetting curve: R0=0.9, k=0.15',
        confidence: 0.82,
        evidence: JSON.stringify({
          R0: 0.9,
          k: 0.15,
          halfLife: 4.6,
        }),
      },
    }),
  ]);
  console.log(`✓ Created ${patterns.length} behavioral patterns`);

  // Story 5.1: Create behavioral insights
  const insights = await Promise.all([
    prisma.behavioralInsight.create({
      data: {
        userId: testUser.id,
        insightType: 'STUDY_TIME_OPTIMIZATION',
        title: 'Study during your peak hours (7-9 AM)',
        description:
          'Your performance is 23% higher when studying between 7-9 AM compared to afternoon sessions.',
        actionableRecommendation:
          'Schedule your most challenging topics (biochemistry pathways) during morning hours.',
        confidence: 0.87,
      },
    }),
    prisma.behavioralInsight.create({
      data: {
        userId: testUser.id,
        insightType: 'SESSION_LENGTH_ADJUSTMENT',
        title: 'Reduce session length to 50 minutes',
        description:
          'Your performance drops by 18% after 60 minutes. Optimal session length is 50 minutes.',
        actionableRecommendation:
          'Set a timer for 50 minutes and take a 10-minute break before continuing.',
        confidence: 0.79,
      },
    }),
  ]);
  console.log(`✓ Created ${insights.length} behavioral insights`);

  // Story 5.1: Create user learning profile
  const learningProfile = await prisma.userLearningProfile.create({
    data: {
      userId: testUser.id,
      preferredStudyTimes: JSON.stringify([
        { dayOfWeek: 1, startHour: 7, endHour: 9 },
        { dayOfWeek: 2, startHour: 7, endHour: 9 },
        { dayOfWeek: 4, startHour: 7, endHour: 9 },
      ]),
      averageSessionDuration: 52,
      optimalSessionDuration: 50,
      contentPreferences: JSON.stringify({
        lectures: 0.2,
        flashcards: 0.5,
        validation: 0.2,
        clinicalReasoning: 0.1,
      }),
      learningStyleProfile: JSON.stringify({
        visual: 0.4,
        auditory: 0.2,
        kinesthetic: 0.1,
        reading: 0.3,
      }),
      personalizedForgettingCurve: JSON.stringify({
        R0: 0.9,
        k: 0.15,
        halfLife: 4.6,
      }),
      dataQualityScore: 0.85,
      loadTolerance: 65,
      avgCognitiveLoad: 52,
      stressProfile: JSON.stringify({
        primaryStressors: ['difficulty_induced', 'time_pressure'],
        avgRecoveryTime: 2.5,
        copingStrategies: ['break_scheduling', 'difficulty_reduction'],
      }),
    },
  });
  console.log(`✓ Created user learning profile`);

  // Story 5.4: Create stress response patterns
  const stressPatterns = await Promise.all([
    prisma.stressResponsePattern.create({
      data: {
        userId: testUser.id,
        patternType: 'DIFFICULTY_INDUCED',
        triggerConditions: JSON.stringify({
          topicComplexity: 'ADVANCED',
          errorRate: '>40%',
        }),
        responseProfile: JSON.stringify({
          recoveryTime: 2.5,
          impactSeverity: 'MEDIUM',
        }),
        frequency: 12,
        confidence: 0.78,
      },
    }),
    prisma.stressResponsePattern.create({
      data: {
        userId: testUser.id,
        patternType: 'FATIGUE_BASED',
        triggerConditions: JSON.stringify({
          sessionDuration: '>60min',
          consecutiveDays: '>5',
        }),
        responseProfile: JSON.stringify({
          recoveryTime: 3.0,
          impactSeverity: 'HIGH',
        }),
        frequency: 8,
        confidence: 0.82,
      },
    }),
  ]);
  console.log(`✓ Created ${stressPatterns.length} stress response patterns`);

  // Story 5.4: Create burnout risk assessment
  const burnoutAssessment = await prisma.burnoutRiskAssessment.create({
    data: {
      userId: testUser.id,
      riskScore: 35,
      riskLevel: 'MEDIUM',
      contributingFactors: JSON.stringify([
        { factor: 'chronicLoad', score: 45, weight: 0.25 },
        { factor: 'performanceDecline', score: 15, weight: 0.25 },
        { factor: 'irregularity', score: 20, weight: 0.15 },
      ]),
      recommendations: JSON.stringify([
        'Schedule 1 rest day this week',
        'Reduce session duration to 45 minutes',
        'Focus on review content (lower cognitive load)',
      ]),
    },
  });
  console.log(`✓ Created burnout risk assessment (MEDIUM risk)`);

  // Story 5.2: Create struggle predictions and indicators
  const strugglePrediction = await prisma.strugglePrediction.create({
    data: {
      userId: testUser.id,
      learningObjectiveId: objectives[1].id,
      predictedStruggleProbability: 0.72,
      predictionConfidence: 0.81,
      predictionStatus: 'CONFIRMED',
      actualOutcome: true,
      outcomeRecordedAt: new Date(),
      featureVector: JSON.stringify({
        prerequisiteGap: 0.6,
        complexityMismatch: 0.8,
        historicalStruggle: 0.7,
      }),
    },
  });

  await prisma.struggleIndicator.create({
    data: {
      userId: testUser.id,
      predictionId: strugglePrediction.id,
      learningObjectiveId: objectives[1].id,
      indicatorType: 'PREREQUISITE_GAP',
      severity: 'HIGH',
      context: JSON.stringify({
        missingPrerequisites: ['glycolysis_fundamentals'],
        gapScore: 0.6,
      }),
    },
  });

  console.log(`✓ Created struggle prediction with indicators`);

  // Story 5.2: Create intervention recommendation
  const intervention = await prisma.interventionRecommendation.create({
    data: {
      predictionId: strugglePrediction.id,
      userId: testUser.id,
      interventionType: 'PREREQUISITE_REVIEW',
      description: 'Review glycolysis fundamentals before tackling citric acid cycle',
      reasoning: 'Detected prerequisite knowledge gap (60% confidence)',
      priority: 8,
      status: 'APPLIED',
      appliedAt: new Date(),
      effectiveness: 0.75,
    },
  });
  console.log(`✓ Created intervention recommendation`);

  // Story 5.6: Create behavioral goals
  const goals = await Promise.all([
    prisma.behavioralGoal.create({
      data: {
        userId: testUser.id,
        goalType: 'STUDY_TIME_CONSISTENCY',
        title: 'Study at peak hours 5 days/week',
        description: 'Maintain consistent study schedule during optimal morning hours',
        targetMetric: 'consistencyScore',
        currentValue: 3.2,
        targetValue: 5.0,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'ACTIVE',
        progressHistory: JSON.stringify([
          { date: '2025-01-01', value: 2.5, note: 'Baseline' },
          { date: '2025-01-08', value: 3.0, note: 'Week 1 progress' },
          { date: '2025-01-15', value: 3.2, note: 'Current' },
        ]),
      },
    }),
    prisma.behavioralGoal.create({
      data: {
        userId: testUser.id,
        goalType: 'SESSION_DURATION',
        title: 'Maintain 50-minute session length',
        description: 'Optimize session duration for maximum performance',
        targetMetric: 'sessionDuration',
        currentValue: 52,
        targetValue: 50,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        status: 'ACTIVE',
        progressHistory: JSON.stringify([
          { date: '2025-01-01', value: 65, note: 'Baseline' },
          { date: '2025-01-08', value: 58, note: 'Improving' },
          { date: '2025-01-15', value: 52, note: 'Almost there' },
        ]),
      },
    }),
  ]);
  console.log(`✓ Created ${goals.length} behavioral goals`);

  // Story 5.6: Create recommendations
  const recommendations = await Promise.all([
    prisma.recommendation.create({
      data: {
        userId: testUser.id,
        recommendationType: 'STUDY_TIME_OPTIMIZATION',
        title: 'Study during your peak hours (7-9 AM)',
        description:
          'Your performance is 23% higher during morning hours. Schedule challenging topics accordingly.',
        actionableText:
          'Set up recurring calendar blocks for 7-9 AM Mon/Tue/Thu/Fri for biochemistry study.',
        confidence: 0.87,
        estimatedImpact: 0.23,
        easeOfImplementation: 0.8,
        userReadiness: 0.75,
        priorityScore: 0.78,
        sourcePatternIds: [patterns[0].id],
        sourceInsightIds: [insights[0].id],
      },
    }),
    prisma.recommendation.create({
      data: {
        userId: testUser.id,
        recommendationType: 'SESSION_DURATION_ADJUSTMENT',
        title: 'Reduce session length to 50 minutes',
        description:
          'Performance drops 18% after 60 minutes. Optimal session length is 50 minutes with breaks.',
        actionableText: 'Use Pomodoro technique: 50 min study + 10 min break.',
        confidence: 0.79,
        estimatedImpact: 0.18,
        easeOfImplementation: 0.9,
        userReadiness: 0.8,
        priorityScore: 0.72,
        sourcePatternIds: [patterns[1].id],
        sourceInsightIds: [insights[1].id],
      },
    }),
    prisma.recommendation.create({
      data: {
        userId: testUser.id,
        recommendationType: 'RETENTION_STRATEGY',
        title: 'Review every 4.6 days for optimal retention',
        description:
          'Your forgetting curve half-life is 4.6 days. Review intervals should align with this.',
        actionableText: 'Trust Americano\'s FSRS algorithm—it\'s calibrated to your curve.',
        confidence: 0.82,
        estimatedImpact: 0.15,
        easeOfImplementation: 1.0,
        userReadiness: 0.9,
        priorityScore: 0.68,
        sourcePatternIds: [patterns[2].id],
        sourceInsightIds: [],
      },
    }),
  ]);
  console.log(`✓ Created ${recommendations.length} recommendations`);

  // Story 5.6: Create applied recommendation tracking
  const appliedRec = await prisma.appliedRecommendation.create({
    data: {
      recommendationId: recommendations[0].id,
      userId: testUser.id,
      applicationType: 'MANUAL',
      baselineMetrics: JSON.stringify({
        avgPerformance: 72,
        peakHourAdherence: 0.4,
      }),
      currentMetrics: JSON.stringify({
        avgPerformance: 82,
        peakHourAdherence: 0.75,
      }),
      effectiveness: 0.23,
      userFeedbackRating: 5,
      userNotes: 'Morning study blocks are working great!',
      evaluatedAt: new Date(),
    },
  });
  console.log(`✓ Created applied recommendation tracking`);

  // Story 5.6: Create insight notifications
  const notifications = await Promise.all([
    prisma.insightNotification.create({
      data: {
        userId: testUser.id,
        notificationType: 'NEW_PATTERN',
        title: 'New pattern detected: Morning peak performance',
        message:
          'We detected you perform 23% better during 7-9 AM sessions. Consider scheduling challenging topics during these hours.',
        priority: 'HIGH',
        relatedEntityId: patterns[0].id,
        relatedEntityType: 'pattern',
      },
    }),
    prisma.insightNotification.create({
      data: {
        userId: testUser.id,
        notificationType: 'GOAL_PROGRESS_25',
        title: 'Goal 25% complete: Study time consistency',
        message: 'Great progress! You\'re consistently studying 3.2 days per week at peak hours.',
        priority: 'NORMAL',
        relatedEntityId: goals[0].id,
        relatedEntityType: 'goal',
      },
    }),
  ]);
  console.log(`✓ Created ${notifications.length} insight notifications`);

  // Story 5.3: Create study schedule recommendations
  const scheduleRecs = await Promise.all([
    prisma.studyScheduleRecommendation.create({
      data: {
        userId: testUser.id,
        recommendedStartTime: new Date('2025-01-20T07:00:00Z'),
        recommendedDuration: 50,
        confidence: 0.87,
        reasoningFactors: JSON.stringify({
          optimalTimeScore: 0.9,
          calendarAvailable: true,
          cognitiveLoadForecast: 45,
        }),
        calendarIntegration: false,
      },
    }),
  ]);
  console.log(`✓ Created ${scheduleRecs.length} study schedule recommendations`);

  // Summary
  console.log('\n✅ Epic 5 Integration Seed Complete!\n');
  console.log('📊 Data Summary:');
  console.log(`   - User: ${testUser.email}`);
  console.log(`   - Behavioral Events: ${behavioralEvents.length} (${weeksToGenerate} weeks)`);
  console.log(`   - Cognitive Load Metrics: ${cognitiveLoadMetrics.length}`);
  console.log(`   - Behavioral Patterns: ${patterns.length}`);
  console.log(`   - Behavioral Insights: ${insights.length}`);
  console.log(`   - Stress Response Patterns: ${stressPatterns.length}`);
  console.log(`   - Burnout Assessment: 1 (MEDIUM risk)`);
  console.log(`   - Struggle Predictions: 1 (CONFIRMED)`);
  console.log(`   - Intervention Recommendations: 1 (APPLIED)`);
  console.log(`   - Behavioral Goals: ${goals.length}`);
  console.log(`   - Recommendations: ${recommendations.length}`);
  console.log(`   - Applied Recommendations: 1`);
  console.log(`   - Insight Notifications: ${notifications.length}`);
  console.log(`   - Schedule Recommendations: ${scheduleRecs.length}`);
  console.log('\n🚀 Ready for integration testing!\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
