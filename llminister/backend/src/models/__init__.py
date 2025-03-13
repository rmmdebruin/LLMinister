from typing import Optional
from pydantic import BaseModel

class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    draftAnswer: Optional[str] = None
    status: Optional[str] = None
    nextAction: Optional[str] = None
    personResponsible: Optional[str] = None
