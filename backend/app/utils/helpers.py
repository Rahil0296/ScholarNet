# Utility functions
import os
import re
from typing import List


def clean_text(text: str) -> str:
    """Clean and normalize text."""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters
    text = re.sub(r'[^\w\s.,!?-]', '', text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Split text into chunks with overlap."""
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    
    return chunks


def ensure_directory(path: str):
    """Ensure directory exists."""
    os.makedirs(path, exist_ok=True)


def get_file_extension(filename: str) -> str:
    """Get file extension."""
    return os.path.splitext(filename)[1].lower()


def is_valid_file_type(filename: str, allowed_extensions: List[str]) -> bool:
    """Check if file type is allowed."""
    ext = get_file_extension(filename)
    return ext in allowed_extensions
