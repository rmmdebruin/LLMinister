# /Users/debruinreinier/Repos/LLMinister/llminister/backend/src/services/question_extractor.py

import os
import json
import uuid
from datetime import datetime
from typing import List, Dict

import anthropic

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

def extract_questions_from_transcript(transcript: str, categories: List[str], list_of_speakers: str = "") -> List[Dict]:
    """
    Use Anthropic (Claude) to parse the transcript and identify questions
    that are DIRECTLY asked to the minister or implicit questions requiring answers.
    """
    if not ANTHROPIC_API_KEY:
        raise Exception("No ANTHROPIC_API_KEY found in environment variables.")

    if "Algemeen" not in categories:
        categories.append("Algemeen")

    categories_str = ", ".join(categories)

    # Read the list of speakers from CSV if not provided
    if not list_of_speakers:
        try:
            # Try to load the list_of_speakers from the default location
            speakers_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))),
                                       "data", "list_of_speakers", "list_of_speakers.csv")
            if os.path.exists(speakers_path):
                with open(speakers_path, 'r', encoding='utf-8') as f:
                    # Skip header
                    next(f)
                    # Format as Name (Party)
                    list_of_speakers = "\n".join([f"{line.split(',')[0]} ({line.split(',')[2].strip()})" for line in f if line.strip()])
        except Exception as e:
            print(f"Error loading list of speakers: {e}")
            # Continue without the list of speakers
            pass

    # User message with the detailed prompt
    user_message = f"""
Extract all questions directed to the minister from the following parliamentary debate transcript.
In parliamentary debates, questions can be explicit (direct questions with question marks) or implicit (statements that clearly expect a ministerial response).

For BOTH explicit and implicit questions, provide:
1. The exact text of the question or statement requiring a response
2. The timestamp in the format [HH:MM:SS] when the question was asked
3. The name of the parliament member who asked the question (if available, otherwise use their identifier like 'A', 'B', etc.)
4. The political party of the parliament member (if available, otherwise leave blank)
5. The topic/category of the question (choose from: {categories_str})

Important clarifications:
- Include BOTH explicit questions (with question marks) AND implicit questions (statements clearly requiring a ministerial response)
- Parliamentary members often make statements implying questions or requesting explanations - identify these as questions
- When members ask "I would like to hear from the minister about X" or similar phrasings, these ARE questions
- Phrases like "How does the minister plan to..." or "I would like to know the minister's view on..." are questions
- When a member asks "Would the minister agree that..." or "Does the minister share my concern..." these are questions
- Look for requests for reflections, explanations, or calls for the minister to address issues

Return the result as a JSON array of objects with the following fields:
- "question_text": The exact text of the question or statement requiring response
- "timestamp": The timestamp when the question was asked
- "speaker": The name or identifier of the speaker
- "party": The political party of the speaker
- "category": The topic/category of the question

Here is the list of people in the transcript, ordered by their set time to speak for a few minutes:
{list_of_speakers}

Transcript:
{transcript}
"""

    # Anthropic API client
    client = anthropic.Client(api_key=ANTHROPIC_API_KEY)

    # Use the Messages API
    response = client.messages.create(
        model="claude-3-7-sonnet-20250219",
        max_tokens=4000,
        messages=[
            {"role": "user", "content": user_message}
        ],
        temperature=0,
    )

    raw = response.content[0].text

    # Attempt to parse as JSON
    try:
        # Strip any markdown formatting that might be present
        json_str = raw
        if "```json" in raw:
            json_str = raw.split("```json")[1].split("```")[0]
        elif "```" in raw:
            json_str = raw.split("```")[1].split("```")[0]

        data = json.loads(json_str)
    except Exception as e:
        print(f"JSON parsing error: {e}")
        print(f"Raw response: {raw}")
        # Fallback to empty array
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