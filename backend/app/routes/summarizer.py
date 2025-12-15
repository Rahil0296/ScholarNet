# /api/summarize endpoint
from fastapi import APIRouter, HTTPException
from app.models.schemas import SummarizeRequest, SummarizeResponse
from app.services.summarizer import summarize_text

router = APIRouter()


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(request: SummarizeRequest):
    """
    Generate summaries from text or stored documents.
    
    Summary Types:
    - concise: Brief, essential points only (150-300 words typical)
    - explanatory: Detailed, comprehensive with context (600-3000+ words)
    
    Usage:
    1. With direct text: {"text": "...", "summary_type": "explanatory"}
    2. With document_id: {"document_id": "uuid", "summary_type": "concise"}
    """
    try:
        # Validate input
        if not request.text and not request.document_id:
            raise HTTPException(
                status_code=400, 
                detail="Either 'text' or 'document_id' must be provided"
            )
        
        # Generate summary
        result = await summarize_text(
            text=request.text,
            document_id=request.document_id,
            max_length=request.max_length or 500,
            summary_type=request.summary_type or "learning"
        )
        
        # Check for errors in result
        if result["summary"].startswith("Error:"):
            raise HTTPException(status_code=404, detail=result["summary"])
        
        return SummarizeResponse(
            summary=result["summary"],
            summary_type=result["summary_type"],
            source=result["source"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")