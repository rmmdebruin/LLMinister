import os
from datetime import datetime
from typing import Tuple

def ensure_directory_exists(directory: str) -> None:
    """Ensure a directory exists, create it if it doesn't"""
    if not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)

def save_file(file_data: bytes, directory: str, original_filename: str) -> Tuple[str, str]:
    """
    Save a file to the specified directory
    Returns: (saved_filename, saved_path)
    """
    ensure_directory_exists(directory)

    # Use the original filename
    saved_filename = original_filename
    saved_path = os.path.join(directory, saved_filename)

    # Save the file
    with open(saved_path, "wb") as f:
        f.write(file_data)

    return saved_filename, saved_path

def save_transcript(transcript: str, directory: str, base_filename: str) -> Tuple[str, str]:
    """
    Save a transcript to the specified directory
    Returns: (transcript_filename, transcript_path)
    """
    ensure_directory_exists(directory)

    # Create transcript filename
    filename_without_ext = os.path.splitext(base_filename)[0]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    transcript_filename = f"{filename_without_ext}_transcript_{timestamp}.txt"
    transcript_path = os.path.join(directory, transcript_filename)

    # Save the transcript
    with open(transcript_path, "w", encoding="utf-8") as f:
        f.write(transcript)

    return transcript_filename, transcript_path

def save_raw_data(raw_data: dict, directory: str, base_filename: str) -> Tuple[str, str]:
    """
    Save raw transcription data as JSON
    Returns: (raw_filename, raw_path)
    """
    import json
    ensure_directory_exists(directory)

    # Create raw data filename
    filename_without_ext = os.path.splitext(base_filename)[0]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    raw_filename = f"{filename_without_ext}_raw_{timestamp}.json"
    raw_path = os.path.join(directory, raw_filename)

    # Save the raw data
    with open(raw_path, "w", encoding="utf-8") as f:
        json.dump(raw_data, f, ensure_ascii=False, indent=2)

    return raw_filename, raw_path