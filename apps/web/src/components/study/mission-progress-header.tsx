'use client';

import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle2, Circle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MissionObjective {
  objectiveId: string;
  objective?: {
    id: string;
    objective: string;
    complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
    isHighYield: boolean;
  };
  estimatedMinutes: number;
  completed: boolean;
}

interface MissionProgressHeaderProps {
  objectives: MissionObjective[];
  currentObjectiveIndex: number;
  estimatedTotalMinutes: number;
}

export function MissionProgressHeader({
  objectives,
  currentObjectiveIndex,
  estimatedTotalMinutes,
}: MissionProgressHeaderProps) {
  const completedCount = objectives.filter((obj) => obj.completed).length;
  const totalCount = objectives.length;
  const percentComplete = Math.round((completedCount / totalCount) * 100);

  // Calculate remaining time (sum of uncompleted objectives)
  const remainingMinutes = objectives
    .filter((obj) => !obj.completed)
    .reduce((sum, obj) => sum + obj.estimatedMinutes, 0);

  return (
    <Card
      className="p-6 backdrop-blur-xl border-0"
      style={{
        background: 'oklch(1 0 0 / 0.95)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
      }}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6" style={{ color: 'oklch(0.55 0.2 250)' }} />
            <h2 className="text-xl font-bold" style={{ color: 'oklch(0.3 0.15 250)' }}>
              Mission Progress
            </h2>
          </div>
          <Badge
            variant="outline"
            style={{
              background: 'oklch(0.55 0.2 250 / 0.15)',
              color: 'oklch(0.55 0.2 250)',
              borderColor: 'oklch(0.55 0.2 250)',
            }}
          >
            {completedCount} / {totalCount} objectives
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'oklch(0.5 0.1 250)' }}>{percentComplete}% complete</span>
            <span style={{ color: 'oklch(0.5 0.1 250)' }}>~{remainingMinutes}m remaining</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${percentComplete}%`,
                background: 'oklch(0.55 0.2 250)',
              }}
            />
          </div>
        </div>

        {/* Objectives List */}
        <div className="space-y-2">
          {objectives.map((obj, index) => {
            const isCurrent = index === currentObjectiveIndex;
            const isCompleted = obj.completed;

            return (
              <div
                key={obj.objectiveId}
                className={`
                  flex items-start gap-3 p-3 rounded-lg transition-all
                  ${isCurrent ? 'ring-2' : ''}
                `}
                style={{
                  background: isCurrent
                    ? 'oklch(0.55 0.2 250 / 0.1)'
                    : isCompleted
                    ? 'oklch(0.98 0.005 250)'
                    : 'oklch(0.99 0.003 250)',
                  ...(isCurrent && { outline: '2px solid oklch(0.55 0.2 250)' }),
                }}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2
                      className="w-5 h-5"
                      style={{ color: 'oklch(0.65 0.2 140)' }}
                    />
                  ) : isCurrent ? (
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: 'oklch(0.55 0.2 250)' }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: 'oklch(0.55 0.2 250)' }}
                      />
                    </div>
                  ) : (
                    <Circle className="w-5 h-5" style={{ color: 'oklch(0.7 0.05 250)' }} />
                  )}
                </div>

                {/* Objective Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-medium ${isCompleted ? 'line-through' : ''}`}
                      style={{
                        color: isCurrent
                          ? 'oklch(0.3 0.15 250)'
                          : isCompleted
                          ? 'oklch(0.6 0.1 250)'
                          : 'oklch(0.4 0.15 250)',
                      }}
                    >
                      {obj.objective?.objective || 'Unknown objective'}
                    </span>
                    {obj.objective?.isHighYield && <span className="text-xs">⭐</span>}
                  </div>
                  {isCurrent && (
                    <p className="text-xs mt-1" style={{ color: 'oklch(0.55 0.2 250)' }}>
                      Current objective
                    </p>
                  )}
                </div>

                {/* Duration Badge */}
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {obj.estimatedMinutes}m
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
