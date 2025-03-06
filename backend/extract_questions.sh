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
echo "Data directory: $DATA_DIR"
echo "Questions directory: $QUESTIONS_DIR"

# Create questions directory if it doesn't exist
mkdir -p "$QUESTIONS_DIR"

# Check if virtual environment exists, if not create it
if [ ! -d "$SCRIPT_DIR/venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$SCRIPT_DIR/venv"
    # Explicitly activate the virtual environment with full path
    source "$SCRIPT_DIR/venv/bin/activate"
    # Upgrade pip first
    pip install --upgrade pip
    # Install requirements
    pip install -r "$SCRIPT_DIR/requirements.txt"
else
    echo "Using existing virtual environment..."
    # Explicitly activate the virtual environment with full path
    source "$SCRIPT_DIR/venv/bin/activate"
    # Verify pandas is installed
    if ! pip list | grep -q pandas; then
        echo "Pandas not found in virtual environment. Installing requirements..."
        pip install --upgrade pip
        pip install -r "$SCRIPT_DIR/requirements.txt"
    fi
fi

# Verify pandas is installed
if ! python -c "import pandas" &> /dev/null; then
    echo "Error: pandas module not found after installation. Please check your Python environment."
    exit 1
fi

# Check if API key is provided as an environment variable or in .env file
if [ -z "$ANTHROPIC_API_KEY" ]; then
    if [ -f "$PROJECT_ROOT/.env.local" ]; then
        # Extract API key from .env.local file
        ANTHROPIC_API_KEY=$(grep NEXT_PUBLIC_ANTHROPIC_API_KEY "$PROJECT_ROOT/.env.local" | cut -d '=' -f2)
        echo "Found API key in .env.local file"
    fi

    # If still not found, prompt user
    if [ -z "$ANTHROPIC_API_KEY" ]; then
        echo "Anthropic API key not found. Please enter your API key:"
        read -r ANTHROPIC_API_KEY
    fi
fi

# Parse command line arguments
CATEGORIES="general"
TRANSCRIPT_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --categories)
            shift
            CATEGORIES="$1"
            shift
            ;;
        --transcript-file)
            shift
            TRANSCRIPT_FILE="$1"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run the Python script with the full path to the Python executable in the virtual environment
echo "Running question extraction..."
PYTHON_PATH="$SCRIPT_DIR/venv/bin/python"

if [ -n "$TRANSCRIPT_FILE" ]; then
    # If transcript file is provided
    "$PYTHON_PATH" "$SCRIPT_DIR/extract_questions.py" --api-key "$ANTHROPIC_API_KEY" --transcripts-dir "$TRANSCRIPTS_DIR" --output-dir "$QUESTIONS_DIR" --categories $CATEGORIES --transcript-file "$TRANSCRIPT_FILE"
else
    # Use the latest transcript
    "$PYTHON_PATH" "$SCRIPT_DIR/extract_questions.py" --api-key "$ANTHROPIC_API_KEY" --transcripts-dir "$TRANSCRIPTS_DIR" --output-dir "$QUESTIONS_DIR" --categories $CATEGORIES
fi

# Check the exit code
if [ $? -eq 0 ]; then
    echo "Question extraction completed successfully!"
else
    echo "Question extraction failed. Please check the error messages above."
    exit 1
fi

# Deactivate virtual environment
deactivate