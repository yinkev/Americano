"use client"

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { LectureList } from '@/components/library/lecture-list';
import { LectureFilters } from '@/components/library/lecture-filters';
import { BulkActionToolbar } from '@/components/library/bulk-action-toolbar';
import { UploadDialog } from '@/components/library/upload-dialog';
import { CourseDialog } from '@/components/library/course-dialog';

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
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function LibraryPage() {
  const searchParams = useSearchParams();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedLectures, setSelectedLectures] = useState<Set<string>>(new Set());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchLectures();
  }, [selectedCourse, selectedStatus, selectedTags, sortBy, sortOrder, currentPage]);

  // Open dialogs based on URL action parameter
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'upload') {
      setUploadDialogOpen(true);
    } else if (action === 'create-course') {
      setCourseDialogOpen(true);
    }
  }, [searchParams]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/content/courses');
      const result = await response.json();
      if (result.success) {
        setCourses(result.data.courses);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchLectures = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: '50',
      });

      if (selectedCourse !== 'all') {
        params.append('courseId', selectedCourse);
      }

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','));
      }

      const response = await fetch(`/api/content/lectures?${params}`);
      const result = await response.json();

      if (result.success) {
        setLectures(result.data.lectures);
        setPagination(result.data.pagination);
      } else {
        toast.error('Failed to load lectures');
      }
    } catch (error) {
      toast.error('Failed to load lectures');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchLectures();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/content/search?q=${encodeURIComponent(searchQuery)}&limit=50`);
      const result = await response.json();

      if (result.success) {
        setLectures(result.data.lectures);
        setPagination(null); // Search results don't have pagination
      } else {
        toast.error(result.error?.message || 'Search failed');
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchLectures();
  };

  const toggleLectureSelection = (lectureId: string) => {
    const newSelection = new Set(selectedLectures);
    if (newSelection.has(lectureId)) {
      newSelection.delete(lectureId);
    } else {
      newSelection.add(lectureId);
    }
    setSelectedLectures(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedLectures.size === lectures.length && lectures.length > 0) {
      setSelectedLectures(new Set());
    } else {
      setSelectedLectures(new Set(lectures.map(l => l.id)));
    }
  };

  const handleBulkActionComplete = () => {
    setSelectedLectures(new Set());
    fetchLectures();
  };

  const handleCourseDialogSuccess = () => {
    fetchCourses();
    setCourseDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="text-muted-foreground">
            Browse and manage your lecture collection
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lectures by title, course, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
          {searchQuery && (
            <Button variant="outline" onClick={handleClearSearch}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <LectureFilters
        courses={courses}
        selectedCourse={selectedCourse}
        selectedStatus={selectedStatus}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onCourseChange={setSelectedCourse}
        onStatusChange={setSelectedStatus}
        onSortChange={(field, order) => {
          setSortBy(field);
          setSortOrder(order);
        }}
      />

      {/* Bulk Action Toolbar */}
      {selectedLectures.size > 0 && (
        <BulkActionToolbar
          selectedCount={selectedLectures.size}
          selectedLectureIds={Array.from(selectedLectures)}
          courses={courses}
          onComplete={handleBulkActionComplete}
          onCancel={() => setSelectedLectures(new Set())}
        />
      )}

      {/* Lecture List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading lectures...</p>
        </div>
      ) : lectures.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No lectures found' : 'No lectures yet'}
            </p>
            {!searchQuery && (
              <p className="text-sm text-muted-foreground">
                Upload your first lecture to get started
              </p>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Select All Checkbox */}
          <div className="flex items-center gap-2 mb-4 p-4 bg-muted/30 rounded-md">
            <Checkbox
              checked={selectedLectures.size === lectures.length && lectures.length > 0}
              onCheckedChange={toggleSelectAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Select all ({lectures.length})
            </label>
          </div>

          <LectureList
            lectures={lectures}
            selectedLectures={selectedLectures}
            onToggleSelection={toggleLectureSelection}
            onRefresh={fetchLectures}
          />

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} lectures
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={fetchLectures}
        courses={courses}
      />

      {/* Course Dialog */}
      <CourseDialog
        open={courseDialogOpen}
        onOpenChange={setCourseDialogOpen}
        course={null}
        onSuccess={handleCourseDialogSuccess}
      />
    </div>
  );
}
