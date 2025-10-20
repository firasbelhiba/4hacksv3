# 4Hacks Backend API Documentation

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Auth Module](#auth-module)
  - [Hackathons Module](#hackathons-module)
  - [Tracks Module](#tracks-module)
  - [Projects Module](#projects-module)
  - [Reviews Module](#reviews-module)
  - [Code Quality Module](#code-quality-module)
  - [Eligibility Module](#eligibility-module)
  - [AI Jury Module](#ai-jury-module)
  - [Notifications Module](#notifications-module)
- [WebSocket Events](#websocket-events)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Overview

The 4Hacks Backend API is a comprehensive RESTful API built with NestJS that provides endpoints for managing hackathons, project submissions, AI-powered code analysis, automated judging, and real-time notifications.

**Base URL:** `http://localhost:4000/api`
**Swagger Documentation:** `http://localhost:4000/api/docs`
**WebSocket Namespace:** `/events`

### Technology Stack
- **Framework:** NestJS 11.x
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** Socket.IO WebSockets
- **Background Jobs:** Bull Queue with Redis
- **AI Integration:** Together AI, GitHub API
- **Validation:** class-validator

---

## Authentication

All endpoints except public authentication routes require JWT Bearer token authentication.

### Getting a Token

1. **Register** or **Login** to obtain an access token
2. Include the token in subsequent requests:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

### Token Details
- **Type:** JWT Bearer Token
- **Expiration:** 7 days (configurable)
- **Storage:** Store securely (localStorage recommended for web apps)

---

## API Endpoints

### Auth Module

#### POST /api/auth/register
Register a new user account.

**Public Endpoint** (No authentication required)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Validation Rules:**
- `name`: Required, minimum 2 characters
- `email`: Required, must be valid email format, must be unique
- `password`: Required, minimum 6 characters

**Success Response (201):**
```json
{
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN",
    "status": "ACTIVE",
    "createdAt": "2025-10-04T12:00:00.000Z"
  },
  "message": "User created successfully"
}
```

**Notes:**
- First user registered becomes `SUPER_ADMIN`
- Subsequent users become `ADMIN`
- Passwords are hashed with bcrypt (12 rounds)

---

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Public Endpoint** (No authentication required)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN"
  }
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

#### GET /api/auth/register/status
Check if new user registration is allowed.

**Public Endpoint** (No authentication required)

**Success Response (200):**
```json
{
  "allowed": false,
  "message": "Registration is currently disabled"
}
```

---

#### GET /api/auth/me
Get current authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN",
    "status": "ACTIVE",
    "createdAt": "2025-10-04T12:00:00.000Z"
  }
}
```

---

### Hackathons Module

#### GET /api/hackathons
Get all hackathons with optional filters.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): Filter by status (DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED)
- `search` (optional): Search in name and description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "hack123",
      "name": "Web3 Hackathon 2025",
      "slug": "web3-hackathon-2025",
      "description": "Build the future of decentralized web",
      "status": "PUBLISHED",
      "startDate": "2025-11-01T00:00:00.000Z",
      "endDate": "2025-11-03T23:59:59.000Z",
      "_count": {
        "tracks": 3,
        "projects": 25
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

#### GET /api/hackathons/:id
Get a single hackathon by ID.

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: Hackathon ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "hack123",
    "name": "Web3 Hackathon 2025",
    "slug": "web3-hackathon-2025",
    "description": "Build the future of decentralized web",
    "status": "PUBLISHED",
    "startDate": "2025-11-01T00:00:00.000Z",
    "endDate": "2025-11-03T23:59:59.000Z",
    "tracks": [
      {
        "id": "track1",
        "name": "DeFi Track",
        "description": "Decentralized Finance applications"
      }
    ],
    "evaluationCriteria": [
      {
        "id": "criteria1",
        "name": "Innovation",
        "weight": 30
      }
    ],
    "settings": {
      "maxTeamSize": 5,
      "allowSoloParticipants": true
    }
  }
}
```

---

#### POST /api/hackathons
Create a new hackathon.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "basicInfo": {
    "name": "Web3 Hackathon 2025",
    "description": "Build the future of decentralized web",
    "tagline": "Innovate with Web3",
    "coverImage": "https://example.com/image.jpg"
  },
  "schedule": {
    "startDate": "2025-11-01T00:00:00.000Z",
    "endDate": "2025-11-03T23:59:59.000Z",
    "registrationDeadline": "2025-10-25T23:59:59.000Z",
    "submissionDeadline": "2025-11-03T20:00:00.000Z"
  },
  "tracks": [
    {
      "name": "DeFi Track",
      "description": "Decentralized Finance applications",
      "prizes": ["$5000", "$3000", "$2000"]
    }
  ],
  "evaluationCriteria": [
    {
      "name": "Innovation",
      "description": "Novel ideas and creativity",
      "weight": 30
    }
  ],
  "settings": {
    "maxTeamSize": 5,
    "allowSoloParticipants": true,
    "requireGitHubRepo": true
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "hack123",
    "name": "Web3 Hackathon 2025",
    "slug": "web3-hackathon-2025",
    "status": "DRAFT"
  },
  "message": "Hackathon created successfully"
}
```

---

#### PUT /api/hackathons/:id
Update an existing hackathon.

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: Hackathon ID

**Request Body:** Same structure as POST, all fields optional

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "hack123",
    "name": "Web3 Hackathon 2025 - Updated",
    "slug": "web3-hackathon-2025"
  },
  "message": "Hackathon updated successfully"
}
```

---

#### DELETE /api/hackathons/:id
Delete a hackathon.

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: Hackathon ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Hackathon deleted successfully"
}
```

---

### Tracks Module

#### GET /api/hackathons/:hackathonId/tracks
Get all tracks for a hackathon.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "track1",
      "name": "DeFi Track",
      "description": "Decentralized Finance applications",
      "prizes": ["$5000", "$3000", "$2000"],
      "_count": {
        "projects": 10
      }
    }
  ]
}
```

---

#### POST /api/hackathons/:hackathonId/tracks
Add a track to a hackathon.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "NFT Track",
  "description": "Non-Fungible Token applications",
  "prizes": ["$4000", "$2000", "$1000"]
}
```

---

#### DELETE /api/hackathons/:hackathonId/tracks/:trackId
Remove a track from a hackathon.

**Headers:** `Authorization: Bearer <token>`

---

### Projects Module

#### GET /api/projects/:id
Get a single project by ID.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "proj123",
      "name": "DeFi Swap Platform",
      "description": "A decentralized exchange built on Hedera",
      "githubUrl": "https://github.com/user/defi-swap",
      "status": "SUBMITTED",
      "hackathon": {
        "id": "hack123",
        "name": "Web3 Hackathon 2025"
      },
      "track": {
        "id": "track1",
        "name": "DeFi Track"
      },
      "teamMembers": [
        {
          "name": "John Doe",
          "email": "john@example.com",
          "role": "Developer"
        }
      ],
      "innovationReport": {
        "id": "report1",
        "status": "COMPLETED",
        "score": 85
      },
      "coherenceReport": {
        "id": "report2",
        "status": "COMPLETED",
        "score": 90
      },
      "hederaAnalysisReport": {
        "id": "report3",
        "status": "COMPLETED",
        "score": 78
      }
    }
  }
}
```

---

#### POST /api/projects
Create a new project submission.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "DeFi Swap Platform",
  "description": "A decentralized exchange built on Hedera",
  "githubUrl": "https://github.com/user/defi-swap",
  "liveUrl": "https://defi-swap.example.com",
  "videoUrl": "https://youtube.com/watch?v=xxx",
  "hackathonId": "hack123",
  "trackId": "track1",
  "teamMembers": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Developer"
    }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "proj123",
    "name": "DeFi Swap Platform",
    "status": "DRAFT"
  },
  "message": "Project created successfully"
}
```

---

#### PUT /api/projects/:id
Update a project.

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: Project ID

**Request Body:** Same structure as POST, all fields optional

---

#### DELETE /api/projects/:id
Delete a project.

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: Project ID

---

### Reviews Module

#### GET /api/projects/:projectId/review/status
Get overall review status for a project.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "projectId": "proj123",
    "innovation": {
      "status": "COMPLETED",
      "reportId": "report1",
      "score": 85
    },
    "coherence": {
      "status": "COMPLETED",
      "reportId": "report2",
      "score": 90
    },
    "hedera": {
      "status": "IN_PROGRESS",
      "reportId": "report3"
    },
    "overallProgress": 66
  }
}
```

---

#### POST /api/projects/:projectId/review/innovation
Start innovation analysis for a project.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "reportId": "report1",
    "status": "PENDING",
    "message": "Innovation analysis queued"
  }
}
```

**Process:**
1. Creates innovation report with PENDING status
2. Queues analysis job in Bull
3. Background processor analyzes code via AI
4. Updates report with results

---

#### GET /api/projects/:projectId/review/innovation/:reportId
Get innovation analysis report.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "report1",
    "projectId": "proj123",
    "status": "COMPLETED",
    "score": 85,
    "novelty": 90,
    "creativity": 85,
    "technicalComplexity": 80,
    "impactPotential": 85,
    "summary": "Highly innovative DeFi platform with novel AMM algorithm",
    "strengths": ["Novel AMM design", "Strong tokenomics"],
    "improvements": ["Add more documentation"],
    "detailedAnalysis": {...}
  }
}
```

