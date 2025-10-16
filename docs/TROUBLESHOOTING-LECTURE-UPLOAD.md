# Lecture Upload Troubleshooting Guide

## Overview

This guide covers common issues encountered when uploading and processing PDF lectures in the Americano platform, along with their solutions.

## System Architecture

The lecture upload process involves several components:

1. **Next.js Web App** (`localhost:3000`) - Handles file uploads via `/api/content/upload`
2. **PostgreSQL Database** - Stores lecture metadata and processing status
3. **Local File Storage** - Stores PDF files at `~/americano-data/pdfs/lectures/`
4. **OCR Service** (`localhost:8000`) - Extracts text from PDFs using PaddleOCR
5. **Processing Pipeline** - Chunks text and creates learning objectives

## Prerequisites Checklist

Before uploading lectures, verify all services are running:

```bash
# 1. Check PostgreSQL is running
psql -U kyin -d americano -c "SELECT 1"

# 2. Check Next.js dev server (should show "Ready")
curl http://localhost:3000

# 3. Check OCR service (should return {"status":"healthy"})
curl http://localhost:8000/health

# 4. Check storage directory exists
ls -la ~/americano-data/pdfs/lectures/
```

## Common Issues and Solutions

### Issue 1: "Course ID is required"

**Symptom:** Upload dialog shows "Course ID is required" error

**Cause:** No course selected or no courses available

**Solution:**
1. Click "Create Course" from dashboard or navigate to `/library?action=create-course`
2. Create at least one course (e.g., "Gross Anatomy", code "ANAT 505")
3. Select the course in the upload dialog before uploading

**Files Fixed:**
- `apps/web/src/components/library/upload-dialog.tsx` - Added course selector
- `apps/web/src/app/library/page.tsx` - Integrated course dialog

---

### Issue 2: "Failed to load lecture" after upload

**Symptom:** Upload succeeds with "Lecture uploaded successfully!" but then shows "Failed to load lecture"

**Root Causes:**

#### 2a. OCR Service Not Running

**Error in logs:**
```
OCR service call failed, retrying once... TypeError: fetch failed
ECONNREFUSED
```

**Solution:**
```bash
# Start the OCR service
cd /Users/Kyin/Projects/Americano/services/ocr-service
python3 main.py

# Verify it's running
curl http://localhost:8000/health
# Should return: {"status":"healthy","ocr_engine":"PaddleOCR","ready":true}
```

**Prevention:** Add OCR service to startup script or use process manager

---

#### 2b. File Path Format Issue (FIXED)

**Error in logs:**
```
OCR service error: Not Found
```

**Cause:** Local storage provider returns `file://` URLs, but OCR service expects filesystem paths

**Solution Applied:**
- Modified `apps/web/src/subsystems/content-processing/pdf-processor.ts:46`
- Added code to strip `file://` protocol before sending to OCR service:
  ```typescript
  const filePath = lecture.fileUrl.replace(/^file:\/\//, '');
  const extractedText = await this.callOCRService(filePath);
  ```

**Status:** ✅ FIXED (as of 2025-10-15)

---

#### 2c. OCR Processing Fails Silently (FIXED)

**Error in logs:**
```
OCR service returns 200 OK but processing never completes
Processing stays at 0% indefinitely
No chunks or objectives created
```

**Cause:** PaddleOCR expected numpy arrays but received PIL Image objects, causing assertion failures

**Solution Applied:**
- Modified `services/ocr-service/ocr_processor.py:6,97-98`
- Added numpy import and image conversion:
  ```python
  import numpy as np

  # Convert PIL Image to numpy array for PaddleOCR
  image_array = np.array(image)
  result = ocr.ocr(image_array, cls=True)
  ```

**Status:** ✅ FIXED (as of 2025-10-15 Evening)

**Additional Improvements:**
- Added 3-minute timeout protection to prevent infinite waits
- Enhanced error logging with full stack traces
- Improved error messages with HTTP status codes

---

#### 2d. Old Failed Lectures in Database

**Symptom:** Error messages appear for old lecture IDs that failed before fixes were applied

**Solution:**
```sql
-- View failed lectures
SELECT id, title, processingStatus, processedAt
FROM lectures
WHERE processingStatus = 'FAILED';

-- Optional: Delete old failed lectures
DELETE FROM lectures
WHERE processingStatus = 'FAILED'
AND uploadedAt < NOW() - INTERVAL '1 day';
```

---

### Issue 3: Validation Error - "Invalid request data" (Course Creation)

**Error in logs:**
```
API Error: Error [ApiError]: Invalid request data
VALIDATION_ERROR
```

**Cause:** Course color validation regex didn't accept underscore `_` in OKLCH format

