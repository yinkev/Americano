// /api/content/lectures/[id]/pdf
// GET: Serve PDF file for a lecture

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Fetch lecture to get fileUrl
    const lecture = await prisma.lecture.findUnique({
      where: { id },
      select: {
        fileUrl: true,
        fileName: true
      }
    });

    if (!lecture) {
      return Response.json(
        { success: false, error: { code: 'LECTURE_NOT_FOUND', message: 'Lecture not found' } },
        { status: 404 }
      );
    }

    // Convert file:// URL to local file path
    let filePath = lecture.fileUrl.replace(/^file:\/\//, '');

    // Expand ~ to home directory if present
    const basePath = process.env.LOCAL_STORAGE_PATH || '~/americano-data/pdfs';
    const expandedBasePath = basePath.startsWith('~')
      ? basePath.replace('~', process.env.HOME || process.env.USERPROFILE || '')
      : basePath;

    // If filePath is not absolute, resolve it relative to basePath
    if (!filePath.startsWith('/')) {
      filePath = resolve(expandedBasePath, filePath);
    }

    // Read the PDF file
    const fileBuffer = await readFile(filePath);

    // Return PDF with appropriate headers (convert Buffer to Uint8Array for Response)
    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${lecture.fileName}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Failed to serve PDF:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: {
          code: 'PDF_SERVE_FAILED',
          message: 'Failed to serve PDF file',
          details: { error: errorMessage }
        }
      },
      { status: 500 }
    );
  }
}