---

#### POST /api/projects/:projectId/review/coherence
Start coherence analysis.

**Headers:** `Authorization: Bearer <token>`

**Similar structure to innovation review**

---

#### GET /api/projects/:projectId/review/coherence/:reportId
Get coherence analysis report.

**Headers:** `Authorization: Bearer <token>`

---

#### DELETE /api/projects/:projectId/review/coherence/:reportId/delete
Delete coherence report.

**Headers:** `Authorization: Bearer <token>`

---

#### POST /api/projects/:projectId/review/hedera
Start Hedera integration analysis.

**Headers:** `Authorization: Bearer <token>`

---

#### GET /api/projects/:projectId/review/hedera/:reportId
Get Hedera analysis report.

**Headers:** `Authorization: Bearer <token>`

---

### Code Quality Module

#### POST /api/projects/:projectId/code-quality
Start code quality analysis.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "reportId": "cq123",
    "status": "QUEUED"
  }
}
```

---

#### GET /api/projects/:projectId/code-quality/:reportId
Get code quality report.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "cq123",
    "status": "COMPLETED",
    "overallScore": 87,
    "currentStage": "Completed",
    "summary": "High quality codebase with good practices",
    "metrics": {
      "codeQuality": 85,
      "documentation": 90,
      "testCoverage": 80,
      "security": 92
    }
  }
}
```

