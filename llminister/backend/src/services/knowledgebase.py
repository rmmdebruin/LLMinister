import os
import math
import PyPDF2
from pathlib import Path
from typing import List, Dict
import re

import nltk
from nltk.tokenize import word_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Make sure you have installed:
# pip install PyPDF2 scikit-learn nltk

# If needed, do nltk.download('punkt') once

class KnowledgeBase:
    def __init__(self, pdf_dir: str):
        self.pdf_dir = Path(pdf_dir)
        self.documents = []  # List[Dict], each has { 'source', 'page', 'content' }
        self._text_list = []  # just the raw chunk texts
        self._vectorizer = TfidfVectorizer(stop_words='english')
        self._tfidf_matrix = None

        # Make sure NLTK punkt is available
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')

        self._load_pdfs()
        self._build_index()

    def _load_pdfs(self):
        """
        Load each PDF in pdf_dir, parse each page, chunk it into segments of ~600 words,
        store them as {source, page, content} in self.documents.
        """
        if not self.pdf_dir.exists():
            print(f"Knowledge base directory {self.pdf_dir} does not exist.")
            return

        pdf_files = list(self.pdf_dir.glob("*.pdf"))
        if not pdf_files:
            print("No PDF files found in knowledgebase.")
            return

        for pdf_file in pdf_files:
            try:
                with open(pdf_file, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    num_pages = len(reader.pages)
                    for page_idx in range(num_pages):
                        page = reader.pages[page_idx]
                        text = page.extract_text()
                        if not text:
                            continue
                        # chunk into ~600 tokens
                        chunks = chunk_text(text, chunk_size=600)
                        for chunk_i, chunk_text in enumerate(chunks):
                            doc = {
                                "source": pdf_file.name,
                                "page": page_idx + 1,  # pages are 1-based
                                "content": chunk_text.strip()
                            }
                            self.documents.append(doc)
            except Exception as e:
                print(f"Error reading {pdf_file.name}: {e}")

    def _build_index(self):
        """
        Build TF-IDF index from self.documents.
        """
        if not self.documents:
            print("No documents to index.")
            return
        # build self._text_list
        self._text_list = [doc["content"] for doc in self.documents]
        self._tfidf_matrix = self._vectorizer.fit_transform(self._text_list)
        print(f"KnowledgeBase loaded {len(self.documents)} chunks from PDFs.")

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Return top_k relevant chunks in the form:
        { 'source': ..., 'page': ..., 'content': ... }
        """
        if not self.documents or not self._tfidf_matrix:
            return []

        query_vec = self._vectorizer.transform([query])
        sim_scores = cosine_similarity(query_vec, self._tfidf_matrix).flatten()
        best_indices = sim_scores.argsort()[-top_k:][::-1]

        results = []
        for idx in best_indices:
            results.append(self.documents[idx])
        return results

def chunk_text(text: str, chunk_size=600) -> List[str]:
    """
    Tokenize the text into words, group ~600 words per chunk, return list of chunk strings.
    """
    words = word_tokenize(text)
    chunks = []
    current = []
    for w in words:
        current.append(w)
        if len(current) >= chunk_size:
            chunks.append(" ".join(current))
            current = []
    if current:
        chunks.append(" ".join(current))
    return chunks
