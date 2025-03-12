import os
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Header, UploadFile, File, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from .controllers.question_controller import QuestionController
from .controllers.transcription_controller import TranscriptionController
from .models.question import QuestionUpdate
import httpx
import json
from datetime import datetime
from pathlib import Path
import asyncio

# Constants
MAX_UPLOAD_SIZE = 1024 * 1024 * 100  # 100MB

class ExtractQuestionsRequest(BaseModel):
    transcript_path: str
    categories: List[str] = ["Algemeen"]
    speakers_list_path: Optional[str] = None

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Get data directory from environment or use default
DATA_DIR = Path(__file__).parent.parent.parent / "data"
TRANSCRIPTS_DIR = DATA_DIR / "transcripts"
TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

# Ensure data directories exist
os.makedirs(os.path.join(DATA_DIR, "debate_videos"), exist_ok=True)
os.makedirs(os.path.join(DATA_DIR, "questions"), exist_ok=True)

@app.middleware("http")
async def check_file_size(request: Request, call_next):
    if request.url.path == "/api/transcribe" and request.method == "POST":
        if "content-length" in request.headers:
            content_length = int(request.headers["content-length"])
            if content_length > MAX_UPLOAD_SIZE:
                return JSONResponse(
                    status_code=413,
                    content={
                        "status": "error",
                        "error": f"File size exceeds maximum limit of {MAX_UPLOAD_SIZE / (1024 * 1024)}MB"
                    }
                )
    response = await call_next(request)
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to ensure consistent error responses"""
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "error": exc.detail
            }
        )

    # Log unexpected errors in production
    print(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error": str(exc)
        }
    )

# Question endpoints
@app.get("/api/questions")
async def get_questions():
    """Get all questions from the most recent file"""
    controller = QuestionController("dummy-key", DATA_DIR)  # API key not needed for GET
    result = await controller.get_questions()

    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["error"])

    return result

@app.patch("/api/questions/{question_id}")
async def update_question(
    question_id: str,
    update: QuestionUpdate,
    x_api_key: str = Header(..., alias="X-API-Key")
):
    """Update a specific question"""
    controller = QuestionController(x_api_key, DATA_DIR)
    result = await controller.update_question(question_id, update)

    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["error"])

    return result

@app.delete("/api/questions")
async def delete_question(
    id: Optional[str] = None,
    text: Optional[str] = None,
    x_api_key: str = Header(..., alias="X-API-Key")
):
    """Delete a question by ID or text"""
    if not id and not text:
        raise HTTPException(
            status_code=400,
            detail="Either question ID or text must be provided"
        )

    controller = QuestionController(x_api_key, DATA_DIR)
    result = await controller.delete_question(id if id else text)

    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["error"])

    return result

@app.post("/api/questions/extract")
async def extract_questions(
    request: dict,
    x_anthropic_key: str = Header(..., alias="X-Anthropic-Key")
):
    try:
        # Find latest transcript if not specified
        if not request.get("transcript_path"):
            transcript_files = sorted(DATA_DIR.glob("*_transcript.json"))
            if not transcript_files:
                raise HTTPException(status_code=404, detail="No transcripts found")

            latest_transcript = transcript_files[-1]
            with open(latest_transcript) as f:
                transcript_data = json.load(f)
        else:
            with open(request["transcript_path"]) as f:
                transcript_data = json.load(f)

        # Extract questions using Anthropic (implement your existing question extraction logic here)
        # For now, return dummy data
        questions = [
            {"text": "Example question 1?", "category": "Algemeen"},
            {"text": "Example question 2?", "category": "Algemeen"}
        ]

        return {
            "status": "success",
            "questions": questions
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Transcription endpoints
@app.post("/api/transcribe")
async def transcribe_video(
    file: UploadFile,
    x_assemblyai_key: str = Header(..., alias="X-AssemblyAI-Key")
):
    try:
        # First, upload the file to AssemblyAI
        async with httpx.AsyncClient() as client:
            # Upload the file
            upload_response = await client.post(
                "https://api.assemblyai.com/v2/upload",
                headers={"authorization": x_assemblyai_key},
                content=await file.read()
            )

            if upload_response.status_code != 200:
                raise HTTPException(status_code=upload_response.status_code,
                                 detail=f"Upload failed: {upload_response.text}")

            audio_url = upload_response.json()["upload_url"]

            # Start transcription
            transcript_response = await client.post(
                "https://api.assemblyai.com/v2/transcript",
                headers={
                    "authorization": x_assemblyai_key,
                    "content-type": "application/json"
                },
                json={
                    "audio_url": audio_url,
                    "language_code": "nl",
                    "word_boost": ["Algemeen"],
                    "word_timestamps": True
                }
            )

            if transcript_response.status_code != 200:
                raise HTTPException(status_code=transcript_response.status_code,
                                 detail=f"Transcription request failed: {transcript_response.text}")

            transcript_id = transcript_response.json()["id"]

            # Poll for completion
            while True:
                polling_response = await client.get(
                    f"https://api.assemblyai.com/v2/transcript/{transcript_id}",
                    headers={"authorization": x_assemblyai_key}
                )

                if polling_response.status_code != 200:
                    raise HTTPException(status_code=polling_response.status_code,
                                     detail=f"Polling failed: {polling_response.text}")

                result = polling_response.json()

                if result["status"] == "completed":
                    # Save transcript with timestamp
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    transcript_data = {
                        "text": result["text"],
                        "words": result["words"],
                        "timestamp": timestamp
                    }

                    transcript_path = DATA_DIR / f"{timestamp}_transcript.json"
                    with open(transcript_path, "w") as f:
                        json.dump(transcript_data, f, indent=2)

                    return {
                        "status": "success",
                        "transcript": result["text"],
                        "transcript_path": str(transcript_path)
                    }
                elif result["status"] == "error":
                    raise HTTPException(status_code=400, detail=f"Transcription failed: {result['error']}")

                # Wait before polling again
                await asyncio.sleep(3)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        limit_concurrency=10,  # Limit concurrent connections
        limit_max_requests=100,  # Limit max requests per worker
        timeout_keep_alive=300,  # 5 minutes keep-alive timeout
        timeout_graceful_shutdown=300,  # 5 minutes graceful shutdown
        timeout_notify=300,  # 5 minutes notify timeout
    )