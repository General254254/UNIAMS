"""
TF-IDF cosine similarity engine.
CRITICAL: only call with texts from the SAME assignment — never cross-unit.
"""
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def compute_similarity_matrix(texts: list) -> np.ndarray:
    """
    Compute pairwise cosine similarity for a list of document texts.
    Returns an (n x n) float matrix.
    Empty documents are replaced with a whitespace sentinel so the vectorizer
    does not raise an error; their similarity score will be ~0.
    """
    n = len(texts)
    if n < 2:
        return np.zeros((n, n))

    # Replace blank documents with a sentinel to avoid zero-vector issues
    cleaned = [t.strip() if t.strip() else ' ' for t in texts]

    vectorizer = TfidfVectorizer(stop_words='english', min_df=1)
    tfidf_matrix = vectorizer.fit_transform(cleaned)
    return cosine_similarity(tfidf_matrix)
