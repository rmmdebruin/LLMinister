import os
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict

BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
TRANSCRIPTS_DIR = DATA_DIR / "transcripts"
QUESTIONS_DIR = DATA_DIR / "questions"
ANSWERS_DIR = DATA_DIR / "answers"

TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
QUESTIONS_DIR.mkdir(parents=True, exist_ok=True)
ANSWERS_DIR.mkdir(parents=True, exist_ok=True)

def save_transcript_file(transcript_text: str, original_filename: str) -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base = os.path.splitext(original_filename)[0]
    out_filename = f"{base}_transcript_{timestamp}.txt"
    out_path = TRANSCRIPTS_DIR / out_filename
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(transcript_text)
    return str(out_path)

def load_most_recent_questions_json() -> List[Dict]:
    files = sorted(QUESTIONS_DIR.glob("questions_*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not files:
        return []
    path = files[0]
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_questions_json(questions: List[Dict], override: bool = False) -> str:
    if override:
        files = sorted(QUESTIONS_DIR.glob("questions_*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        if files:
            target = files[0]
            with open(target, "w", encoding="utf-8") as f:
                json.dump(questions, f, indent=2, ensure_ascii=False)
            return str(target)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_filename = f"questions_{timestamp}.json"
    out_path = QUESTIONS_DIR / out_filename
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    return str(out_path)

def reset_data():
    """
    Delete all files from transcripts, questions, and answers directories.
    """
    if TRANSCRIPTS_DIR.exists():
        for f in TRANSCRIPTS_DIR.iterdir():
            if f.is_file():
                f.unlink()
    if QUESTIONS_DIR.exists():
        for f in QUESTIONS_DIR.iterdir():
            if f.is_file():
                f.unlink()
    if ANSWERS_DIR.exists():
        for f in ANSWERS_DIR.iterdir():
            if f.is_file():
                f.unlink()
