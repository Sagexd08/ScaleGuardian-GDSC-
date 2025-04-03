# Browser Extension

This browser extension provides AI-powered content moderation and blockchain integration for our decentralized moderation platform.

## Overview

The extension analyzes web content in real-time, identifies potentially harmful content, and allows users to participate in the decentralized moderation ecosystem through blockchain technology.

## Modules

The extension is organized into the following modules:

### AI Module

The AI module integrates with Google's Gemini API to provide real-time content analysis and moderation capabilities:

- **gemini.js**: Handles communication with the Gemini API for content moderation

### Web3 Module

The Web3 module provides blockchain connectivity and DAO (Decentralized Autonomous Organization) interaction:

- **blockchain.js**: Manages blockchain connections, smart contract interactions, and transaction handling
- **dao.js**: Facilitates participation in moderation governance through the DAO

## Installation

1. Clone the repository
2. Install dependencies:
```bash
cd extension
npm install
```
3. Build the extension:
```bash
npm run build
```
4. Load the extension in your browser:
   - Chrome: Open `chrome://extensions/`, enable Developer mode, and click "Load unpacked"
   - Firefox: Open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on"

## Configuration

The extension requires configuration for both the AI and blockchain components:

- **AI Configuration**: Set up your Gemini API key in the extension settings
- **Blockchain Configuration**: Configure your preferred network and wallet connection

## Usage

Once installed, the extension will:

1. Analyze web content as you browse
2. Highlight potentially harmful content
3. Allow you to submit moderation proposals to the DAO
4. Participate in governance decisions

## Development

To contribute to the extension development:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add your license information here]