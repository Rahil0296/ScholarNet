# Q&A with Conversation History Support
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableParallel
from app.services.llm_service import get_llm
from app.utils.vector_store import get_optimized_retriever
from typing import Optional, List, Dict
from datetime import datetime
import uuid

# ✅ In-memory storage (for demo - use Redis/DB in production)
conversation_store = {}


class ConversationHistory:
    """Manage conversation history for a session."""
    
    def __init__(self, session_id: str = None):
        self.session_id = session_id or str(uuid.uuid4())
        self.messages = []
        self.created_at = datetime.now()
    
    def add_message(self, role: str, content: str):
        """Add a message to history."""
        self.messages.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
    
    def get_recent_context(self, n: int = 3) -> str:
        """Get last N exchanges as context."""
        recent = self.messages[-(n*2):]  # Last N Q&A pairs
        return "\n\n".join([
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in recent
        ])
    
    def clear(self):
        """Clear conversation history."""
        self.messages = []


def get_or_create_session(session_id: Optional[str] = None) -> ConversationHistory:
    """Get existing session or create new one."""
    if session_id and session_id in conversation_store:
        return conversation_store[session_id]
    
    new_session = ConversationHistory(session_id)
    conversation_store[new_session.session_id] = new_session
    return new_session


def format_docs(docs):
    """Format retrieved documents into a single string."""
    return "\n\n".join(doc.page_content[:300] for doc in docs)


def get_question_type(question: str) -> str:
    """Detect the type of question being asked."""
    question_lower = question.lower()
    
    if any(word in question_lower for word in ["why", "reason", "because"]):
        return "explanation"
    elif any(word in question_lower for word in ["how", "process", "steps", "way to"]):
        return "process"
    elif any(word in question_lower for word in ["what is", "define", "meaning"]):
        return "definition"
    elif any(word in question_lower for word in ["compare", "difference", "versus", "vs"]):
        return "comparison"
    elif any(word in question_lower for word in ["example", "instance", "demonstrate"]):
        return "example"
    else:
        return "general"


def get_prompt_with_history(question_type: str) -> str:
    """Get prompt that includes conversation history."""
    
    base_instructions = {
        "explanation": "Provide a clear explanation of WHY something happens",
        "process": "Explain HOW something works step-by-step",
        "definition": "Define and explain the concept clearly",
        "comparison": "Compare and contrast the concepts",
        "example": "Provide concrete examples",
        "general": "Answer the question thoroughly"
    }
    
    instruction = base_instructions.get(question_type, base_instructions["general"])
    
    return f"""You are a knowledgeable teacher helping a student understand a document.

CONVERSATION HISTORY:
{{conversation_history}}

CURRENT CONTEXT FROM DOCUMENT:
{{context}}

CURRENT QUESTION:
{{question}}

Instructions:
- {instruction}
- Use the conversation history to understand follow-up questions
- If the question refers to something discussed earlier, use that context
- Be conversational and natural
- If asked "tell me more" or "explain that", refer to the last topic discussed

Answer:"""


async def answer_question(
    question: str,
    context: str = None,
    session_id: Optional[str] = None,
    use_history: bool = True
) -> dict:
    """
    Answer question with optional conversation history.
    
    Args:
        question: User's question
        context: Optional direct context (if not using vector store)
        session_id: Session ID for conversation history
        use_history: Whether to use conversation history
    
    Returns:
        Dict with answer, sources, and session_id
    """
    
    llm = get_llm(model="gpt-3.5-turbo", temperature=0.3)
    
    # Get or create session
    session = get_or_create_session(session_id) if use_history else None
    
    # Get conversation history context
    conversation_history = ""
    if session and len(session.messages) > 0:
        conversation_history = session.get_recent_context(n=3)
    else:
        conversation_history = "No previous conversation"
    
    # Detect question type
    question_type = get_question_type(question)
    
    # Build prompt with history
    prompt_template = get_prompt_with_history(question_type)
    prompt = ChatPromptTemplate.from_template(prompt_template)
    
    if context:
        # Direct context provided
        context = context[:4000]
        
        chain = prompt | llm | StrOutputParser()
        answer = await chain.ainvoke({
            "context": context,
            "question": question,
            "conversation_history": conversation_history
        })
        
        # Store in history
        if session:
            session.add_message("user", question)
            session.add_message("assistant", answer.strip())
        
        return {
            "answer": answer.strip(),
            "sources": None,
            "session_id": session.session_id if session else None
        }
    
    else:
        # Retrieve from vector store
        retriever = get_optimized_retriever(k=3, search_type="similarity")
        
        rag_chain = (
            RunnableParallel({
                "context": retriever | format_docs,
                "question": RunnablePassthrough(),
                "conversation_history": lambda x: conversation_history
            })
            | prompt
            | llm
            | StrOutputParser()
        )
        
        retrieved_docs = await retriever.ainvoke(question)
        answer = await rag_chain.ainvoke(question)
        
        sources = [
            f"{doc.page_content[:150]}..."
            for doc in retrieved_docs
        ]
        
        # Store in history
        if session:
            session.add_message("user", question)
            session.add_message("assistant", answer.strip())
        
        return {
            "answer": answer.strip(),
            "sources": sources,
            "session_id": session.session_id if session else None
        }


# ✅ NEW: Session management functions
def get_conversation_history(session_id: str) -> List[Dict]:
    """Get full conversation history for a session."""
    if session_id in conversation_store:
        return conversation_store[session_id].messages
    return []


def clear_conversation(session_id: str) -> bool:
    """Clear conversation history for a session."""
    if session_id in conversation_store:
        conversation_store[session_id].clear()
        return True
    return False


def delete_session(session_id: str) -> bool:
    """Delete a session entirely."""
    if session_id in conversation_store:
        del conversation_store[session_id]
        return True
    return False


def list_active_sessions() -> List[str]:
    """List all active session IDs."""
    return list(conversation_store.keys())