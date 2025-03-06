#!/bin/bash

# Exit on error and enable debug mode
set -e
set -x

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
DATA_DIR="$( cd "$PROJECT_ROOT/../data" && pwd )"
DEBATE_VIDEOS_DIR="$DATA_DIR/debate_videos"
TRANSCRIPTS_DIR="$DATA_DIR/transcripts"
ENV_FILE="$PROJECT_ROOT/.env.local"

echo "Script directory: $SCRIPT_DIR"
echo "Project root: $PROJECT_ROOT"
echo "Data directory: $DATA_DIR"
echo "Debate videos directory: $DEBATE_VIDEOS_DIR"
echo "Transcripts directory: $TRANSCRIPTS_DIR"

# Create directories if they don't exist
mkdir -p "$DATA_DIR"
mkdir -p "$TRANSCRIPTS_DIR"
mkdir -p "$DEBATE_VIDEOS_DIR"

# Function to check Python dependencies
check_dependencies() {
    echo "Checking Python dependencies..."
    if ! command -v python3 &> /dev/null; then
        echo "Error: Python 3 is not installed"
        exit 1
    fi

    # Create and activate virtual environment if it doesn't exist
    if [ ! -d "$SCRIPT_DIR/venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv "$SCRIPT_DIR/venv"
    fi

    # Source the virtual environment
    source "$SCRIPT_DIR/venv/bin/activate"

    # Install requirements
    pip install -r "$SCRIPT_DIR/requirements.txt"
}

# Function to find the most recent video file
find_video_file() {
    echo "Looking for video files..."
    VIDEO_FILE="$DEBATE_VIDEOS_DIR/debate_video_trimmed.mp4"

    if [ -f "$VIDEO_FILE" ]; then
        echo "Found video file: $VIDEO_FILE"
        return 0
    fi

    # If the specific file is not found, look for any video file
    for ext in mp4 mov avi mkv; do
        VIDEO_FILES=($DEBATE_VIDEOS_DIR/*.$ext)
        if [ ${#VIDEO_FILES[@]} -gt 0 ] && [ -f "${VIDEO_FILES[0]}" ]; then
            VIDEO_FILE="${VIDEO_FILES[0]}"
            echo "Found video file: $VIDEO_FILE"
            return 0
        fi
    done

    echo "Error: No video files found in $DEBATE_VIDEOS_DIR"
    exit 1
}

# Function to check API key
check_api_key() {
    if [ -f "$ENV_FILE" ]; then
        echo "Found .env.local file"
        source "$ENV_FILE"

        # Check for API key with or without NEXT_PUBLIC_ prefix
        if [ ! -z "$NEXT_PUBLIC_ASSEMBLYAI_API_KEY" ]; then
            ASSEMBLYAI_API_KEY="$NEXT_PUBLIC_ASSEMBLYAI_API_KEY"
            export ASSEMBLYAI_API_KEY
            echo "Found AssemblyAI API key with NEXT_PUBLIC_ prefix"
            return 0
        elif [ ! -z "$ASSEMBLYAI_API_KEY" ]; then
            echo "Found AssemblyAI API key"
            return 0
        fi
    fi

    echo "Error: AssemblyAI API key not found in $ENV_FILE"
    echo "Please ensure either ASSEMBLYAI_API_KEY or NEXT_PUBLIC_ASSEMBLYAI_API_KEY is set"
    exit 1
}

# Function to run transcription
run_transcription() {
    local video_file="$1"
    echo "Testing transcription with $video_file..."
    echo "File size: $(du -h "$video_file" | cut -f1)"

    # Run the transcription script with the API key from .env.local
    "$SCRIPT_DIR/transcribe.py" \
        --api-key "$ASSEMBLYAI_API_KEY" \
        --input "$video_file" \
        --output-dir "$DATA_DIR"
}

# Function to verify transcription output
verify_transcription() {
    echo "Verifying transcription output..."
    # Find the most recent transcript file
    TRANSCRIPT_FILE=$(find "$TRANSCRIPTS_DIR" -type f -name "*_transcript_*.txt" -print0 | xargs -0 ls -t | head -n 1)

    if [ -f "$TRANSCRIPT_FILE" ]; then
        echo "Found transcript file: $TRANSCRIPT_FILE"
        # Check if the file is not empty
        if [ -s "$TRANSCRIPT_FILE" ]; then
            echo "Transcript file is not empty"
            return 0
        else
            echo "Error: Transcript file is empty"
            return 1
        fi
    else
        echo "Error: No transcript file found"
        return 1
    fi
}

# Main execution
main() {
    echo "Starting transcription test..."

    # Run all checks
    check_dependencies
    check_api_key
    find_video_file

    # Run transcription
    run_transcription "$VIDEO_FILE"

    # Verify output
    if verify_transcription; then
        echo "Test completed successfully!"
        echo "Transcript saved to: $TRANSCRIPT_FILE"
        return 0
    else
        echo "Test failed. Please check the error messages above."
        return 1
    fi
}

# Run main function
main