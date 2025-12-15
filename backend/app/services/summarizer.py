# Summarization logic
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from app.services.llm_service import get_llm


async def summarize_text(text: str, max_length: int = 500) -> str:
    """Summarize the given text using LLM."""
    llm = get_llm(temperature=0.3)
    
    prompt = PromptTemplate(
        input_variables=["text", "max_length"],
        template="""Summarize the following text in approximately {max_length} words. 
        Maintain the key points and important details.
        
        Text: {text}
        
        Summary:"""
    )
    
    chain = LLMChain(llm=llm, prompt=prompt)
    result = await chain.arun(text=text, max_length=max_length)
    
    return result.strip()
