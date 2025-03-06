#!/usr/bin/env python3
import os
import sys
import json
import time
import argparse
import requests
from datetime import datetime

class AssemblyAITranscriber:
    """
    A class to handle video transcription using AssemblyAI
    """
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.assemblyai.com/v2"
        self.headers = {
            "authorization": api_key,
            "content-type": "application/json"
        }

    def upload_file(self, file_path):
        """
        Upload a file to AssemblyAI
        """
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
                error_detail = "Unknown error"
                try:
                    error_json = upload_response.json()
                    error_detail = json.dumps(error_json, indent=2)
                except:
                    error_detail = upload_response.text

                raise Exception(f"Upload failed with status code: {upload_response.status_code}. Details: {error_detail}")

            return upload_response.json()["upload_url"]
        except requests.RequestException as e:
            raise Exception(f"Network error during upload: {str(e)}")

    def submit_transcription_job(self, audio_url):
        """
        Submit a transcription job to AssemblyAI
        """
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
                error_detail = "Unknown error"
                try:
                    error_json = response.json()
                    error_detail = json.dumps(error_json, indent=2)
                except:
                    error_detail = response.text

                raise Exception(f"Transcription request failed with status code: {response.status_code}. Details: {error_detail}")

            return response.json()["id"]
        except requests.RequestException as e:
            raise Exception(f"Network error during transcription request: {str(e)}")

    def check_transcription_status(self, job_id):
        """
        Check the status of a transcription job
        """
        try:
            response = requests.get(
                f"{self.base_url}/transcript/{job_id}",
                headers=self.headers
            )

            if response.status_code != 200:
                error_detail = "Unknown error"
                try:
                    error_json = response.json()
                    error_detail = json.dumps(error_json, indent=2)
                except:
                    error_detail = response.text

                raise Exception(f"Status check failed with status code: {response.status_code}. Details: {error_detail}")

            return response.json()
        except requests.RequestException as e:
            raise Exception(f"Network error during status check: {str(e)}")

    def format_timestamp(self, ms):
        """
        Format milliseconds to timestamp string (HH:MM:SS)
        """
        total_seconds = int(ms / 1000)
        hours = int(total_seconds / 3600)
        minutes = int((total_seconds % 3600) / 60)
        seconds = total_seconds % 60

        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    def format_transcript(self, data):
        """
        Format the transcript with timestamps and speakers
        """
        formatted_transcript = ""

        if "utterances" in data and data["utterances"]:
            for utterance in data["utterances"]:
                timestamp = self.format_timestamp(utterance["start"])
                speaker = utterance.get("speaker", "Onbekend")
                formatted_transcript += f"[{timestamp}] {speaker}: {utterance['text']}\n\n"
        else:
            formatted_transcript = data["text"]

        return formatted_transcript

    def transcribe_video(self, file_path, output_dir):
        """
        Transcribe a video file to text and save the result
        """
        try:
            # Verify API key format
            if not self.api_key or len(self.api_key) < 10:
                raise Exception("Invalid API key format. Please check your AssemblyAI API key.")

            # Verify file exists and is readable
            if not os.path.isfile(file_path):
                raise Exception(f"File not found: {file_path}")

            file_size = os.path.getsize(file_path)
            print(f"File size: {file_size} bytes ({file_size / (1024*1024):.2f} MB)")

            if file_size == 0:
                raise Exception("File is empty")

            # Upload file
            print("Step 1/4: Uploading file...")
            upload_url = self.upload_file(file_path)
            print(f"File uploaded successfully. URL: {upload_url}")

            # Submit transcription job
            print("Step 2/4: Starting transcription...")
            job_id = self.submit_transcription_job(upload_url)
            print(f"Transcription job submitted. ID: {job_id}")

            # Poll for results
            print("Step 3/4: Processing audio...")
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

            # Format and save transcript
            print("Step 4/4: Saving transcript...")
            formatted_transcript = self.format_transcript(result)

            # Create output filename based on input filename
            base_filename = os.path.basename(file_path)
            filename_without_ext = os.path.splitext(base_filename)[0]
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            # Create transcripts directory if it doesn't exist
            transcripts_dir = os.path.join(output_dir, "transcripts")
            if not os.path.exists(transcripts_dir):
                print(f"Creating transcripts directory: {transcripts_dir}")
                os.makedirs(transcripts_dir)

            output_filename = f"{filename_without_ext}_transcript_{timestamp}.txt"
            output_path = os.path.join(transcripts_dir, output_filename)

            # Save formatted transcript
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(formatted_transcript)

            # Save raw JSON for potential future use
            json_output_path = os.path.join(transcripts_dir, f"{filename_without_ext}_raw_{timestamp}.json")
            with open(json_output_path, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)

            print(f"Transcription complete! Output saved to: {output_path}")
            print(f"Raw data saved to: {json_output_path}")

            return {
                "status": "success",
                "transcript_path": output_path,
                "raw_data_path": json_output_path,
                "transcript": formatted_transcript
            }

        except Exception as e:
            print(f"Error in transcription process: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }

def main():
    parser = argparse.ArgumentParser(description="Transcribe a video file using AssemblyAI")
    parser.add_argument("--api-key", required=True, help="AssemblyAI API key")
    parser.add_argument("--input", required=True, help="Path to the input video file")
    parser.add_argument("--output-dir", default="/Users/debruinreinier/Repos/LLMinister/data",
                        help="Directory to save the transcription output")

    args = parser.parse_args()

    # Convert relative paths to absolute paths
    input_path = os.path.abspath(args.input)
    output_dir = os.path.abspath(args.output_dir)

    # Print the resolved paths for debugging
    print(f"Resolved input path: {input_path}")
    print(f"Resolved output directory: {output_dir}")

    # Validate input file exists
    if not os.path.isfile(input_path):
        print(f"Error: Input file '{input_path}' does not exist")
        sys.exit(1)

    # Validate output directory exists
    if not os.path.isdir(output_dir):
        print(f"Error: Output directory '{output_dir}' does not exist")
        sys.exit(1)

    # Create transcriber and process video
    transcriber = AssemblyAITranscriber(args.api_key)
    result = transcriber.transcribe_video(input_path, output_dir)

    if result["status"] == "error":
        print(f"Transcription failed: {result['error']}")
        sys.exit(1)

    print("Transcription completed successfully!")
    sys.exit(0)

if __name__ == "__main__":
    main()