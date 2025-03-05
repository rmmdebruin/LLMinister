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

# Check if the debate_video.mp4 file exists
VIDEO_FILE="$DATA_DIR/debate_video_trimmed.mp4"
if [ ! -f "$VIDEO_FILE" ]; then
    echo "Looking for debate_video_trimmed.mp4..."
    VIDEO_FILE="$DATA_DIR/debate_video.mp4"
    if [ ! -f "$VIDEO_FILE" ]; then
        echo "Error: Neither debate_video_trimmed.mp4 nor debate_video.mp4 found in $DATA_DIR"
        exit 1
    fi
    echo "Using debate_video.mp4 instead of debate_video_trimmed.mp4"
fi

echo "Using video file: $VIDEO_FILE"
echo "File size: $(du -h "$VIDEO_FILE" | cut -f1) bytes"

# Run the transcription script
echo "Testing transcription with $VIDEO_FILE..."
"$SCRIPT_DIR/transcribe.sh" "$VIDEO_FILE"

# Check the result
if [ $? -eq 0 ]; then
    echo "Test completed successfully!"
    echo "Check the data directory for the transcription output."
else
    echo "Test failed. Please check the error messages above."
    exit 1
fi