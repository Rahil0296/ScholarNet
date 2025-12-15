# /api/pdf-read endpoint
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.models.schemas import PDFResponse
from app.services.pdf_processor import process_pdf, save_uploaded_file
from app.utils.vector_store import add_documents_to_store
from app.config import settings

router = APIRouter()


@router.post("/pdf-read", response_model=PDFResponse)
async def read_pdf(file: UploadFile = File(...)):
    """Process PDF file and extract text."""
    try:
        # Validate file extension
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Read file content
        content = await file.read()
        
        # Check file size
        if len(content) > settings.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds limit")
        
        # Save file
        file_path = save_uploaded_file(content, file.filename)
        
        # Process PDF
        result = await process_pdf(file_path)

        # Add extracted text to vector store
        if result["text"]:
            add_documents_to_store([result["text"]], metadatas=[{"filename": file.filename}])

        return PDFResponse(
            text=result["text"],
            audio_url=result["audio_url"],
            pages=result["pages"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
