# MCQ generation logic
import json
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from app.services.llm_service import get_llm


async def generate_mcqs(text: str, num_questions: int = 5) -> list:
    """Generate MCQs from the given text."""
    llm = get_llm(temperature=0.7)
    
    prompt = PromptTemplate(
        input_variables=["text", "num_questions"],
        template="""Based on the following text, generate {num_questions} multiple choice questions.
        
        Text: {text}
        
        Return the questions in the following JSON format:
        [
            {{
                "question": "Question text here",
                "options": [
                    {{"option": "Option A", "is_correct": false}},
                    {{"option": "Option B", "is_correct": true}},
                    {{"option": "Option C", "is_correct": false}},
                    {{"option": "Option D", "is_correct": false}}
                ],
                "explanation": "Brief explanation of the correct answer"
            }}
        ]
        
        Make sure each question has exactly 4 options with only one correct answer.
        
        JSON Output:"""
    )
    
    chain = LLMChain(llm=llm, prompt=prompt)
    result = await chain.arun(text=text, num_questions=num_questions)
    
    try:
        questions = json.loads(result.strip())
    except json.JSONDecodeError:
        questions = []
    
    return questions
