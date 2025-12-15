# /api/summarize endpoint
from fastapi import APIRouter, HTTPException
from app.models.schemas import SummarizeRequest, SummarizeResponse
from app.services.summarizer import summarize_text

router = APIRouter()


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(request: SummarizeRequest):
    """Summarize the provided text."""
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        summary = await summarize_text(request.text, request.max_length)
        return SummarizeResponse(summary=summary)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
