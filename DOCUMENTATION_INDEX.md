# 4Hacks Project Documentation Index

## 📚 Complete Documentation Hub

This document serves as the central index for all project documentation.

---

## 🗂️ Quick Navigation

### Backend Documentation
- **[Backend Docs Hub](backend/docs/README.md)** - Main documentation index
- **[API Documentation](backend/docs/API_DOCUMENTATION.md)** - Complete REST API reference
- **[Swagger Guide](backend/docs/SWAGGER_GUIDE.md)** - Interactive API docs guide
- **[WebSocket Documentation](backend/docs/WEBSOCKET_DOCUMENTATION.md)** - Real-time events
- **[Authentication Guide](backend/docs/AUTHENTICATION_GUIDE.md)** - JWT implementation
- **[Backend Testing](backend/TESTING.md)** - Testing procedures
- **[Documentation Summary](backend/DOCUMENTATION_SUMMARY.md)** - What was documented

### Project Documentation
- **[Migration Audit](MIGRATION_AUDIT.md)** - Next.js to NestJS migration analysis
- **[Cleanup Summary](CLEANUP_SUMMARY.md)** - Phase 4 cleanup details

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

**Backend will be available at:**
- API: http://localhost:4000/api
- Swagger Docs: http://localhost:4000/api/docs

### 2. Frontend Setup

```bash
# Navigate to project root
cd ..

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with backend URL

# Start development server
npm run dev
```

**Frontend will be available at:**
- App: http://localhost:3000

---

## 📖 Documentation Categories

### Architecture & Design

**Migration Documentation:**
- [Migration Audit](MIGRATION_AUDIT.md) - Comprehensive comparison of Next.js routes vs NestJS endpoints
  - 48/48 critical endpoints migrated (100%)
  - Module-by-module analysis
  - Migration status tracking

**Cleanup Documentation:**
- [Cleanup Summary](CLEANUP_SUMMARY.md) - Phase 4 cleanup details
  - API routes deletion
  - Dependencies cleanup
  - Environment configuration
  - Rollback procedures

### API Documentation

**Complete API Reference:**
- [API Documentation](backend/docs/API_DOCUMENTATION.md)
  - All 48 REST endpoints
  - Request/response schemas
  - Authentication requirements
  - Error handling
  - Query parameters

**Interactive Documentation:**
- [Swagger Guide](backend/docs/SWAGGER_GUIDE.md)
  - How to use Swagger UI
  - Authorization setup
  - Testing endpoints
  - Code generation
  - Troubleshooting

### Real-time & WebSocket

**WebSocket Events:**
- [WebSocket Documentation](backend/docs/WEBSOCKET_DOCUMENTATION.md)
  - Connection and authentication
  - Subscription management
  - Analysis progress events
  - AI Jury updates
  - React integration examples

### Authentication & Security

**JWT Implementation:**
- [Authentication Guide](backend/docs/AUTHENTICATION_GUIDE.md)
  - Registration and login flow
  - Token management
  - Frontend implementation
  - React Context and Hooks
  - Security best practices

### Testing

**Backend Testing:**
- [Testing Guide](backend/TESTING.md)
  - Health check procedures
  - Endpoint testing with curl
  - WebSocket testing
  - Common issues and solutions
  - Production readiness checklist

---

## 🏗️ Project Architecture

