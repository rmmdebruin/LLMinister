import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from .services.transcription_service import transcribe_video_file
from .services.question_extractor import extract_questions_from_transcript
from .services.answer_generation import generate_rag_answer
from .services.storage_service import (
    save_transcript_file,
    load_most_recent_questions_json,
    save_questions_json,
    reset_data
)
from .models import QuestionUpdate

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractRequest(BaseModel):
    transcript_path: Optional[str] = None
    categories: List[str] = []

class BulkGenerateAnswersRequest(BaseModel):
    question_ids: List[str]

class UpdateQuestionRequest(BaseModel):
    question_text: Optional[str] = None
    draftAnswer: Optional[str] = None
    status: Optional[str] = None
    nextAction: Optional[str] = None
    personResponsible: Optional[str] = None

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        original_name = file.filename or "uploaded_video.mp4"
        transcript_text = transcribe_video_file(file_bytes, original_name)
        transcript_path = save_transcript_file(transcript_text, original_name)
        return {
            "status": "success",
            "transcript": transcript_text,
            "transcriptPath": transcript_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-questions")
async def extract_questions(req: ExtractRequest):
    try:
        if not req.transcript_path:
            raise HTTPException(
                status_code=400,
                detail="No transcript path provided."
            )
        with open(req.transcript_path, "r", encoding="utf-8") as f:
            transcript_text = f.read()
        questions_list = extract_questions_from_transcript(transcript_text, req.categories)
        output_path = save_questions_json(questions_list)
        return {
            "status": "success",
            "questions": questions_list,
            "outputPath": output_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/questions")
async def get_questions():
    try:
        questions = load_most_recent_questions_json()
        return {"status": "success", "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/questions/{question_id}")
async def patch_question(question_id: str, req: UpdateQuestionRequest):
    try:
        questions = load_most_recent_questions_json()
        if not questions:
            raise HTTPException(status_code=404, detail="No questions found.")
        updated_question = None
        for q in questions:
            if q["id"] == question_id:
                if req.question_text is not None:
                    q["question_text"] = req.question_text
                    q["text"] = req.question_text
                if req.draftAnswer is not None:
                    q["draftAnswer"] = req.draftAnswer
                if req.status is not None:
                    q["status"] = req.status
                if req.nextAction is not None:
                    q["nextAction"] = req.nextAction
                if req.personResponsible is not None:
                    q["personResponsible"] = req.personResponsible
                from datetime import datetime
                q["updatedAt"] = datetime.now().isoformat()
                updated_question = q
                break
        if not updated_question:
            raise HTTPException(status_code=404, detail="Question not found.")
        save_questions_json(questions, override=True)
        return {"status": "success", "question": updated_question}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/questions/{question_id}")
async def delete_question(question_id: str):
    try:
        questions = load_most_recent_questions_json()
        if not questions:
            raise HTTPException(status_code=404, detail="No questions file found.")
        new_list = [q for q in questions if q["id"] != question_id]
        if len(new_list) == len(questions):
            raise HTTPException(status_code=404, detail="Question ID not found.")
        save_questions_json(new_list, override=True)
        return {"status": "success", "message": "Question deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-answers")
async def generate_answers(req: BulkGenerateAnswersRequest):
    try:
        questions = load_most_recent_questions_json()
        if not questions:
            raise HTTPException(status_code=404, detail="No questions available.")
        for qid in req.question_ids:
            for q in questions:
                if q["id"] == qid:
                    draft = generate_rag_answer(q["question_text"])
                    q["draftAnswer"] = draft
                    from datetime import datetime
                    q["updatedAt"] = datetime.now().isoformat()
                    break
        save_questions_json(questions, override=True)
        return {
            "status": "success",
            "message": "Draft answers generated successfully.",
            "questions": questions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset")
async def reset_all_data():
    """
    Remove all transcripts, questions, answers from disk (like the old reset logic).
    """
    try:
        reset_data()
        return {"status": "success", "message": "All data reset successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
