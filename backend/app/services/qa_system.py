# Q&A with ChromaDB
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from app.services.llm_service import get_llm
from app.utils.vector_store import get_vector_store


async def answer_question(question: str, context: str = None) -> dict:
    """Answer question using context or vector store."""
    llm = get_llm(temperature=0.5)
    
    if context:
        # Direct context-based QA
        prompt = PromptTemplate(
            input_variables=["context", "question"],
            template="""Based on the following context, answer the question.
            
            Context: {context}
            
            Question: {question}
            
            Answer:"""
        )
        
        from langchain.chains import LLMChain
        chain = LLMChain(llm=llm, prompt=prompt)
        answer = await chain.arun(context=context, question=question)
        
        return {"answer": answer.strip(), "sources": None}
    
    else:
        # Vector store retrieval-based QA
        vector_store = get_vector_store()
        retriever = vector_store.as_retriever(search_kwargs={"k": 3})
        
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True
        )
        
        result = await qa_chain.acall({"query": question})
        
        sources = [doc.page_content[:100] for doc in result.get("source_documents", [])]
        
        return {"answer": result["result"], "sources": sources}
