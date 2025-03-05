#!/bin/bash

# Exit on error
set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
DATA_DIR="$( cd "$PROJECT_ROOT/../data" && pwd )"

echo "Script directory: $SCRIPT_DIR"
echo "Project root: $PROJECT_ROOT"
echo "Data directory: $DATA_DIR"

# Check if virtual environment exists, if not create it
if [ ! -d "$SCRIPT_DIR/venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$SCRIPT_DIR/venv"
    source "$SCRIPT_DIR/venv/bin/activate"
    pip install -r "$SCRIPT_DIR/requirements.txt"
else
    echo "Using existing virtual environment..."
    source "$SCRIPT_DIR/venv/bin/activate"
fi

# Check if API key is provided as an environment variable or in .env file
if [ -z "$ASSEMBLYAI_API_KEY" ]; then
    if [ -f "$PROJECT_ROOT/.env.local" ]; then
        # Extract API key from .env.local file
        ASSEMBLYAI_API_KEY=$(grep NEXT_PUBLIC_ASSEMBLYAI_API_KEY "$PROJECT_ROOT/.env.local" | cut -d '=' -f2)
        echo "Found API key in .env.local file"
    fi

    # If still not found, prompt user
    if [ -z "$ASSEMBLYAI_API_KEY" ]; then
        echo "AssemblyAI API key not found. Please enter your API key:"
        read -r ASSEMBLYAI_API_KEY
    fi
fi

# Check if input file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <path-to-video-file>"
    echo "Example: $0 $DATA_DIR/debate_video.mp4"
    exit 1
fi

# Convert to absolute path
INPUT_FILE="$( cd "$(dirname "$1")" && pwd )/$(basename "$1")"
echo "Input file: $INPUT_FILE"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file '$INPUT_FILE' does not exist"
    exit 1
fi

# Check if data directory exists
if [ ! -d "$DATA_DIR" ]; then
    echo "Error: Data directory '$DATA_DIR' does not exist"
    exit 1
fi

echo "Running transcription..."
# Run the Python script with absolute paths
python "$SCRIPT_DIR/transcribe.py" --api-key "$ASSEMBLYAI_API_KEY" --input "$INPUT_FILE" --output-dir "$DATA_DIR"

# Check the exit code
if [ $? -eq 0 ]; then
    echo "Transcription completed successfully!"
else
    echo "Transcription failed. Please check the error messages above."
    exit 1
fi

# Deactivate virtual environment
deactivate