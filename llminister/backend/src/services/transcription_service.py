import json
import time
from typing import Dict, Optional
import requests
from datetime import datetime

class TranscriptionService:
    """Service for handling video transcription using AssemblyAI"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.assemblyai.com/v2"
        self.headers = {
            "authorization": api_key,
            "content-type": "application/json"
        }

    def upload_file(self, file_path: str) -> str:
        """Upload a file to AssemblyAI"""
        print(f"Uploading file: {file_path}")

        def read_file(file_path):
            with open(file_path, "rb") as f:
                while True:
                    data = f.read(5242880)  # Read in 5MB chunks
                    if not data:
                        break
                    yield data

        try:
            upload_response = requests.post(
                f"{self.base_url}/upload",
                headers={"authorization": self.api_key},
                data=read_file(file_path)
            )

            if upload_response.status_code != 200:
                error_detail = self._get_error_detail(upload_response)
                raise Exception(f"Upload failed with status code: {upload_response.status_code}. Details: {error_detail}")

            return upload_response.json()["upload_url"]
        except requests.RequestException as e:
            raise Exception(f"Network error during upload: {str(e)}")

    def submit_transcription_job(self, audio_url: str) -> str:
        """Submit a transcription job to AssemblyAI"""
        print("Submitting transcription job...")

        data = {
            "audio_url": audio_url,
            "language_code": "nl",
            "speaker_labels": True
        }

        print(f"Request data: {json.dumps(data, indent=2)}")

        try:
            response = requests.post(
                f"{self.base_url}/transcript",
                json=data,
                headers=self.headers
            )

            if response.status_code != 200:
                error_detail = self._get_error_detail(response)
                raise Exception(f"Transcription request failed with status code: {response.status_code}. Details: {error_detail}")

            return response.json()["id"]
        except requests.RequestException as e:
            raise Exception(f"Network error during transcription request: {str(e)}")

    def check_transcription_status(self, job_id: str) -> Dict:
        """Check the status of a transcription job"""
        try:
            response = requests.get(
                f"{self.base_url}/transcript/{job_id}",
                headers=self.headers
            )

            if response.status_code != 200:
                error_detail = self._get_error_detail(response)
                raise Exception(f"Status check failed with status code: {response.status_code}. Details: {error_detail}")

            return response.json()
        except requests.RequestException as e:
            raise Exception(f"Network error during status check: {str(e)}")

    def format_timestamp(self, ms: int) -> str:
        """Format milliseconds to timestamp string (HH:MM:SS)"""
        total_seconds = int(ms / 1000)
        hours = int(total_seconds / 3600)
        minutes = int((total_seconds % 3600) / 60)
        seconds = total_seconds % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    def format_transcript(self, data: Dict) -> str:
        """Format the transcript with timestamps and speakers"""
        formatted_transcript = ""

        if "utterances" in data and data["utterances"]:
            for utterance in data["utterances"]:
                timestamp = self.format_timestamp(utterance["start"])
                speaker = utterance.get("speaker", "Onbekend")
                formatted_transcript += f"[{timestamp}] {speaker}: {utterance['text']}\n\n"
        else:
            formatted_transcript = data["text"]

        return formatted_transcript

    def transcribe(self, file_path: str) -> Dict:
        """
        Transcribe a video file to text
        Returns a dictionary with the transcription result and metadata
        """
        try:
            # Verify API key format
            if not self.api_key or len(self.api_key) < 10:
                raise Exception("Invalid API key format. Please check your AssemblyAI API key.")

            # Upload file
            print("Step 1/3: Uploading file...")
            upload_url = self.upload_file(file_path)
            print(f"File uploaded successfully. URL: {upload_url}")

            # Submit transcription job
            print("Step 2/3: Starting transcription...")
            job_id = self.submit_transcription_job(upload_url)
            print(f"Transcription job submitted. ID: {job_id}")

            # Poll for results
            print("Step 3/3: Processing audio...")
            result = self.check_transcription_status(job_id)
            attempts = 0
            max_attempts = 60  # Maximum 5 minutes (60 * 5 seconds)

            while result["status"] not in ["completed", "error"] and attempts < max_attempts:
                print(f"Transcription status: {result['status']} (attempt {attempts+1}/{max_attempts})")
                time.sleep(5)  # Wait 5 seconds between checks
                result = self.check_transcription_status(job_id)
                attempts += 1

            if result["status"] == "error" or "text" not in result:
                error_msg = result.get("error", "Unknown error")
                raise Exception(f"Transcription failed: {error_msg}")

            if result["status"] != "completed":
                raise Exception("Transcription timed out")

            # Format transcript
            formatted_transcript = self.format_transcript(result)

            return {
                "status": "success",
                "transcript": formatted_transcript,
                "raw_data": result
            }

        except Exception as e:
            print(f"Error in transcription process: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }

    def _get_error_detail(self, response: requests.Response) -> str:
        """Extract error details from a response"""
        try:
            error_json = response.json()
            return json.dumps(error_json, indent=2)
        except:
            return response.text