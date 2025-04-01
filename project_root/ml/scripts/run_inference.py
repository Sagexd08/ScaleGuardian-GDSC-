"""
Enhanced content detection script combining Gemini AI and DistilBERT models with fail-safe mechanisms
"""

import os
import argparse
import numpy as np
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

DEFAULT_API_KEY = "AIzaSyBUS_G7RP-5QBHxGW3RFFSt3Snbs983okQ"

class ContentAnalyzer:
    def __init__(self, gemini_api_key=None):
        """
        Initialize models with error handling
        """
        # Initialize DistilBERT
        self.tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
        self.model = DistilBertForSequenceClassification.from_pretrained(
            'distilbert-base-uncased-finetuned-sst-2-english')
        
        # Initialize Gemini with fallback
        self.gemini_enabled = False
        if GEMINI_AVAILABLE:
            try:
                genai.configure(api_key=gemini_api_key or os.getenv('GEMINI_API_KEY', DEFAULT_API_KEY))
                self.gemini = genai.GenerativeModel('gemini-pro')
                self.gemini_enabled = True
            except Exception as e:
                print(f"⚠️ Gemini initialization failed: {str(e)}")

    def analyze_with_bert(self, text):
        """Perform analysis using DistilBERT model"""
        inputs = self.tokenizer(text, return_tensors='pt', truncation=True, padding=True)
        outputs = self.model(**inputs)
        probs = outputs.logits.softmax(dim=1).detach().numpy()[0]
        return {
            'label': 'HARMFUL' if np.argmax(probs) == 1 else 'SAFE',
            'confidence': float(probs[1])
        }

    def analyze_with_gemini(self, text):
        """Perform analysis using Gemini API with error handling"""
        if not self.gemini_enabled:
            return None
            
        try:
            response = self.gemini.generate_content(
                f"Analyze this text for harmful content. Respond only 'YES' or 'NO': {text}"
            )
            decision = 'YES' if 'YES' in response.text.upper() else 'NO'
            return {
                'label': 'HARMFUL' if decision == 'YES' else 'SAFE',
                'confidence': 0.8  # Placeholder confidence for demonstration
            }
        except Exception as e:
            print(f"⚠️ Gemini analysis failed: {str(e)}")
            return None

    def combine_results(self, bert_result, gemini_result):
        """Combine model results using risk-averse strategy"""
        if not gemini_result:
            return bert_result

        # Agreement case
        if bert_result['label'] == gemini_result['label']:
            return {
                'label': bert_result['label'],
                'confidence': (bert_result['confidence'] + gemini_result['confidence']) / 2
            }
            
        # Disagreement case - choose higher risk
        labels = [bert_result['label'], gemini_result['label']]
        if 'HARMFUL' in labels:
            return {
                'label': 'HARMFUL',
                'confidence': min(bert_result['confidence'], gemini_result['confidence'])
            }
            
        return bert_result  # Fallback
        
    def analyze_text(self, text):
        """Legacy method for backward compatibility"""
        bert_result = self.analyze_with_bert(text)
        gemini_result = self.analyze_with_gemini(text) if self.gemini_enabled else None
        final_result = self.combine_results(bert_result, gemini_result)
        
        # Convert to original format for backward compatibility
        bert_prediction = 1 if bert_result['label'] == 'HARMFUL' else 0
        gemini_decision = 1 if gemini_result and gemini_result['label'] == 'HARMFUL' else 0
        
        return {
            'bert_probability': bert_result['confidence'],
            'bert_prediction': bert_prediction,
            'gemini_decision': gemini_decision,
            'final_verdict': 1 if final_result['label'] == 'HARMFUL' else 0
        }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Content Safety Analyzer")
    parser.add_argument('--text', type=str, help='Text to analyze (if not provided, will prompt)')
    parser.add_argument('--api-key', type=str, help='Override Gemini API key')
    parser.add_argument('--verbose', action='store_true', help='Show detailed analysis')
    args = parser.parse_args()

    analyzer = ContentAnalyzer(gemini_api_key=args.api_key)
    
    # Get text input
    text_to_analyze = args.text
    if not text_to_analyze:
        text_to_analyze = input("Enter text to analyze: ")
    
    # Analyze using new methods
    bert_result = analyzer.analyze_with_bert(text_to_analyze)
    gemini_result = analyzer.analyze_with_gemini(text_to_analyze) if analyzer.gemini_enabled else None
    final_result = analyzer.combine_results(bert_result, gemini_result)
    
    # For backward compatibility
    results = analyzer.analyze_text(text_to_analyze)

    print(f"\nAnalysis Results:\n{'-'*40}")
    print(f"Final Verdict: {'⚠️ Harmful Content' if final_result['label'] == 'HARMFUL' else '✅ Safe Content'} ({final_result['confidence']:.2%})")
    
    if args.verbose:
        print("\nDetailed Breakdown:")
        print(f"DistilBERT: {bert_result['label']} ({bert_result['confidence']:.2%})")
        if gemini_result:
            print(f"Gemini: {gemini_result['label']} ({gemini_result['confidence']:.2%})")
        else:
            print("Gemini: Not available")
    else:
        print(f"DistilBERT Confidence: {results['bert_probability']:.2%}")
        print(f"Gemini Decision: {'Harmful' if results['gemini_decision'] else 'Safe'}")