**Example:** `oklch(0.7_0.15_230)` was rejected because regex only allowed `[\d\s.]`

**Solution Applied:**
- Modified `apps/web/src/lib/validation.ts:92,99`
- Changed regex from `/^oklch\([\d\s.]+\)$/` to `/^oklch\([\d\s._]+\)$/`

**Status:** ✅ FIXED (as of 2025-10-15)

---

## Complete Setup Process

### First-Time Setup

1. **Start all services:**
   ```bash
   # Terminal 1: Start PostgreSQL (if not already running)
   brew services start postgresql@18

   # Terminal 2: Start Next.js
   cd /Users/Kyin/Projects/Americano/apps/web
   pnpm dev

   # Terminal 3: Start OCR Service
   cd /Users/Kyin/Projects/Americano/services/ocr-service
   python3 main.py
   ```

2. **Verify database is seeded:**
   ```bash
   cd /Users/Kyin/Projects/Americano/apps/web
   npx prisma db seed
   ```

3. **Create your first course:**
   - Navigate to http://localhost:3000
   - Click "Create Course" from dashboard
   - Fill in: Name, Code (optional), Term (optional), Color
   - Click "Create"

4. **Upload your first lecture:**
   - Click "Upload Lecture" from dashboard
   - Select the course you created
   - Choose a PDF file (<50MB)
   - Click "Upload"
   - Wait 30-60 seconds for processing

### Verifying Upload Success

1. **Check lecture appears in library:**
   - Navigate to `/library`
   - Lecture should appear with status badge
   - Status progression: PENDING → PROCESSING → COMPLETED

2. **Check server logs:**
   ```bash
   # Should see successful processing:
   [Orchestrator] Step 1 complete: X chunks created
   [Orchestrator] Step 2 complete: Y objectives extracted
   [Orchestrator] Step 3 complete: Z flashcards created
   ```

3. **Check database:**
   ```sql
   SELECT
     title,
     processingStatus,
     processedAt,
     (SELECT COUNT(*) FROM content_chunks WHERE lectureId = lectures.id) as chunk_count
   FROM lectures
   ORDER BY uploadedAt DESC
   LIMIT 5;
   ```

---

## Debugging Steps

### Step 1: Check Service Health

```bash
# Web server
curl http://localhost:3000 | head -n 5

# OCR service
curl http://localhost:8000/health

# Database
psql -U kyin -d americano -c "\dt"
```

### Step 2: Review Server Logs

Check Next.js terminal for:
- Upload success: `POST /api/content/upload 200`
- Processing start: `[Orchestrator] Processing lecture`
- Processing errors: `[Orchestrator] Processing failed for lecture`

Check OCR service terminal for:
- Health checks: `GET /health 200 OK`
- Text extraction: `POST /extract 200 OK` (success) or `404` (file not found)

### Step 3: Check File System

```bash
# Verify uploaded files exist
ls -lh ~/americano-data/pdfs/lectures/*/

# Check file permissions
stat ~/americano-data/pdfs/lectures/*/1*.pdf

# Verify file paths in database match filesystem
psql -U kyin -d americano -c "SELECT id, title, fileUrl FROM lectures ORDER BY uploadedAt DESC LIMIT 5;"
```

### Step 4: Test OCR Service Directly

```bash
# Test with an actual file path
curl -X POST http://localhost:8000/extract \
  -H "Content-Type: application/json" \
  -d '{"file_path": "/Users/kyin/americano-data/pdfs/lectures/COURSE_ID/TIMESTAMP-filename.pdf"}'

# Should return JSON with text, confidence, and pages
```

---

## Known Limitations (MVP)

1. **No Authentication:** Uses hardcoded user `kevy@americano.dev`
2. **No Cloud Storage:** Files stored locally at `~/americano-data/pdfs`
3. **No Job Queue:** Processing runs synchronously in background
4. **No Retry Logic:** Failed uploads must be manually re-uploaded
5. **No Progress Updates:** Processing status doesn't update in real-time

---

## Quick Reference

### Service Ports
- Next.js: `http://localhost:3000`
- OCR Service: `http://localhost:8000`
- Prisma Studio: `http://localhost:5555` (if running)
- PostgreSQL: `localhost:5432`

### Important File Paths
- Storage: `~/americano-data/pdfs/lectures/{courseId}/{timestamp}-{filename}.pdf`
- Logs: Terminal output (no log files in MVP)
- Config: `apps/web/.env.local`

### Environment Variables
```bash
# apps/web/.env.local
DATABASE_URL="postgresql://kyin@localhost:5432/americano"
STORAGE_MODE=local
LOCAL_STORAGE_PATH=~/americano-data/pdfs
OCR_SERVICE_URL=http://localhost:8000  # Optional, defaults to this
GEMINI_API_KEY=<your-key>
```

