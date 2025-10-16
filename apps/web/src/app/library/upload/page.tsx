'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UploadPage() {
  const router = useRouter();
  const [courses, setCourses] = React.useState<Array<{ id: string; name: string }>>([]);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [processingStatus, setProcessingStatus] = React.useState<string>('');
  const [lectureId, setLectureId] = React.useState<string>('');

  // Fetch courses on mount
  React.useEffect(() => {
    async function loadCourses() {
      try {
        const response = await fetch('/api/courses');
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses || []);
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      }
    }
    loadCourses();
  }, []);

  // Poll processing status
  React.useEffect(() => {
    if (!lectureId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/content/processing/${lectureId}`);
        if (response.ok) {
          const data = await response.json();
          setProcessingStatus(data.status);

          if (data.status === 'COMPLETED' || data.status === 'FAILED') {
            clearInterval(pollInterval);
            if (data.status === 'COMPLETED') {
              router.push(`/library/lectures/${lectureId}`);
            } else {
              setError(data.error || 'Processing failed');
            }
          }
        }
      } catch (err) {
        console.error('Failed to check processing status:', err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [lectureId, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported');
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append('file', selectedFile);

    setUploading(true);

    try {
      const response = await fetch('/api/content/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Start processing
      setLectureId(data.lectureId);
      setProcessingStatus('PENDING');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Only PDF files are supported');
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-800">Upload Lecture PDF</CardTitle>
          <CardDescription className="text-gray-600">
            Upload a medical lecture PDF for processing and integration into your study library
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!processingStatus ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Area */}
              <div
                className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 ease-in-out bg-gray-50/50"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium">Drop PDF here or click to browse</p>
                    <p className="text-xs text-gray-500 mt-1">Maximum file size: 50MB</p>
                  </div>
                )}
                <input
                  id="file-input"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Course Selection */}
              <div className="space-y-2">
                <label htmlFor="courseId" className="text-sm font-medium">
                  Course
                </label>
                <select
                  id="courseId"
                  name="courseId"
                  required
                  disabled={uploading}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lecture Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Lecture Title
                </label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Cardiovascular Pathophysiology"
                  disabled={uploading}
                  autoComplete="off"
                />
              </div>

              {/* Week Number */}
              <div className="space-y-2">
                <label htmlFor="weekNumber" className="text-sm font-medium">
                  Week Number (Optional)
                </label>
                <Input
                  id="weekNumber"
                  name="weekNumber"
                  type="number"
                  min="1"
                  placeholder="e.g., 5"
                  disabled={uploading}
                />
              </div>

              {/* Instructor */}
              <div className="space-y-2">
                <label htmlFor="instructor" className="text-sm font-medium">
                  Instructor (Optional)
                </label>
                <Input
                  id="instructor"
                  name="instructor"
                  placeholder="e.g., Dr. Smith"
                  disabled={uploading}
                  autoComplete="off"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
                  <p className="text-sm text-rose-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!selectedFile || uploading}
                className="w-full bg-blue-400 hover:bg-blue-500 shadow-md hover:shadow-lg rounded-lg transition-all duration-200"
              >
                {uploading ? 'Uploading...' : 'Upload and Process'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Processing Lecture</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Status: <span className="font-medium">{processingStatus}</span>
                </p>

                {processingStatus === 'PROCESSING' && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.4)]" style={{ width: '60%' }} />
                    </div>
                    <p className="text-xs text-gray-500">
                      Extracting text, analyzing content, and generating embeddings...
                    </p>
                    <p className="text-xs text-gray-500">This may take 2-5 minutes</p>
                  </div>
                )}

                {processingStatus === 'PENDING' && (
                  <div className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto" />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
