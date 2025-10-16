"""
OCR Processing Module
Handles PDF text extraction using PaddleOCR with medical terminology preservation
"""

import os
from pathlib import Path
from typing import Dict, List
from paddleocr import PaddleOCR
from pdf2image import convert_from_path
import numpy as np
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize PaddleOCR (lazy loading on first use)
_ocr_instance = None


def get_ocr_instance() -> PaddleOCR:
    """
    Get or create PaddleOCR instance with medical terminology settings
    Singleton pattern for performance
    """
    global _ocr_instance

    if _ocr_instance is None:
        logger.info("Initializing PaddleOCR engine...")
        _ocr_instance = PaddleOCR(
            use_angle_cls=True,  # Enable text angle classification
            lang='en',           # English language
            use_gpu=False,       # CPU mode for local development
            show_log=False,      # Reduce console noise
            # Medical terminology preservation settings
            rec_char_dict_path=None,  # Use default English dictionary
            det_db_thresh=0.3,         # Detection threshold (lower = more sensitive)
            det_db_box_thresh=0.5,     # Box threshold
            rec_batch_num=6,           # Batch size for recognition
        )
        logger.info("PaddleOCR engine initialized successfully")

    return _ocr_instance


async def extract_text_from_pdf(file_path: str) -> Dict:
    """
    Extract text from PDF file using PaddleOCR

    Args:
        file_path: Absolute or relative path to PDF file

    Returns:
        dict: {
            "text": str (complete extracted text),
            "confidence": float (average confidence score),
            "pages": list[dict] (page-by-page results)
        }

    Raises:
        FileNotFoundError: If PDF file doesn't exist
        ValueError: If file is corrupted or not a valid PDF
    """
    # Validate file exists
    pdf_path = Path(file_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF file not found: {file_path}")

    # Validate file extension
    if pdf_path.suffix.lower() != '.pdf':
        raise ValueError(f"File must be a PDF, got: {pdf_path.suffix}")

    try:
        logger.info(f"Converting PDF to images: {pdf_path.name}")

        # Convert PDF to images (one per page)
        images = convert_from_path(str(pdf_path))

        if not images:
            raise ValueError("PDF contains no pages")

        logger.info(f"Processing {len(images)} pages...")

        # Get OCR instance
        ocr = get_ocr_instance()

        # Process each page
        all_pages_text = []
        all_pages_results = []
        total_confidence = 0.0
        confidence_count = 0

        for page_num, image in enumerate(images, start=1):
            logger.info(f"Processing page {page_num}/{len(images)}")

            # Convert PIL Image to numpy array for PaddleOCR
            image_array = np.array(image)

            # Run OCR on page image
            result = ocr.ocr(image_array, cls=True)

            # Extract text and confidence from result
            page_text_lines = []
            page_confidence_sum = 0.0
            page_confidence_count = 0

            if result and result[0]:
                for line in result[0]:
                    # line format: [box, (text, confidence)]
                    if line and len(line) >= 2:
                        text, confidence = line[1]
                        page_text_lines.append(text)
                        page_confidence_sum += confidence
                        page_confidence_count += 1

            # Combine page text
            page_text = " ".join(page_text_lines)
            page_confidence = (
                page_confidence_sum / page_confidence_count
                if page_confidence_count > 0
                else 0.0
            )

            # Store page results
            all_pages_text.append(page_text)
            all_pages_results.append({
                "page_number": page_num,
                "text": page_text,
                "confidence": round(page_confidence, 4),
                "line_count": len(page_text_lines)
            })

            # Update total confidence
            total_confidence += page_confidence_sum
            confidence_count += page_confidence_count

        # Combine all text
        complete_text = "\n\n".join(all_pages_text)

        # Calculate average confidence
        average_confidence = (
            total_confidence / confidence_count
            if confidence_count > 0
            else 0.0
        )

        logger.info(f"OCR complete. Extracted {len(complete_text)} characters with {average_confidence:.2%} confidence")

        return {
            "text": complete_text,
            "confidence": round(average_confidence, 4),
            "pages": all_pages_results
        }

    except Exception as e:
        # Log full stack trace for debugging
        logger.exception(f"OCR processing error: {str(e)}")

        # Check for corrupted PDF
        if "PDF" in str(e) or "corrupt" in str(e).lower():
            raise ValueError(f"Corrupted or invalid PDF file: {str(e)}")

        # Re-raise other errors with full context
        raise
