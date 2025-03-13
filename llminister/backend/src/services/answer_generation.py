import os
import anthropic

from .knowledgebase import KnowledgeBase

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

# We'll create a single global knowledge base instance (for performance).
_kb = KnowledgeBase(pdf_dir="data/available_knowledge")

def generate_rag_answer(question_text: str, speaker: str = "Unknown", party: str = "Unknown", category: str = "Algemeen") -> str:
    """
    1. Use TF-IDF knowledge base to get top 5 relevant chunks
    2. Construct prompt with sources
    3. Call Anthropic
    4. Return the final draft answer with citations
    """
    if not ANTHROPIC_API_KEY:
        raise Exception("No ANTHROPIC_API_KEY in environment variables.")

    # 1. retrieve top k
    top_docs = _kb.search(question_text, top_k=5)

    # 2. build context with citations
    context_str = ""
    for doc in top_docs:
        # doc has { 'source': ..., 'page': ..., 'content': ... }
        context_str += f"Bron: {doc['source']} p.{doc['page']}\n{doc['content']}\n\n"

    # 3. build system and user messages
    system_message = """\
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
Asked by: {speaker} ({party})
Category: {category}
Available knowledge base (most relevant documents):
{context_str}
Please provide a draft answer to this parliamentary question, following the requirements in the system prompt."""

    # 4. Call Anthropic using Messages API
    client = anthropic.Client(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-3-7-sonnet-20250219",
        max_tokens=3000,
        system=system_message,
        messages=[
            {"role": "user", "content": user_message}
        ],
        temperature=0,
    )

    # 5. Extract the answer from the response
    return response.content[0].text.strip()