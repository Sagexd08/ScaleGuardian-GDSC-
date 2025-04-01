# ML Content Analysis Module

## Architecture Overview
- **Dual-Model Analysis**: Combines DistilBERT classification with Gemini's contextual understanding
- **Ensemble Decision**: Final verdict based on either model detecting harmful content
- **Security**: Requires GEMINI_API_KEY in environment variables (.env file)

## Setup
```bash
cd project_root/ml
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## Usage
1. Create `.env` file with your Gemini API key:
   ```ini
   GEMINI_API_KEY=your_api_key_here
   ```
2. Run analysis:
   ```bash
   python scripts/run_inference.py
   ```
   
## Expected Output
```
Enter text to analyze: This is some potentially dangerous content...

Analysis Results:
----------------------------------------
DistilBERT Confidence: 87.34%
Gemini Decision: Harmful
Final Verdict: ⚠️ Harmful Content
```