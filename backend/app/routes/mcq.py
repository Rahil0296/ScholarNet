# /api/mcq endpoint
from fastapi import APIRouter, HTTPException
from app.models.schemas import MCQRequest, MCQResponse, MCQQuestion, MCQOption
from app.services.mcq_generator import generate_mcqs

router = APIRouter()


@router.post("/mcq", response_model=MCQResponse)
async def generate_mcq(request: MCQRequest):
    """Generate MCQs from the provided text."""
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        questions_data = await generate_mcqs(request.text, request.num_questions)
        
        questions = []
        for q in questions_data:
            options = [
                MCQOption(option=opt["option"], is_correct=opt["is_correct"])
                for opt in q.get("options", [])
            ]
            questions.append(MCQQuestion(
                question=q["question"],
                options=options,
                explanation=q.get("explanation")
            ))
        
        return MCQResponse(questions=questions)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
