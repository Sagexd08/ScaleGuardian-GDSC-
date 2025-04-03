#!/usr/bin/env python3
"""
predict_gemini.py - Command-line tool for content moderation using Google's Gemini API.

Usage:
    python predict_gemini.py --input "Your text here" --api-key YOUR_API_KEY
    python predict_gemini.py --file input.txt --api-key YOUR_API_KEY
    python predict_gemini.py --interactive --api-key YOUR_API_KEY
    
    Note: API key can also be provided via GEMINI_API_KEY environment variable.
"""

import os
import sys
import argparse
import logging
import json
from pathlib import Path
from typing import List, Dict, Any, Optional

# Add the project root to the path
sys.path.append(str(Path(__file__).resolve().parent.parent))

try:
    from ml.models.gemini_model import GeminiInference
except ImportError:
    # Fallback if the module isn't installed
    sys.path.append(str(Path(__file__).resolve().parent))
    from models.gemini_model import GeminiInference

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("predict_gemini")

# Default API key (you can override this with command-line arguments or environment variables)
DEFAULT_API_KEY = "AIzaSyBUS_G7RP-5QBHxGW3RFFSt3Snbs983okQ"

def setup_argparse() -> argparse.ArgumentParser:
    """
    Set up command-line argument parsing.
    
    Returns:
        Configured ArgumentParser object.
    """
    parser = argparse.ArgumentParser(description="Content Moderation using Google's Gemini API")
    
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument(
        '--input', '-i', type=str,
        help='Text input for moderation'
    )
    input_group.add_argument(
        '--file', '-f', type=str,
        help='File containing text input for moderation'
    )
    input_group.add_argument(
        '--interactive', '-int', action='store_true',
        help='Start an interactive moderation session'
    )
    
    parser.add_argument(
        '--api-key', '-k', type=str,
        help='Gemini API key (defaults to environment variable GEMINI_API_KEY if not provided)'
    )
    
    parser.add_argument(
        '--output', '-o', type=str,
        help='Output file to save moderation results (JSON format)'
    )
    
    parser.add_argument(
        '--verbose', '-v', action='store_true',
        help='Enable verbose output with detailed moderation information'
    )
    
    return parser

def read_input_file(file_path: str) -> str:
    """
    Read text input from a file.
    
    Args:
        file_path: Path to the input file.
        
    Returns:
        File content as string.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except Exception as e:
        logger.error(f"Failed to read input file {file_path}: {str(e)}")
        sys.exit(1)

def save_output(results: Dict[str, Any], output_file: str) -> None:
    """
    Save moderation results to a file in JSON format.
    
    Args:
        results: Moderation results.
        output_file: Path to the output file.
    """
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
        logger.info(f"Results saved to {output_file}")
    except Exception as e:
        logger.error(f"Failed to save results to {output_file}: {str(e)}")

def format_prediction(prediction: Dict[str, Any], verbose: bool = False) -> str:
    """
    Format moderation results for display.
    
    Args:
        prediction: Moderation result dictionary.
        verbose: Whether to include detailed information.
        
    Returns:
        Formatted moderation result string.
    """
    if prediction["status"] == "error":
        return f"ERROR: {prediction['error']}"
    
    if verbose:
        return json.dumps(prediction, indent=2)
    else:
        # Simple format for regular output
        result = prediction["result"]["processed_output"]
        is_harmful = prediction["result"]["is_harmful"]
        
        if is_harmful:
            return f"MODERATION RESULT: POTENTIALLY HARMFUL CONTENT DETECTED\n\n{result}"
        else:
            return f"MODERATION RESULT: CONTENT APPEARS SAFE\n\n{result}"

def interactive_mode(inference: GeminiInference, verbose: bool = False) -> None:
    """
    Run the moderation in interactive mode, accepting and processing user inputs.
    
    Args:
        inference: Initialized GeminiInference object.
        verbose: Whether to enable verbose output.
    """
    print("\n===== Gemini Content Moderation Interactive Mode =====")
    print("Type 'exit', 'quit', or 'q' to end the session.")
    print("Type 'help' or '?' for instructions.")
    print("Enter your text for moderation below:\n")
    
    history = []
    
    while True:
        try:
            user_input = input("> ")
            
            # Check for exit commands
            if user_input.lower() in ('exit', 'quit', 'q'):
                print("Exiting interactive mode.")
                break
                
            # Check for help command
            if user_input.lower() in ('help', '?'):
                print("\nInstructions:")
                print("  - Type your text and press Enter to get a moderation assessment")
                print("  - Type 'exit', 'quit', or 'q' to end the session")
                print("  - Type 'history' to see your previous inputs")
                print("  - Type 'clear' to clear the screen")
                continue
                
            # Check for history command
            if user_input.lower() == 'history':
                if not history:
                    print("No history yet.")
                else:
                    for i, item in enumerate(history, 1):
                        print(f"{i}. {item['input'][:50]}{'...' if len(item['input']) > 50 else ''}")
                continue
                
            # Check for clear command
            if user_input.lower() == 'clear':
                os.system('cls' if os.name == 'nt' else 'clear')
                continue
                
            # Skip empty inputs
            if not user_input.strip():
                continue
                
            # Process the input
            print("\nAnalyzing content with Gemini API...")
            result = inference.predict(user_input)
            formatted_result = format_prediction(result, verbose)
            print(f"\nRESULT:\n{formatted_result}\n")
            
            # Store in history
            history.append({
                'input': user_input,
                'output': result
            })
                
        except KeyboardInterrupt:
            print("\nExiting interactive mode.")
            break
        except Exception as e:
            print(f"ERROR: {str(e)}")

def main() -> None:
    """
    Main function to run the moderation script.
    """
    parser = setup_argparse()
    args = parser.parse_args()
    
    # Set logging level based on verbosity
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Get API key from command line, environment variable, or default
    api_key = args.api_key or os.environ.get("GEMINI_API_KEY") or DEFAULT_API_KEY
    
    # Initialize the Gemini inference engine
    try:
        logger.info("Initializing Gemini API client")
        inference = GeminiInference(api_key=api_key)
        logger.info("Gemini API client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini API client: {str(e)}")
        sys.exit(1)
    
    # Process based on input method
    if args.interactive:
        interactive_mode(inference, args.verbose)
    else:
        # Get input text
        if args.file:
            input_text = read_input_file(args.file)
            logger.info(f"Loaded input from {args.file} ({len(input_text)} characters)")
        else:
            input_text = args.input
        
        # Make prediction using Gemini API
        logger.info("Sending content to Gemini for moderation...")
        result = inference.predict(input_text)
        
        # Display results
        formatted_result = format_prediction(result, args.verbose)
        print(formatted_result)
        
        # Save results if output file specified
        if args.output:
            save_output(result, args.output)

if __name__ == "__main__":
    main()