"use client"

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CourseDialog } from '@/components/library/course-dialog';
import { DeleteConfirmation } from '@/components/library/delete-confirmation';

interface Course {
  id: string;
  name: string;
  code: string | null;
  term: string | null;
  color: string | null;
  lectureCount: number;
  createdAt: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/content/courses');
      const result = await response.json();

      if (result.success) {
        setCourses(result.data.courses);
      } else {
        toast.error('Failed to load courses');
      }
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setDialogOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setDialogOpen(true);
  };

  const handleDeleteClick = (course: Course) => {
    setSelectedCourse(course);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCourse) return;

    try {
      const response = await fetch(`/api/content/courses/${selectedCourse.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Course deleted successfully');
        fetchCourses();
        setDeleteOpen(false);
      } else {
        if (data.error?.code === 'COURSE_HAS_LECTURES') {
          toast.error(data.error.message);
        } else {
          toast.error('Failed to delete course');
        }
      }
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const handleDialogSuccess = () => {
    fetchCourses();
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Courses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your course collection and organize lectures
          </p>
        </div>
        <Button onClick={handleAddCourse} className="rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">No courses yet</p>
            <Button onClick={handleAddCourse} className="rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <Plus className="mr-2 h-4 w-4" />
              Create your first course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="relative overflow-hidden bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl hover:shadow-[0_10px_40px_rgba(31,38,135,0.15)] hover:scale-[1.02] transition-all duration-200"
            >
              {course.color && (
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                  style={{ backgroundColor: course.color }}
                />
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-heading">{course.name}</CardTitle>
                    {course.code && (
                      <CardDescription className="mt-1">
                        {course.code}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg hover:bg-white/50 transition-all duration-200"
                      onClick={() => handleEditCourse(course)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg hover:bg-white/50 transition-all duration-200"
                      onClick={() => handleDeleteClick(course)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-2">
                    {course.term && (
                      <Badge variant="secondary" className="rounded-lg">{course.term}</Badge>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {course.lectureCount} {course.lectureCount === 1 ? 'lecture' : 'lectures'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CourseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        course={selectedCourse}
        onSuccess={handleDialogSuccess}
      />

      <DeleteConfirmation
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Course"
        description={
          selectedCourse
            ? `Are you sure you want to delete "${selectedCourse.name}"? This action cannot be undone.`
            : ''
        }
      />
    </div>
  );
}
