# MCQ generation with document_id support
import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.services.llm_service import get_llm
from app.utils.vector_store import get_document_by_id
from app.utils.helpers import chunk_text
from typing import Optional
import asyncio


async def generate_mcqs(
    text: Optional[str] = None,
    document_id: Optional[str] = None,
    num_questions: int = 10
) -> dict:
    """
    Generate MCQs from text or stored document.
    
    Args:
        text: Direct text to generate MCQs from
        document_id: ID of document in vector store
        num_questions: Number of questions to generate (default: 10)
    
    Returns:
        Dict with questions list and metadata
    """
    try:
        source_filename = None
        
        # Get text from vector store if document_id provided
        if document_id and not text:
            document = get_document_by_id(document_id)
            
            if not document:
                return {
                    "status": "error",
                    "message": "Document not found",
                    "questions": []
                }
            
            text = document['text']
            source_filename = document['metadata'].get('source', 'Unknown')
        
        # Validate we have text
        if not text:
            return {
                "status": "error",
                "message": "No text or document_id provided",
                "questions": []
            }
        
        # For very long documents, sample key sections
        # This ensures MCQs cover the entire document
        if len(text) > 50000:
            # Split into chunks and sample from different parts
            chunks = chunk_text(text, chunk_size=15000, overlap=0)
            # Take questions from multiple chunks to cover whole document
            questions_per_chunk = max(2, num_questions // len(chunks))
            
            all_questions = []
            
            for i, chunk in enumerate(chunks[:5]):  # Max 5 chunks to keep it reasonable
                chunk_questions = await generate_mcqs_from_chunk(
                    chunk, 
                    min(questions_per_chunk, num_questions - len(all_questions))
                )
                all_questions.extend(chunk_questions)
                
                if len(all_questions) >= num_questions:
                    break
            
            # Take exactly num_questions
            questions = all_questions[:num_questions]
        else:
            # Document is small enough to process directly
            questions = await generate_mcqs_from_chunk(text, num_questions)
        
        return {
            "status": "success",
            "questions": questions,
            "total_questions": len(questions),
            "source": source_filename
        }
    
    except Exception as e:
        print(f"Error generating MCQs: {e}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": str(e),
            "questions": []
        }


async def generate_mcqs_from_chunk(text: str, num_questions: int) -> list:
    """Generate MCQs from a single text chunk."""
    
    # Use GPT-3.5 for speed (good quality for MCQs)
    llm = get_llm(model="gpt-3.5-turbo", temperature=0.3)
    
    # Create prompt template
    prompt = ChatPromptTemplate.from_template(
        """You are an expert teacher creating multiple choice questions to test understanding.

Based on the following text, generate {num_questions} multiple choice questions.

Text: {text}

CRITICAL INSTRUCTIONS:
1. Create questions that test UNDERSTANDING, not just memorization
2. Each question must have EXACTLY 4 options (A, B, C, D)
3. Only ONE option should be correct
4. Make incorrect options plausible but clearly wrong
5. Cover different topics from the text
6. Questions should be clear and unambiguous

Return ONLY valid JSON in this EXACT format (no markdown, no extra text):
[
    {{
        "question": "Clear question text here?",
        "options": [
            {{"option": "Option A text", "is_correct": false}},
            {{"option": "Option B text", "is_correct": true}},
            {{"option": "Option C text", "is_correct": false}},
            {{"option": "Option D text", "is_correct": false}}
        ],
        "explanation": "Why option B is correct and others are wrong"
    }}
]

JSON Output:"""
    )
    
    # Create chain
    chain = prompt | llm | StrOutputParser()
    
    # Invoke the chain
    result = await chain.ainvoke({
        "text": text[:10000],  # Limit input to avoid token limits
        "num_questions": num_questions
    })
    
    # Parse JSON response
    try:
        # Clean the response (remove markdown code blocks if present)
        cleaned_result = result.strip()
        
        # Remove markdown code fences
        if cleaned_result.startswith("```json"):
            cleaned_result = cleaned_result[7:]
        if cleaned_result.startswith("```"):
            cleaned_result = cleaned_result[3:]
        if cleaned_result.endswith("```"):
            cleaned_result = cleaned_result[:-3]
        
        cleaned_result = cleaned_result.strip()
        
        # Parse JSON
        questions = json.loads(cleaned_result)
        
        # Validate structure
        validated_questions = []
        for q in questions:
            if (isinstance(q, dict) and 
                "question" in q and 
                "options" in q and 
                isinstance(q["options"], list) and
                len(q["options"]) == 4):
                
                # Ensure exactly one correct answer
                correct_count = sum(1 for opt in q["options"] if opt.get("is_correct", False))
                if correct_count == 1:
                    validated_questions.append(q)
        
        return validated_questions
    
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Raw response: {result}")
        return []
    except Exception as e:
        print(f"Validation error: {e}")
        return []