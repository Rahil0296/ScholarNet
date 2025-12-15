# backend/app/routes/read_aloud.py

from fastapi import APIRouter, HTTPException
from app.services.read_aloud_service import (
    generate_embeddings,
    semantic_chunk_sentences
)
from app.models.schemas import ReadAloudRequest, ReadAloudResponse

router = APIRouter()

@router.post("/read-aloud", response_model=ReadAloudResponse)
async def read_aloud(request: ReadAloudRequest):
    try:
        if not request.sentences or len(request.sentences) < 5:
            raise HTTPException(status_code=400, detail="Not enough content")

        embeddings = generate_embeddings(request.sentences)

        chunks = semantic_chunk_sentences(
            request.sentences,
            embeddings,
            num_clusters=request.num_clusters
        )

        return ReadAloudResponse(chunks=chunks)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
