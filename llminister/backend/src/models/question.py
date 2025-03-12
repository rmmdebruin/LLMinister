from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel

class QuestionInput(BaseModel):
    """Input model for creating a new question"""
    question_text: str
    timestamp: str
    speaker: str
    party: str
    category: str

class QuestionUpdate(BaseModel):
    """Model for updating an existing question"""
    question_text: Optional[str] = None
    draftAnswer: Optional[str] = None
    status: Optional[Literal['Draft', 'InProgress', 'Completed']] = None
    nextAction: Optional[str] = None
    personResponsible: Optional[str] = None

class Question(BaseModel):
    """Model representing a parliamentary question"""
    id: str
    question_text: str
    timestamp: str
    speaker: str
    party: str
    category: str
    status: Literal['Draft', 'InProgress', 'Completed'] = 'Draft'
    draftAnswer: Optional[str] = None
    nextAction: Optional[str] = None
    personResponsible: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    def to_dict(self) -> dict:
        """Convert the model to a dictionary"""
        return self.model_dump()