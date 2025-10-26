'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brain, Calendar, TrendingUp, MessageSquare, Filter } from 'lucide-react';
import { getEngagementLevel } from '@/lib/reflection-config';

interface ReflectionEntry {
  id: string;
  responseId: string;
  reflectionNotes: string;
  conceptName: string;
  score: number;
  respondedAt: Date;
}

interface ReflectionHistoryViewProps {
  reflections: ReflectionEntry[];
  engagementScore?: number;
  completionRate?: number; // 0-100
  avgResponseLength?: number;
  isLoading?: boolean;
}

/**
 * ReflectionHistoryView
 *
 * Component to display user's reflection history and engagement metrics.
 *
 * **Features**:
 * - List of past reflections with concept context
 * - Engagement score display with level indicator
 * - Completion rate tracking
 * - Filter by date range or concept
 * - Glassmorphism design with OKLCH colors
 *
 * @see Story 4.4 Task 6.7 (Reflection History View)
 * @see Story 4.4 AC#5 (Historical reflection archive)
 */
export function ReflectionHistoryView({
  reflections,
  engagementScore = 0,
  completionRate = 0,
  avgResponseLength = 0,
  isLoading = false,
}: ReflectionHistoryViewProps) {
  const [filterPeriod, setFilterPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const engagement = getEngagementLevel(engagementScore);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter reflections by period
  const filteredReflections = reflections.filter((reflection) => {
    if (filterPeriod === 'all') return true;
    const daysAgo = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
    }[filterPeriod];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    return new Date(reflection.respondedAt) >= cutoffDate;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <Brain className="h-12 w-12 animate-pulse mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading reflections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Engagement Score */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-dm-sans font-bold">Reflection History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review your metacognitive reflections
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterPeriod} onValueChange={(value: any) => setFilterPeriod(value)}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Engagement Score Card */}
        <Card
          className="p-6 border-2"
          style={{
            backgroundColor: 'oklch(0.98 0.02 230)',
            borderColor: 'oklch(0.85 0.08 230)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full"
              style={{
                backgroundColor: engagement.color.replace(')', ' / 0.2)'),
              }}
            >
              <Brain className="h-5 w-5" style={{ color: engagement.color }} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Engagement Score</p>
              <p className="text-2xl font-bold" style={{ color: engagement.color }}>
                {engagementScore}
              </p>
            </div>
          </div>
          <div>
            <Badge
              variant="secondary"
              style={{
                backgroundColor: engagement.color.replace(')', ' / 0.15)'),
                color: engagement.color,
                border: `1px solid ${engagement.color}`,
              }}
            >
              {engagement.level}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">{engagement.description}</p>
          </div>
        </Card>

        {/* Completion Rate Card */}
        <Card
          className="p-6 border-2"
          style={{
            backgroundColor: 'oklch(0.98 0.02 145)',
            borderColor: 'oklch(0.85 0.08 145)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full"
              style={{
                backgroundColor: 'oklch(0.7 0.15 145 / 0.2)',
              }}
            >
              <TrendingUp
                className="h-5 w-5"
                style={{ color: 'oklch(0.7 0.15 145)' }}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
              <p
                className="text-2xl font-bold"
                style={{ color: 'oklch(0.7 0.15 145)' }}
              >
                {Math.round(completionRate)}%
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {filteredReflections.length} reflection{filteredReflections.length !== 1 ? 's' : ''}{' '}
            completed
          </p>
        </Card>

        {/* Avg Response Length Card */}
        <Card
          className="p-6 border-2"
          style={{
            backgroundColor: 'oklch(0.98 0.02 60)',
            borderColor: 'oklch(0.85 0.08 60)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full"
              style={{
                backgroundColor: 'oklch(0.65 0.18 60 / 0.2)',
              }}
            >
              <MessageSquare
                className="h-5 w-5"
                style={{ color: 'oklch(0.65 0.18 60)' }}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
              <p
                className="text-2xl font-bold"
                style={{ color: 'oklch(0.65 0.18 60)' }}
              >
                {Math.round(avgResponseLength)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {avgResponseLength >= 200 ? 'Well-developed' : 'Could be more detailed'}
          </p>
        </Card>
      </div>

      {/* Reflection Timeline */}
      <Card className="p-6 bg-card  shadow-none">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          Your Reflections ({filteredReflections.length})
        </h3>

        {filteredReflections.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
            <p className="text-base font-medium text-muted-foreground">
              No reflections yet
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Complete assessments and take time to reflect on your learning
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {filteredReflections.map((reflection) => {
                const isExpanded = expandedIds.has(reflection.id);
                const truncatedText =
                  reflection.reflectionNotes.length > 150
                    ? reflection.reflectionNotes.substring(0, 150) + '...'
                    : reflection.reflectionNotes;

                return (
                  <div
                    key={reflection.id}
                    className="p-4 rounded-lg border transition-all hover:shadow-none"
                    style={{
                      backgroundColor: 'oklch(0.99 0.01 240)',
                      borderColor: 'oklch(0.90 0.02 240)',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-base">{reflection.conceptName}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(reflection.respondedAt), 'MMM d, yyyy • h:mm a')}
                          </span>
                          <Badge
                            variant="outline"
                            style={{
                              backgroundColor:
                                reflection.score >= 80
                                  ? 'oklch(0.7 0.15 145 / 0.15)'
                                  : reflection.score >= 60
                                    ? 'oklch(0.75 0.12 85 / 0.15)'
                                    : 'oklch(0.65 0.20 25 / 0.15)',
                              color:
                                reflection.score >= 80
                                  ? 'oklch(0.55 0.18 145)'
                                  : reflection.score >= 60
                                    ? 'oklch(0.55 0.18 85)'
                                    : 'oklch(0.55 0.20 25)',
                              border: 'none',
                            }}
                          >
                            Score: {Math.round(reflection.score)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Reflection Text */}
                    <div className="pl-4 border-l-2" style={{ borderColor: 'oklch(0.85 0.08 230)' }}>
                      <p className="text-sm leading-relaxed text-foreground">
                        {isExpanded ? reflection.reflectionNotes : truncatedText}
                      </p>
                      {reflection.reflectionNotes.length > 150 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(reflection.id)}
                          className="mt-2 h-8 px-2 text-xs"
                          style={{ color: 'oklch(0.6 0.18 230)' }}
                        >
                          {isExpanded ? 'Show less' : 'Show more'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
