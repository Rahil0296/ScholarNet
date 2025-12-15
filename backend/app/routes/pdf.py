# /api/pdf endpoints
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.models.schemas import PDFResponse, DocumentUploadResponse
from app.services.pdf_processor import (
    process_pdf, 
    save_uploaded_file, 
    process_pdf_for_vector_store,
    get_pdf_metadata
)
from app.utils.vector_store import add_documents_to_store, list_all_documents, delete_document_by_id
from app.config import settings
import os

router = APIRouter()


@router.post("/pdf-read", response_model=PDFResponse)
async def read_pdf(file: UploadFile = File(...)):
    """Process PDF file and extract text (without storing in vector DB)."""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        content = await file.read()
        
        if len(content) > settings.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds limit")
        
        file_path = save_uploaded_file(content, file.filename)
        result = await process_pdf(file_path)
        
        if os.path.exists(file_path):
            os.remove(file_path)

        return PDFResponse(
            text=result["text"],
            audio_url=result["audio_url"],
            pages=result["pages"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pdf-upload", response_model=DocumentUploadResponse)
async def upload_pdf_to_vector_store(file: UploadFile = File(...)):
    """Upload PDF and store in vector database for Q&A and summarization."""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        content = await file.read()
        
        if len(content) > settings.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds limit")
        
        file_path = save_uploaded_file(content, file.filename)
        result = await process_pdf_for_vector_store(file_path, file.filename)
        
        if os.path.exists(file_path):
            os.remove(file_path)
        
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])
        
        success = add_documents_to_store(
            texts=result["chunks"],
            metadatas=result["metadatas"],
            document_id=result["document_id"]
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to store document")
        
        return DocumentUploadResponse(
            document_id=result["document_id"],
            filename=result["filename"],
            chunks=result["total_chunks"],
            message=f"PDF uploaded successfully. Use document_id for summarization and Q&A."
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/list")
async def list_uploaded_documents():
    """List all documents uploaded to vector store."""
    try:
        documents = list_all_documents()
        return {"documents": documents, "count": len(documents)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document from vector store."""
    try:
        success = delete_document_by_id(document_id)
        if success:
            return {"message": f"Document deleted successfully"}
        raise HTTPException(status_code=404, detail="Document not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))