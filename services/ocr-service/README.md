# Americano OCR Service

PaddleOCR-based PDF text extraction service for the Americano platform.

## Overview

This FastAPI service provides OCR (Optical Character Recognition) capabilities for extracting text from PDF lecture files. It uses PaddleOCR for accurate text extraction with special attention to medical terminology preservation.

## Features

- **PDF Text Extraction**: Convert PDF pages to images and extract text using PaddleOCR
- **Medical Terminology Preservation**: Optimized settings for medical content accuracy (>90% target)
- **Page-by-Page Processing**: Detailed results for each page
- **Confidence Scoring**: Track OCR quality metrics
- **Error Handling**: Robust handling of corrupted PDFs and processing failures
- **FastAPI REST API**: Simple HTTP endpoint for integration

## Requirements

- Python 3.11+
- PaddleOCR 2.9.1+
- FastAPI 0.115+
- poppler-utils (for pdf2image)

## Installation

### 1. Install System Dependencies

**macOS:**
```bash
brew install poppler
```

**Ubuntu/Debian:**
```bash
sudo apt-get install poppler-utils
```

**Windows:**
Download poppler from: http://blog.alivate.com.au/poppler-windows/

### 2. Install Python Dependencies

```bash
cd services/ocr-service
pip install -r requirements.txt
```

## Usage

### Start the Service

```bash
# Development mode with auto-reload
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The service will start at `http://localhost:8000`

### API Endpoints

#### Health Check
```bash
GET http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "ocr_engine": "PaddleOCR",
  "ready": true
}
```

#### Extract Text from PDF
```bash
POST http://localhost:8000/extract
Content-Type: application/json

{
  "file_path": "/path/to/lecture.pdf"
}
```

**Response:**
```json
{
  "text": "Complete extracted text from all pages...",
  "confidence": 0.9523,
  "pages": [
    {
      "page_number": 1,
      "text": "Page 1 text...",
      "confidence": 0.9612,
      "line_count": 45
    }
  ]
}
```

### Integration with Next.js API

From Next.js API route:

```typescript
const response = await fetch('http://localhost:8000/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ file_path: '/path/to/file.pdf' })
});

const result = await response.json();
// result.text, result.confidence, result.pages
```

## Configuration

### OCR Settings (ocr_processor.py)

Key parameters for medical terminology accuracy:

- `det_db_thresh=0.3`: Detection threshold (lower = more sensitive)
- `det_db_box_thresh=0.5`: Bounding box threshold
- `use_angle_cls=True`: Handle rotated text
- `lang='en'`: English language model

### Performance Tuning

- `rec_batch_num=6`: Batch size for recognition (adjust based on RAM)
- `use_gpu=False`: Set to `True` if CUDA GPU available
- `show_log=False`: Reduce console output in production

## Medical Terminology Accuracy

Target: **>90% accuracy** for medical terms

**Testing:**
1. Use sample PNWU lecture PDFs with medical terminology
2. Manually verify extraction of terms like:
   - "myocardial infarction"
   - "pathophysiology"
   - "pharmacokinetics"
   - Complex anatomical terms
3. Adjust `det_db_thresh` if accuracy < 90%

## Error Handling

The service handles:

- **File Not Found**: Returns 404 with clear message
- **Corrupted PDFs**: Returns 400 with validation error
- **Processing Failures**: Returns 500 with error details
- **Invalid Requests**: Returns 422 with validation errors

## Development

### Run Tests
```bash
pytest tests/
```

### Debug Mode
```bash
# Enable verbose logging
export LOG_LEVEL=DEBUG
python main.py
```

### Docker Support (Future)
```bash
docker build -t americano-ocr .
docker run -p 8000:8000 americano-ocr
```

## Performance Targets

- **Small PDF** (<5MB, 10 pages): <30 seconds
- **Large PDF** (50MB, 200 pages): 2-3 minutes
- **Accuracy**: >90% for medical terminology
- **Memory Usage**: <2GB RAM per request

## Troubleshooting

### "poppler not found" Error
Install poppler system dependency (see Installation section)

### Low Accuracy (<90%)
1. Check PDF quality (scanned vs. native text)
2. Adjust `det_db_thresh` in ocr_processor.py
3. Verify medical terms manually in sample output

### Slow Processing
1. Enable GPU if available (`use_gpu=True`)
2. Reduce `rec_batch_num` if running out of memory
3. Consider async processing for large files

## Production Deployment

For production use:

1. Set `use_gpu=True` on GPU-enabled servers
2. Configure CORS for production domain
3. Add authentication/API keys
4. Set up monitoring and logging
5. Use Docker for containerization
6. Scale horizontally for high load

## License

Part of the Americano platform (proprietary)
