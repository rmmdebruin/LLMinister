#!/usr/bin/env python3
import os
import json
import argparse
from pathlib import Path
from typing import List, Dict, Any, Tuple
import anthropic
from anthropic import Anthropic
import PyPDF2
from dotenv import load_dotenv
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import datetime

class Document:
    def __init__(self, content: str, metadata: Dict[str, Any]):
        self.content = content
        self.metadata = metadata

    def __str__(self):
        return f"Document: {self.metadata['source']}, Page: {self.metadata['page']}\n{self.content}"

class KnowledgeBase:
    def __init__(self, knowledge_dir: str):
        self.knowledge_dir = Path(knowledge_dir)
        self.documents: List[Document] = []
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self._load_documents()
        self._create_index()

    def _load_documents(self):
        """Load all PDF documents from the knowledge directory."""
        print("Loading knowledge base documents...")
        for pdf_file in self.knowledge_dir.glob("*.pdf"):
            try:
                print(f"Processing {pdf_file.name}...")

                with open(pdf_file, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page_num, page in enumerate(pdf_reader.pages, 1):
                        content = page.extract_text()
                        if content.strip():  # Only store non-empty pages
                            doc = Document(
                                content=content.strip(),
                                metadata={
                                    "source": pdf_file.name,
                                    "page": page_num
                                }
                            )
                            self.documents.append(doc)

                print(f"Successfully loaded {len(pdf_reader.pages)} pages from {pdf_file.name}")
            except Exception as e:
                print(f"Error processing {pdf_file.name}: {str(e)}")

    def _create_index(self):
        """Create a TF-IDF index of the documents."""
        if not self.documents:
            print("No documents to index.")
            return

        contents = [doc.content for doc in self.documents]
        self.tfidf_matrix = self.vectorizer.fit_transform(contents)
        print(f"Created index with {len(self.documents)} documents.")

    def get_relevant_documents(self, query: str, top_k: int = 10) -> List[Document]:
        """Retrieve the most relevant documents for a query."""
        if not self.documents:
            return []

        # Transform query to TF-IDF vector
        query_vector = self.vectorizer.transform([query])

        # Calculate similarity scores
        similarity_scores = cosine_similarity(query_vector, self.tfidf_matrix).flatten()

        # Get indices of top_k most similar documents
        top_indices = similarity_scores.argsort()[-top_k:][::-1]

        # Return the top_k documents
        return [self.documents[i] for i in top_indices]

    def get_relevant_context(self, query: str, max_tokens: int = 100000) -> str:
        """Get relevant context for a query, limiting to max_tokens."""
        relevant_docs = self.get_relevant_documents(query, top_k=20)

        context_parts = []
        total_length = 0

        for doc in relevant_docs:
            doc_text = f"Document: {doc.metadata['source']}\nPage {doc.metadata['page']}:\n{doc.content}\n---\n"
            doc_tokens = len(doc_text.split())

            if total_length + doc_tokens > max_tokens:
                break

            context_parts.append(doc_text)
            total_length += doc_tokens

        return "\n".join(context_parts)

class AnswerGenerator:
    def __init__(self, api_key: str, knowledge_base: KnowledgeBase):
        self.client = Anthropic(api_key=api_key)
        self.knowledge_base = knowledge_base

    def generate_answer(self, question: Dict[str, Any]) -> str:
        """Generate a draft answer for a given question using Claude."""
        # Get the question text from the correct field
        question_text = question.get("question_text", question.get("text", ""))
        if not question_text:
            return "Error: No question text found in the question object."

        # Get relevant context using RAG
        context = self.knowledge_base.get_relevant_context(question_text, max_tokens=50000)

        system_prompt = """\
- You are an ambtenaar (public official) working for the Dutch Ministery of Economic Affairs.
- You are tasked with preparing answers to parliamentary questions about the Advisory Board on Regulatory Burden (ATR).
- These answers will be used by the Minister of Economic Affairs to answer questions in the Dutch House of Representatives.
- Your role is to provide thorough, formal, and factual answers based solely on the provided knowledge base.
- The Minister of Economic Affairs has a limited amount of time to answer the questions, so your answers should be concise and to the point.
- Aim for a word count between 100 and 300 words, depending on the complexity of the question.

Requirements for your answer:
1. Only use information from the provided knowledge base
2. For each claim or piece of information, cite the specific document and page number
3. Maintain a formal, thorough tone appropriate for parliamentary communication
4. If no relevant information is found in the knowledge base, explicitly state this
5. Structure your answer clearly and comprehensively
6. Focus only on information relevant to the specific question
7. There is no need to repeat to provide a header or to repeat the question in your answer.
8. Remember that your answers will be used as input by the Minister of Economic Affairs to answer questions in the Dutch House of Representatives.
9. Your answer should start directly with the answer to the question, without any introductory text.
10. Your answer should be in Dutch.

Format your answer with clear citations, e.g., "[Werkprogramma ATR 2025, p. 12]"."""

        user_message = f"""Question from parliament:
{question_text}

Asked by: {question.get("speaker", "Unknown")} ({question.get("party", "Unknown")})
Category: {question.get("category", "Unknown")}

Available knowledge base (most relevant documents):
{context}

Please provide a draft answer to this parliamentary question, following the requirements in the system prompt."""

        # Maximum number of retries
        max_retries = 6
        # Initial wait time in seconds
        wait_time = 10

        for attempt in range(max_retries):
            try:
                response = self.client.messages.create(
                    model="claude-3-7-sonnet-20250219",
                    max_tokens=4000,
                    temperature=0,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_message}]
                )
                return response.content[0].text
            except Exception as e:
                error_str = str(e)
                print(f"Error generating answer: {error_str}")

                # Check if it's a rate limit error (429)
                if "rate_limit_error" in error_str or "429" in error_str:
                    if attempt < max_retries - 1:  # Don't wait after the last attempt
                        retry_wait = wait_time * (attempt + 1)  # Exponential backoff
                        print(f"Rate limit exceeded. Waiting {retry_wait} seconds before retry {attempt + 1}/{max_retries}...")
                        import time
                        time.sleep(retry_wait)
                    else:
                        return f"Error generating answer: {error_str}"
                else:
                    # For other errors, don't retry
                    return f"Error generating answer: {error_str}"

        return "Error: Maximum retries exceeded for generating answer."

