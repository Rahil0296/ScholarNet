# PDF text extraction & TTS
import os
from typing import Tuple
from PyPDF2 import PdfReader
from app.config import settings


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
