# API Specification

## Base URL

```
https://api.contentmod.example.com/v1
```

## Authentication

The API uses JWT (JSON Web Tokens) and Web3 wallet signatures for authentication:

```http
Authorization: Bearer <jwt_token>
X-Wallet-Signature: <ethereum_signature>
```

## API Endpoints

### Authentication

#### POST /auth/login
Login with email/password or wallet signature.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```
OR
```json
{
  "walletAddress": "0x...",
  "signature": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "role": "moderator",
    "walletAddress": "0x..."
  }
}
```

### Content Moderation

#### POST /moderation/analyze
Submit content for analysis using Gemini API.

**Request:**
```json
{
  "content": {
    "text": "Content to analyze",
    "type": "text",
    "language": "en",
    "context": {
      "url": "https://example.com/article",
      "platform": "web"
    }
  },
  "options": {
    "sensitivityLevel": "medium",
    "categories": ["hate_speech", "violence", "harassment"],
    "returnRawScore": true
  }
}
```

**Response:**
```json
{
  "requestId": "req_123",
  "analysis": {
    "summary": {
      "harmful": true,
      "confidence": 0.92,
      "recommendedAction": "flag"
    },
    "categories": {
      "hate_speech": {
        "detected": true,
        "confidence": 0.87,
        "severity": "high"
      },
      "violence": {
        "detected": false,
        "confidence": 0.32
      }
    },
    "gemini": {
      "modelVersion": "1.0",
      "processingTime": "0.24s",
      "languageConfidence": 0.98
    }
  },
  "metadata": {
    "timestamp": "2024-02-20T12:00:00Z",
    "processingId": "proc_456"
  }
}
```

#### POST /moderation/action
Apply moderation action with blockchain logging.

**Request:**
```json
{
  "contentId": "cont_123",
  "action": {
    "type": "remove",
    "reason": "policy_violation",
    "details": "Explicit hate speech detected"
  },
  "blockchain": {
    "log": true,
    "appeal": {
      "allowed": true,
      "window": 72 // hours
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "moderation": {
    "id": "mod_789",
    "status": "completed",
    "timestamp": "2024-02-20T12:01:00Z"
  },
  "blockchain": {
    "transactionHash": "0x...",
    "blockNumber": 12345,
    "eventId": "evt_101"
  }
}
```

### Governance

#### GET /governance/proposals
Get active DAO proposals.

**Response:**
```json
{
  "proposals": [
    {
      "id": "prop_123",
      "type": "policy_update",
      "title": "Update harassment detection threshold",
      "description": "Adjust the sensitivity of harassment detection...",
      "status": {
        "state": "active",
        "votingEnds": "2024-03-01T00:00:00Z",
        "quorum": {
          "required": 100000,
          "reached": 75000
        }
      },
      "votes": {
        "for": 156000,
        "against": 42000,
        "abstain": 5000
      },
      "blockchain": {
        "proposalId": "0x...",
        "proposer": "0x...",
        "created": "2024-02-15T00:00:00Z"
      }
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10
  }
}
```

#### POST /governance/vote
Cast vote on proposal with blockchain recording.

**Request:**
```json
{
  "proposalId": "prop_123",
  "vote": {
    "support": 1,  // 0: Against, 1: For, 2: Abstain
    "reason": "Support stricter moderation"
  },
  "signature": {
    "wallet": "0x...",
    "signedData": "0x..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "vote": {
    "recorded": true,
    "weight": 1500,
    "timestamp": "2024-02-20T12:05:00Z"
  },
  "transaction": {
    "hash": "0x...",
    "block": 12346
  }
}
```

### Analytics

#### GET /analytics/moderation
Get moderation statistics.

**Response:**
```json
{
  "period": {
    "start": "2024-02-01T00:00:00Z",
    "end": "2024-02-20T23:59:59Z"
  },
  "summary": {
    "total": 15000,
    "actionsTaken": 2500,
    "appealRate": 0.05
  },
  "categories": {
    "hate_speech": 450,
    "violence": 380,
    "harassment": 890
  },
  "accuracy": {
    "overall": 0.95,
    "falsePositives": 0.03,
    "falseNegatives": 0.02
  },
  "gemini": {
    "averageConfidence": 0.88,
    "averageLatency": "0.3s",
    "successRate": 0.998
  }
}
```

## Error Handling

All endpoints use standard HTTP status codes and return detailed error information:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid input parameters",
    "details": {
      "field": "content",
      "constraint": "required"
    },
    "requestId": "req_789"
  }
}
```

## Rate Limiting

- Basic tier: 100 requests/minute
- Premium tier: 1000 requests/minute
- Enterprise: Custom limits

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1623761402
```

## Webhooks

Subscribe to events:

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["moderation.completed", "appeal.created"],
  "secret": "your_webhook_secret"
}
```

## API Versioning

- Current version: v1
- Version is specified in URL
- Deprecation notices provided 6 months in advance

## SDK Support

Official SDKs available for:
- JavaScript/TypeScript
- Python
- Java
- Go

## Documentation Updates

Last updated: February 2024
Next review: May 2024