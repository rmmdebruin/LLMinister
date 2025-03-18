# LLMinister - Parlementaire Vragen Assistent
LLMinister dient als assistent voor een minister om beter en sneller vragen te beantwoorden van Kamerleden.

Met behulp van AI transcribeert de app een Tweede Kamer debat, extraheert daaruit de vragen die direct aan de minister worden gesteld, en genereert daarop draft antwoorden met bronvermelding op basis van de meest relevant openbare documenten.

Daarnaast biedt de app de mogelijkheid om vragen en antwoorden te verwijderen of te bewerken, en de veranderingen op te slaan. Er is ook de mogelijkheid om de status van een beantwoorde vraag aan te passen, e.g. van "Herschrijven" naar "Check Senior", en een verantwoordelijk persoon voor de vraag aan te wijzen, e.g. de senior medewerker die de vraag moet checken.

https://github.com/user-attachments/assets/fc832903-f737-4e60-b14c-419f8aa6ce7a

Ik zie twee mogelijke toepassingen voor LLMinister, waarbij de eerste optie het meest voor de hand liggend is maar de tweede optie op langere termijn de voorkeur heeft:
1. Als tool voor het team van een minister om beter en sneller de vragen van Kamerleden aan de minister te beantwoorden. Hierbij kan de app een eerste feitelijke opzet voor de vragen generen, kunnen de medewerkers van de minister aanvullingen / meningen / standpunten toevoegen, en kan de app het beantwoordingsproces begeleiden.
2. Als assistent van Kamerleden en journalisten om de mogelijke antwoorden van een minister mee te testen. Zo kunnen de Kamerleden hun feitelijke vragen direct door de app beantwoord krijgen, en kunnen zij tijdens de Tweede Kamer debatten focussen op vragen die echt een nieuw standpunt van de minister vraagt dat niet gemakkelijk te vinden is in de relevante openbare stukken. Zo gaat de kwaliteit van het debat in de Tweede Kamer omhoog: minder feiten vragen, meer echt debat.

## Demo debat
Het debat dat gebruikt is voor de demo (video) van de app is (het eerste deel van) het debat: ["Instellingswet Adviescollege toetsing regeldruk"](https://debatdirect.tweedekamer.nl/2025-02-06/economie/plenaire-zaal/regels-omtrent-de-instelling-van-het-adviescollege-toetsing-regeldruk-instellingswet-adviescollege-toetsing-regeldruk-36450-10-35/onderwerp) op dinsdag 6 februari 10:35 - 13:39 met de minister van Economische Zaken.

De meest relevante openbare stukken die voor de tool via RAG beschikbaar zijn om de vragen van de minister te beantwoorden zijn (de 5 meest relevante pagina's dienen als context voor de beantwoording van een vraag):

- 36450 Advies Afdeling advisering Raad van State inzake Regels omtrent de instelling van het Adviescollege toetsing regeldruk (Instellingswet Adviescollege toetsing).pdf
- Advies Afdeling advisering Raad van State en Nader rapport.pdf
- Beslisnota bij 36450 Tweede nota van wijziging inzake Regels omtrent de instelling van het Adviescollege toetsing regeldruk (Instellingswet Adviescollege toetsing).pdf
- Beslisnota bij Kamerbrief Nota naar aanleiding van het verslag inzake Regels omtrent de instelling van het Adviescollege toetsing regeldruk (Instellingswet Adviesco re.pdf
- Beslisnota bij Kamerbrief Werkprogramma 2025 en Voortgangsrapportage Adviescollege Toetsing Regeldruk.pdf
- Besluit houdende wijziging van het Instellingsbesluit Adviescollege Toetsing Regeldruk, in verband met de verlenging van de termijn van het adviescollege.pdf
- Koninklijke boodschap.pdf
- Memorie van toelichting.pdf
- Nota naar aanleiding van het verslag.pdf
- Regeerprogramma. Uitwerking van het hoofdlijnenakkoord door het kabinet.pdf
- Voorstel van wet.pdf
- Werkprogramma 2025 en Voortgangsrapportage Adviescollege Toetsing Regeldruk.pdf
- Werkprogramma ATR 2025.pdf

## Next steps
De app is nog in progress, en er zijn nog veel functionaliteiten die verbeterd kunnen worden, zoals:
- [In progress] Laat de gebruiker de specifieke pagina's van de relevante pdf-documenten live zien in de UI voor elk specifiek argument van een draft antwoord
- Verbeter de transcripties van de debatvideos verder. Uiteindelijk zou er een live transcriptie van een debat video stream moeten komen, inclusief timestamps per zin
- De app in productie brengen: hosten via e.g. Vercel, gedeelde data opslag op e.g. AWS, zodat mensen de app kunnen gebruiken via een weblink

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
├── next.config.js
├── postcss.config.mjs
├── tailwind.config.js
├── tsconfig.json
├── eslint.config.mjs
├── .env                     # Environment variables (for development)
├── app/
│   ├── layout.tsx           # Root layout with theme provider and navigation
│   ├── page.tsx             # Dashboard page (server component)
│   ├── globals.css          # Global CSS styles
│   ├── transcriptie/
│   │   └── page.tsx         # Video upload & question extraction
│   ├── vragen/
│   │   └── page.tsx         # List & edit questions, generate answers
│   ├── instellingen/
│   │   └── page.tsx         # Settings page for API keys
│   ├── components/
│   │   ├── Navigation.tsx   # Navigation sidebar
│   │   ├── QuestionCard.tsx # Individual question component
│   │   ├── QuestionList.tsx # List of questions component
│   │   ├── PdfViewer.tsx    # PDF viewer component
│   │   └── SourceViewer.tsx # Source viewer for citations
│   └── lib/
│       └── store.ts         # Zustand store for UI state
└── backend/
    ├── requirements.txt     # Python dependencies
    ├── .env                 # Backend environment variables
    ├── src/
        ├── main.py          # FastAPI entry point
        ├── models/
        │   ├── __init__.py  # Updated models with citations, sources, etc.
        │   ├── question.py  # Question model
        │   └── transcription.py # Transcription model
        └── services/
            ├── transcription_service.py  # AssemblyAI integration
            ├── question_extractor.py     # Extracting questions with Claude
            ├── answer_generation.py      # RAG answers with Claude
            ├── knowledgebase.py          # TF-IDF search for PDFs
            └── storage_service.py        # File handling functions
data/
├── transcripts/            # Stores transcript .txt files
│   └── debate_video_trimmed_first_part_transcript_20250314_171715.txt
├── questions/              # Stores extracted questions as JSON
│   └── questions_20250314_171724.json
├── list_of_speakers/       # Reference data for transcript processing
│   └── list_of_speakers.csv
├── debate_videos/          # Original videos (mostly gitignored)
└── available_knowledge/    # PDF documents for RAG
    ├── Werkprogramma 2025 en Voortgangsrapportage Adviescollege Toetsing Regeldruk.pdf
    ├── Memorie van toelichting.pdf
    ├── Nota naar aanleiding van het verslag.pdf
    └── ... (other PDFs)
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

MIT.

## Contact

For questions, open a GitHub issue or email rmmdebruin [at] gmail [dot] com.