# LLMinister - Parlementaire Vragen Assistent

LLMinister is een AI-gestuurde applicatie die het Ministerie van Economische Zaken helpt bij het efficiënt beantwoorden van parlementaire vragen. De applicatie maakt gebruik van geavanceerde AI-technologie om debatvideo's te transcriberen, relevante vragen te identificeren en conceptantwoorden te genereren.

## Functionaliteiten

- **Automatische Transcriptie**: Upload video's van parlementaire debatten en krijg automatisch een transcriptie.
- **Vraag Extractie**: Identificeert automatisch vragen gericht aan de minister in de transcriptie.
- **Concept Antwoorden**: Genereert conceptantwoorden op basis van beschikbare informatie.
- **Beheer Workflow**: Volg de status van vragen en antwoorden door het hele proces.
- **Donkere Modus**: Ondersteunt zowel lichte als donkere weergave voor gebruikerscomfort.
- **Python Transcriptie**: Geavanceerde transcriptie met Python backend voor betere resultaten.

## Technische Stack

- **Frontend**: Next.js 14 met TypeScript en Tailwind CSS
- **AI-integratie**: Anthropic Claude API voor vraaganalyse en AssemblyAI voor transcriptie
- **State Management**: Zustand voor eenvoudig en effectief state management
- **Styling**: Tailwind CSS met dark mode ondersteuning
- **Backend Transcriptie**: Python met AssemblyAI API voor geavanceerde transcriptie

## Installatie

1. Clone de repository:
   ```bash
   git clone https://github.com/yourusername/llminister.git
   cd llminister
   ```

2. Installeer dependencies:
   ```bash
   npm install
   ```

3. Maak een `.env.local` bestand aan in de root van het project met de volgende variabelen:
   ```
   NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key
   NEXT_PUBLIC_ASSEMBLYAI_API_KEY=your_assemblyai_api_key
   ```

4. Installeer Python dependencies (optioneel, voor geavanceerde transcriptie):
   ```bash
   cd python
   python -m venv venv
   source venv/bin/activate  # Op Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

5. Start de ontwikkelingsserver:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in je browser.

## Gebruik

1. **Transcriptie**: Ga naar de Transcriptie pagina en upload een video van een parlementair debat.
2. **Vragen Bekijken**: Bekijk geïdentificeerde vragen op de Vragen pagina.
3. **Antwoorden Bewerken**: Bewerk conceptantwoorden en update de status.
4. **Instellingen**: Configureer API-sleutels en gebruikersrollen in de Instellingen.

### Python Transcriptie

Voor geavanceerde transcriptie met de Python backend:

1. Zorg ervoor dat Python 3.6+ is geïnstalleerd op je systeem.
2. Gebruik het transcriptie script direct:
   ```bash
   cd python
   ./transcribe.sh /pad/naar/je/video.mp4
   ```
3. De transcriptie wordt opgeslagen in de `data` directory.

## Projectstructuur

```
llminister/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   │   ├── anthropic/    # Anthropic API routes
│   │   └── transcribe/   # Transcriptie API routes
│   ├── components/       # Herbruikbare UI-componenten
│   ├── lib/              # Utilities, services en hooks
│   ├── transcriptie/     # Transcriptie pagina
│   ├── vragen/           # Vragen pagina
│   ├── instellingen/     # Instellingen pagina
│   ├── layout.tsx        # Root layout component
│   └── page.tsx          # Homepage/dashboard
├── python/               # Python transcriptie scripts
│   ├── transcribe.py     # Hoofdscript voor transcriptie
│   ├── transcribe.sh     # Shell script voor eenvoudig gebruik
│   └── requirements.txt  # Python dependencies
├── public/               # Statische bestanden
└── package.json          # Project dependencies
```

## Ontwikkeling

### Huidige Status

- ✅ Basis applicatie setup met Next.js en Tailwind CSS
- ✅ UI-componenten voor navigatie en layout
- ✅ Transcriptie pagina met bestandsupload
- ✅ Vragen pagina met filtering en bewerking
- ✅ Instellingen pagina voor API-configuratie
- ✅ Integratie met Anthropic Claude API
- ✅ Integratie met AssemblyAI voor transcriptie
- ✅ Python backend voor geavanceerde transcriptie
- ✅ State management met Zustand
- ✅ Dark mode ondersteuning

### Volgende Stappen

- [ ] Implementatie van gebruikersauthenticatie
- [ ] Opslag van transcripties en vragen in een database
- [ ] Exportfunctionaliteit voor antwoorden
- [ ] Verbeterde analyse van vragen en antwoorden
- [ ] Integratie met documentbronnen voor betere antwoorden

## Licentie

Dit project is gelicenseerd onder de MIT-licentie.

## Contact

Voor vragen of ondersteuning, neem contact op via GitHub issues of stuur een e-mail naar [your-email@example.com](mailto:your-email@example.com).
