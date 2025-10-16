"""
PaddleOCR Service - FastAPI Server
Provides PDF text extraction endpoint for Americano platform
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from ocr_processor import extract_text_from_pdf

app = FastAPI(
    title="Americano OCR Service",
    description="PDF text extraction using PaddleOCR",
    version="1.0.0"
)

# CORS middleware for Next.js API communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class OCRRequest(BaseModel):
    """Request model for OCR extraction"""
    file_path: str


class OCRResponse(BaseModel):
    """Response model for OCR extraction"""
    text: str
    confidence: float
    pages: list[dict]


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Americano OCR Service",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check with OCR engine status"""
    return {
        "status": "healthy",
        "ocr_engine": "PaddleOCR",
        "ready": True
    }


@app.post("/extract", response_model=OCRResponse)
async def extract_text(request: OCRRequest):
    """
    Extract text from PDF using PaddleOCR

    Args:
        request: OCRRequest with file_path

    Returns:
        OCRResponse with extracted text, confidence, and page-by-page results

    Raises:
        HTTPException: If file not found or OCR fails
    """
    try:
        result = await extract_text_from_pdf(request.file_path)
        return result
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {request.file_path}"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing failed: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
