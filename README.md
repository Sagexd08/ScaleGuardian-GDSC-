# ScaleGuardian-GDSC-
ScaleGuardian is an innovative platform that combines advanced AI and secure blockchain technology to detect, analyze, and transparently moderate harmful online content, creating safer, trusted digital communities for users worldwide.

## System Components

- **Browser Extension**: Chrome/Firefox extension for real-time content detection
- **Web & Mobile Clients**: User interfaces for reporting and monitoring content
- **Backend Server**: API endpoints for content processing and moderation
- **Blockchain Integration**: Smart contracts for transparent logging of moderation actions
- **ML Module**: Python-based machine learning for content classification, featuring:
  - Hybrid content analysis using DistilBERT and Gemini
  - Real-time harmful content detection
  - Ensemble decision system

## Setup Instructions

### Prerequisites
- Node.js 16+
- Python 3.8+
- Docker and Docker Compose
- Hardhat (for blockchain development)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ai-content-moderation.git
   cd ai-content-moderation
   ```

2. Set up each component:
   ```
   # Install backend dependencies
   cd server && npm install
   
   # Install extension dependencies
   cd ../extension && npm install
   
   # Install web client dependencies
   cd ../client/web && npm install
   
   # Install mobile client dependencies
   cd ../mobile && npm install
   
   # Install blockchain dependencies
   cd ../../blockchain && npm install
   
   # Install ML dependencies
   cd ../ml && pip install -r requirements.txt
   ```

3. Using Docker:
   ```
   docker-compose up
   ```

## Usage

- **Extension**: Install the browser extension for real-time content moderation
- **Web Client**: Access the dashboard at http://localhost:3000
- **API Server**: Endpoints available at http://localhost:5000/api
- **Blockchain**: Moderation logs are stored on-chain for transparency

## Documentation

See the [docs](/docs) directory for detailed documentation, including:
- [System Architecture](/docs/architecture.md)
- [API Specifications](/docs/api_spec.md)
- [ML Module Documentation](/ml/README.md)

## License

MIT
