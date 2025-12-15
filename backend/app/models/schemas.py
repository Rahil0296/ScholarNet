# Pydantic models for request/response
from pydantic import BaseModel
from typing import List, Optional


class SummarizeRequest(BaseModel):
    text: str
    max_length: Optional[int] = 500


class SummarizeResponse(BaseModel):
    summary: str


class QARequest(BaseModel):
    question: str
    context: Optional[str] = None


class QAResponse(BaseModel):
    answer: str
    sources: Optional[List[str]] = None


class MCQRequest(BaseModel):
    text: str
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
