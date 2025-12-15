# OpenAI/LangChain integration
from langchain_openai import ChatOpenAI
from app.config import settings


def get_llm(model: str = "gpt-3.5-turbo", temperature: float = 0.7):
    """Initialize and return LLM instance."""
    return ChatOpenAI(
        model=model,
        temperature=temperature,
        openai_api_key=settings.OPENAI_API_KEY
    )
