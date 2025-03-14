import os
import re
import json
from typing import Dict, List, Tuple, Optional, Any
import anthropic

from .knowledgebase import KnowledgeBase

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

# Create a single global knowledge base instance (for performance)
_kb = KnowledgeBase(pdf_dir="data/available_knowledge")

def generate_rag_answer(question_text: str, speaker: str = "Unknown", party: str = "Unknown", category: str = "Algemeen") -> Dict:
    """
    1. Use TF-IDF knowledge base to get top 5 relevant pages
    2. Construct prompt with sources
    3. Call Anthropic with special instructions to include sentence-level citations
    4. Process the response to extract citations and structure data
    5. Return the final draft answer with structured citations and source metadata

    Returns a dict with:
    - answer_text: The formatted answer with citations
    - sources: List of source documents with metadata
    - sentences: List of {text, citations} mappings for frontend highlighting
    """
    if not ANTHROPIC_API_KEY:
        raise Exception("No ANTHROPIC_API_KEY in environment variables.")

    # 1. retrieve top k pages
    top_docs = _kb.search(question_text, top_k=5)

    # Create a unique ID for each source doc
    sources = []
    doc_id_map = {}  # Maps source+page to an ID

    for i, doc in enumerate(top_docs):
        source_id = f"source-{i+1}"
        doc_id_map[f"{doc['source']}|{doc['page']}"] = source_id

        sources.append({
            "id": source_id,
            "title": doc['source'],
            "page": doc['page'],
            "file_path": doc['file_path'],
            "similarity_score": doc.get('similarity_score', 0)
        })

    # 2. build context with citations and source IDs
    context_str = ""
    for i, doc in enumerate(top_docs):
        source_id = f"source-{i+1}"
        context_str += f"[{source_id}] Bron: {doc['source']} p.{doc['page']}\n{doc['content']}\n\n"

    # 3. build system and user messages with enhanced citation instructions
    system_message = """\
- Je bent een ambtenaar (public official) die werkt voor het Nederlandse Ministerie van Economische Zaken.
- Je taak is het voorbereiden van antwoorden op parlementaire vragen over het Adviescollege Toetsing Regeldruk (ATR).
- Deze antwoorden zullen worden gebruikt door de Minister van Economische Zaken om vragen in de Tweede Kamer te beantwoorden.
- Jouw rol is om grondige, formele en feitelijke antwoorden te geven, uitsluitend gebaseerd op de verstrekte kennisbasis.
- De Minister van Economische Zaken heeft beperkte tijd om de vragen te beantwoorden, dus je antwoorden moeten beknopt en to-the-point zijn.
- Streef naar een lengte tussen 100 en 300 woorden, afhankelijk van de complexiteit van de vraag.

Vereisten voor je antwoord:
1. Gebruik alleen informatie uit de verstrekte kennisbasis
2. Voor elke bewering of stukje informatie, citeer de specifieke bron met een bronvermelding aan het eind van ELKE ZIN
3. De citatie aan het eind van elke zin moet precies de source-ID volgen zoals aangegeven in de context, bijvoorbeeld: "[source-1]"
4. Gebruik een formele, grondige toon die past bij parlementaire communicatie
5. Als er geen relevante informatie wordt gevonden in de kennisbasis, vermeld dit expliciet
6. Structureer je antwoord duidelijk en volledig
7. Focus alleen op informatie die relevant is voor de specifieke vraag
8. Er is geen noodzaak om een header te geven of de vraag in je antwoord te herhalen
9. Onthoud dat je antwoorden zullen worden gebruikt als input door de Minister van Economische Zaken om vragen in de Tweede Kamer te beantwoorden
10. Begin je antwoord direct met het antwoord op de vraag, zonder inleidende tekst
11. Je antwoord moet in het Nederlands zijn
12. Plaats de bron altijd aan het einde van elke zin binnen vierkante haken

BELANGRIJK:
- Plaats aan het einde van ELKE ZIN de bijbehorende bronvermelding met de exacte source-ID tussen vierkante haken
- Volg dit formaat strikt: "Dit is een zin met informatie. [source-1]"
- Als een zin informatie bevat uit meerdere bronnen, citeer ze allemaal: "Dit is een gecombineerde zin. [source-1][source-3]"
- Elke zin MOET eindigen met minstens één bronvermelding
"""

    user_message = f"""Vraag uit het parlement:
{question_text}
Gesteld door: {speaker} ({party})
Categorie: {category}
Beschikbare kennisbasis (meest relevante documenten):
{context_str}
Geef een conceptantwoord op deze parlementaire vraag, volgens de vereisten in de systeemprompt."""

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

    # 5. Extract the answer text from the response
    answer_text = response.content[0].text.strip()

    # 6. Process the answer to extract sentence-level citations
    sentences = []
    # Split answer into sentences with their citations
    pattern = r'(.*?)(\[source-\d+\])+'

    # Find all sentences and their citations using regex
    for match in re.finditer(r'(.+?[.!?])\s*(\[source-\d+\](?:\[source-\d+\])*)', answer_text):
        sentence_text = match.group(1).strip()
        citations_text = match.group(2)

        # Extract all source IDs from the citations
        source_ids = re.findall(r'\[source-(\d+)\]', citations_text)

        # Map source IDs to the actual sources
        citations = []
        for source_id in source_ids:
            source_index = int(source_id) - 1
            if 0 <= source_index < len(sources):
                citations.append({
                    "source_id": f"source-{source_id}",
                    "title": sources[source_index]["title"],
                    "page": sources[source_index]["page"]
                })

        sentences.append({
            "text": sentence_text,
            "citations": citations
        })

    # Create the final structured result
    result = {
        "answer_text": answer_text,
        "sources": sources,
        "sentences": sentences
    }

    return result

def get_pdf_page_data(source: str, page: int) -> Dict:
    """
    Retrieve the specific PDF page data for displaying in the UI.
    """
    page_data = _kb.get_pdf_page(source, page)
    if not page_data:
        return {"error": "Page not found"}

    return {
        "source": page_data["source"],
        "page": page_data["page"],
        "content": page_data["content"],
        "file_path": page_data["file_path"]
    }