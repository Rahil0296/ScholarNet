# ScholarNet

### AI-Powered Learning Assistant

Transform any PDF into an interactive learning experience with RAG-based Q&A, intelligent summarization, adaptive quizzes with topic analytics, and semantic text-to-speech.

---

## Features

| Feature | Description |
|---------|-------------|
|  **PDF Upload & Preview** | Upload any PDF with side-by-side preview while chatting |
|  **Conversational Q&A** | ChatGPT-style interface with conversation memory—ask follow-up questions naturally |
|  **Smart Summarization** | Generate concise or detailed summaries with one click |
|  **Adaptive MCQ Quizzes** | AI-generated quizzes with **topic-wise performance analysis** |
|  **Semantic Read Aloud** | Text-to-speech that groups related content together |

---

## Why ScholarNet?

Most AI tools either:
- **Hallucinate** (ChatGPT without document grounding)
- **Require manual work** (Quizlet flashcard creation)
- **Give useless feedback** ("You scored 7/10" tells you nothing)

**ScholarNet is different:**

```
┌─────────────────────────────────────────────────────────────┐
│                    THE SCHOLARNET DIFFERENCE                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│      Other Tools           ScholarNet                       │
│   ─────────────          ────────────                       │
│   "You got 70%"    →     "You're weak in Regularization,    │
│                           strong in Neural Networks.        │
│                           Review Chapter 4."                │
│                                                             │
│   Generic answers  →     Answers grounded in YOUR document  │
│                                                             │
│   No context       →     "As we discussed earlier..."       │
│                          (remembers conversation)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

##  Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         SCHOLARNET                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│   │   React     │────▶│   FastAPI   │────▶│   OpenAI    │        │
│   │   Frontend  │◀────│   Backend   │◀────│   GPT-3.5   │        │
│   └─────────────┘     └──────┬──────┘     └─────────────┘        │
│                              │                                   │
│                              ▼                                   │
│                       ┌─────────────┐                            │
│                       │  ChromaDB   │                            │
│                       │  (Vectors)  │                            │
│                       └─────────────┘                            │
│                                                                  │
│   PDF ──▶ Chunks ──▶ Embeddings ──▶ Vector Search ──▶ RAG        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

##  Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- OpenAI API Key

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/scholarnet.git
cd scholarnet
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env

# Run the server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

### 4. Open in Browser

Navigate to `http://localhost:5173`

---

## 📁 Project Structure

```
ScholarNet/
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── pdf.py           # PDF upload & document management
│   │   │   ├── qa.py            # Q&A with conversation history
│   │   │   ├── summarizer.py    # Summary generation
│   │   │   ├── mcq.py           # MCQ generation & evaluation
│   │   │   └── read_aloud.py    # Semantic chunking
│   │   │
│   │   ├── services/
│   │   │   ├── llm_service.py       # OpenAI/LangChain integration
│   │   │   ├── qa_system.py         # RAG + conversation memory
│   │   │   ├── summarizer.py        # Summarization logic
│   │   │   ├── mcq_generator.py     # MCQ + topic extraction
│   │   │   ├── pdf_processor.py     # PDF text extraction
│   │   │   └── read_aloud_service.py # Semantic chunking
│   │   │
│   │   ├── utils/
│   │   │   ├── vector_store.py  # ChromaDB operations
│   │   │   └── helpers.py       # Utility functions
│   │   │
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic models
│   │   │
│   │   ├── config.py            # Configuration
│   │   └── main.py              # FastAPI app entry point
│   │
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── QAChat.jsx       # Chat interface
│   │   │   ├── Summary.jsx      # Summary component
│   │   │   ├── MCQGenerator.jsx # Quiz with analytics
│   │   │   ├── PDFPreview.jsx   # PDF viewer
│   │   │   └── ReadAloud.jsx    # TTS component
│   │   │
│   │   ├── services/
│   │   │   └── api.js           # API client
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

##  API Endpoints

| Endpoint |                Method | Description |
|----------|-----------------------|-------------|
| `/api/pdf-upload`         | POST | Upload PDF and index in vector store |
| `/api/qa`                 | POST | Ask questions with conversation history |
| `/api/summarize`.         | POST | Generate document summary |
| `/api/mcq`                | POST | Generate MCQ questions |
| `/api/mcq/evaluate`       | POST | Evaluate answers & get topic analysis |
| `/api/documents/list`     | GET |  List all uploaded documents |
| `/api/documents/{id}`     | DELETE | Delete a document |
| `/api/documents/{id}/text`| GET |   Get document text for read aloud |
| `/api/read-aloud`         | POST |  Get semantic chunks for TTS |

---

##  How It Works

### RAG (Retrieval-Augmented Generation)

```
User Question ──▶ Embed ──▶ Vector Search ──▶ Top K Chunks
                                                   │
                                                   ▼
                              ┌─────────────────────────────┐
                              │  Prompt:                    │
                              │  - Conversation History     │
                              │  - Retrieved Context        │
                              │  - User Question            │
                              └─────────────┬───────────────┘
                                            │
                                            ▼
                                    GPT-3.5-turbo
                                            │
                                            ▼
                                   Grounded Answer
```

### Topic-Wise MCQ Analysis

```
Questions with Topics ──▶ User Answers ──▶ Backend Evaluation
                                                   │
                                                   ▼
                              ┌─────────────────────────────┐
                              │  Topic Analysis:            │
                              │  • Neural Networks: 80%     │
                              │  • Regularization: 33%      │
                              │  • Gradient Descent: 100%   │
                              └─────────────────────────────┘
                                            │
                                            ▼
                              Personalized Recommendations
```

---

##  Configuration

Create a `.env` file in the `backend/` directory:

```env
# Required
OPENAI_API_KEY=sk-your-api-key-here

# Optional (defaults shown)
OPENAI_MODEL=gpt-3.5-turbo
CHROMA_DB_PATH=./chroma_db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
```

---

##  Tech Stack

### Backend
- **FastAPI** - High-performance async API framework
- **LangChain** - LLM orchestration and RAG pipelines
- **OpenAI GPT-3.5-turbo** - Language model
- **ChromaDB** - Vector database for semantic search
- **PyMuPDF (fitz)** - PDF text extraction
- **Sentence Transformers** - Embeddings for semantic chunking

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Web Speech API** - Text-to-speech

---

##  Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

---

##  Performance

| Operation | Time |
|-----------|------|
| PDF Upload (30 pages) | ~3-5 seconds |
| Q&A Response | ~1.5-3 seconds |
| MCQ Generation (10 questions) | ~10-15 seconds |
| Summary Generation | ~3-5 seconds |

---

##  Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

##  Team

- **Shubham Mojidra** - [GitHub](https://github.com/shubhzam) | [LinkedIn](https://linkedin.com/in/shubhammojidra)
- **Rahil Shaikh** - [GitHub](https://github.com/rahil0296) | [LinkedIn](https://www.linkedin.com/in/rahil-shaikh7/)

---

## Acknowledgments

- [LangChain](https://langchain.com/) for the amazing RAG framework
- [ChromaDB](https://trychroma.com/) for the vector database
- [OpenAI](https://openai.com/) or [Ollama][GrokAPI]
- Our Professor Dr. Sundeep Rangan for the project opportunity.

---

<p align="center">
  Made with ❤️ for students, by students
</p>

<p align="center">
  <a href="#-scholarnet">Back to top</a>
</p>
