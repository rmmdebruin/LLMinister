import json
from datetime import datetime
from typing import List, Optional
import uuid
import anthropic
from ..models.question import Question, QuestionInput

class QuestionExtractorService:
    """Service for extracting questions from transcripts using Anthropic's Claude"""

    def __init__(self, api_key: str):
        """Initialize the service with an API key"""
        if not api_key or len(api_key) < 10:
            raise ValueError("Invalid Anthropic API key")
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = "claude-3-sonnet-20240229"

    async def extract_questions_from_transcript(
        self,
        transcript: str,
        categories: List[str] = ["Algemeen"],
        speakers_list: Optional[List[str]] = None
    ) -> List[Question]:
        """Extract questions from a transcript using Claude"""
        try:
            prompt = self._build_prompt(transcript, categories, speakers_list)

            response = await self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.content[0].text if response.content[0].type == 'text' else ''
            questions = self._parse_response(content)

            return [self._format_question(q) for q in questions]
        except Exception as e:
            raise Exception(f"Failed to extract questions: {str(e)}")

    def _build_prompt(
        self,
        transcript: str,
        categories: List[str],
        speakers_list: Optional[List[str]] = None
    ) -> str:
        """Build the prompt for Claude"""
        categories_str = ", ".join(categories)
        speakers_section = f"\nList of speakers ordered by their set time to speak:\n{chr(10).join(speakers_list)}" if speakers_list else ""

        return f"""
        Extract all questions directed to the minister from the following parliamentary debate transcript.

        For each question, provide:
        1. The exact text of the question
        2. The timestamp in the format [HH:MM:SS] when the question was asked
        3. The name of the parliament member who asked the question (if available, otherwise use their identifier)
        4. The political party of the parliament member (if available, otherwise leave blank)
        5. The topic/category of the question (choose from: {categories_str})

        Return the result as a JSON array of objects with the following fields:
        - "question_text": The exact text of the question
        - "timestamp": The timestamp when the question was asked
        - "speaker": The name or identifier of the speaker
        - "party": The political party of the speaker
        - "category": The topic/category of the question

        Rules:
        - Only include actual questions directed to the minister
        - Include implicit questions (e.g., "I would like to hear what the minister has to say about this")
        - Follow the parliamentary debate structure and speaking time rules
        - Be critical of speaker labels and verify them against the content{speakers_section}

        Transcript:
        {transcript}"""

    def _parse_response(self, content: str) -> List[QuestionInput]:
        """Parse the JSON response from Claude"""
        try:
            # Try to find JSON block in markdown format first
            import re
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', content) or \
                        re.search(r'\[\s*\{[\s\S]*\}\s*\]', content)

            if not json_match:
                raise ValueError("Could not extract JSON from Anthropic response")

            json_str = json_match.group(1) if json_match.group(1) else json_match.group(0)
            questions_data = json.loads(json_str)

            return [QuestionInput(**q) for q in questions_data]
        except Exception as e:
            raise ValueError(f"Failed to parse JSON response: {str(e)}")

    def _format_question(self, input: QuestionInput) -> Question:
        """Format a QuestionInput into a full Question"""
        now = datetime.now()
        return Question(
            id=str(uuid.uuid4()),
            **input.model_dump(),
            status="Draft",
            createdAt=now,
            updatedAt=now
        )