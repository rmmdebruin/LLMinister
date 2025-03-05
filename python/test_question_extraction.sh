#!/bin/bash

# Exit on error
set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
DATA_DIR="$( cd "$PROJECT_ROOT/../data" && pwd )"
TRANSCRIPTS_DIR="$DATA_DIR/transcripts"
QUESTIONS_DIR="$DATA_DIR/questions"

echo "Script directory: $SCRIPT_DIR"
echo "Project root: $PROJECT_ROOT"
echo "Data directory: $DATA_DIR"
echo "Transcripts directory: $TRANSCRIPTS_DIR"
echo "Questions directory: $QUESTIONS_DIR"

# Create questions directory if it doesn't exist
mkdir -p "$QUESTIONS_DIR"

# Run the question extraction script
echo "Testing question extraction..."
"$SCRIPT_DIR/extract_questions.sh" --categories "general regeldruk overheid toezicht"

# Check the result
if [ $? -eq 0 ]; then
    echo "Test completed successfully!"
    echo "Check the questions directory for the extraction output."
else
    echo "Test failed. Please check the error messages above."
    exit 1
fi