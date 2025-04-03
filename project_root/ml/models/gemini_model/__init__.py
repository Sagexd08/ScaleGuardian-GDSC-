"""
Gemini Inference Model using Google's Gemini API for content moderation.
"""

import os
import logging
import json
import requests
from typing import Dict, Any, Optional

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiInference:
    """
    Client for Google's Gemini API to perform content moderation.
    """
    
    # Base URL for the Gemini API
    API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    
    def __init__(self, model_dir: str = None, api_key: Optional[str] = None):
        """
        Initialize the Gemini API client.
        
        Args:
            model_dir: Directory path (not used for API integration, kept for compatibility)
            api_key: API key for Gemini. If not provided, will look for GEMINI_API_KEY environment variable.
        """
        # API key can be provided directly or via environment variable
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        
        if not self.api_key:
            logger.warning("No API key provided. Set GEMINI_API_KEY environment variable or pass api_key parameter.")
        
        logger.info("Gemini API client initialized")
    
    def _format_request(self, text: str) -> Dict[str, Any]:
        """
        Format the request payload for the Gemini API.
        
        Args:
            text: Input text to be moderated.
            
        Returns:
            Dictionary containing the formatted request payload.
        """
        return {
            "contents": [{
                "parts": [{
                    "text": f"Please moderate the following content and identify if it contains harmful, offensive, or inappropriate material. Provide a detailed analysis of any problematic content found, categorizing issues as: hate speech, violence, sexual content, harassment, or other harmful content. If the content is safe, indicate that as well.\n\nContent to moderate:\n{text}"
                }]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "topP": 0.8,
                "topK": 40
            }
        }
    
    def predict(self, text: str) -> Dict[str, Any]:
        """
        Send text to Gemini API for content moderation.
        
        Args:
            text: Input text to be moderated.
            
        Returns:
            Dictionary containing the moderation results or error information.
        """
        if not text or not text.strip():
            return {
                "status": "error",
                "error": "Empty input text provided."
            }
        
        if not self.api_key:
            return {
                "status": "error",
                "error": "No API key available. Please provide a Gemini API key."
            }
        
        try:
            # Build the request URL with API key
            request_url = f"{self.API_BASE_URL}?key={self.api_key}"
            
            # Prepare the request payload
            payload = self._format_request(text)
            
            # Make the API request
            logger.info("Sending request to Gemini API")
            response = requests.post(
                request_url,
                headers={"Content-Type": "application/json"},
                data=json.dumps(payload),
                timeout=30
            )
            
            # Handle HTTP errors
            response.raise_for_status()
            
            # Parse the response JSON
            response_data = response.json()
            
            # Extract and process the content from the response
            if 'candidates' in response_data and response_data['candidates']:
                content = response_data['candidates'][0]['content']
                text_parts = [part['text'] for part in content['parts'] if 'text' in part]
                processed_output = ' '.join(text_parts)
                
                # Determine if content is potentially harmful based on response
                is_harmful = any(harmful_term in processed_output.lower() 
                               for harmful_term in [
                                   "harmful", "offensive", "inappropriate", 
                                   "hate speech", "violence", "sexual content", 
                                   "harassment"
                               ])
                
                return {
                    "status": "success",
                    "result": {
                        "raw_response": response_data,
                        "processed_output": processed_output,
                        "is_harmful": is_harmful
                    }
                }
            else:
                logger.error("Unexpected API response format: %s", response_data)
                return {
                    "status": "error",
                    "error": "Unexpected response format from Gemini API",
                    "raw_response": response_data
                }
            
        except requests.exceptions.Timeout:
            logger.error("Request to Gemini API timed out")
            return {
                "status": "error",
                "error": "Request to Gemini API timed out. Please try again later."
            }
        except requests.exceptions.ConnectionError:
            logger.error("Connection error when contacting Gemini API")
            return {
                "status": "error",
                "error": "Failed to connect to Gemini API. Please check your internet connection."
            }
        except requests.exceptions.HTTPError as e:
            logger.error("HTTP error from Gemini API: %s", str(e))
            return {
                "status": "error",
                "error": f"HTTP error from Gemini API: {str(e)}"
            }
        except json.JSONDecodeError:
            logger.error("Failed to parse JSON response from Gemini API")
            return {
                "status": "error",
                "error": "Failed to parse response from Gemini API."
            }
        except Exception as e:
            logger.error("Unexpected error during Gemini API request: %s", str(e))
            return {
                "status": "error",
                "error": f"Unexpected error: {str(e)}"
            }