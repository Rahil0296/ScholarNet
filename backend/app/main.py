# FastAPI app initialization
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import read_aloud

from app.routes import summarizer, qa, mcq, pdf

app = FastAPI(
    title="ScholarNet API",
    description="Backend API for ScholarNet - AI-powered learning assistant",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(summarizer.router, prefix="/api", tags=["Summarizer"])
app.include_router(qa.router, prefix="/api", tags=["Q&A"])
app.include_router(mcq.router, prefix="/api", tags=["MCQ"])
app.include_router(pdf.router, prefix="/api", tags=["PDF"])
app.include_router(read_aloud.router, prefix="/api", tags=["ReadAloud"])


@app.get("/")
async def root():
    return {"message": "Welcome to ScholarNet API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
