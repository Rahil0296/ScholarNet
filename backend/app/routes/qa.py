# /api/qa endpoint
from fastapi import APIRouter, HTTPException
from app.models.schemas import QARequest, QAResponse
from app.services.qa_system import answer_question

router = APIRouter()


@router.post("/qa", response_model=QAResponse)
async def question_answer(request: QARequest):
    """Answer questions based on context or knowledge base."""
    try:
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        result = await answer_question(request.question, request.context)
        return QAResponse(answer=result["answer"], sources=result["sources"])
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
