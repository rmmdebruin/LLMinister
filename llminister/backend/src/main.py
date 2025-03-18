import os
from typing import List, Optional

# 1) Add these two lines at the top:
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from fastapi.responses import FileResponse, StreamingResponse
from fastapi import HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os.path
from pathlib import Path as PathLib
from typing import List, Optional, Dict, Any
import io

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
    allow_origins=["*"],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]  # Important for file downloads
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

        # Try to load the list of speakers
        list_of_speakers = ""
        speakers_path = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                                    "data", "list_of_speakers", "list_of_speakers.csv")
        if os.path.exists(speakers_path):
            with open(speakers_path, 'r', encoding='utf-8') as f:
                list_of_speakers = f.read()

        questions_list = extract_questions_from_transcript(
            transcript_text,
            req.categories,
            list_of_speakers
        )
        output_path = save_questions_json(questions_list)
        return {
            "status": "success",
            "questions": questions_list,
            "outputPath": output_path
        }
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
                # Update text fields
                if req.question_text is not None:
                    q["question_text"] = req.question_text
                    q["text"] = req.question_text

                # Update draft answer (handle both string and object formats)
                if req.draftAnswer is not None:
                    # If the incoming draftAnswer is a string but the existing one is an object,
                    # we need to update just the answer_text
                    if isinstance(req.draftAnswer, str) and isinstance(q.get("draftAnswer"), dict):
                        q["draftAnswer"]["answer_text"] = req.draftAnswer
                    else:
                        # Otherwise, just replace the whole draftAnswer
                        q["draftAnswer"] = req.draftAnswer

                # Update other fields
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
                    draft = generate_rag_answer(
                        q["question_text"],
                        speaker=q.get("speaker", "Unknown"),
                        party=q.get("party", "Unknown"),
                        category=q.get("category", "Algemeen")
                    )
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

@app.get("/questions")
async def get_questions():
    """
    Retrieve all questions from the most recent questions JSON file.
    """
    try:
        questions = load_most_recent_questions_json()
        if not questions:
            # Return empty list instead of 404 if no questions are found
            return {"status": "success", "questions": []}
        return {"status": "success", "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/questions/{question_id}")
async def get_question(question_id: str):
    """
    Retrieve a specific question by ID.
    """
    try:
        questions = load_most_recent_questions_json()
        if not questions:
            raise HTTPException(status_code=404, detail="No questions found.")

        for q in questions:
            if q["id"] == question_id:
                return {"status": "success", "question": q}

        raise HTTPException(status_code=404, detail="Question not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)

@app.post("/extract-latest-questions")
async def extract_latest_questions():
    """
    Finds the most recent transcript .txt file in data/transcripts,
    calls the existing extract_questions_from_transcript() logic,
    saves the resulting questions, and returns them.
    """
    from .services.storage_service import load_most_recent_transcript_file, save_questions_json
    from .services.question_extractor import extract_questions_from_transcript

    try:
        # 1) find the most recent transcript file
        latest_transcript_path = load_most_recent_transcript_file()

        # 2) read the transcript text
        with open(latest_transcript_path, "r", encoding="utf-8") as f:
            transcript_text = f.read()

        # 3) Try to load the list of speakers from the CSV file
        list_of_speakers = ""
        speakers_path = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                                     "data", "list_of_speakers", "list_of_speakers.csv")
        if os.path.exists(speakers_path):
            with open(speakers_path, 'r', encoding='utf-8') as f:
                list_of_speakers = f.read()

        # 4) call the existing question extraction logic
        questions_list = extract_questions_from_transcript(
            transcript_text,
            categories=["Algemeen", "Regeldruk", "Toezicht", "Wetgeving"],
            list_of_speakers=list_of_speakers
        )

        # 5) save the resulting questions to data/questions/
        output_path = save_questions_json(questions_list)

        return {
            "status": "success",
            "questions": questions_list,
            "outputPath": output_path,
            "message": f"Questions extracted from {latest_transcript_path}"
        }
    except FileNotFoundError as fnf_err:
        raise HTTPException(status_code=404, detail=str(fnf_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/pdf")
async def get_pdf(path: str = Query(..., description="Path to the PDF file")):
    """
    Serve a PDF file directly from the knowledge base.
    """
    # Security check - only allow PDFs from the data/available_knowledge directory
    base_dir = PathLib(__file__).parent.parent.parent.parent / "data" / "available_knowledge"

    try:
        # Normalize paths to prevent directory traversal attacks
        base_dir = str(base_dir.resolve())
        full_path = os.path.normpath(os.path.join(base_dir, os.path.basename(path)))

        if not os.path.commonprefix([full_path, base_dir]) == base_dir:
            raise HTTPException(status_code=403, detail="Access denied")

        if not os.path.isfile(full_path):
            raise HTTPException(status_code=404, detail="File not found")

        # Return the PDF file
        return FileResponse(
            full_path,
            media_type="application/pdf",
            filename=os.path.basename(full_path)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pdf-page")
async def get_pdf_page(source: str, page: int):
    """
    Extract a specific page from a PDF and return it as a standalone PDF.
    """
    try:
        from PyPDF2 import PdfReader, PdfWriter
        import io

        # Security check - only allow PDFs from the data/available_knowledge directory
        base_dir = PathLib(__file__).parent.parent.parent.parent / "data" / "available_knowledge"
        full_path = os.path.join(base_dir, source)

        # Normalize paths to prevent directory traversal attacks
        base_dir = str(base_dir.resolve())
        full_path = os.path.normpath(full_path)

        if not os.path.commonprefix([full_path, base_dir]) == base_dir:
            raise HTTPException(status_code=403, detail="Access denied")

        if not os.path.isfile(full_path):
            raise HTTPException(status_code=404, detail="File not found")

        # Extract the specific page
        reader = PdfReader(full_path)
        writer = PdfWriter()

        # Adjust to 0-based indexing
        page_idx = page - 1

        if page_idx < 0 or page_idx >= len(reader.pages):
            raise HTTPException(status_code=404, detail="Page number out of range")

        writer.add_page(reader.pages[page_idx])

        # Write to bytes buffer
        output_buffer = io.BytesIO()
        writer.write(output_buffer)
        output_buffer.seek(0)

        # Return the PDF file
        return StreamingResponse(
            output_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename={source.replace('.pdf', '')}_page_{page}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add a new endpoint to get page content as text
@app.get("/api/pdf-text")
async def get_pdf_text(source: str, page: int):
    """
    Get the text content of a specific PDF page.
    """
    try:
        from .services.answer_generation import get_pdf_page_data
        page_data = get_pdf_page_data(source, page)
        return {"status": "success", "data": page_data}
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
                    # Call the enhanced answer generation function
                    result = generate_rag_answer(
                        q["text"],  # Use text or question_text based on your data structure
                        speaker=q.get("speaker", "Unknown"),
                        party=q.get("party", "Unknown"),
                        category=q.get("category", "Algemeen")
                    )

                    # Store the complete structured data for frontend use
                    q["draftAnswer"] = result

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