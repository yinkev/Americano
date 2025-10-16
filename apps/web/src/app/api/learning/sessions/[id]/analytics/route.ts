import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse } from '@/lib/api-response';
import { withErrorHandler } from '@/lib/api-error';

/**
 * GET /api/learning/sessions/:id/analytics
 * Phase A analytics endpoint to power session summary (8.1) and charts (8.2).
 *
 * Returns:
 * - objectives: [{ index, objectiveId, objective, complexity, timeSpentMinutes, estimatedMinutes, selfAssessment, confidenceRating, deltaMinutes }]
 * - cards: { reviewed, accuracy }
 * - timeBreakdown: { totalActualMinutes, totalEstimatedMinutes, deltaMinutes, deltaPercent }
 * - insights: string[]
 */
export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

    // Load session with related mission + reviews
    const session = await prisma.studySession.findUnique({
      where: { id },
      include: {
        mission: true,
        reviews: {
          include: {
            card: {
              include: {
                lecture: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error(`Session not found: ${id}`);
    }

    // Objective completions snapshot (Story 2.5) lives as JSON on session
    const objectiveCompletions: Array<{
      objectiveId: string;
      completedAt: string;
      timeSpentMs: number;
      selfAssessment: number;
      confidenceRating: number;
      notes?: string;
    }> = Array.isArray(session.objectiveCompletions)
      ? (session.objectiveCompletions as any[])
      : [];

    // Mission objectives snapshot (estimatedMinutes)
    const missionObjectives: Array<{
      objectiveId: string;
      estimatedMinutes: number;
      objective?: { objective?: string; complexity?: string };
    }> = session.mission?.objectives
      ? ((session.mission.objectives as any[]) ?? [])
      : [];

    // Build objectives dataset for charts/table
    const objectives = objectiveCompletions.map((completion, index) => {
      const missionObj = missionObjectives.find(
        (o) => o.objectiveId === completion.objectiveId
      );
      const timeSpentMinutes = Math.round((completion.timeSpentMs || 0) / 60000);
      const estimatedMinutes = missionObj?.estimatedMinutes ?? 0;

      return {
        index: index + 1,
        objectiveId: completion.objectiveId,
        objective:
          missionObj?.objective?.objective || `Objective ${index + 1}`,
        complexity: missionObj?.objective?.complexity || null,
        timeSpentMinutes,
        estimatedMinutes,
        selfAssessment: completion.selfAssessment ?? null,
        confidenceRating: completion.confidenceRating ?? null,
        deltaMinutes: timeSpentMinutes - estimatedMinutes,
      };
    });

    // Cards analytics (basic): count reviews and derive accuracy if rating available
    // Treat GOOD/EASY as correct; AGAIN/HARD as incorrect if present
    const reviews = session.reviews ?? [];
    const reviewed = reviews.length;
    let correct = 0;
    let incorrect = 0;
    for (const r of reviews) {
      const rating = (r.rating || '').toUpperCase();
      if (rating === 'GOOD' || rating === 'EASY') correct += 1;
      else if (rating === 'AGAIN' || rating === 'HARD') incorrect += 1;
    }
    const accuracy = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0;

    // Time breakdown
    const totalActualMinutes = Math.round(
      objectiveCompletions.reduce((sum, c) => sum + (c.timeSpentMs || 0), 0) / 60000
    );
    const totalEstimatedMinutes = missionObjectives.reduce(
      (sum, o) => sum + (o.estimatedMinutes || 0),
      0
    );
    const deltaMinutes = totalActualMinutes - totalEstimatedMinutes;
    const deltaPercent =
      totalEstimatedMinutes > 0
        ? Math.round((deltaMinutes / totalEstimatedMinutes) * 100)
        : 0;

    // Simple insights (human-friendly)
    const insights: string[] = [];
    const avgSelf =
      objectives.length > 0
        ? (
            objectives.reduce((sum, o) => sum + (o.selfAssessment ?? 0), 0) /
            objectives.length
          ).toFixed(1)
        : '0.0';
    const avgConf =
      objectives.length > 0
        ? (
            objectives.reduce((sum, o) => sum + (o.confidenceRating ?? 0), 0) /
            objectives.length
          ).toFixed(1)
        : '0.0';

    insights.push(`Average self-assessment: ${avgSelf}/5`);
    insights.push(`Average confidence: ${avgConf}/5`);
    if (totalEstimatedMinutes > 0) {
      insights.push(
        deltaPercent === 0
          ? 'Time management matched estimate.'
          : deltaPercent > 0
          ? `Time management slower than estimate by ${deltaPercent}%.`
          : `Time management faster than estimate by ${Math.abs(deltaPercent)}%.`
      );
    }
    if (accuracy > 0 || reviewed > 0) {
      insights.push(`Flashcard accuracy: ${accuracy}% across ${reviewed} reviews.`);
    }

  return Response.json(
    successResponse({
      objectives,
      cards: { reviewed, accuracy },
      timeBreakdown: {
        totalActualMinutes,
        totalEstimatedMinutes,
        deltaMinutes,
        deltaPercent,
      },
      insights,
    })
  );
});