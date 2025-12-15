# Configuration (API keys, settings)
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    CHROMA_DB_PATH: str = os.getenv("CHROMA_DB_PATH", "./chroma_db")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: list = [".pdf"]
    DEFAULT_EMBEDDING_MODEL: str = "text-embedding-3-small"
    DEFAULT_RETRIEVAL_K: int = 2  # Fewer docs = faster



settings = Settings()