---

### Eligibility Module

#### POST /api/projects/:projectId/eligibility-check
Check project eligibility against criteria.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "criteria": [
    {
      "name": "GitHub Repository",
      "description": "Must have public GitHub repo"
    },
    {
      "name": "Team Size",
      "description": "Max 5 members"
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "checks": [
      {
        "criterion": "GitHub Repository",
        "passed": true,
        "message": "Valid GitHub repository found"
      },
      {
        "criterion": "Team Size",
        "passed": true,
        "message": "Team has 3 members (within limit)"
      }
    ]
  }
}
```

---

### AI Jury Module

#### GET /api/ai-jury/sessions?hackathonId=xxx
Get AI Jury session for a hackathon.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `hackathonId`: Hackathon ID

**Success Response (200):**
```json
{
  "id": "session123",
  "hackathonId": "hack123",
  "status": "IN_PROGRESS",
  "currentLayer": 2,
  "totalLayers": 4,
  "createdAt": "2025-10-04T12:00:00.000Z"
}
```

---

#### POST /api/ai-jury/sessions
Create new AI Jury session.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "hackathonId": "hack123",
  "eligibilityCriteria": [
    {
      "name": "GitHub Repository",
      "description": "Must have public GitHub repo"
    }
  ]
}
```

**Success Response (201):**
```json
{
  "id": "session123",
  "hackathonId": "hack123",
  "status": "PENDING",
  "message": "AI Jury session created"
}
```

---

#### GET /api/ai-jury/sessions/:id/progress
Get session progress.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "sessionId": "session123",
  "status": "IN_PROGRESS",
  "currentLayer": 2,
  "layers": {
    "1": {
      "status": "COMPLETED",
      "processed": 50,
      "advanced": 30,
      "eliminated": 20
    },
    "2": {
      "status": "IN_PROGRESS",
      "processed": 15,
      "advanced": 0,
      "eliminated": 0
    }
  }
}
```

---

#### GET /api/ai-jury/sessions/:id/live-progress
Get real-time session progress (includes live updates).

**Headers:** `Authorization: Bearer <token>`

---

#### GET /api/ai-jury/sessions/:id/results
Get final jury results.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "sessionId": "session123",
  "finalResults": [
    {
      "projectId": "proj1",
      "projectName": "DeFi Swap",
      "finalScore": 92,
      "rank": 1,
      "layerResults": {
        "1": { "passed": true, "score": 90 },
        "2": { "passed": true, "score": 88 },
        "3": { "passed": true, "score": 95 },
        "4": { "passed": true, "score": 92 }
      }
    }
  ]
}
```

---

