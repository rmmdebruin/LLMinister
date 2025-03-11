import os
from typing import Dict, Optional
from ..models.transcription import Transcription
from ..services.transcription_service import TranscriptionService
from ..utils.file_utils import save_file, save_transcript, save_raw_data

class TranscriptionController:
    """Controller for handling transcription requests and file management"""

    def __init__(self, api_key: str, data_dir: str):
        self.transcription_service = TranscriptionService(api_key)
        self.data_dir = data_dir
        self.videos_dir = os.path.join(data_dir, "debate_videos")
        self.transcripts_dir = os.path.join(data_dir, "transcripts")

    def process_video(self, file_data: bytes, original_filename: str) -> Dict:
        """
        Process a video file: transcribe it and save the transcript
        Returns a dictionary with the transcription result and metadata
        """
        try:
            # Create a temporary file for transcription
            import tempfile
            import os

            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(original_filename)[1]) as temp_file:
                temp_file.write(file_data)
                temp_path = temp_file.name

            try:
                # Transcribe the video
                transcription_result = self.transcription_service.transcribe(temp_path)

                if transcription_result["status"] != "success":
                    return transcription_result

                # Save the transcript
                transcript_filename, transcript_path = save_transcript(
                    transcription_result["transcript"],
                    self.transcripts_dir,
                    original_filename
                )

                # Save the raw data
                raw_filename, raw_path = save_raw_data(
                    transcription_result["raw_data"],
                    self.transcripts_dir,
                    original_filename
                )

                # Create transcription model
                transcription = Transcription(
                    original_filename=original_filename,
                    saved_filename=original_filename,
                    saved_path=temp_path,
                    transcript_path=transcript_path,
                    transcript_content=transcription_result["transcript"],
                    raw_data_path=raw_path
                )

                return transcription.to_dict()

            finally:
                # Clean up the temporary file
                try:
                    os.unlink(temp_path)
                except Exception as e:
                    print(f"Warning: Failed to delete temporary file {temp_path}: {e}")

        except Exception as e:
            print(f"Error in transcription controller: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }