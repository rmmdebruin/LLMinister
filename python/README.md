# Video Transcription with AssemblyAI

This directory contains Python scripts for transcribing video files using the AssemblyAI API. The transcription is performed locally, and the results are saved to the specified output directory.

## Requirements

- Python 3.6 or higher
- AssemblyAI API key (get one at [assemblyai.com](https://www.assemblyai.com/))
- Internet connection for API access

## Setup

1. Make sure you have Python 3.6+ installed on your system.
2. The script will automatically create a virtual environment and install dependencies when run.

## Usage

### Using the Shell Script (Recommended)

The easiest way to use the transcription tool is with the provided shell script:

```bash
./transcribe.sh /path/to/your/video.mp4
```

The script will:
1. Create a virtual environment if it doesn't exist
2. Install required dependencies
3. Look for your AssemblyAI API key in the following places:
   - `ASSEMBLYAI_API_KEY` environment variable
   - `.env.local` file in the project root
   - Prompt you to enter it if not found
4. Run the transcription process
5. Save the results to the `/Users/debruinreinier/Repos/LLMinister/data` directory

### Using the Python Script Directly

You can also run the Python script directly:

```bash
python transcribe.py --api-key YOUR_API_KEY --input /path/to/your/video.mp4 --output-dir /path/to/output/directory
```

## Output

The script generates two files:
1. A formatted text file with timestamps and speaker labels
2. A JSON file with the raw API response for further processing

## Integration with the Web Application

The transcription results can be loaded into the LLMinister web application by:
1. Running the transcription script to generate the transcript
2. Opening the web application
3. Navigating to the transcription page
4. Loading the generated transcript file

## Troubleshooting

- If you encounter an error about missing dependencies, try running `pip install -r requirements.txt` manually.
- If the transcription fails, check your API key and internet connection.
- For large video files, the transcription may take a significant amount of time. The script will provide progress updates.