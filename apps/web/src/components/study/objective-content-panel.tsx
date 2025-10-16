'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BookOpen, ChevronLeft, ChevronRight, Target } from 'lucide-react';

interface LearningObjective {
  id: string;
  objective: string;
  complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  pageStart?: number;
  pageEnd?: number;
  isHighYield: boolean;
  boardExamTags: string[];
  lecture: {
    id: string;
    title: string;
    courseId: string;
    course: {
      name: string;
    };
  };
}

interface LectureContentChunk {
  id: string;
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
}

interface ObjectiveContentPanelProps {
  objective: LearningObjective;
  lectureId: string;
  pageStart?: number;
  pageEnd?: number;
  onNavigate?: (page: number) => void;
}

const complexityColors: Record<LearningObjective['complexity'], string> = {
  BASIC: 'oklch(0.65 0.2 140)',
  INTERMEDIATE: 'oklch(0.55 0.2 250)',
  ADVANCED: 'oklch(0.5 0.2 0)',
};

const complexityLabels: Record<LearningObjective['complexity'], string> = {
  BASIC: 'Basic',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

export function ObjectiveContentPanel({
  objective,
  lectureId,
  pageStart,
  pageEnd,
  onNavigate,
}: ObjectiveContentPanelProps) {
  const [currentPage, setCurrentPage] = useState(pageStart ?? 1);
  const [prerequisites, setPrerequisites] = useState<LearningObjective[]>([]);
  const [loadingPrereqs, setLoadingPrereqs] = useState(false);
  const [contentChunks, setContentChunks] = useState<LectureContentChunk[]>([]);
  const [contentError, setContentError] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);

  useEffect(() => {
    const fetchPrerequisites = async () => {
      setLoadingPrereqs(true);
      try {
        // Placeholder for future prerequisite fetching
        setPrerequisites([]);
      } catch (error) {
        console.error('Failed to load prerequisites:', error);
      } finally {
        setLoadingPrereqs(false);
      }
    };

    const fetchLectureContent = async () => {
      setIsLoadingContent(true);
      setContentError(null);

      try {
        const response = await fetch(`/api/content/lectures/${lectureId}`);
        if (!response.ok) {
          throw new Error('Failed to load lecture content');
        }

        const data = await response.json();
        const rawChunks: LectureContentChunk[] = data?.data?.lecture?.contentChunks ?? [];

        const hasPageRange = typeof pageStart === 'number' && typeof pageEnd === 'number';

        let filteredChunks = rawChunks;
        if (hasPageRange) {
          filteredChunks = rawChunks.filter((chunk) => {
            if (chunk.pageNumber === null) return false;
            return chunk.pageNumber >= (pageStart as number) && chunk.pageNumber <= (pageEnd as number);
          });

          if (filteredChunks.length === 0) {
            filteredChunks = rawChunks.filter((chunk) => {
              if (chunk.pageNumber === null) return false;
              return chunk.pageNumber >= (pageStart as number);
            });
          }
        }

        if (filteredChunks.length === 0) {
          filteredChunks = rawChunks;
        }

        setContentChunks(filteredChunks);

        if (filteredChunks.length > 0) {
          if (hasPageRange) {
            const index = filteredChunks.findIndex((chunk) => {
              if (chunk.pageNumber === null) return false;
              return chunk.pageNumber >= (pageStart as number);
            });
            setActiveChunkIndex(index >= 0 ? index : 0);
          } else {
            setActiveChunkIndex(0);
          }
        }
      } catch (error) {
        console.error('Failed to fetch lecture content:', error);
        setContentError('Unable to load lecture content for this objective.');
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchPrerequisites();
    fetchLectureContent();
  }, [lectureId, objective.id, pageEnd, pageStart]);

  useEffect(() => {
    if (contentChunks.length === 0) return;
    const chunk = contentChunks[activeChunkIndex];
    if (chunk?.pageNumber) {
      setCurrentPage(chunk.pageNumber);
      onNavigate?.(chunk.pageNumber);
    }
  }, [activeChunkIndex, contentChunks, onNavigate]);

  const escapeRegExp = useCallback((value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), []);

  const highlightObjectiveText = useCallback(
    (text: string) => {
      const objectiveText = objective.objective.trim();
      if (!objectiveText.length) {
        return text;
      }

      const escapedObjective = escapeRegExp(objectiveText);
      try {
        const regex = new RegExp(escapedObjective, 'gi');
        return text.replace(
          regex,
          (match) =>
            `<mark class="rounded px-1 py-0.5 bg-[oklch(0.85_0.05_90)] text-[oklch(0.28_0.16_250)]">${match}</mark>`,
        );
      } catch {
        return text;
      }
    },
    [escapeRegExp, objective.objective],
  );

  const activeChunk = contentChunks[activeChunkIndex];

  const highlightedContent = useMemo(() => {
    if (!activeChunk) return '';

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const escaped = escapeHtml(activeChunk.content).replace(/\n/g, '<br />');
    return highlightObjectiveText(escaped);
  }, [activeChunk, highlightObjectiveText]);

  const handlePrevious = () => {
    if (contentChunks.length > 0 && activeChunkIndex > 0) {
      setActiveChunkIndex((prev) => prev - 1);
      return;
    }

    if (pageStart && currentPage > pageStart) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onNavigate?.(newPage);
    }
  };

  const handleNext = () => {
    if (contentChunks.length > 0 && activeChunkIndex < contentChunks.length - 1) {
      setActiveChunkIndex((prev) => prev + 1);
      return;
    }

    if (pageEnd && currentPage < pageEnd) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onNavigate?.(newPage);
    }
  };

  const renderNavigationControls = () => {
    if (contentChunks.length === 0 && (!pageStart || !pageEnd || pageStart === pageEnd)) {
      return null;
    }

    const disablePrev = contentChunks.length > 0 ? activeChunkIndex === 0 : !!pageStart && currentPage <= pageStart;
    const disableNext =
      contentChunks.length > 0
        ? activeChunkIndex === contentChunks.length - 1
        : !!pageEnd && currentPage >= pageEnd;

    return (
      <Card
        className="p-4 backdrop-blur-xl border-0"
        style={{
          background: 'oklch(1 0 0 / 0.95)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
        }}
      >
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handlePrevious} disabled={disablePrev} className="min-h-[44px]">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm font-medium" style={{ color: 'oklch(0.4 0.15 250)' }}>
            {contentChunks.length > 0 ? (
              <>
                Section {activeChunkIndex + 1} of {contentChunks.length}
                {activeChunk?.pageNumber && ` • Page ${activeChunk.pageNumber}`}
              </>
            ) : (
              <>Page {currentPage}</>
            )}
          </span>

          <Button variant="outline" size="sm" onClick={handleNext} disabled={disableNext} className="min-h-[44px]">
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card
        className="p-6 backdrop-blur-xl border-0"
        style={{
          background: 'oklch(1 0 0 / 0.95)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
        }}
      >
        <div className="flex items-start gap-4">
          <Target className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: complexityColors[objective.complexity] }} />

          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  style={{
                    background: `${complexityColors[objective.complexity]}15`,
                    color: complexityColors[objective.complexity],
                    borderColor: complexityColors[objective.complexity],
                  }}
                >
                  {complexityLabels[objective.complexity]}
                </Badge>

                {objective.isHighYield && (
                  <Badge
                    variant="outline"
                    style={{
                      background: 'oklch(0.9 0.1 60 / 0.2)',
                      color: 'oklch(0.5 0.15 60)',
                      borderColor: 'oklch(0.7 0.12 60)',
                    }}
                  >
                    ⭐ High-Yield
                  </Badge>
                )}

                {objective.boardExamTags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <h2 className="text-2xl font-bold" style={{ color: 'oklch(0.3 0.15 250)' }}>
                {objective.objective}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-sm" style={{ color: 'oklch(0.5 0.1 250)' }}>
              <BookOpen className="w-4 h-4" />
              <span>
                <span className="font-medium">{objective.lecture.course.name}</span>
                {' • '}
                {objective.lecture.title}
                {pageStart && (
                  <>
                    {' • '}
                    <span>
                      Page{pageStart !== pageEnd && 's'} {pageStart}
                      {pageEnd && pageEnd !== pageStart && `-${pageEnd}`}
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card
        className="p-6 backdrop-blur-xl border-0"
        style={{
          background: 'oklch(0.99 0.003 250)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.08)',
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'oklch(0.4 0.15 250)' }}>
          Focused Reading
        </h3>

        {isLoadingContent ? (
          <div className="space-y-3">
            <div className="animate-pulse h-4 rounded bg-[oklch(0.95_0.003_250)]" />
            <div className="animate-pulse h-4 rounded bg-[oklch(0.95_0.003_250)]" />
            <div className="animate-pulse h-4 rounded bg-[oklch(0.95_0.003_250)] w-3/4" />
          </div>
        ) : contentError ? (
          <p className="text-sm" style={{ color: 'oklch(0.6 0.1 250)' }}>
            {contentError}
          </p>
        ) : contentChunks.length === 0 ? (
          <p className="text-sm" style={{ color: 'oklch(0.6 0.1 250)' }}>
            No related lecture content available for this objective.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 text-xs" style={{ color: 'oklch(0.6 0.1 250)' }}>
              <span>
                Section {activeChunkIndex + 1} of {contentChunks.length}
                {activeChunk?.pageNumber && ` • Page ${activeChunk.pageNumber}`}
              </span>
            </div>

            <div
              className="rounded-xl border border-[oklch(0.92_0.005_250)] bg-[oklch(1_0_0/0.95)] p-4 text-sm leading-relaxed"
              style={{ color: 'oklch(0.4 0.15 250)' }}
              dangerouslySetInnerHTML={{ __html: highlightedContent }}
            />
          </>
        )}
      </Card>

      {renderNavigationControls()}

      {prerequisites.length > 0 && (
        <Card
          className="p-6 backdrop-blur-xl border-0"
          style={{
            background: 'oklch(1 0 0 / 0.95)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
          }}
        >
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'oklch(0.4 0.15 250)' }}>
            Prerequisites
          </h3>
          <div className="space-y-2">
            {prerequisites.map((prereq) => (
              <div
                key={prereq.id}
                className="flex items-start gap-2 p-3 rounded-lg"
                style={{ background: 'oklch(0.98 0.005 250)' }}
              >
                <Badge
                  variant="outline"
                  className="mt-0.5"
                  style={{
                    background: `${complexityColors[prereq.complexity]}15`,
                    color: complexityColors[prereq.complexity],
                    borderColor: complexityColors[prereq.complexity],
                  }}
                >
                  {complexityLabels[prereq.complexity]}
                </Badge>
                <span className="text-sm" style={{ color: 'oklch(0.4 0.15 250)' }}>
                  {prereq.objective}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card
        className="p-6 backdrop-blur-xl border-0"
        style={{
          background: 'oklch(0.98 0.005 250 / 0.8)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
        }}
      >
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'oklch(0.4 0.15 250)' }}>
          Study Tips
        </h3>
        <ul className="space-y-1 text-sm" style={{ color: 'oklch(0.5 0.1 250)' }}>
          <li>• Read through the objective and understand the key concepts</li>
          <li>• Review the lecture content for this section</li>
          <li>• Complete the flashcard reviews for active recall</li>
          <li>• Assess your understanding before moving to the next objective</li>
        </ul>
      </Card>
    </div>
  );
}