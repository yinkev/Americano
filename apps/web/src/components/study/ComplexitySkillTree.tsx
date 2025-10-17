'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle2, Lock, Circle, Star } from 'lucide-react';
import { MasteryBadge } from './MasteryBadge';
import { cn } from '@/lib/utils';

interface ComplexitySkillTreeProps {
  userId: string;
  conceptId: string;
  onLevelSelect?: (level: ComplexityLevel) => void;
}

type ComplexityLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

interface LevelStatus {
  level: ComplexityLevel;
  isMastered: boolean;
  isUnlocked: boolean;
  isCurrent: boolean;
  masteredAt?: Date;
  progress: number;
  requirementsText: string;
}

/**
 * ComplexitySkillTree
 *
 * Visualizes the BASIC → INTERMEDIATE → ADVANCED progression for a concept
 * (Story 4.5 Task 4). Shows mastery badges, unlock status, current level,
 * and next level requirements.
 *
 * **Features:**
 * - Three-tier skill tree visualization
 * - Mastery badges (gold stars) on completed levels
 * - Unlock animations when new levels become available
 * - Current level highlight with distinctive styling
 * - Lock icons on unavailable levels with tooltip requirements
 * - Progress indicators for in-progress levels
 * - Clickable nodes to review previous levels
 * - Responsive layout with connection lines
 * - Glassmorphism design with OKLCH colors
 * - Accessible with ARIA labels and keyboard navigation
 *
 * **Design System:**
 * - Unlocked: Green (oklch(0.7 0.15 145))
 * - Current: Blue (oklch(0.6 0.18 230))
 * - Locked: Gray (oklch(0.556 0 0))
 * - Mastery: Gold (oklch(0.8 0.15 60))
 * - Min 44px touch targets
 *
 * @see Story 4.5 AC#6 (Progressive Complexity Revelation)
 * @see Story 4.5 AC#4 (Mastery Verification Protocol)
 */
