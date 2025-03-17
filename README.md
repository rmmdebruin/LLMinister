# LLMinister - Parlementaire Vragen Assistent

LLMinister is an AI-driven application that helps the Dutch Ministry of Economic Affairs efficiently answer parliamentary questions.

https://github.com/user-attachments/assets/545ed46d-2ab7-40ec-bd77-5f7dff4697cc

## Overview

The app does the following:

1. **Automatic Transcription**
   Upload a debate video. The system calls the FastAPI backend to transcribe it (using AssemblyAI). The transcript is saved in `data/transcripts/`.

2. **Question Extraction**
   The backend (Anthropic Claude) parses the transcript to identify **only** questions directed to the minister. Each question is saved as JSON in `data/questions/`.

3. **Draft Answer Generation (RAG)**
   The system uses a TF-IDF approach to find the 5 most relevant chunks from PDF documents in `data/available_knowledge/`. Then it calls Anthropic Claude again, providing those chunks, to produce a best possible draft answer in Dutch with inline citations.

4. **UI to Manage Q&A**
   The Next.js 14 frontend shows the extracted questions. Each question has a status (“Draft”, “Herschreven”, “Definitief”), next action (“Herschrijven”, “Check senior”, “Klaar”), and a “Persoon Verantwoordelijk”. Users can edit or finalize the draft answers in an intuitive interface.

## Tech Stack

- **Frontend**: Next.js 14 (TypeScript), Tailwind CSS
- **State Management**: Zustand
- **Backend**: Python 3.9+ with FastAPI
- **AI**:
  - AssemblyAI for transcription
  - Anthropic Claude (3-7-sonnet) for question extraction & answer generation
- **RAG**:
  - TF-IDF approach with scikit-learn, chunking PDFs in `data/available_knowledge/`

## Folder Structure

```bash
llminister/
├── README.md
├── package.json
├── app/
│ ├── layout.tsx
│ ├── page.tsx # (Dashboard)
│ ├── transcriptie/
│ │ └── page.tsx # (Video upload & question extraction)
│ ├── vragen/
│ │ └── page.tsx # (List & edit questions, generate answers)
│ ├── lib/
│ │ ├── store.ts # (Zustand store for UI state)
│ │ └── ...
│ └── ... # (UI components, styling, etc.)
└── backend/
│ ├── requirements.txt
│ ├── src/
│ │ ├── main.py # (FastAPI entry point)
│ │ ├── models/
│ │ │ └── init.py
│ │ └── services/
│ │ │ └── transcription_service.py
│ │ │ └── question_extractor.py
│ │ │ └── answer_generation.py
│ │ │ └── knowledgebase.py
│ │ │ └── storage_service.py
data/
├── transcripts/ # (Stores transcript .txt)
├── questions/ # (Stores extracted questions as JSON)
├── answers/ # (If you want to store final answers separately)
└── available_knowledge/ # (Your PDF documents for RAG)
```


## Installation & Setup

1. **Clone Repo**:
```bash
git clone https://github.com/yourusername/llminister.git
cd llminister
```

2. **Frontend Dependencies**:
```bash
npm install
```

3. **Python Environment**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. **Environment Variables**:
   - In `backend/.env` (or your system env):
     ```
     ASSEMBLYAI_API_KEY=YOUR_ASSEMBLYAI_KEY
     ANTHROPIC_API_KEY=YOUR_ANTHROPIC_CLAUDE_KEY
     ```
   - In `llminister/.env.local`:
     ```
     NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8000
     ```

5. **Run the Backend**:
```bash
cd backend
uvicorn src.main:app --reload --port 8000
```

   This starts FastAPI on `http://127.0.0.1:8000`.

6. **Run the Frontend**:
```bash
cd ../
npm run dev
```

   This starts Next.js on `http://localhost:3000`.

7. **Usage**:
   - Open `http://localhost:3000/transcriptie` to upload a debate video and extract questions.
   - Go to `http://localhost:3000/vragen` to see & edit the extracted questions, generate draft answers, etc.

## License

MIT or your choice.

## Contact

For questions, open a GitHub issue or email your-email@example.com.
