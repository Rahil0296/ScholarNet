# /api/mcq endpoint
from fastapi import APIRouter, HTTPException
from app.models.schemas import MCQRequest, MCQResponse, MCQQuestion, MCQOption
from app.services.mcq_generator import generate_mcqs

router = APIRouter()


@router.post("/mcq", response_model=MCQResponse)
async def generate_mcq(request: MCQRequest):
    """
    Generate multiple choice questions from text or uploaded document.
    
    Usage:
    1. With direct text: {"text": "...", "num_questions": 10}
    2. With document_id: {"document_id": "uuid", "num_questions": 10}
    
    Returns:
    - List of MCQ questions with 4 options each
    - Correct answers marked with is_correct: true
    - Explanations for each question
    """
    try:
        # Validate input
        if not request.text and not request.document_id:
            raise HTTPException(
                status_code=400,
                detail="Either 'text' or 'document_id' must be provided"
            )
        
        # Validate num_questions
        if request.num_questions < 1 or request.num_questions > 20:
            raise HTTPException(
                status_code=400,
                detail="num_questions must be between 1 and 20"
            )
        
        # Generate MCQs
        result = await generate_mcqs(
            text=request.text,
            document_id=request.document_id,
            num_questions=request.num_questions
        )
        
        # Check for errors
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])
        
        # Format questions
        questions = []
        for q in result["questions"]:
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
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))