### Useful Commands
```bash
# Reset database (CAUTION: Deletes all data)
cd apps/web
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="I approve you with the reset" npx prisma migrate reset

# View database in GUI
npx prisma studio

# Check running processes
lsof -ti:3000  # Next.js
lsof -ti:8000  # OCR service
lsof -ti:5432  # PostgreSQL

# Kill stuck processes
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

---

## Deleting Uploaded Files

### Issue 4: How to Delete Failed or Unprocessed Uploads

**Symptom:** You uploaded a file but it failed to process or you uploaded the wrong file

**Solution:**

1. **Navigate to Library page** (`/library`)
2. **Find the file** you want to delete in the lecture list
3. **Look for the trash icon** in the "Actions" column
   - Trash icon only appears for `PENDING` or `FAILED` lectures
   - `PROCESSING` and `COMPLETED` lectures cannot be deleted this way (use bulk actions instead)
4. **Click the trash icon** to open deletion confirmation dialog
5. **Confirm deletion** - the file and all associated database records will be permanently deleted

**What Gets Deleted:**
- Lecture database record
- PDF file from storage (`~/americano-data/pdfs/lectures/...`)
- Related content chunks (if any were created before failure)
- Related learning objectives (if any were extracted before failure)

**Protection:**
- Completed or processing lectures cannot be deleted via the trash icon
- This prevents accidental deletion of valuable processed content
- Use bulk actions in the Library page to delete processed lectures if needed

---

## Recent Fixes (Change Log)

### 2025-10-15 (Morning)
1. ✅ Fixed course validation to accept OKLCH colors with underscores
2. ✅ Fixed file path format issue (strip `file://` protocol for OCR service)
3. ✅ Fixed file path format issue in DELETE endpoint (strip `file://` protocol for storage deletion)
4. ✅ Added course selector to upload dialog
5. ✅ Added course creation integration to library page
6. ✅ Added warning message when no courses exist
7. ✅ Added delete functionality for unprocessed uploads (PENDING/FAILED only)
8. ✅ Added confirmation dialog with contextual messages for deletions
9. ✅ Added protection to prevent deletion of processed lectures

### 2025-10-15 (Evening) - Critical OCR Fixes
10. ✅ **CRITICAL FIX**: Fixed OCR numpy array conversion bug
    - **Issue**: PaddleOCR expected numpy arrays but received PIL Image objects, causing silent OCR failures
    - **Location**: `services/ocr-service/ocr_processor.py:97-98`
    - **Fix**: Added `image_array = np.array(image)` conversion before OCR processing
    - **Impact**: OCR now works correctly - text extraction successful

11. ✅ Improved OCR error logging with full stack traces
    - **Location**: `services/ocr-service/ocr_processor.py:157`
    - **Fix**: Changed `logger.error()` to `logger.exception()` for complete error context
    - **Impact**: Better debugging capabilities for OCR failures

12. ✅ Added 3-minute timeout protection to OCR requests
    - **Location**: `apps/web/src/subsystems/content-processing/pdf-processor.ts:100-167`
    - **Fix**: Implemented AbortController with 180-second timeout and retry logic
    - **Impact**: Prevents infinite hangs on large/complex PDFs, graceful timeout handling

13. ✅ Improved OCR error messages with HTTP status codes
    - **Location**: `apps/web/src/subsystems/content-processing/pdf-processor.ts:117-118`
    - **Fix**: Enhanced error messages to include HTTP status and response body
    - **Impact**: Better error diagnostics in Next.js logs

14. ✅ Migrated to centralized Prisma configuration
    - **Created**: `apps/web/prisma/prisma-config.ts` - Centralized config file
    - **Modified**: `apps/web/src/lib/db.ts` - Now imports from config file
    - **Impact**: Better maintainability, consistent logging/error formatting across environments

### Pending Improvements
- [ ] Add real-time processing status updates
- [ ] Implement retry logic for failed uploads
- [ ] Add user authentication
- [ ] Implement cloud storage option
- [ ] Add job queue for async processing
- [ ] Add bulk delete functionality for processed lectures

---

## Getting Help

If you encounter an issue not covered here:

1. Check server logs in both terminals (Next.js and OCR service)
2. Review database state with Prisma Studio or SQL queries
3. Verify all services are running with health check commands
4. Check file system for uploaded PDFs
5. Review recent code changes in git history

For persistent issues, file a bug report with:
- Error message from logs
- Steps to reproduce
- Output of health check commands
- Database query results showing lecture status