def main():
    parser = argparse.ArgumentParser(description="Generate draft answers for parliamentary questions")
    parser.add_argument("--questions-file", required=True, help="Path to the JSON file containing questions")
    parser.add_argument("--knowledge-dir", required=True, help="Path to the directory containing knowledge base PDFs")
    parser.add_argument("--output-file", required=True, help="Path to save the updated questions with draft answers")
    args = parser.parse_args()

    # Load environment variables
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_file = os.path.join(project_root, '.env.local')
    load_dotenv(env_file)

    api_key = os.getenv("NEXT_PUBLIC_ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError(f"NEXT_PUBLIC_ANTHROPIC_API_KEY not found in environment file: {env_file}")

    # Initialize knowledge base and answer generator
    knowledge_base = KnowledgeBase(args.knowledge_dir)
    generator = AnswerGenerator(api_key, knowledge_base)

    # Load questions
    with open(args.questions_file, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    # Import time module for delays
    import time

    # Generate answers for each question
    for i, question in enumerate(questions):
        print(f"\nGenerating answer for question: {question.get('question_text', '')[:100]}...")
        draft_answer = generator.generate_answer(question)

        # Check if the answer generation failed
        if draft_answer.startswith("Error generating answer:") or draft_answer.startswith("Error: Maximum retries exceeded"):
            print(f"Warning: Could not generate answer after retries. Saving error message as draft answer.")
        else:
            print("Answer generated successfully")

        question["draftAnswer"] = draft_answer

        # Add a delay between questions to avoid hitting rate limits
        # Only add delay if there are more questions to process
        if i < len(questions) - 1:
            delay = 5  # 5 seconds delay between questions
            print(f"Waiting {delay} seconds before processing next question...")
            time.sleep(delay)

    # Create a timestamp in the format YYYYMMDD_HHMMSS
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    try:
        # Create the answers directory path
        data_dir = os.path.dirname(os.path.dirname(args.output_file))
        answers_dir = os.path.join(data_dir, 'answers')

        # Ensure the answers directory exists
        os.makedirs(answers_dir, exist_ok=True)

        # Use the provided output file path if it has a .json extension
        # Otherwise, create a new filename with the timestamp
        if args.output_file.endswith('.json'):
            output_path = args.output_file
        else:
            # Create the output filename with the timestamp
            output_filename = f"questions_with_answers_{timestamp}.json"
            output_path = os.path.join(answers_dir, output_filename)

        # Save updated questions to the answers directory
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        print(f"\nUpdated questions saved to {output_path}")

    except Exception as e:
        print(f"Error saving answers: {str(e)}")
        raise

if __name__ == "__main__":
    main()