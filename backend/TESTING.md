# Backend Testing Guide

## Prerequisites

1. **PostgreSQL** must be running with the database created
2. **Redis** must be running on port 6379
3. **Environment variables** configured in `.env`

```bash
# Required environment variables
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key"
REDIS_HOST="localhost"
REDIS_PORT="6379"
TOGETHER_AI_API_KEY="your-api-key" # For AI features
GITHUB_TOKEN="your-github-token" # Optional, for higher rate limits
```

---

## Starting the Backend

### Development Mode
```bash
cd backend
npm run dev
```

Server runs on: `http://localhost:4000`

### Production Mode
```bash
cd backend
npm run build
npm run start
```

---

## Quick Health Check

### 1. Server is Running
```bash
curl http://localhost:4000/api/auth/register/status
```

Expected response:
```json
{
  "registrationAllowed": true,
  "message": "Registration is allowed for the first admin user"
}
```

### 2. Database Connection
If the server starts without errors, database is connected.
Check logs for: `✅ Database connected successfully`

### 3. Redis Connection
If Bull queues initialize without errors, Redis is connected.
Check logs for Bull queue registrations.

---

## Testing Critical Endpoints

### Authentication

#### Register First User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Expected: User created with `SUPER_ADMIN` role

#### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Expected: JWT token in response

#### Get Profile (with token)
```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Hackathons

#### Create Hackathon
```bash
curl -X POST http://localhost:4000/api/hackathons \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "basicInfo": {
      "name": "Test Hackathon",
      "tagline": "A test hackathon",
      "description": "Testing the backend"
    },
    "schedule": {
      "startDate": "2025-01-01T00:00:00Z",
      "endDate": "2025-01-07T23:59:59Z",
      "timezone": "UTC"
    },
    "tracks": [
      {
        "name": "Web3",
        "description": "Web3 projects"
      }
    ],
    "evaluationCriteria": [
      {
        "name": "Innovation",
        "description": "How innovative is it",
        "weight": 30
      }
    ],
    "settings": {
      "maxTeamSize": 5,
      "allowLateSubmissions": false,
      "requireProjectApproval": false
    }
  }'
```

#### List Hackathons
```bash
curl http://localhost:4000/api/hackathons \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Projects

#### Create Project
```bash
curl -X POST http://localhost:4000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hackathonId": "HACKATHON_ID",
    "trackId": "TRACK_ID",
    "name": "Test Project",
    "description": "A test project",
    "githubUrl": "https://github.com/user/repo",
    "teamMembers": []
  }'
```

#### Start Innovation Review
```bash
curl -X POST http://localhost:4000/api/projects/PROJECT_ID/review/innovation \
  -H "Authorization: Bearer YOUR_TOKEN"
```

This will queue a background job. Check the report later:

```bash
curl http://localhost:4000/api/projects/PROJECT_ID/review/innovation/REPORT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### AI Jury

#### Create Session
```bash
curl -X POST http://localhost:4000/api/ai-jury/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hackathonId": "HACKATHON_ID",
    "eligibilityCriteria": {
      "submissionDeadline": true,
      "repositoryAccess": true
    }
  }'
```

#### Execute Layer
```bash
curl -X POST http://localhost:4000/api/ai-jury/sessions/SESSION_ID/execute-layer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "layer": 1 }'
```

---

### Notifications

#### List Notifications
```bash
curl http://localhost:4000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Notification
```bash
curl -X POST http://localhost:4000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "info",
    "category": "system",
    "title": "Test Notification",
    "message": "This is a test",
    "priority": "medium"
  }'
```

---

## Testing WebSocket Connection

### Using a WebSocket Client

1. Install `wscat` for testing:
```bash
npm install -g wscat
```

2. Connect to WebSocket:
```bash
wscat -c "ws://localhost:4000/events?token=YOUR_JWT_TOKEN"
```

3. Subscribe to project updates:
```json
{"event": "subscribe:project", "data": {"projectId": "PROJECT_ID"}}
```

4. You should receive real-time updates when analysis runs.

---

## Common Issues

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Start PostgreSQL and verify DATABASE_URL

### Redis Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution**: Start Redis server
```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or start local Redis
redis-server
```

### JWT Token Errors
```
401 Unauthorized
```
**Solution**:
- Ensure you included `Authorization: Bearer TOKEN` header
- Token might be expired (re-login)
- JWT_SECRET must match between sessions

### Bull Queue Not Processing
**Solution**:
- Ensure Redis is running
- Check logs for Bull queue registration
- Verify TOGETHER_AI_API_KEY is set for AI analysis

---

## Monitoring Logs

### Development
Logs appear in console with colored output and context.

### Production
```bash
# Using PM2
pm2 logs backend

# Using Docker
docker logs backend-container
```

### Important Log Messages

✅ **Success indicators:**
- `✅ Database connected successfully`
- `Application is running on: http://localhost:4000`
- `Client connected: xyz (User: userId)`

❌ **Error indicators:**
- `Authentication failed for client`
- `Database connection failed`
- `Analysis failed for project`

---

## Load Testing (Optional)

### Using Apache Bench
```bash
# Test auth endpoint
ab -n 100 -c 10 http://localhost:4000/api/auth/register/status
```

### Using Artillery
```bash
npm install -g artillery

# Create test.yml
artillery quick --count 10 --num 100 http://localhost:4000/api/auth/register/status
```

---

## Debugging Tips

1. **Enable Verbose Logging**: Set `LOG_LEVEL=debug` in `.env`

2. **Check Database Queries**: Enable Prisma query logging
   ```typescript
   // In prisma.service.ts
   log: ['query', 'info', 'warn', 'error']
   ```

3. **Monitor Redis**: Use Redis CLI
   ```bash
   redis-cli monitor
   ```

4. **Check Bull Queue Dashboard**: Install Bull Board (optional)
   ```bash
   npm install @bull-board/api @bull-board/express
   ```

---

## Ready for Production Checklist

- [ ] All environment variables are set
- [ ] Database migrations are run
- [ ] Redis is running and accessible
- [ ] JWT_SECRET is strong and secure (64+ characters)
- [ ] CORS is configured for production frontend URL
- [ ] SSL/TLS certificates are configured (for production)
- [ ] Rate limiting is enabled (optional)
- [ ] Logging is configured for production
- [ ] Health check endpoints are working
- [ ] WebSocket connection works
- [ ] Background jobs are processing

---

## Success!

If all tests pass, your backend is ready! 🎉

Next steps:
1. Update frontend to use the API client
2. Test end-to-end flows
3. Clean up old Next.js API routes