### Backend (NestJS)

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/              # JWT authentication
│   │   ├── hackathons/        # Hackathon management
│   │   ├── projects/          # Project submissions
│   │   ├── ai-agents/         # AI analysis (Innovation, Coherence, Hedera)
│   │   ├── ai-jury/           # Automated judging
│   │   ├── notifications/     # Notifications
│   │   └── events/            # WebSocket gateway
│   ├── database/              # Prisma service
│   └── main.ts               # Swagger configuration
├── docs/                      # Documentation
├── prisma/                    # Database schema & migrations
└── package.json
```

**Technology Stack:**
- Framework: NestJS 11.x
- Database: PostgreSQL with Prisma ORM
- Authentication: JWT (Passport.js)
- Real-time: Socket.IO
- Background Jobs: Bull Queue with Redis
- API Docs: Swagger/OpenAPI
- Validation: class-validator

### Frontend (Next.js)

```
src/
├── app/                       # Next.js 14 app directory
├── components/               # React components
├── lib/
│   ├── api/                  # API client & WebSocket client
│   └── [other utilities]
└── [other frontend code]
```

**Technology Stack:**
- Framework: Next.js 14
- UI: React 18, Tailwind CSS, Radix UI
- State: React Context (for auth)
- HTTP Client: Fetch API / Axios
- Real-time: Socket.IO client

---

## 📊 API Endpoints Overview

### Authentication (4 endpoints)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `GET /api/auth/register/status` - Check registration availability

### Hackathons (5 endpoints)
- `GET /api/hackathons` - List all hackathons
- `GET /api/hackathons/:id` - Get single hackathon
- `POST /api/hackathons` - Create hackathon
- `PUT /api/hackathons/:id` - Update hackathon
- `DELETE /api/hackathons/:id` - Delete hackathon

### Tracks (3 endpoints)
- `GET /api/hackathons/:id/tracks` - List tracks
- `POST /api/hackathons/:id/tracks` - Add track
- `DELETE /api/hackathons/:id/tracks/:trackId` - Remove track

### Projects (4 endpoints)
- `GET /api/projects/:id` - Get project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Reviews (9 endpoints)
- Innovation analysis (3)
- Coherence analysis (4)
- Hedera analysis (2)

### Code Quality (2 endpoints)
- Start analysis
- Get report

### Eligibility (1 endpoint)
- Check project eligibility

### AI Jury (7 endpoints)
- Session management (3)
- Progress tracking (2)
- Layer execution (2)

### Notifications (5 endpoints)
- List, create, mark read, delete

### WebSocket Gateway
- Real-time project updates
- AI Jury progress
- Analysis events

**Total: 48 REST endpoints + WebSocket**

---

## 🔑 Environment Configuration

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://user:pass@host:port/db"

# Server
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"

# JWT
JWT_SECRET="your-secure-secret-min-64-chars"
JWT_EXPIRATION="7d"

# Redis (for Bull queues)
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# AI Services
TOGETHER_AI_API_KEY="your-together-ai-key"
GITHUB_TOKEN="your-github-token"
```

### Frontend (.env)

```env
# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Backend API URLs
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_WS_URL="http://localhost:4000"
```

---

## 🧪 Testing the System

### 1. Health Check

```bash
# Backend health
curl http://localhost:4000/api/health

# Should return: Backend is healthy
```

### 2. Test Authentication

```bash
# Register user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### 3. Use Swagger UI

1. Navigate to http://localhost:4000/api/docs
2. Click **"Authorize"**
3. Enter JWT token from login
4. Test any endpoint interactively

---

## 📦 Key Features

### AI-Powered Analysis
- **Innovation Analysis:** Evaluates novelty, creativity, impact
- **Coherence Analysis:** Checks code structure and organization
- **Hedera Analysis:** Analyzes Hedera network integration
- **Code Quality:** Comprehensive quality metrics

### Automated AI Jury
- **4-Layer Evaluation:**
  1. Eligibility Check
  2. Hedera Integration Analysis
  3. Code Quality Evaluation
  4. Final Comprehensive Analysis
- Batch processing with progress tracking
- Real-time updates via WebSocket

### Real-time Updates
- WebSocket subscriptions for projects
- Analysis progress notifications
- AI Jury execution updates
- Live notifications

### Background Processing
- Bull queue integration
- Redis-backed job processing
- Asynchronous analysis execution
- Progress tracking and reporting

---

## 🔧 Development Commands

### Backend

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start:prod      # Run production build

# Database
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run migrations
npm run db:push         # Push schema changes
npm run db:studio       # Open Prisma Studio

# Testing
npm run test            # Run tests
npm run test:watch      # Watch mode
npm run test:cov        # Coverage report

# Code Quality
npm run lint            # Lint code
npm run format          # Format code
```

### Frontend

```bash
# Development
npm run dev             # Start dev server
npm run build          # Build for production
npm run start          # Run production build

# Code Quality
npm run lint           # Lint code
npm run format         # Format code
npm run type-check     # TypeScript check
```

---

## 🚨 Common Issues & Solutions

### Backend Won't Start
- ✅ Check PostgreSQL is running
- ✅ Verify .env configuration
- ✅ Run `npm install`
- ✅ Check Redis is running (for queues)

### 401 Unauthorized Errors
- ✅ Verify JWT token is valid
- ✅ Check Authorization header format: `Bearer <token>`
- ✅ Ensure token hasn't expired

### WebSocket Connection Fails
- ✅ Check backend is running on port 4000
- ✅ Verify WebSocket URL in frontend
- ✅ Ensure JWT token is provided

