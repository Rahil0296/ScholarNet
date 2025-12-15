# backend/app/services/read_aloud_service.py

from typing import List, Dict
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
from langchain_openai import OpenAIEmbeddings


def generate_embeddings(sentences: List[str]) -> List[List[float]]:
    embedder = OpenAIEmbeddings()
    return embedder.embed_documents(sentences)


def semantic_chunk_sentences(
    sentences: List[str],
    embeddings: List[List[float]],
    num_clusters: int = 5
) -> List[Dict]:

    X = np.array(embeddings)

    kmeans = KMeans(
        n_clusters=num_clusters,
        random_state=42,
        n_init="auto"
    )
    labels = kmeans.fit_predict(X)

    clusters = {}
    for sentence, label in zip(sentences, labels):
        clusters.setdefault(label, []).append(sentence)

    chunks = []
    for idx, chunk_sentences in clusters.items():
        chunks.append({
            "chunk_id": idx,
            "num_sentences": len(chunk_sentences),
            "text": " ".join(chunk_sentences)
        })

    return chunks
