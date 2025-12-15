# Enhanced PDF processing with better extraction
import os
import uuid
from typing import Tuple, List, Dict
from app.config import settings
from app.utils.helpers import chunk_text

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    print("Warning: PyMuPDF not installed. Falling back to PyPDF2")

# Fallback to PyPDF2
from PyPDF2 import PdfReader


def extract_text_from_pdf_pymupdf(file_path: str) -> Tuple[str, int]:
    """
    Extract text using PyMuPDF (much better for complex PDFs).
    Handles images, tables, and complex layouts better.
    """
    doc = None
    try:
        doc = fitz.open(file_path)
        text = ""
        num_pages = len(doc)
        
        for page_num in range(num_pages):
            page = doc[page_num]
            # Extract text with layout preservation
            text += page.get_text("text")
            text += "\n\n"  # Page separator
        
        return text.strip(), num_pages
    finally:
        # Always close the document properly
        if doc:
            doc.close()


def extract_text_from_pdf_pypdf2(file_path: str) -> Tuple[str, int]:
    """Fallback: Extract text using PyPDF2 (basic extraction)."""
    reader = PdfReader(file_path)
    text = ""
    
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    
    return text.strip(), len(reader.pages)


def extract_text_from_pdf(file_path: str) -> Tuple[str, int]:
    """
    Smart PDF extraction - uses best available library.
    
    Priority:
    1. PyMuPDF (fitz) - Best quality
    2. PyPDF2 - Fallback
    """
    if PYMUPDF_AVAILABLE:
        try:
            print("📄 Using PyMuPDF for extraction (better quality)")
            return extract_text_from_pdf_pymupdf(file_path)
        except Exception as e:
            print(f"Error with PyMuPDF extraction, trying fallback: {e}")
            return extract_text_from_pdf_pypdf2(file_path)
    else:
        print("📄 Using PyPDF2 for extraction (basic quality)")
        return extract_text_from_pdf_pypdf2(file_path)


def save_uploaded_file(file_content: bytes, filename: str) -> str:
    """Save uploaded file and return file path."""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Use unique filename to avoid conflicts
    unique_filename = f"{uuid.uuid4()}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    return file_path


async def process_pdf(file_path: str) -> dict:
    """Process PDF and optionally generate audio."""
    text, num_pages = extract_text_from_pdf(file_path)
    
    # Basic quality check
    if len(text.strip()) < 100:
        print("⚠️ Warning: Extracted text is suspiciously short. PDF may have images/scans.")
    
    # TTS can be implemented here
    audio_url = None
    
    return {
        "text": text,
        "audio_url": audio_url,
        "pages": num_pages
    }


def process_pdf_for_vector_store_sync(file_path: str, filename: str) -> dict:
    """
    Synchronous version - Process PDF and prepare for vector store.
    This ensures file operations complete before returning.
    """
    try:
        # Extract text with better library
        text, num_pages = extract_text_from_pdf(file_path)
        
        # Validate extraction quality
        if not text or len(text.strip()) < 10:
            raise ValueError("Could not extract meaningful text from PDF")
        
        # Quality check: Warn if extraction seems poor
        words_per_page = len(text.split()) / max(num_pages, 1)
        if words_per_page < 50:
            print(f"⚠️ Warning: Only {words_per_page:.0f} words/page. PDF may be image-heavy.")
            print("💡 Tip: Consider using OCR or vision-enabled models for better results.")
        
        # Generate unique document ID
        document_id = str(uuid.uuid4())
        
        # Chunking for vector store
        chunks = chunk_text(text, chunk_size=1000, overlap=200)
        
        if not chunks:
            raise ValueError("No chunks generated from PDF text")
        
        # Prepare metadata for each chunk
        metadatas = [
            {
                "source": filename,
                "document_id": document_id,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "pages": num_pages,
                "extraction_method": "pymupdf" if PYMUPDF_AVAILABLE else "pypdf2"
            }
            for i in range(len(chunks))
        ]
        
        return {
            "status": "success",
            "document_id": document_id,
            "filename": filename,
            "chunks": chunks,
            "metadatas": metadatas,
            "pages": num_pages,
            "total_chunks": len(chunks),
            "words_per_page": words_per_page,
            "full_text": text  # Keep full text for later retrieval
        }
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": str(e)
        }


async def process_pdf_for_vector_store(file_path: str, filename: str) -> dict:
    """
    Async wrapper that runs synchronous PDF processing.
    Ensures file is fully processed before any cleanup.
    """
    import asyncio
    
    # Run the synchronous extraction in a thread pool to not block
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, 
        process_pdf_for_vector_store_sync, 
        file_path, 
        filename
    )
    
    return result


def get_pdf_metadata(file_path: str) -> dict:
    """Extract metadata from PDF."""
    try:
        if PYMUPDF_AVAILABLE:
            doc = None
            try:
                doc = fitz.open(file_path)
                metadata = doc.metadata
                pages = len(doc)
                return {
                    "title": metadata.get("title", "Unknown"),
                    "author": metadata.get("author", "Unknown"),
                    "pages": pages,
                    "encrypted": False
                }
            finally:
                if doc:
                    doc.close()
        else:
            reader = PdfReader(file_path)
            metadata = reader.metadata
            return {
                "title": metadata.get("/Title", "Unknown") if metadata else "Unknown",
                "author": metadata.get("/Author", "Unknown") if metadata else "Unknown",
                "pages": len(reader.pages),
                "encrypted": reader.is_encrypted
            }
    except Exception as e:
        return {
            "error": str(e),
            "pages": 0
        }