### Database Errors
- ✅ Run `npm run db:generate`
- ✅ Check DATABASE_URL in .env
- ✅ Verify PostgreSQL is accessible
- ✅ Run migrations: `npm run db:migrate`

### CORS Errors
- ✅ Check FRONTEND_URL in backend .env
- ✅ Verify CORS configuration in main.ts
- ✅ Ensure ports match

---

## 📈 Migration Progress

### Completed ✅
- ✅ Phase 1: NestJS Foundation
- ✅ Phase 2: All Modules Migrated (Auth, Hackathons, Projects, AI Agents, AI Jury, Scoring, Notifications, Events)
- ✅ Phase 3: Frontend Integration Foundation (API Client, WebSocket Client)
- ✅ Phase 4: Cleanup (API routes deleted, dependencies cleaned)
- ✅ **Phase 5: Documentation** (Swagger, Guides, Examples)

### Pending
- ⏳ Phase 3 Continuation: Update frontend components to use API client
- ⏳ Phase 6: Infrastructure (Docker, Redis, production config)
- ⏳ Phase 7: Deployment

---

## 📚 Additional Resources

### External Documentation
- **NestJS:** https://docs.nestjs.com
- **Prisma:** https://www.prisma.io/docs
- **Swagger/OpenAPI:** https://swagger.io/specification/
- **Socket.IO:** https://socket.io/docs/v4/
- **Bull Queue:** https://github.com/OptimalBits/bull
- **Next.js:** https://nextjs.org/docs

### Project Links
- **Backend Swagger UI:** http://localhost:4000/api/docs
- **Backend API:** http://localhost:4000/api
- **Frontend:** http://localhost:3000

### Support
- Check documentation first
- Review troubleshooting guides
- Check GitHub issues (if applicable)

---

## 🎯 Next Steps

### Immediate
1. **Test Swagger UI:**
   - Start backend: `cd backend && npm run dev`
   - Open http://localhost:4000/api/docs
   - Test authentication and endpoints

2. **Review Documentation:**
   - Read through API_DOCUMENTATION.md
   - Understand WebSocket events
   - Review authentication flow

### Short-term
1. **Update Frontend:**
   - Replace old API calls with new API client
   - Integrate WebSocket for real-time updates
   - Update authentication to use JWT

2. **Add More Features:**
   - Implement remaining non-critical endpoints
   - Add file upload support
   - Enhance analytics

### Long-term
1. **Infrastructure:**
   - Docker containerization
   - Redis clustering
   - Load balancing

2. **Deployment:**
   - Production environment setup
   - CI/CD pipeline
   - Monitoring and logging

---

## ✅ Documentation Checklist

- [x] Swagger/OpenAPI integration
- [x] Interactive API documentation
- [x] All endpoints documented
- [x] All DTOs documented
- [x] Authentication guide
- [x] WebSocket documentation
- [x] Testing procedures
- [x] Architecture documentation
- [x] Migration audit
- [x] Cleanup summary
- [x] This index file

**Documentation Status: 100% Complete** 🎉

---

**Last Updated:** October 4, 2025
**Project:** 4Hacks
**API Version:** 1.0
**Documentation Version:** 1.0

---

## 📞 Quick Reference

| Resource | URL |
|----------|-----|
| Backend API | http://localhost:4000/api |
| Swagger Docs | http://localhost:4000/api/docs |
| Frontend | http://localhost:3000 |
| Prisma Studio | Run `npm run db:studio` |

| Documentation | Path |
|---------------|------|
| Main Index | [This file](DOCUMENTATION_INDEX.md) |
| Backend Hub | [backend/docs/README.md](backend/docs/README.md) |
| API Reference | [backend/docs/API_DOCUMENTATION.md](backend/docs/API_DOCUMENTATION.md) |
| Swagger Guide | [backend/docs/SWAGGER_GUIDE.md](backend/docs/SWAGGER_GUIDE.md) |
| WebSocket | [backend/docs/WEBSOCKET_DOCUMENTATION.md](backend/docs/WEBSOCKET_DOCUMENTATION.md) |
| Auth Guide | [backend/docs/AUTHENTICATION_GUIDE.md](backend/docs/AUTHENTICATION_GUIDE.md) |
| Testing | [backend/TESTING.md](backend/TESTING.md) |

---

**Happy Coding! 🚀**
