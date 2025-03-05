#!/usr/bin/env python3
"""
Extract questions from transcripts using Anthropic API.
This script extracts questions directed to the minister from parliamentary debate transcripts,
including timestamps, speaker information, and topic categorization.
"""

import os
import sys
import json
import argparse
import glob
from datetime import datetime
import pandas as pd
from anthropic import Anthropic
from dotenv import load_dotenv
import re

class QuestionExtractor:
    """
    Extract questions from transcripts using Anthropic API.
    """
    def __init__(self, api_key):
        """
        Initialize the QuestionExtractor with the Anthropic API key.
        """
        if not api_key or len(api_key) < 10:
            raise ValueError("Invalid Anthropic API key")

        self.api_key = api_key
        self.client = Anthropic(api_key=api_key)
        self.model = "claude-3-opus-20240229"  # Using Claude 3 Opus

    def find_latest_transcript(self, transcripts_dir):
        """
        Find the most recent transcript file in the transcripts directory.
        """
        # Get all transcript files
        transcript_files = glob.glob(os.path.join(transcripts_dir, "*_transcript_*.txt"))

        if not transcript_files:
            raise FileNotFoundError(f"No transcript files found in {transcripts_dir}")

        # Sort by modification time (most recent first)
        transcript_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)

        latest_transcript = transcript_files[0]
        print(f"Found latest transcript: {latest_transcript}")

        return latest_transcript

    def find_matching_raw_data(self, transcript_path):
        """
        Find the matching raw data JSON file for a transcript.
        """
        # Extract the base filename and timestamp
        base_dir = os.path.dirname(transcript_path)
        filename = os.path.basename(transcript_path)

        # Extract the base name and timestamp
        match = re.match(r'(.+)_transcript_(\d+_\d+)\.txt', filename)
        if not match:
            raise ValueError(f"Invalid transcript filename format: {filename}")

        base_name, timestamp = match.groups()

        # Construct the raw data filename
        raw_data_filename = f"{base_name}_raw_{timestamp}.json"
        raw_data_path = os.path.join(base_dir, raw_data_filename)

        if not os.path.exists(raw_data_path):
            raise FileNotFoundError(f"Raw data file not found: {raw_data_path}")

        print(f"Found matching raw data: {raw_data_path}")

        return raw_data_path

    def read_transcript(self, transcript_path):
        """
        Read the transcript file.
        """
        with open(transcript_path, 'r', encoding='utf-8') as f:
            transcript = f.read()

        return transcript

    def read_raw_data(self, raw_data_path):
        """
        Read the raw data JSON file.
        """
        with open(raw_data_path, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)

        return raw_data

    def extract_questions(self, transcript, raw_data, categories=None):
        """
        Extract questions from the transcript using Anthropic API.
        """
        # Ensure we always have a "general" category
        if not categories:
            categories = ["general"]
        elif "general" not in categories:
            categories.append("general")

        categories_str = ", ".join(categories)

        print("Extracting questions using Anthropic API...")

        # Create the prompt for Anthropic
        prompt = f"""
        Extract all questions directed to the minister from the following parliamentary debate transcript.

        For each question, provide:
        1. The exact text of the question
        2. The timestamp in the format [HH:MM:SS] when the question was asked
        3. The name of the parliament member who asked the question (if available, otherwise use their identifier like 'A', 'B', etc.)
        4. The political party of the parliament member (if available, otherwise leave blank)
        5. The topic/category of the question (choose from: {categories_str})

        Return the result as a JSON array of objects with the following fields:
        - "question_text": The exact text of the question
        - "timestamp": The timestamp when the question was asked
        - "speaker": The name or identifier of the speaker
        - "party": The political party of the speaker
        - "category": The topic/category of the question

        Only include actual questions directed to the minister. Rhetorical questions or statements should not be included.

        Transcript:
        {transcript}
        """

        # Call the Anthropic API
        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Extract the content
        content = response.content[0].text if response.content and response.content[0].type == "text" else ""

        # Find the JSON part in the response
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', content)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find any JSON array in the response
            json_match = re.search(r'\[\s*\{[\s\S]*\}\s*\]', content)
            if json_match:
                json_str = json_match.group(0)
            else:
                raise ValueError("Could not extract JSON from Anthropic response")

        # Parse the JSON
        try:
            questions = json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            print(f"JSON string: {json_str}")
            raise

        print(f"Extracted {len(questions)} questions")

        return questions

    def save_questions(self, questions, output_path):
        """
        Save the extracted questions to a file.
        """
        # Save as JSON
        with open(output_path + '.json', 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)

        # Save as CSV
        df = pd.DataFrame(questions)
        df.to_csv(output_path + '.csv', index=False)

        print(f"Questions saved to {output_path}.json and {output_path}.csv")

        return output_path + '.json', output_path + '.csv'

def main():
    """
    Main function to extract questions from transcripts.
    """
    parser = argparse.ArgumentParser(description="Extract questions from transcripts using Anthropic API")
    parser.add_argument("--api-key", help="Anthropic API key")
    parser.add_argument("--transcripts-dir", default="/Users/debruinreinier/Repos/LLMinister/data/transcripts",
                        help="Directory containing transcript files")
    parser.add_argument("--output-dir", default="/Users/debruinreinier/Repos/LLMinister/data/questions",
                        help="Directory to save extracted questions")
    parser.add_argument("--categories", nargs='+', default=["general"],
                        help="Categories for question classification")
    parser.add_argument("--transcript-file", help="Specific transcript file to process (optional)")

    args = parser.parse_args()

    # Load environment variables from .env file
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env.local'))

    # Get API key from arguments, environment, or .env file
    api_key = args.api_key or os.environ.get('NEXT_PUBLIC_ANTHROPIC_API_KEY')

    if not api_key:
        print("Error: Anthropic API key not provided")
        print("Please provide an API key using --api-key or set the NEXT_PUBLIC_ANTHROPIC_API_KEY environment variable")
        sys.exit(1)

    # Convert paths to absolute paths
    transcripts_dir = os.path.abspath(args.transcripts_dir)
    output_dir = os.path.abspath(args.output_dir)

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Initialize the QuestionExtractor
    extractor = QuestionExtractor(api_key)

    try:
        # Find the transcript file to process
        if args.transcript_file:
            transcript_path = os.path.abspath(args.transcript_file)
            if not os.path.exists(transcript_path):
                raise FileNotFoundError(f"Transcript file not found: {transcript_path}")
        else:
            transcript_path = extractor.find_latest_transcript(transcripts_dir)

        # Find the matching raw data file
        raw_data_path = extractor.find_matching_raw_data(transcript_path)

        # Read the transcript and raw data
        transcript = extractor.read_transcript(transcript_path)
        raw_data = extractor.read_raw_data(raw_data_path)

        # Extract questions
        questions = extractor.extract_questions(transcript, raw_data, args.categories)

        # Create output filename based on transcript filename
        transcript_filename = os.path.basename(transcript_path)
        base_name = re.sub(r'_transcript_\d+_\d+\.txt$', '', transcript_filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"{base_name}_questions_{timestamp}"
        output_path = os.path.join(output_dir, output_filename)

        # Save questions
        json_path, csv_path = extractor.save_questions(questions, output_path)

        print("Question extraction completed successfully!")
        print(f"JSON output: {json_path}")
        print(f"CSV output: {csv_path}")

        # Return the paths for use in other scripts
        return {
            "status": "success",
            "json_path": json_path,
            "csv_path": csv_path,
            "questions": questions
        }

    except Exception as e:
        print(f"Error extracting questions: {str(e)}")
        return {
            "status": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    main()