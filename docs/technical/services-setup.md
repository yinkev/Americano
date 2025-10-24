# Americano Services Setup & Operation

**Last Updated**: 2025-10-15
**Status**: All services operational ✅

---

## Running Services Overview

All three required services are now running and operational:

### 1. Frontend (Next.js)
- **Port**: 3000
- **URLs**:
  - Local: http://localhost:3000
  - Network: http://192.168.4.125:3000
- **Status**: ✅ Running
- **Stack**: Next.js 15.5.5 with Turbopack
- **Features**:
  - Dashboard
  - Library (lecture management)
  - Study mode
  - Progress tracking
  - Settings

**Start Command**:
```bash
cd /Users/kyin/Projects/Americano/apps/web
pnpm dev
```

---

### 2. OCR Service (Python FastAPI)
- **Port**: 8000
- **URL**: http://0.0.0.0:8000
- **Health Check**: http://localhost:8000/health
- **Status**: ✅ Running
- **Purpose**: PDF text extraction using PaddleOCR
- **Tech**: Python 3.13.1, FastAPI, PaddleOCR

**Start Command**:
```bash
cd /Users/kyin/Projects/Americano/services/ocr-service
python3 main.py
```

**Endpoints**:
- `GET /` - Service info
- `GET /health` - Health check with OCR engine status
- `POST /extract` - Extract text from PDF

---

### 3. ChatMock (GPT-5 Proxy)
- **Port**: 8801
- **URLs**:
  - Base: http://localhost:8801
  - API: http://localhost:8801/v1
  - Completions: http://localhost:8801/v1/chat/completions
- **Status**: ✅ Running & Authenticated
- **Account**: kevinpyin@gmail.com (ChatGPT Pro)
- **Purpose**: Local GPT-5 proxy for AI features without API costs
- **Tech**: Python, Flask, OpenAI-compatible API

**Available Models**:
- `gpt-5` - Main model
- `gpt-5-codex` - Coding optimized
- `codex-mini` - Lighter variant

**Start Command**:
```bash
cd /Users/kyin/Projects/Americano/services/chatmock
python3 chatmock.py serve --port 8801
```

**Test Command**:
```bash
curl http://localhost:8801/v1/models
```

**Check Login Status**:
```bash
python3 chatmock.py info
```

---

## Service Integration

### Processing Pipeline
When a lecture is uploaded, the following happens:

1. **Upload** → File stored via Storage Provider (local filesystem or Supabase)
2. **OCR Extraction** → Text extracted via OCR Service (port 8000)
3. **Content Chunking** → Text split into semantic chunks
4. **AI Analysis** → Learning objectives extracted via ChatMock (port 8801)
5. **Embeddings** → Vector embeddings generated via Google Gemini API
6. **Completion** → Lecture marked as COMPLETED

**Critical**: All three services must be running for complete lecture processing.

---

## Common Issues & Solutions

### Issue: 0 Learning Objectives After Upload

**Symptom**: Lectures show "0 objectives" in the library after processing completes.

**Cause**: The lecture was processed before ChatMock was running. The pipeline continued through OCR and embedding generation but skipped objective extraction.

**Solution**: Use the **Reprocess Button**

1. Go to **Library** page
2. Look for lectures with "0 objectives"
3. Click the **↻ Reprocess** button in the Actions column
4. Wait for processing to complete (1-3 minutes)

The reprocess button appears for:
- ❌ **FAILED** lectures (processing error)
- ⚠️ **COMPLETED** lectures with 0 learning objectives

**What happens during reprocessing**:
- Status resets to PENDING
- Full pipeline runs again: OCR → ChatMock → Embeddings
- Learning objectives extracted using GPT-5 via ChatMock
- Status updates to COMPLETED with objectives count

---

## Starting All Services

### Quick Start (Background Processes)

```bash
# 1. Start OCR Service
cd /Users/kyin/Projects/Americano/services/ocr-service
python3 main.py &

# 2. Start ChatMock
cd /Users/kyin/Projects/Americano/services/chatmock
python3 chatmock.py serve --port 8801 &

# 3. Start Frontend
cd /Users/kyin/Projects/Americano/apps/web
pnpm dev
```

### Verify All Services

