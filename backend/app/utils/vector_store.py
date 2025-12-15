# ChromaDB initialization
import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from app.config import settings

_vector_store = None


def get_vector_store() -> Chroma:
    """Get or initialize ChromaDB vector store."""
    global _vector_store
    
    if _vector_store is None:
        embeddings = OpenAIEmbeddings(openai_api_key=settings.OPENAI_API_KEY)
        
        _vector_store = Chroma(
            persist_directory=settings.CHROMA_DB_PATH,
            embedding_function=embeddings,
            collection_name="scholarnet_docs"
        )
    
    return _vector_store


def add_documents_to_store(texts: list, metadatas: list = None):
    """Add documents to the vector store."""
    vector_store = get_vector_store()
    vector_store.add_texts(texts=texts, metadatas=metadatas)
    return True


def clear_vector_store():
    """Clear all documents from the vector store."""
    global _vector_store
    _vector_store = None
