import time
import os
import requests

ASSEMBLYAI_API_KEY = os.environ.get("ASSEMBLYAI_API_KEY")  # set in .env / environment

def transcribe_video_file(file_bytes: bytes, filename: str) -> str:
    """
    Upload video to AssemblyAI (or alternative),
    poll for completion, return [HH:MM:SS] Speaker: text transcript.
    """
    ASSEMBLYAI_API_KEY = os.environ.get("ASSEMBLYAI_API_KEY")  # set in .env / environment

    # check if ASSEMBLYAI_API_KEY is set
    if not ASSEMBLYAI_API_KEY:
        raise Exception("No ASSEMBLYAI_API_KEY in environment.")

    # 1. upload
    upload_url = upload_to_assemblyai(file_bytes)

    # 2. start job
    job_id = submit_transcription_job(upload_url)

    # 3. poll until done
    result = poll_transcription_job(job_id)

    # 4. format
    return format_utterances(result)

def upload_to_assemblyai(file_bytes: bytes) -> str:
    print("Uploading file to AssemblyAI...")
    url = "https://api.assemblyai.com/v2/upload"
    headers = {"authorization": ASSEMBLYAI_API_KEY}
    resp = requests.post(url, headers=headers, data=file_bytes)
    if resp.status_code != 200:
        raise Exception(f"Error uploading to AssemblyAI: {resp.text}")
    return resp.json()["upload_url"]

def submit_transcription_job(upload_url: str) -> str:
    print("Submitting transcription job to AssemblyAI...")
    endpoint = "https://api.assemblyai.com/v2/transcript"
    headers = {
        "authorization": ASSEMBLYAI_API_KEY,
        "content-type": "application/json"
    }
    data = {
        "audio_url": upload_url,
        "language_code": "nl",
        "speaker_labels": True
    }
    r = requests.post(endpoint, json=data, headers=headers)
    if r.status_code != 200:
        raise Exception(f"Failed to create transcript job: {r.text}")
    return r.json()["id"]

def poll_transcription_job(transcript_id: str, max_tries=60):
    """
    Poll every 5 seconds until the transcript is completed or max tries.
    """
    import time
    endpoint = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
    headers = {"authorization": ASSEMBLYAI_API_KEY}

    for attempt in range(max_tries):
        resp = requests.get(endpoint, headers=headers)
        if resp.status_code != 200:
            raise Exception(f"Error polling transcript job: {resp.text}")

        data = resp.json()
        status = data["status"]
        if status == "completed":
            return data
        elif status == "error":
            raise Exception(f"Transcription error: {data['error']}")
        else:
            print(f"Transcription status: {status} (attempt {attempt+1})")
            time.sleep(5)

    raise Exception("Transcription timed out after too many tries.")

def format_utterances(json_data: dict) -> str:
    """
    Combine utterances into [HH:MM:SS] Speaker: text
    If no utterances, fallback to the entire text.
    """
    if "utterances" not in json_data:
        return json_data.get("text", "")

    lines = []
    for utt in json_data["utterances"]:
        start = utt["start"]
        speaker = utt.get("speaker", "Onbekend")
        stamp = ms_to_hhmmss(start)
        text = utt["text"]
        lines.append(f"[{stamp}] {speaker}: {text}")
    return "\n\n".join(lines)

def ms_to_hhmmss(ms: int) -> str:
    seconds = ms // 1000
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:02d}"
