# PDF text extraction & TTS with vector store support
import os
import uuid
from typing import Tuple, List, Dict
from PyPDF2 import PdfReader
from app.config import settings
from app.utils.helpers import chunk_text


def extract_text_from_pdf(file_path: str) -> Tuple[str, int]:
    """Extract text from PDF file."""
    reader = PdfReader(file_path)
    text = ""
    
    for page in reader.pages:
        text += page.extract_text() + "\n"
    
    return text.strip(), len(reader.pages)


async def process_pdf(file_path: str) -> dict:
    """Process PDF and optionally generate audio."""
    text, num_pages = extract_text_from_pdf(file_path)
    
    # TTS can be implemented here using libraries like gTTS or OpenAI TTS
    audio_url = None
    
    return {
        "text": text,
        "audio_url": audio_url,
        "pages": num_pages
    }


def save_uploaded_file(file_content: bytes, filename: str) -> str:
    """Save uploaded file and return file path."""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    return file_path


# ✅ NEW: Process PDF with chunking for vector store
async def process_pdf_for_vector_store(file_path: str, filename: str) -> dict:
    """
    Process PDF and prepare it for vector store storage.
    Returns chunks with metadata and document_id.
    """
    try:
        # Extract text
        text, num_pages = extract_text_from_pdf(file_path)
        
        if not text or len(text.strip()) < 10:
            raise ValueError("Could not extract meaningful text from PDF")
        
        # Generate unique document ID
        document_id = str(uuid.uuid4())
        
        # Split into chunks for better retrieval
        chunks = chunk_text(text, chunk_size=1000, overlap=200)
        
        # Prepare metadata for each chunk
        metadatas = [
            {
                "source": filename,
                "document_id": document_id,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "pages": num_pages
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
            "total_chunks": len(chunks)
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


def get_pdf_metadata(file_path: str) -> dict:
    """Extract metadata from PDF."""
    try:
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