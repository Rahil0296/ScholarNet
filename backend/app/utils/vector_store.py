# ChromaDB initialization - OPTIMIZED & FIXED
import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from app.config import settings
from typing import Optional
import os
import shutil
import uuid

_vector_store = None


def get_vector_store() -> Chroma:
    """Get or initialize ChromaDB vector store with optimized settings."""
    global _vector_store
    
    if _vector_store is None:
        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=settings.OPENAI_API_KEY
        )
        
        os.makedirs(settings.CHROMA_DB_PATH, exist_ok=True)
        
        _vector_store = Chroma(
            persist_directory=settings.CHROMA_DB_PATH,
            embedding_function=embeddings,
            collection_name="scholarnet_docs"
        )
    
    return _vector_store


def get_optimized_retriever(k: int = 2, search_type: str = "similarity"):
    """Get optimized retriever for fast queries."""
    vector_store = get_vector_store()
    
    if search_type == "mmr":
        return vector_store.as_retriever(
            search_type="mmr",
            search_kwargs={
                "k": k,
                "lambda_mult": 0.5
            }
        )
    else:
        return vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": k}
        )


def add_documents_to_store(texts: list, metadatas: list = None, document_id: str = None) -> bool:
    """Add documents to the vector store with document ID."""
    try:
        vector_store = get_vector_store()
        
        # Generate document ID if not provided
        if not document_id:
            document_id = str(uuid.uuid4())
        
        # Add document_id to all metadata
        if metadatas:
            for metadata in metadatas:
                metadata['document_id'] = document_id
        else:
            metadatas = [{'document_id': document_id} for _ in texts]
        
        # Add texts in batches
        batch_size = 50
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            batch_metadatas = metadatas[i:i + batch_size]
            
            vector_store.add_texts(
                texts=batch_texts,
                metadatas=batch_metadatas
            )
        
        vector_store.persist()
        return True
    
    except Exception as e:
        print(f"Error adding documents: {e}")
        return False


# ✅ NEW: Retrieve full document by ID
def get_document_by_id(document_id: str) -> Optional[dict]:
    """
    Retrieve all chunks of a document and reconstruct full text.
    
    Returns:
        dict with 'text', 'metadata', and 'chunks_count'
    """
    try:
        vector_store = get_vector_store()
        collection = vector_store._collection
        
        # Get all chunks with this document_id
        results = collection.get(
            where={"document_id": document_id},
            include=["documents", "metadatas"]
        )
        
        if not results or not results.get('documents'):
            return None
        
        # Combine all chunks
        full_text = "\n\n".join(results['documents'])
        
        # Get metadata from first chunk
        metadata = results['metadatas'][0] if results['metadatas'] else {}
        
        return {
            "text": full_text,
            "metadata": metadata,
            "chunks_count": len(results['documents']),
            "document_id": document_id
        }
    
    except Exception as e:
        print(f"Error retrieving document: {e}")
        return None


# ✅ NEW: List all documents
def list_all_documents() -> list:
    """Get list of all unique documents in the store."""
    try:
        vector_store = get_vector_store()
        collection = vector_store._collection
        
        # Get all items
        results = collection.get(include=["metadatas"])
        
        if not results or not results.get('metadatas'):
            return []
        
        # Extract unique documents
        documents = {}
        for metadata in results['metadatas']:
            doc_id = metadata.get('document_id')
            if doc_id and doc_id not in documents:
                documents[doc_id] = {
                    'document_id': doc_id,
                    'filename': metadata.get('source', 'Unknown'),
                    'page': metadata.get('page', 0)
                }
        
        return list(documents.values())
    
    except Exception as e:
        print(f"Error listing documents: {e}")
        return []


def search_documents(query: str, k: int = 3) -> list:
    """Search for similar documents."""
    try:
        vector_store = get_vector_store()
        results = vector_store.similarity_search_with_score(query, k=k)
        return results
    except Exception as e:
        print(f"Error searching documents: {e}")
        return []


def clear_vector_store() -> bool:
    """Clear all documents from the vector store and reset."""
    global _vector_store
    
    try:
        if os.path.exists(settings.CHROMA_DB_PATH):
            shutil.rmtree(settings.CHROMA_DB_PATH)
        
        _vector_store = None
        print("Vector store cleared successfully")
        return True
    
    except Exception as e:
        print(f"Error clearing vector store: {e}")
        return False


def get_collection_stats() -> dict:
    """Get statistics about the vector store."""
    try:
        vector_store = get_vector_store()
        collection = vector_store._collection
        
        return {
            "count": collection.count(),
            "name": collection.name,
            "metadata": collection.metadata if hasattr(collection, 'metadata') else {}
        }
    except Exception as e:
        print(f"Error getting collection stats: {e}")
        return {"count": 0, "error": str(e)}


def delete_documents_by_metadata(metadata_filter: dict) -> bool:
    """Delete documents matching metadata filter."""
    try:
        vector_store = get_vector_store()
        collection = vector_store._collection
        
        results = collection.get(where=metadata_filter)
        
        if results and results.get('ids'):
            collection.delete(ids=results['ids'])
            print(f"Deleted {len(results['ids'])} documents")
            return True
        
        return False
    
    except Exception as e:
        print(f"Error deleting documents: {e}")
        return False


# ✅ NEW: Delete document by ID
def delete_document_by_id(document_id: str) -> bool:
    """Delete all chunks of a specific document."""
    return delete_documents_by_metadata({"document_id": document_id})