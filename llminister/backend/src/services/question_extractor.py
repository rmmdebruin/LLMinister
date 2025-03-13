import os
import json
import uuid
from datetime import datetime
from typing import List, Dict

import anthropic

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

def extract_questions_from_transcript(transcript: str, categories: List[str]) -> List[Dict]:
    """
    Use Anthropic (Claude) to parse the transcript and identify questions
    that are DIRECTLY asked to the minister.
    """
    if not ANTHROPIC_API_KEY:
        raise Exception("No ANTHROPIC_API_KEY found in environment variables.")

    if "Algemeen" not in categories:
        categories.append("Algemeen")

    # Build an explicit instruction for the user message:
    # We include a big block that clarifies how we want the JSON.
    system_instructions = f"""
Jij bent een AI-assistent die Nederlandse parlementaire debatten analyseert.
Je taak is om ALLE vragen te vinden die direct aan de minister gericht zijn.

BELANGRIJK:
1. We willen GEEN vragen die alleen retorisch zijn of bedoeld voor een ander Kamerlid.
2. We willen alleen vragen waar de minister een antwoord op moet geven.
3. Als de vraag niet duidelijk aan de minister is, sla hem over.

We hebben de volgende categorieën: {", ".join(categories)}.
Als je niet zeker weet bij welke categorie de vraag hoort, zet 'Algemeen'.

Geef je antwoord als JSON array, elk object bevat deze velden exact:
- "question_text": (string) de exacte vraag
- "timestamp": (string) [HH:MM:SS] van toen de vraag werd gesteld
- "speaker": (string) naam of identifier van de spreker (Tweede Kamerlid)
- "party": (string) partij van de spreker (bijv. VVD, PVV, etc.)
- "category": (string) één van deze categorieën: {", ".join(categories)}

GEEN extra uitleg, alleen JSON. Voorbeeld:

[
  {{
    "question_text": "Wat vindt de minister hiervan?",
    "timestamp": "[00:10:42]",
    "speaker": "Arend Kisteman",
    "party": "VVD",
    "category": "Algemeen"
  }},
  ...
]

Transcript:
{transcript}
    """

    # Anthropich API
    client = anthropic.Client(api_key=ANTHROPIC_API_KEY)

    # Construct the Claude prompt in their recommended style
    prompt_text = f"{anthropic.HUMAN_PROMPT} {system_instructions}\n\n{anthropic.AI_PROMPT}"

    resp = client.completions.create(
        model="claude-3-7-sonnet-20250219",
        max_tokens_to_sample=3000,
        prompt=prompt_text,
        temperature=0,
    )

    raw = resp.completion.strip()

    # Attempt to parse as JSON
    try:
        data = json.loads(raw)
    except:
        data = []

    now_iso = datetime.now().isoformat()
    output = []
    for item in data:
        qid = str(uuid.uuid4())
        qtxt = item.get("question_text", "").strip()
        output.append({
            "id": qid,
            "question_text": qtxt,
            "text": qtxt,
            "timestamp": item.get("timestamp", ""),
            "speaker": item.get("speaker", "Onbekend"),
            "party": item.get("party", ""),
            "category": item.get("category", "Algemeen"),
            "status": "Draft",
            "draftAnswer": "",
            "nextAction": "",
            "personResponsible": "",
            "createdAt": now_iso,
            "updatedAt": now_iso
        })

    return output
