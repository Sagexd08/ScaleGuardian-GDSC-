# API Specification

## Base URL

```
https://api.contentmod.example.com/v1
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

To obtain a token, use the authentication endpoints.

## Endpoints

### Authentication

#### POST /auth/login

Login with email and password to receive a JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
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
    "role": "moderator"
  }
}
```

### Content Moderation

#### POST /content/analyze

Submit content for AI analysis.

**Request:**
```json
{
  "content": "Text content to analyze",
  "contentType": "text",
  "source": "web",
  "metadata": {
    "url": "https://example.com/article",
    "contextualInfo": "Additional context"
  }
}
```

**Response:**
```json
{
  "contentId": "cont_12345",
  "analysis": {
    "toxic": 0.92,
    "harassment": 0.87,
    "hate_speech": 0.65,
    "self_harm": 0.12,
    "sexual": 0.05,
    "violence": 0.32
  },
  "recommendation": "flag",
  "confidence": 0.89
}
```

#### POST /content/moderate

Apply a moderation decision to content.

**Request:**
```json
{
  "contentId": "cont_12345",
  "action": "remove",
  "reason": "violates_policy",
  "moderatorNotes": "Contains explicit threats",
  "logToBlockchain": true
}
```

**Response:**
```json
{
  "success": true,
  "contentId": "cont_12345",
  "transaction": {
    "blockchainId": "0x123abc...",
    "timestamp": "2023-06-15T14:32:11Z"
  }
}
```

#### GET /content/status/:contentId

Check the moderation status of content.

**Response:**
```json
{
  "contentId": "cont_12345",
  "status": "flagged",
  "history": [
    {
      "action": "flag",
      "timestamp": "2023-06-15T14:30:00Z",
      "actor": "ai_system"
    },
    {
      "action": "review",
      "timestamp": "2023-06-15T14:32:11Z",
      "actor": "moderator_123"
    }
  ],
  "blockchainRecord": "0x123abc..."
}
```

### Governance

#### GET /governance/proposals

Get active governance proposals.

**Response:**
```json
{
  "proposals": [
    {
      "id": "prop_123",
      "title": "Update harassment policy",
      "description": "Modify the definition of harassment to include...",
      "proposer": "user_456",
      "status": "active",
      "votingEnds": "2023-07-01T00:00:00Z",
      "votes": {
        "yes": 156,
        "no": 42
      }
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "pages": 1
  }
}
```

#### POST /governance/vote

Vote on a governance proposal.

**Request:**
```json
{
  "proposalId": "prop_123",
  "vote": "yes",
  "comment": "I support this change because..."
}
```

**Response:**
```json
{
  "success": true,
  "proposalId": "prop_123",
  "transaction": {
    "blockchainId": "0x456def...",
    "timestamp": "2023-06-16T09:12:00Z"
  }
}
```

### Feedback

#### POST /feedback/submit

Submit feedback on a moderation decision.

**Request:**
```json
{
  "contentId": "cont_12345",
  "feedbackType": "false_positive",
  "comment": "This content was incorrectly flagged",
  "requestAppeal": true
}
```

**Response:**
```json
{
  "success": true,
  "feedbackId": "feed_789",
  "appealId": "app_101"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "bad_request",
  "message": "Invalid input parameters",
  "details": {
    "content": "Field is required"
  }
}
```

### 401 Unauthorized

```json
{
  "error": "unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": "forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "error": "not_found",
  "message": "Resource not found"
}
```

### 500 Server Error

```json
{
  "error": "server_error",
  "message": "Internal server error occurred"
}
```

## Rate Limiting

API requests are limited to 100 requests per minute per API key. When exceeded, the API will return a 429 Too Many Requests response.

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1623761402
```

**Response Body:**
```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded. Try again in 45 seconds."
}
```
</qodoArtifact>

Let's implement the core server components. First, let's create the server's main app file: