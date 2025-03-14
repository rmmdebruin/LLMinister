import os
import PyPDF2
from pathlib import Path
from typing import List, Dict, Optional
import re

import nltk
from nltk.tokenize import word_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class KnowledgeBase:
    def __init__(self, pdf_dir: str):
        self.pdf_dir = Path(pdf_dir)
        self.documents = []  # List[Dict], each has { 'source', 'page', 'content', 'page_number', 'file_path' }
        self._text_list = []  # just the raw chunk texts
        self._vectorizer = TfidfVectorizer(stop_words='dutch')  # Use Dutch stopwords as we're dealing with Dutch text
        self._tfidf_matrix = None

        # Store PDF metadata for quicker reference
        self.pdf_metadata = {}  # Dict with filename as key

        # Make sure NLTK punkt is available
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')

        self._load_pdfs()
        self._build_index()

    def _load_pdfs(self):
        """
        Load each PDF in pdf_dir, parse each page, and store content by page.
        Each page is a separate chunk with its own metadata.
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
                file_path = str(pdf_file)
                with open(pdf_file, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    num_pages = len(reader.pages)

                    # Store metadata about this PDF
                    self.pdf_metadata[pdf_file.name] = {
                        'path': file_path,
                        'num_pages': num_pages,
                        'title': pdf_file.stem  # Use filename without extension as title
                    }

                    for page_idx in range(num_pages):
                        page = reader.pages[page_idx]
                        text = page.extract_text()
                        if not text:
                            continue

                        # Store entire page as one chunk
                        doc = {
                            "source": pdf_file.name,
                            "page": page_idx + 1,  # pages are 1-based for display
                            "content": text.strip(),
                            "page_number": page_idx + 1,
                            "file_path": file_path
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
        print(f"KnowledgeBase loaded {len(self.documents)} pages from PDFs.")

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Return top_k relevant pages in the form:
        { 'source': ..., 'page': ..., 'content': ..., 'page_number': ..., 'file_path': ... }
        """
        if not self.documents or not self._tfidf_matrix:
            return []

        query_vec = self._vectorizer.transform([query])
        sim_scores = cosine_similarity(query_vec, self._tfidf_matrix).flatten()

        # Get best indices sorted by similarity score
        best_indices = sim_scores.argsort()[-top_k:][::-1]

        # Create results with similarity scores for better context awareness
        results = []
        for idx in best_indices:
            doc = self.documents[idx].copy()  # Make a copy to avoid modifying original
            doc['similarity_score'] = float(sim_scores[idx])
            results.append(doc)

        return results

    def get_pdf_page(self, source: str, page: int) -> Optional[Dict]:
        """
        Return a specific page from a specific source.
        """
        for doc in self.documents:
            if doc["source"] == source and doc["page"] == page:
                return doc
        return None