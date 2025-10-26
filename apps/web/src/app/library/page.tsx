'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, ArrowUpDown, PlusCircle, BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { LectureList } from '@/components/library/lecture-list'
import { LectureFilters } from '@/components/library/lecture-filters'
import { BulkActionToolbar } from '@/components/library/bulk-action-toolbar'
import { UploadDialog } from '@/components/library/upload-dialog'
import { CourseDialog } from '@/components/library/course-dialog'

interface Course {
  id: string
  name: string
  code: string | null
  color: string | null
}

interface Lecture {
  id: string
  title: string
  fileName: string
  uploadedAt: string
  processedAt: string | null
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  weekNumber: number | null
  topicTags: string[]
  course: Course
  chunkCount: number
  objectiveCount: number
  cardCount: number
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function NewLibraryPage() {
  const searchParams = useSearchParams()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [selectedLectures, setSelectedLectures] = useState<Set<string>>(new Set())
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [courseDialogOpen, setCourseDialogOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('uploadedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchLectures()
    fetchCourses()
  }, [currentPage, selectedCourse, selectedStatus, sortBy, sortOrder])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/content/courses')
      const result = await response.json()
      if (result.success) {
        setCourses(result.data.courses)
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    }
  }

  const fetchLectures = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: '10',
        courseId: selectedCourse,
        status: selectedStatus,
      })

      const response = await fetch(`/api/content/lectures?${params}`)
      const result = await response.json()

      if (result.success) {
        setLectures(result.data.lectures)
        setPagination(result.data.pagination)
      } else {
        toast.error('Failed to load lectures')
      }
    } catch (error) {
      toast.error('Failed to load lectures')
    } finally {
      setLoading(false)
    }
  }

  const toggleLectureSelection = (lectureId: string) => {
    const newSelection = new Set(selectedLectures)
    if (newSelection.has(lectureId)) {
      newSelection.delete(lectureId)
    } else {
      newSelection.add(lectureId)
    }
    setSelectedLectures(newSelection)
  }

  const handleBulkActionComplete = () => {
    setSelectedLectures(new Set())
    fetchLectures()
  }

  const handleCourseDialogSuccess = () => {
    fetchCourses()
    setCourseDialogOpen(false)
  }

  return (
    <div className="container mx-auto p-6">
      {/* I would add a motion.div here for a playful entrance animation */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <BookOpen className="w-10 h-10 text-primary" />
            <div>
                <h1 className="text-4xl font-heading font-bold">Your Library</h1>
                <p className="text-lg text-muted-foreground">All your lectures and notes in one place.</p>
            </div>
        </div>
        <div className="flex gap-4">
          <Button size="lg" className="rounded-full font-bold text-lg shadow-none gap-2" onClick={() => setUploadDialogOpen(true)}><PlusCircle /> Upload</Button>
          <Button size="lg" variant="outline" className="rounded-full font-bold text-lg shadow-none gap-2" onClick={() => setCourseDialogOpen(true)}><FolderPlus /> New Course</Button>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-card  border-border/50 shadow-none">
        <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                placeholder="Search by title, topic, or content..."
                className="pl-12 h-14 text-lg rounded-full bg-card border-none focus:ring-2 focus:ring-primary"
                />
            </div>
            <LectureFilters
              courses={courses}
              selectedCourse={selectedCourse}
              selectedStatus={selectedStatus}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onCourseChange={setSelectedCourse}
              onStatusChange={setSelectedStatus}
              onSortChange={(field, order) => {
                setSortBy(field)
                setSortOrder(order)
              }}
            />
        </div>

        {selectedLectures.size > 0 && (
            <BulkActionToolbar
                selectedCount={selectedLectures.size}
                selectedLectureIds={Array.from(selectedLectures)}
                courses={courses}
                onComplete={handleBulkActionComplete}
                onCancel={() => setSelectedLectures(new Set())}
            />
        )}

        <LectureList lectures={lectures} selectedLectures={selectedLectures} onToggleSelection={toggleLectureSelection} onRefresh={fetchLectures} />

      </div>

        <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onUploadComplete={fetchLectures} courses={courses} />
        <CourseDialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen} course={null} onSuccess={handleCourseDialogSuccess} />

    </div>
  )
}