export function ComplexitySkillTree({
  userId,
  conceptId,
  onLevelSelect,
}: ComplexitySkillTreeProps) {
  const [levelStatuses, setLevelStatuses] = useState<LevelStatus[]>([
    {
      level: 'BASIC',
      isMastered: false,
      isUnlocked: true,
      isCurrent: true,
      progress: 67,
      requirementsText: 'Starting level - unlocked by default',
    },
    {
      level: 'INTERMEDIATE',
      isMastered: false,
      isUnlocked: false,
      isCurrent: false,
      progress: 0,
      requirementsText: 'Requires: Master BASIC level (3 consecutive 80%+ scores)',
    },
    {
      level: 'ADVANCED',
      isMastered: false,
      isUnlocked: false,
      isCurrent: false,
      progress: 0,
      requirementsText: 'Requires: Master INTERMEDIATE level',
    },
  ]);

  const [showUnlockAnimation, setShowUnlockAnimation] = useState<ComplexityLevel | null>(null);

  // Load level statuses from API
  useEffect(() => {
    const fetchLevelStatuses = async () => {
      try {
        const response = await fetch(`/api/mastery/complexity/${conceptId}?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setLevelStatuses(data.levels);

          // Check if a new level was just unlocked
          const recentlyUnlocked = data.levels.find(
            (level: LevelStatus) => level.isUnlocked && !level.isMastered && !level.isCurrent
          );
          if (recentlyUnlocked) {
            setShowUnlockAnimation(recentlyUnlocked.level);
            setTimeout(() => setShowUnlockAnimation(null), 3000);
          }
        }
      } catch (error) {
        console.error('Failed to fetch level statuses:', error);
      }
    };

    fetchLevelStatuses();
  }, [userId, conceptId]);

  const handleLevelClick = (level: LevelStatus) => {
    if (level.isUnlocked && onLevelSelect) {
      onLevelSelect(level.level);
    }
  };

  const getLevelColor = (level: LevelStatus) => {
    if (level.isMastered) return 'oklch(0.8 0.15 60)'; // Gold
    if (level.isCurrent) return 'oklch(0.6 0.18 230)'; // Blue
    if (level.isUnlocked) return 'oklch(0.7 0.15 145)'; // Green
    return 'oklch(0.556 0 0)'; // Gray (locked)
  };

  const getLevelIcon = (level: LevelStatus) => {
    if (level.isMastered) {
      return <Star className="h-6 w-6" fill="currentColor" />;
    }
    if (level.isCurrent) {
      return <Circle className="h-6 w-6" fill="currentColor" />;
    }
    if (level.isUnlocked) {
      return <CheckCircle2 className="h-6 w-6" />;
    }
    return <Lock className="h-6 w-6" />;
  };

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
      <CardHeader>
        <CardTitle className="text-xl font-dm-sans">Complexity Progression</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Unlock Animation Banner */}
        {showUnlockAnimation && (
          <div
            className="mb-6 p-4 rounded-lg border animate-in fade-in slide-in-from-top-2"
            style={{
              backgroundColor: 'oklch(0.95 0.05 145)',
              borderColor: 'oklch(0.85 0.08 145)',
            }}
          >
            <div className="flex items-center gap-3">
              <Star
                className="h-6 w-6 animate-spin"
                style={{ color: 'oklch(0.8 0.15 60)' }}
                fill="currentColor"
              />
              <div>
                <p className="font-semibold" style={{ color: 'oklch(0.3 0.15 145)' }}>
                  New Level Unlocked!
                </p>
                <p className="text-sm text-muted-foreground">
                  {showUnlockAnimation} complexity is now available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Skill Tree Visualization */}
        <div className="relative flex flex-col items-center gap-6 py-4">
          {levelStatuses.map((level, index) => (
            <div key={level.level} className="relative w-full max-w-md">
              {/* Connection Line to Next Level */}
              {index < levelStatuses.length - 1 && (
                <div
                  className="absolute left-1/2 top-full w-0.5 h-6 -translate-x-1/2"
                  style={{
                    backgroundColor: level.isUnlocked
                      ? 'oklch(0.7 0.15 145)'
                      : 'oklch(0.9 0.02 240)',
                  }}
                />
              )}

              {/* Level Node */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleLevelClick(level)}
                      disabled={!level.isUnlocked}
                      className={cn(
                        'w-full min-h-[100px] p-4 rounded-lg border-2 transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2',
                        level.isUnlocked
                          ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg'
                          : 'cursor-not-allowed opacity-60'
                      )}
                      style={{
                        backgroundColor: level.isUnlocked
                          ? 'oklch(1 0 0)'
                          : 'oklch(0.97 0 0)',
                        borderColor: getLevelColor(level),
                        boxShadow: level.isCurrent
                          ? `0 4px 12px ${getLevelColor(level)}40`
                          : undefined,
                      }}
                      aria-label={`${level.level} complexity level - ${
                        level.isMastered
                          ? 'Mastered'
                          : level.isCurrent
                          ? 'Current'
                          : level.isUnlocked
                          ? 'Unlocked'
                          : 'Locked'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Level Icon */}
                        <div
                          className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: `${getLevelColor(level)}20`,
                            color: getLevelColor(level),
                          }}
                        >
                          {getLevelIcon(level)}
                        </div>

                        {/* Level Info */}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg font-dm-sans">
                              {level.level}
                            </h3>
                            {level.isCurrent && (
                              <Badge
                                variant="secondary"
                                style={{
                                  backgroundColor: 'oklch(0.95 0.05 230)',
                                  color: 'oklch(0.35 0.16 230)',
                                }}
                              >
                                Current
                              </Badge>
                            )}
                            {level.isMastered && (
                              <MasteryBadge
                                verifiedAt={level.masteredAt!}
                                complexityLevel={level.level}
                              />
                            )}
                          </div>

                          {/* Progress Bar for Current/Unlocked Levels */}
                          {level.isUnlocked && !level.isMastered && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{level.progress}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${level.progress}%`,
                                    backgroundColor: getLevelColor(level),
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Mastery Date */}
                          {level.isMastered && level.masteredAt && (
                            <p className="text-xs text-muted-foreground">
                              Mastered {new Date(level.masteredAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="max-w-xs"
                    style={{
                      backgroundColor: 'oklch(0.2 0 0)',
                      color: 'oklch(0.985 0 0)',
                    }}
                  >
                    <p className="text-sm">{level.requirementsText}</p>
                    {level.isMastered && (
                      <p className="text-xs mt-2 opacity-80">
                        ✓ Click to review mastered material
                      </p>
                    )}
                    {level.isUnlocked && !level.isMastered && !level.isCurrent && (
                      <p className="text-xs mt-2 opacity-80">
                        Click to start this level
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t space-y-2">
          <p className="text-sm font-medium mb-3">Legend</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Star
                className="h-4 w-4"
                fill="currentColor"
                style={{ color: 'oklch(0.8 0.15 60)' }}
              />
              <span className="text-muted-foreground">Mastered</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle
                className="h-4 w-4"
                fill="currentColor"
                style={{ color: 'oklch(0.6 0.18 230)' }}
              />
              <span className="text-muted-foreground">Current Level</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" style={{ color: 'oklch(0.7 0.15 145)' }} />
              <span className="text-muted-foreground">Unlocked</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" style={{ color: 'oklch(0.556 0 0)' }} />
              <span className="text-muted-foreground">Locked</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
