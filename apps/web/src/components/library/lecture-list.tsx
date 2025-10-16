"use client"

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Clock, CheckCircle2, AlertCircle, XCircle, Trash2, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProcessingProgress } from './processing-progress';
import { toast } from 'sonner';

interface Course {
  id: string;
  name: string;
  code: string | null;
  color: string | null;
}

interface Lecture {
  id: string;
  title: string;
  fileName: string;
  uploadedAt: string;
  processedAt: string | null;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  weekNumber: number | null;
  topicTags: string[];
  course: Course;
  chunkCount: number;
  objectiveCount: number;
  cardCount: number;
  processingProgress?: number;
  totalPages?: number;
  processedPages?: number;
  processingStartedAt?: string;
}

interface LectureListProps {
  lectures: Lecture[];
  selectedLectures: Set<string>;
  onToggleSelection: (lectureId: string) => void;
  onRefresh: () => void;
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    variant: 'secondary' as const,
    color: 'oklch(0.7 0.05 230)',
  },
  PROCESSING: {
    label: 'Processing',
    icon: Clock,
    variant: 'default' as const,
    color: 'oklch(0.7 0.15 230)',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    variant: 'default' as const,
    color: 'oklch(0.7 0.15 150)',
  },
  FAILED: {
    label: 'Failed',
    icon: XCircle,
    variant: 'destructive' as const,
    color: 'oklch(0.6 0.2 20)',
  },
};

export function LectureList({
  lectures,
  selectedLectures,
  onToggleSelection,
  onRefresh,
}: LectureListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lectureToDelete, setLectureToDelete] = useState<Lecture | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reprocessingLectures, setReprocessingLectures] = useState<Set<string>>(new Set());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const handleDeleteClick = (lecture: Lecture) => {
    setLectureToDelete(lecture);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!lectureToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/content/lectures/${lectureToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('File deleted successfully');
        onRefresh();
        setDeleteDialogOpen(false);
        setLectureToDelete(null);
      } else {
        toast.error(result.error?.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = (status: string) => {
    return status === 'PENDING' || status === 'FAILED';
  };

  const needsReprocess = (lecture: Lecture) => {
    // Show reprocess button if:
    // 1. Processing failed, OR
    // 2. Processing completed but no learning objectives were extracted
    return (
      lecture.processingStatus === 'FAILED' ||
      (lecture.processingStatus === 'COMPLETED' && lecture.objectiveCount === 0)
    );
  };

  const handleReprocess = async (lectureId: string) => {
    setReprocessingLectures(prev => new Set(prev).add(lectureId));

    try {
      const response = await fetch(`/api/content/lectures/${lectureId}/reprocess`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Reprocessing started. This may take a few minutes.');
        // Refresh after a short delay to show the PROCESSING status
        setTimeout(() => {
          onRefresh();
        }, 1000);
      } else {
        toast.error(result.error?.message || 'Failed to start reprocessing');
      }
    } catch (error) {
      console.error('Reprocess error:', error);
      toast.error('Failed to start reprocessing');
    } finally {
      setReprocessingLectures(prev => {
        const next = new Set(prev);
        next.delete(lectureId);
        return next;
      });
    }
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Week</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Content</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lectures.map((lecture) => {
            const StatusIcon = statusConfig[lecture.processingStatus].icon;

            return (
              <TableRow key={lecture.id} className="hover:bg-muted/30">
                <TableCell>
                  <Checkbox
                    checked={selectedLectures.has(lecture.id)}
                    onCheckedChange={() => onToggleSelection(lecture.id)}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/library/${lecture.id}`}
                    className="font-medium hover:underline flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {lecture.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {lecture.course.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: lecture.course.color }}
                      />
                    )}
                    <span className="text-sm">
                      {lecture.course.code || lecture.course.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {lecture.weekNumber ? (
                    <Badge variant="outline">Week {lecture.weekNumber}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {lecture.topicTags.length > 0 ? (
                      lecture.topicTags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                    {lecture.topicTags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{lecture.topicTags.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {lecture.processingStatus === 'PROCESSING' ? (
                    <ProcessingProgress
                      lectureId={lecture.id}
                      initialProgress={lecture.processingProgress || 0}
                      totalPages={lecture.totalPages}
                      processedPages={lecture.processedPages || 0}
                      processingStartedAt={lecture.processingStartedAt}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <StatusIcon
                        className="h-4 w-4"
                        style={{ color: statusConfig[lecture.processingStatus].color }}
                      />
                      <span className="text-sm">{statusConfig[lecture.processingStatus].label}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>{lecture.chunkCount} chunks</div>
                    <div>{lecture.objectiveCount} objectives</div>
                    {lecture.cardCount > 0 && <div>{lecture.cardCount} cards</div>}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(lecture.uploadedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {needsReprocess(lecture) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReprocess(lecture.id)}
                        disabled={reprocessingLectures.has(lecture.id)}
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Reprocess this lecture"
                      >
                        <RefreshCw className={`h-4 w-4 ${reprocessingLectures.has(lecture.id) ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                    {canDelete(lecture.processingStatus) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(lecture)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete this file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Uploaded File</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>Are you sure you want to delete &quot;{lectureToDelete?.title}&quot;?</p>
                {lectureToDelete?.processingStatus === 'FAILED' && (
                  <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive text-sm">
                    This file failed to process and can be safely deleted.
                  </div>
                )}
                {lectureToDelete?.processingStatus === 'PENDING' && (
                  <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    This file hasn&apos;t been processed yet. Deleting it will remove the upload.
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
