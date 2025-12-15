// API service for backend communication
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ScholarNetAPI {
  constructor() {
    this.baseURL = API_URL;
  }

  // PDF Upload
  async uploadPDF(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/pdf-upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload PDF');
    }

    return response.json();
  }

  // Generate Summary
  async generateSummary(documentId, summaryType = 'learning', maxLength = 500) {
    const response = await fetch(`${this.baseURL}/api/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_id: documentId,
        summary_type: summaryType,
        max_length: maxLength,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate summary');
    }

    return response.json();
  }

  // Ask Question
// Update askQuestion in api.js
async askQuestion(question, documentId, sessionId = null) {
  const response = await fetch(`${this.baseURL}/api/qa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      document_id: documentId,
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get answer');
  }

  return response.json();
}

  // Generate MCQs
async generateMCQs(documentId) {
  const response = await fetch(`${this.baseURL}/api/mcq`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      document_id: documentId,
      num_questions: 10
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate MCQs');
  }

  return response.json();
}

  // List Documents
  async listDocuments() {
    const response = await fetch(`${this.baseURL}/api/documents/list`);
    
    if (!response.ok) {
      throw new Error('Failed to list documents');
    }

    return response.json();
  }

  // Delete Document
  async deleteDocument(documentId) {
    const response = await fetch(`${this.baseURL}/api/documents/${documentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }

    return response.json();
  }
}

export default new ScholarNetAPI();