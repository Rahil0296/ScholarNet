# MCQ generation with document_id support and topic analysis
import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.services.llm_service import get_llm
from app.utils.vector_store import get_document_by_id
from app.utils.helpers import chunk_text
from typing import Optional, List, Dict
import asyncio
from collections import defaultdict


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
        Dict with questions list, topic analysis, and metadata
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
                    "questions": [],
                    "topics": []
                }
            
            text = document['text']
            source_filename = document['metadata'].get('source', 'Unknown')
        
        # Validate we have text
        if not text:
            return {
                "status": "error",
                "message": "No text or document_id provided",
                "questions": [],
                "topics": []
            }
        
        # For very long documents, sample key sections
        if len(text) > 50000:
            chunks = chunk_text(text, chunk_size=15000, overlap=0)
            questions_per_chunk = max(2, num_questions // len(chunks))
            
            all_questions = []
            
            for i, chunk in enumerate(chunks[:5]):
                chunk_questions = await generate_mcqs_from_chunk(
                    chunk, 
                    min(questions_per_chunk, num_questions - len(all_questions))
                )
                all_questions.extend(chunk_questions)
                
                if len(all_questions) >= num_questions:
                    break
            
            questions = all_questions[:num_questions]
        else:
            questions = await generate_mcqs_from_chunk(text, num_questions)
        
        # Extract unique topics from questions
        topics = extract_topics(questions)
        
        return {
            "status": "success",
            "questions": questions,
            "total_questions": len(questions),
            "topics": topics,
            "source": source_filename
        }
    
    except Exception as e:
        print(f"Error generating MCQs: {e}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": str(e),
            "questions": [],
            "topics": []
        }


def extract_topics(questions: List[Dict]) -> List[Dict]:
    """
    Extract unique topics from questions with question indices.
    
    Returns:
        List of topic dicts with name and question indices
    """
    topic_questions = defaultdict(list)
    
    for idx, q in enumerate(questions):
        topic = q.get('topic', 'General')
        topic_questions[topic].append(idx)
    
    topics = [
        {
            "name": topic,
            "question_indices": indices,
            "question_count": len(indices)
        }
        for topic, indices in topic_questions.items()
    ]
    
    return sorted(topics, key=lambda x: x['name'])


async def generate_mcqs_from_chunk(text: str, num_questions: int) -> list:
    """Generate MCQs from a single text chunk."""
    
    llm = get_llm(model="gpt-3.5-turbo", temperature=0.3)
    
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
7. IMPORTANT: Add a "topic" field indicating the main concept/topic the question tests
   - Use concise topic names (e.g., "Neural Networks", "Supervised Learning", "Regularization", "Decision Trees")
   - Be consistent with topic naming across questions

Return ONLY valid JSON in this EXACT format (no markdown, no extra text):
[
    {{
        "question": "Clear question text here?",
        "topic": "Main concept this question tests",
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
    
    chain = prompt | llm | StrOutputParser()
    
    result = await chain.ainvoke({
        "text": text[:10000],
        "num_questions": num_questions
    })
    
    try:
        cleaned_result = result.strip()
        
        if cleaned_result.startswith("```json"):
            cleaned_result = cleaned_result[7:]
        if cleaned_result.startswith("```"):
            cleaned_result = cleaned_result[3:]
        if cleaned_result.endswith("```"):
            cleaned_result = cleaned_result[:-3]
        
        cleaned_result = cleaned_result.strip()
        
        questions = json.loads(cleaned_result)
        
        validated_questions = []
        for q in questions:
            if (isinstance(q, dict) and 
                "question" in q and 
                "options" in q and 
                isinstance(q["options"], list) and
                len(q["options"]) == 4):
                
                correct_count = sum(1 for opt in q["options"] if opt.get("is_correct", False))
                if correct_count == 1:
                    # Ensure topic exists
                    if "topic" not in q or not q["topic"]:
                        q["topic"] = "General"
                    validated_questions.append(q)
        
        return validated_questions
    
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Raw response: {result}")
        return []
    except Exception as e:
        print(f"Validation error: {e}")
        return []


async def evaluate_mcq_answers(
    questions: List[Dict],
    user_answers: Dict[int, int]
) -> Dict:
    """
    Evaluate user answers and provide topic-wise analysis.
    
    Args:
        questions: List of MCQ questions
        user_answers: Dict mapping question index to selected option index
    
    Returns:
        Dict with score, topic analysis, and feedback
    """
    topic_stats = defaultdict(lambda: {
        "total": 0,
        "correct": 0,
        "incorrect": 0,
        "questions": []
    })
    
    total_correct = 0
    total_questions = len(questions)
    
    for idx, question in enumerate(questions):
        topic = question.get("topic", "General")
        user_answer_idx = user_answers.get(idx)
        
        is_correct = False
        if user_answer_idx is not None:
            selected_option = question["options"][user_answer_idx]
            is_correct = selected_option.get("is_correct", False)
        
        topic_stats[topic]["total"] += 1
        topic_stats[topic]["questions"].append({
            "index": idx,
            "correct": is_correct,
            "question": question["question"][:100] + "..."
        })
        
        if is_correct:
            total_correct += 1
            topic_stats[topic]["correct"] += 1
        else:
            topic_stats[topic]["incorrect"] += 1
    
    # Build topic analysis
    topic_analysis = []
    for topic, stats in topic_stats.items():
        percentage = round((stats["correct"] / stats["total"]) * 100) if stats["total"] > 0 else 0
        
        # Determine performance level
        if percentage == 100:
            performance = "excellent"
        elif percentage >= 80:
            performance = "strong"
        elif percentage >= 60:
            performance = "good"
        elif percentage >= 40:
            performance = "needs_practice"
        else:
            performance = "weak"
        
        topic_analysis.append({
            "topic": topic,
            "total": stats["total"],
            "correct": stats["correct"],
            "incorrect": stats["incorrect"],
            "percentage": percentage,
            "performance": performance,
            "questions": stats["questions"]
        })
    
    # Sort by percentage (weakest first)
    topic_analysis.sort(key=lambda x: x["percentage"])
    
    # Identify weak and strong topics
    weak_topics = [t["topic"] for t in topic_analysis if t["percentage"] < 60]
    strong_topics = [t["topic"] for t in topic_analysis if t["percentage"] >= 80]
    
    # Calculate overall percentage
    overall_percentage = round((total_correct / total_questions) * 100) if total_questions > 0 else 0
    
    return {
        "total_questions": total_questions,
        "total_correct": total_correct,
        "overall_percentage": overall_percentage,
        "topic_analysis": topic_analysis,
        "weak_topics": weak_topics,
        "strong_topics": strong_topics,
        "recommendations": generate_recommendations(topic_analysis)
    }


def generate_recommendations(topic_analysis: List[Dict]) -> List[str]:
    """Generate study recommendations based on topic analysis."""
    recommendations = []
    
    weak_topics = [t for t in topic_analysis if t["percentage"] < 60]
    
    for topic in weak_topics:
        if topic["percentage"] == 0:
            recommendations.append(
                f"🔴 {topic['topic']}: You need to review this topic thoroughly. "
                f"All {topic['total']} questions were incorrect."
            )
        elif topic["percentage"] < 40:
            recommendations.append(
                f"🟠 {topic['topic']}: This is a weak area. "
                f"Review the concepts and practice more questions."
            )
        else:
            recommendations.append(
                f"🟡 {topic['topic']}: You're getting there! "
                f"A bit more practice will help solidify your understanding."
            )
    
    if not recommendations:
        recommendations.append("🟢 Great job! You have a good understanding of all topics.")
    
    return recommendations