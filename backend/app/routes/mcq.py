# /api/mcq endpoints
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from app.services.mcq_generator import generate_mcqs, evaluate_mcq_answers

router = APIRouter()


class MCQRequest(BaseModel):
    text: Optional[str] = None
    document_id: Optional[str] = None
    num_questions: int = 10


class MCQOption(BaseModel):
    option: str
    is_correct: bool


class MCQQuestion(BaseModel):
    question: str
    topic: str
    options: List[MCQOption]
    explanation: Optional[str] = None


class TopicInfo(BaseModel):
    name: str
    question_indices: List[int]
    question_count: int


class MCQResponse(BaseModel):
    status: str
    questions: List[dict]
    total_questions: int
    topics: List[TopicInfo]
    source: Optional[str] = None
    message: Optional[str] = None


class EvaluateRequest(BaseModel):
    questions: List[dict]
    user_answers: Dict[int, int]  # question_index -> selected_option_index


class TopicAnalysis(BaseModel):
    topic: str
    total: int
    correct: int
    incorrect: int
    percentage: int
    performance: str  # excellent, strong, good, needs_practice, weak
    questions: List[dict]


class EvaluateResponse(BaseModel):
    total_questions: int
    total_correct: int
    overall_percentage: int
    topic_analysis: List[TopicAnalysis]
    weak_topics: List[str]
    strong_topics: List[str]
    recommendations: List[str]


@router.post("/mcq", response_model=MCQResponse)
async def create_mcqs(request: MCQRequest):
    """
    Generate MCQs from text or document.
    
    Returns questions with topics for frontend display.
    """
    try:
        if not request.text and not request.document_id:
            raise HTTPException(
                status_code=400, 
                detail="Either text or document_id must be provided"
            )
        
        result = await generate_mcqs(
            text=request.text,
            document_id=request.document_id,
            num_questions=request.num_questions
        )
        
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])
        
        return MCQResponse(
            status=result["status"],
            questions=result["questions"],
            total_questions=result["total_questions"],
            topics=[TopicInfo(**t) for t in result["topics"]],
            source=result.get("source")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mcq/evaluate", response_model=EvaluateResponse)
async def evaluate_answers(request: EvaluateRequest):
    """
    Evaluate user's MCQ answers and provide topic-wise analysis.
    
    This endpoint receives the questions and user's answers,
    then returns detailed feedback including:
    - Overall score
    - Topic-wise breakdown
    - Weak/strong areas
    - Study recommendations
    """
    try:
        if not request.questions:
            raise HTTPException(status_code=400, detail="Questions are required")
        
        if not request.user_answers:
            raise HTTPException(status_code=400, detail="User answers are required")
        
        result = await evaluate_mcq_answers(
            questions=request.questions,
            user_answers=request.user_answers
        )
        
        return EvaluateResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mcq/topics/{document_id}")
async def get_document_topics(document_id: str):
    """
    Get available topics for a document.
    
    Useful for filtering or displaying topic categories.
    """
    try:
        # Generate a small set of MCQs to extract topics
        result = await generate_mcqs(
            document_id=document_id,
            num_questions=5
        )
        
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])
        
        return {
            "document_id": document_id,
            "topics": [t["name"] for t in result["topics"]]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))