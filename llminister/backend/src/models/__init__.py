# Add these updated models to your backend/src/models/__init__.py file

from typing import Optional, List, Dict, Union, Any
from pydantic import BaseModel, Field

class Citation(BaseModel):
    source_id: str
    title: str
    page: int

class Sentence(BaseModel):
    text: str
    citations: List[Citation] = []

class Source(BaseModel):
    id: str
    title: str
    page: int
    file_path: str
    similarity_score: float = 0.0

class AnswerData(BaseModel):
    answer_text: str
    sources: List[Source] = []
    sentences: List[Sentence] = []

# Updated model for question updates
class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    draftAnswer: Optional[Union[str, Dict[str, Any]]] = None  # Can be string or AnswerData object
    status: Optional[str] = None
    nextAction: Optional[str] = None
    personResponsible: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None
    sentences: Optional[List[Dict[str, Any]]] = None