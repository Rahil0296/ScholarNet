# OpenAI/LangChain integration
from langchain_openai import ChatOpenAI
from app.config import settings


def get_llm(model: str = "gpt-4", temperature: float = 0.1):
    """Initialize and return LLM instance."""
    return ChatOpenAI(
        model="gpt-5-nano" if model == "gpt-4" else model,
        temperature=temperature,
        openai_api_key=settings.OPENAI_API_KEY
    )
