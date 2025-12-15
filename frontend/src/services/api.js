// API calls to backend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const summarizeText = async (text) => {
  const response = await fetch(`${API_BASE_URL}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return response.json();
};

export const askQuestion = async (question, context) => {
  const response = await fetch(`${API_BASE_URL}/qa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context }),
  });
  return response.json();
};

export const generateMCQ = async (text, numQuestions) => {
  const response = await fetch(`${API_BASE_URL}/mcq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, num_questions: numQuestions }),
  });
  return response.json();
};

export const processPDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/pdf-read`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
};
