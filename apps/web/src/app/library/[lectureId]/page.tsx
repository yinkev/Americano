"use client"

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, FileText, Target, BookOpen, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { DeleteConfirmation } from '@/components/library/delete-confirmation';
import { LectureEditDialog } from '@/components/library/lecture-edit-dialog';
import { ObjectiveEditDialog } from '@/components/library/objective-edit-dialog';
import { PDFViewer } from '@/components/library/pdf-viewer';

interface Course {
  id: string;
  name: string;
  code: string | null;
  color: string | null;
}

interface ContentChunk {
  id: string;
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
}

interface LearningObjective {
  id: string;
  objective: string;
  complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  pageStart: number | null;
  pageEnd: number | null;
  isHighYield: boolean;
  boardExamTags: string[];
  extractedBy: string;
}

interface Lecture {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  processedAt: string | null;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  weekNumber: number | null;
  topicTags: string[];
  course: Course;
  contentChunks: ContentChunk[];
  learningObjectives: LearningObjective[];
  chunkCount: number;
  objectiveCount: number;
  cardCount: number;
}

export default function LectureDetailPage({ params }: { params: Promise<{ lectureId: string }> }) {
  const { lectureId } = use(params);
  const router = useRouter();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<LearningObjective | null>(null);
  const [objectiveEditOpen, setObjectiveEditOpen] = useState(false);

  useEffect(() => {
    fetchLecture();
  }, [lectureId]);

  const fetchLecture = async () => {
    try {
      const response = await fetch(`/api/content/lectures/${lectureId}`);
      const result = await response.json();

      if (result.success) {
        setLecture(result.data.lecture);
      } else {
        toast.error('Failed to load lecture');
        router.push('/library');
      }
    } catch (error) {
      toast.error('Failed to load lecture');
      router.push('/library');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/content/lectures/${lectureId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Lecture deleted successfully');
        router.push('/library');
      } else {
        toast.error('Failed to delete lecture');
      }
    } catch (error) {
      toast.error('Failed to delete lecture');
    }
  };

  const handleEditSuccess = () => {
    fetchLecture();
    setEditOpen(false);
  };

  const handleExtractObjectives = async () => {
    setExtracting(true);
    try {
      const response = await fetch('/api/ai/extract/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Extracted ${result.data.extractedCount} learning objectives`);
        fetchLecture();
      } else {
        toast.error(result.error?.message || 'Failed to extract objectives');
      }
    } catch (error) {
      toast.error('Failed to extract objectives');
    } finally {
      setExtracting(false);
    }
  };

  const handleObjectiveEdit = (objective: LearningObjective) => {
    setSelectedObjective(objective);
    setObjectiveEditOpen(true);
  };

  const handleObjectiveSave = async (objectiveId: string, updated: Partial<LearningObjective>) => {
    const response = await fetch(`/api/objectives/${objectiveId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update objective');
    }

    toast.success('Objective updated');
    fetchLecture();
  };

  const handleObjectiveDelete = async (objectiveId: string) => {
    const response = await fetch(`/api/objectives/${objectiveId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete objective');
    }

    toast.success('Objective deleted');
    fetchLecture();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading lecture...</p>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(dateString));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/library" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {lecture.course.color && (
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: lecture.course.color }}
                />
              )}
              <span className="text-sm text-muted-foreground">
                {lecture.course.code || lecture.course.name}
              </span>
              {lecture.weekNumber && (
                <Badge variant="outline">Week {lecture.weekNumber}</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{lecture.title}</h1>
            <p className="text-sm text-muted-foreground">
              {lecture.fileName} • {formatFileSize(lecture.fileSize)} • Uploaded {formatDate(lecture.uploadedAt)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Tags */}
        {lecture.topicTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {lecture.topicTags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="pdf" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pdf" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            PDF Document
          </TabsTrigger>
          <TabsTrigger value="objectives" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Learning Objectives
            <Badge variant="secondary" className="ml-1">{lecture.objectiveCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Content Chunks
            <Badge variant="secondary" className="ml-1">{lecture.chunkCount}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* PDF Viewer Tab */}
        <TabsContent value="pdf" className="mt-0">
          <Card className="h-[calc(100vh-280px)]">
            <PDFViewer lectureId={lecture.id} fileName={lecture.fileName} />
          </Card>
        </TabsContent>

        {/* Learning Objectives Tab */}
        <TabsContent value="objectives">
          <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Learning Objectives</CardTitle>
            <CardDescription>
              Key concepts and learning goals from this lecture
            </CardDescription>
          </div>
          <Button
            onClick={handleExtractObjectives}
            disabled={extracting}
            variant="outline"
            size="sm"
          >
            {extracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {lecture.learningObjectives.length > 0 ? 'Re-extract' : 'Extract Objectives'}
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {lecture.learningObjectives.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">No learning objectives extracted yet</p>
              <p className="text-sm">Click "Extract Objectives" to analyze this lecture</p>
            </div>
          ) : (
            <div className="space-y-4">
              {['BASIC', 'INTERMEDIATE', 'ADVANCED'].map((complexity) => {
                const objectivesOfComplexity = lecture.learningObjectives.filter(
                  (obj) => obj.complexity === complexity
                );
                if (objectivesOfComplexity.length === 0) return null;

                return (
                  <div key={complexity}>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Badge variant={
                        complexity === 'BASIC' ? 'outline' :
                        complexity === 'INTERMEDIATE' ? 'secondary' : 'default'
                      }>
                        {complexity}
                      </Badge>
                      <span className="text-muted-foreground">({objectivesOfComplexity.length})</span>
                    </h3>
                    <ul className="space-y-3">
                      {objectivesOfComplexity.map((objective) => (
                        <li key={objective.id} className="flex items-start gap-3 group">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              {objective.isHighYield && (
                                <Badge variant="default" className="shrink-0">⭐ High Yield</Badge>
                              )}
                              {objective.pageStart && objective.pageEnd && (
                                <Badge variant="outline" className="shrink-0 text-xs">
                                  {objective.pageStart === objective.pageEnd
                                    ? `Page ${objective.pageStart}`
                                    : `Pages ${objective.pageStart}-${objective.pageEnd}`
                                  }
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{objective.objective}</p>
                            {objective.boardExamTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {objective.boardExamTags.map((tag, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleObjectiveEdit(objective)}
                              title="Edit objective"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Content Chunks Tab */}
        <TabsContent value="content">
          {lecture.contentChunks.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>
                  Extracted content organized by section
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lecture.contentChunks.map((chunk) => (
                    <div key={chunk.id} className="pb-4 border-b last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Section {chunk.chunkIndex + 1}
                        </Badge>
                        {chunk.pageNumber && (
                          <span className="text-xs text-muted-foreground">
                            Page {chunk.pageNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{chunk.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No content chunks available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <LectureEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        lecture={lecture}
        onSuccess={handleEditSuccess}
      />

      {/* Objective Edit Dialog */}
      {selectedObjective && (
        <ObjectiveEditDialog
          open={objectiveEditOpen}
          onOpenChange={setObjectiveEditOpen}
          objective={selectedObjective}
          onSave={(updated) => handleObjectiveSave(selectedObjective.id, updated)}
          onDelete={() => handleObjectiveDelete(selectedObjective.id)}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Delete Lecture"
        description={`Are you sure you want to delete "${lecture.title}"? This will permanently delete all content, objectives, and cards associated with this lecture.`}
      />
    </div>
  );
}
