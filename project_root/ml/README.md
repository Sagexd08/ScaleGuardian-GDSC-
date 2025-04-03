# Content Moderation with Google's Gemini API

This directory contains code for content moderation using Google's Gemini API, which provides advanced text analysis capabilities for identifying harmful or inappropriate content.

## Overview

The system uses Google's Gemini API to analyze and moderate text content, identifying potentially harmful content such as:
- Hate speech
- Violence
- Sexual content
- Harassment
- Other inappropriate material

## Directory Structure

```
ml/
├── models/
│   └── gemini_model/       # Gemini API client implementation
├── scripts/
│   └── predict_gemini.py   # Command-line script for content moderation
└── utils/                  # Utility functions for preprocessing
```

## Usage

You can use the content moderation system in several ways:

### Single Input

```bash
python scripts/predict_gemini.py --input "Text to be moderated" --api-key YOUR_API_KEY
```

### File Input

```bash
python scripts/predict_gemini.py --file path/to/input.txt --api-key YOUR_API_KEY
```

### Interactive Mode

```bash
python scripts/predict_gemini.py --interactive --api-key YOUR_API_KEY
```

### Environment Variables

You can set your Gemini API key as an environment variable:

```bash
export GEMINI_API_KEY="your-api-key-here"
python scripts/predict_gemini.py --input "Text to be moderated"
```

### Output to File

```bash
python scripts/predict_gemini.py --input "Text to be moderated" --output results.json
```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up your Gemini API key (optional, can also be provided via command line):

```bash
export GEMINI_API_KEY="your-api-key-here"
```

## Requirements

Required Python packages are listed in `requirements.txt`. Key dependencies include:
- requests
- tqdm
- colorama

## API Key

The script uses Google's Gemini API, which requires an API key. You can provide this key in three ways:
1. Command-line argument (`--api-key`)
2. Environment variable (`GEMINI_API_KEY`) 
3. Default value in the script (not recommended for production)

## Error Handling

The system includes robust error handling for:
- Network connectivity issues
- API rate limiting
- Invalid inputs
- Authentication errors
- Unexpected response formats

## License

[Add your license information here]