```bash
# Check OCR
curl http://localhost:8000/health

# Check ChatMock
curl http://localhost:8801/v1/models

# Check Frontend (open in browser)
open http://localhost:3000
```

---

## Stopping Services

### Kill All Services

```bash
# Kill by port
lsof -ti:3000,8000,8801 | xargs kill -9

# Or kill individually
pkill -f "next dev"
pkill -f "main.py"
pkill -f "chatmock.py serve"
```

---

## Environment Variables

### Frontend (.env.local)

```bash
# Database
DATABASE_URL="postgresql://localhost/americano"

# Storage
STORAGE_MODE=local
LOCAL_STORAGE_PATH=~/americano-data/pdfs

# AI Services
CHATMOCK_URL=http://localhost:8801
GEMINI_API_KEY=your-gemini-api-key

# OCR Service
OCR_SERVICE_URL=http://localhost:8000
```

### ChatMock

No environment variables needed. Uses authenticated ChatGPT session via OAuth.

### OCR Service

No environment variables needed. Runs standalone.

---

## Service Health Monitoring

### Check Service Status

```bash
# Frontend
curl -I http://localhost:3000

# OCR Service
curl http://localhost:8000/health | jq

# ChatMock
curl http://localhost:8801/v1/models | jq
```

### Expected Responses

**OCR Service Health**:
```json
{
  "status": "healthy",
  "ocr_engine": "PaddleOCR",
  "ready": true
}
```

**ChatMock Models**:
```json
{
  "data": [
    {"id": "gpt-5", "object": "model", "owned_by": "owner"},
    {"id": "gpt-5-codex", "object": "model", "owned_by": "owner"},
    {"id": "codex-mini", "object": "model", "owned_by": "owner"}
  ],
  "object": "list"
}
```

---

## Development Workflow

### Typical Development Session

1. **Start all services** (see Quick Start above)
2. **Open frontend** at http://localhost:3000
3. **Upload a lecture** via Library → Upload button
4. **Monitor processing** - Status updates in real-time
5. **Check objectives** - Should show count > 0 when complete
6. **Reprocess if needed** - Use reprocess button if objectives = 0

### Testing AI Features

```bash
# Test ChatMock directly
curl http://localhost:8801/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5",
    "messages": [{"role": "user", "content": "Extract learning objectives from: The cardiac conduction system..."}]
  }'
```

---

## Troubleshooting

### Frontend won't start
- **Check**: Port 3000 not in use (`lsof -ti:3000`)
- **Fix**: Kill existing process or use alternative port

### OCR Service errors
- **Check**: Python 3.13+ installed
- **Check**: PaddleOCR dependencies installed
- **Fix**: `pip3 install -r requirements.txt`

### ChatMock not authenticated
- **Check**: Login status (`python3 chatmock.py info`)
- **Fix**: Re-login (`python3 chatmock.py login`)

### 0 Learning Objectives
- **Check**: ChatMock running on port 8801
- **Fix**: Start ChatMock, then use reprocess button in Library

---

## Architecture

```
┌─────────────────┐
│   Frontend      │  Port 3000
│   (Next.js)     │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         v                  v
┌─────────────────┐  ┌─────────────────┐
│  OCR Service    │  │   ChatMock      │
│  (PaddleOCR)    │  │   (GPT-5 Proxy) │
│  Port 8000      │  │   Port 8801     │
└─────────────────┘  └─────────────────┘
         │                  │
         │                  │
         v                  v
    ┌────────────────────────┐
    │      PostgreSQL         │
    │      + pgvector         │
    │   (Learning Data)       │
    └────────────────────────┘
```

---

## Next Steps

1. ✅ All services running
2. ✅ Reprocess button implemented
3. ✅ Documentation updated
4. ⏳ Upload more lectures and test full pipeline
5. ⏳ Monitor processing success rate
6. ⏳ Optimize ChatMock prompts for better objective extraction

---

## Support

**Issues?** Check:
- Service logs in terminal
- Browser console for frontend errors
- `apps/web/.next/` for build errors
- Database connection: `psql americano`

**Still stuck?** Review:
- `/Users/kyin/Projects/Americano/docs/solution-architecture.md`
- `/Users/kyin/Projects/Americano/docs/TROUBLESHOOTING-LECTURE-UPLOAD.md`