#### POST /api/ai-jury/sessions/:id/execute-layer
Execute a specific jury layer.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "layer": 1
}
```

**Success Response (200):**
```json
{
  "sessionId": "session123",
  "layer": 1,
  "status": "PROCESSING",
  "message": "Layer 1 execution started"
}
```

**Layer Descriptions:**
- **Layer 1:** Eligibility check
- **Layer 2:** Hedera integration analysis
- **Layer 3:** Code quality evaluation
- **Layer 4:** Final comprehensive analysis

---

#### POST /api/ai-jury/sessions/:id/reset
Reset AI Jury session.

**Headers:** `Authorization: Bearer <token>`

---

### Notifications Module

#### GET /api/notifications
Get user notifications.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `type` (optional): Filter by type (HACKATHON_UPDATE, PROJECT_STATUS, REVIEW_COMPLETE, etc.)
- `category` (optional): Filter by category
- `priority` (optional): Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `read` (optional): Filter by read status ("true" or "false")
- `limit` (optional): Number of results (default: 50)

**Success Response (200):**
```json
{
  "notifications": [
    {
      "id": "notif123",
      "type": "REVIEW_COMPLETE",
      "category": "PROJECT",
      "priority": "HIGH",
      "title": "Innovation Review Complete",
      "message": "Your innovation analysis is ready",
      "data": {
        "projectId": "proj123",
        "reportId": "report1"
      },
      "read": false,
      "createdAt": "2025-10-04T12:00:00.000Z"
    }
  ],
  "total": 1,
  "unreadCount": 1
}
```

---

#### POST /api/notifications
Create a notification.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "HACKATHON_UPDATE",
  "category": "HACKATHON",
  "priority": "MEDIUM",
  "title": "Hackathon Starting Soon",
  "message": "Your hackathon starts in 24 hours",
  "data": {
    "hackathonId": "hack123"
  }
}
```

---

#### POST /api/notifications/mark-read
Mark a notification as read.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "notificationId": "notif123"
}
```

---

#### POST /api/notifications/mark-all-read
Mark all notifications as read.

**Headers:** `Authorization: Bearer <token>`

---

#### DELETE /api/notifications/:id
Delete a notification.

**Headers:** `Authorization: Bearer <token>`

---

## WebSocket Events

Connect to WebSocket for real-time updates:

**Namespace:** `/events`
**Authentication:** JWT token required

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000/events', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connected', (data) => {
  console.log('Connected:', data);
});
```

### Subscribe to Project Updates

```javascript
socket.emit('subscribe:project', { projectId: 'proj123' });

socket.on('analysis:progress', (update) => {
  console.log('Progress:', update);
  // {
  //   projectId: 'proj123',
  //   analysisType: 'innovation',
  //   status: 'IN_PROGRESS',
  //   progress: 45,
  //   currentStage: 'Analyzing code structure'
  // }
});

socket.on('analysis:completed', (data) => {
  console.log('Analysis complete:', data);
});

socket.on('analysis:failed', (error) => {
  console.error('Analysis failed:', error);
});
```

### Subscribe to AI Jury Updates

```javascript
socket.emit('subscribe:ai-jury', { sessionId: 'session123' });

socket.on('ai-jury:progress', (update) => {
  console.log('Jury progress:', update);
});

socket.on('ai-jury:layer-completed', (data) => {
  console.log('Layer complete:', data);
});

socket.on('ai-jury:completed', (data) => {
  console.log('Jury complete:', data);
});
```

### Unsubscribe

```javascript
socket.emit('unsubscribe:project', { projectId: 'proj123' });
socket.emit('unsubscribe:ai-jury', { sessionId: 'session123' });
```

### Ping/Pong

```javascript
socket.emit('ping');
socket.on('pong', (data) => {
  console.log('Pong:', data); // { pong: true, timestamp: '...' }
});
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error message or array of validation errors",
  "error": "Bad Request"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Common Errors

**Validation Error (400):**
```json
{
  "statusCode": 400,
  "message": [
    "email must be a valid email",
    "password must be at least 6 characters"
  ],
  "error": "Bad Request"
}
```

**Unauthorized (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Resource Not Found (404):**
```json
{
  "statusCode": 404,
  "message": "Hackathon not found",
  "error": "Not Found"
}
```

---

## Rate Limiting

**Default Limits:**
- 100 requests per 15-minute window per IP
- Configurable via environment variables

**Headers:**
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

**Rate Limit Exceeded (429):**
```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Rate Limit Exceeded"
}
```

---

## Additional Resources

- **Swagger UI:** http://localhost:4000/api/docs
- **WebSocket Testing:** See `WEBSOCKET_DOCUMENTATION.md`
- **Authentication Guide:** See `AUTHENTICATION_GUIDE.md`
- **Backend Testing Guide:** See `TESTING.md`

---

**Last Updated:** October 4, 2025
**API Version:** 1.0
