# /api/qa endpoint
from fastapi import APIRouter, HTTPException
from app.models.schemas import QARequest, QAResponse
from app.services.qa_system import answer_question, get_conversation_history, clear_conversation

router = APIRouter()


@router.post("/qa", response_model=QAResponse)
async def question_answer(request: QARequest):
    """Answer questions based on context or knowledge base with history."""
    try:
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        result = await answer_question(
            question=request.question,
            context=request.context,
            session_id=request.session_id,
            use_history=True
        )
        
        return QAResponse(
            answer=result["answer"],
            sources=result.get("sources"),
            session_id=result.get("session_id")
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/qa/history/{session_id}")
async def clear_history(session_id: str):
    """Clear conversation history for a session."""
    success = clear_conversation(session_id)
    if success:
        return {"message": "History cleared"}
    raise HTTPException(status_code=404, detail="Session not found")