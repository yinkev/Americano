// app/api/content/upload/route.ts
// PDF Upload API endpoint with multipart/form-data handling

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getStorageProvider } from '@/lib/storage';
import { ProcessingOrchestrator } from '@/subsystems/content-processing/processing-orchestrator';

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();

    // Extract form fields
    const file = formData.get('file') as File | null;
    const courseId = formData.get('courseId') as string | null;
    const title = formData.get('title') as string | null;
    const weekNumber = formData.get('weekNumber') as string | null;

    // Validate required fields
    if (!file) {
      return Response.json(
        { success: false, error: { code: 'MISSING_FILE', message: 'No file provided' } },
        { status: 400 }
      );
    }

    if (!courseId) {
      return Response.json(
        { success: false, error: { code: 'MISSING_COURSE_ID', message: 'Course ID is required' } },
        { status: 400 }
      );
    }

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      return Response.json(
        {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Only PDF files are supported',
            details: { receivedType: file.type }
          }
        },
        { status: 400 }
      );
    }

    // Validate file size (<50MB per acceptance criteria)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds 50MB limit',
            details: {
              fileSize: file.size,
              maxSize: MAX_FILE_SIZE,
              fileSizeMB: (file.size / 1024 / 1024).toFixed(2)
            }
          }
        },
        { status: 400 }
      );
    }

    // Get default user (auth deferred for MVP)
    const user = await prisma.user.findFirst({
      where: { email: 'kevy@americano.dev' }
    });

    if (!user) {
      return Response.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'Default user not found. Run database seed.' } },
        { status: 500 }
      );
    }

    // Verify course exists and belongs to user
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return Response.json(
        { success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    if (course.userId !== user.id) {
      return Response.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Course does not belong to user' } },
        { status: 403 }
      );
    }

    // Generate unique file path: lectures/{courseId}/{timestamp}-{filename}
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `lectures/${courseId}/${timestamp}-${sanitizedFilename}`;

    // Upload file to storage (local filesystem or cloud)
    const storage = getStorageProvider();
    const fileUrl = await storage.upload(file, filePath);

    // Create Lecture record with PENDING status
    const lecture = await prisma.lecture.create({
      data: {
        userId: user.id,
        courseId: courseId,
        title: title || file.name.replace('.pdf', ''),
        fileName: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        processingStatus: 'PENDING',
        weekNumber: weekNumber ? parseInt(weekNumber, 10) : null,
      }
    });

    // Trigger background processing
    // MVP: Run asynchronously (fire-and-forget) to avoid blocking upload response
    // Production: Use job queue (BullMQ, etc.)
    const orchestrator = new ProcessingOrchestrator();
    orchestrator.processLecture(lecture.id).catch((error) => {
      console.error(`Background processing failed for lecture ${lecture.id}:`, error);
    });

    // Return success response
    return Response.json({
      success: true,
      data: {
        lectureId: lecture.id,
        processingStatus: lecture.processingStatus,
        title: lecture.title,
        uploadedAt: lecture.uploadedAt,
      }
    });

  } catch (error) {
    console.error('Upload error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload file',
          details: { error: errorMessage }
        }
      },
      { status: 500 }
    );
  }
}
