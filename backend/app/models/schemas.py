# Pydantic models for request/response
from pydantic import BaseModel
from typing import List, Optional, Literal


class SummarizeRequest(BaseModel):
    text: Optional[str] = None
    document_id: Optional[str] = None
    max_length: Optional[int] = 500  # Default 500, but can go up to 5000+
    summary_type: Optional[Literal["concise", "explanatory"]] = "explanatory"  # ✅ Only 2 types now
    strategy: Optional[Literal["auto", "map-reduce", "refine", "direct"]] = "auto"


class ProcessingInfo(BaseModel):
    """Information about how the document was processed."""
    strategy: str
    original_length: int
    word_count: int
    chunks_processed: int


class SummarizeResponse(BaseModel):
    summary: str
    summary_type: str
    source: Optional[str] = None
    processing_info: Optional[ProcessingInfo] = None  # ✅ NEW


class QARequest(BaseModel):
    question: str
    context: Optional[str] = None
    session_id: Optional[str] = None  # ✅ NEW: For conversation history
    use_history: Optional[bool] = True  # ✅ NEW: Enable/disable history


class QAResponse(BaseModel):
    answer: str
    sources: Optional[List[str]] = None
    session_id: Optional[str] = None  # ✅ NEW: Return session_id


class MCQRequest(BaseModel):
    text: Optional[str] = None
    document_id: Optional[str] = None
    num_questions: Optional[int] = 5


class MCQOption(BaseModel):
    option: str
    is_correct: bool


class MCQQuestion(BaseModel):
    question: str
    options: List[MCQOption]
    explanation: Optional[str] = None


class MCQResponse(BaseModel):
    questions: List[MCQQuestion]


class PDFResponse(BaseModel):
    text: str
    audio_url: Optional[str] = None
    pages: int


class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    chunks: int
    message: str