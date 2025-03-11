from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class Transcription:
    """
    Model representing a transcription with its metadata
    """
    original_filename: str
    saved_filename: str
    saved_path: str
    transcript_path: str
    transcript_content: str
    raw_data_path: Optional[str] = None
    created_at: datetime = datetime.now()

    def to_dict(self) -> dict:
        """Convert the transcription to a dictionary"""
        return {
            "status": "success",
            "transcript": self.transcript_content,
            "metadata": {
                "originalFileName": self.original_filename,
                "savedFileName": self.saved_filename,
                "savedPath": self.saved_path,
                "transcriptPath": self.transcript_path,
                "rawDataPath": self.raw_data_path,
                "createdAt": self.created_at.isoformat()
            }
        }