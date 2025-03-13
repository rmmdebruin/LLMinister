import os
import anthropic

from .knowledgebase import KnowledgeBase

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

# We'll create a single global knowledge base instance (for performance).
_kb = KnowledgeBase(pdf_dir="data/available_knowledge")

def generate_rag_answer(question_text: str) -> str:
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

    # 3. build instructions
    system_instructions = f"""
Je bent een AI-assistent voor de Minister van Economische Zaken in Nederland.
Je moet een conceptantwoord schrijven op deze vraag:

Vraag: {question_text}

Hier is relevante informatie uit de PDF-kennisbank, met bronvermelding:
{context_str}

INSTRUCTIES:
1. Schrijf het antwoord in het Nederlands, formeel van toon, alsof de minister spreekt in de ik-vorm.
2. Gebruik alleen informatie uit de context als basis. Niet afwijken.
3. Citeer elke claim met [Bestandsnaam, p. X] naar de bron.
4. Als er geen relevante info is, zeg dat er geen bronnen zijn.
5. Houd het bondig, maar volledig en feitelijk. (~100-200 woorden)
6. Begin direct met het antwoord, zonder extra inleiding.

Geef alleen het conceptantwoord als tekst.
    """

    import anthropic
    prompt_text = f"{anthropic.HUMAN_PROMPT} {system_instructions}\n\n{anthropic.AI_PROMPT}"

    client = anthropic.Client(api_key=ANTHROPIC_API_KEY)
    resp = client.completions.create(
        model="claude-3-7-sonnet-20250219",
        max_tokens_to_sample=3000,
        prompt=prompt_text,
        temperature=0,
    )

    return resp.completion.strip()
