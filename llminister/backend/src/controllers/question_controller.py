import os
import json
from datetime import datetime
from typing import Dict, List, Optional, Union
from ..models.question import Question, QuestionUpdate
from ..services.question_extractor import QuestionExtractorService
from ..utils.file_utils import ensure_dir_exists

class QuestionController:
    """Controller for handling question-related operations"""

    def __init__(self, api_key: str, data_dir: str):
        """Initialize the controller with API key and data directory"""
        self.question_extractor = QuestionExtractorService(api_key)
        self.data_dir = data_dir
        self.questions_dir = os.path.join(data_dir, "questions")
        ensure_dir_exists(self.questions_dir)

    async def extract_questions(
        self,
        transcript_path: str,
        categories: List[str] = ["Algemeen"],
        speakers_list_path: Optional[str] = None
    ) -> Dict[str, Union[List[Question], str]]:
        """Extract questions from a transcript file"""
        try:
            # Read transcript
            with open(transcript_path, 'r', encoding='utf-8') as f:
                transcript = f.read()

            # Read speakers list if provided
            speakers_list = None
            if speakers_list_path:
                with open(speakers_list_path, 'r', encoding='utf-8') as f:
                    speakers_list = [line.strip() for line in f if line.strip()]

            # Extract questions
            questions = await self.question_extractor.extract_questions_from_transcript(
                transcript,
                categories,
                speakers_list
            )

            # Save questions
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            output_path = os.path.join(self.questions_dir, f"questions_{timestamp}.json")

            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump([q.to_dict() for q in questions], f, indent=2, default=str)

            return {
                "status": "success",
                "questions": [q.to_dict() for q in questions],
                "outputPath": output_path
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    async def update_question(self, question_id: str, update: QuestionUpdate) -> Dict:
        """Update a specific question"""
        try:
            # Find the most recent questions file
            json_files = sorted(
                [f for f in os.listdir(self.questions_dir) if f.endswith('.json')],
                key=lambda x: os.path.getmtime(os.path.join(self.questions_dir, x)),
                reverse=True
            )

            if not json_files:
                raise FileNotFoundError("No questions file found")

            file_path = os.path.join(self.questions_dir, json_files[0])

            # Read questions
            with open(file_path, 'r', encoding='utf-8') as f:
                questions_data = json.load(f)

            # Find and update the question
            question_index = next(
                (i for i, q in enumerate(questions_data) if q["id"] == question_id),
                -1
            )

            if question_index == -1:
                raise ValueError("Question not found")

            # Update the question
            questions_data[question_index].update(
                {k: v for k, v in update.model_dump().items() if v is not None}
            )
            questions_data[question_index]["updatedAt"] = datetime.now().isoformat()

            # Save updated questions
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(questions_data, f, indent=2, default=str)

            return {
                "status": "success",
                "question": questions_data[question_index]
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    async def get_questions(self) -> Dict:
        """Get all questions from the most recent file"""
        try:
            json_files = sorted(
                [f for f in os.listdir(self.questions_dir) if f.endswith('.json')],
                key=lambda x: os.path.getmtime(os.path.join(self.questions_dir, x)),
                reverse=True
            )

            if not json_files:
                return {
                    "status": "success",
                    "questions": []
                }

            file_path = os.path.join(self.questions_dir, json_files[0])

            with open(file_path, 'r', encoding='utf-8') as f:
                questions = json.load(f)

            return {
                "status": "success",
                "questions": questions
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    async def delete_question(self, question_id: str) -> Dict:
        """Delete a specific question"""
        try:
            # Find the most recent questions file
            json_files = sorted(
                [f for f in os.listdir(self.questions_dir) if f.endswith('.json')],
                key=lambda x: os.path.getmtime(os.path.join(self.questions_dir, x)),
                reverse=True
            )

            if not json_files:
                raise FileNotFoundError("No questions file found")

            file_path = os.path.join(self.questions_dir, json_files[0])

            # Read questions
            with open(file_path, 'r', encoding='utf-8') as f:
                questions = json.load(f)

            # Filter out the question to delete
            updated_questions = [q for q in questions if q["id"] != question_id]

            if len(updated_questions) == len(questions):
                raise ValueError("Question not found")

            # Save updated questions
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(updated_questions, f, indent=2, default=str)

            return {
                "status": "success",
                "message": "Question deleted successfully"
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }