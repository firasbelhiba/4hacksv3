# 4Hacks Backend Documentation

Welcome to the comprehensive documentation for the 4Hacks Backend API.

## 📚 Documentation Index

### Getting Started
- **[API Documentation](./API_DOCUMENTATION.md)** - Complete REST API reference with all endpoints
- **[Swagger Guide](./SWAGGER_GUIDE.md)** - Interactive API documentation guide
- **[Testing Guide](../TESTING.md)** - Backend testing and validation guide

### Authentication & Security
- **[Authentication Guide](./AUTHENTICATION_GUIDE.md)** - JWT authentication flow and implementation
- **[WebSocket Documentation](./WEBSOCKET_DOCUMENTATION.md)** - Real-time events and subscriptions

### Architecture
- **[Migration Audit](../../MIGRATION_AUDIT.md)** - Next.js to NestJS migration details
- **[Cleanup Summary](../../CLEANUP_SUMMARY.md)** - Phase 4 cleanup documentation

## 🚀 Quick Start

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

The server will start on `http://localhost:4000`

### 2. Access Swagger UI

Navigate to: **http://localhost:4000/api/docs**

### 3. Authenticate

1. Register a user: `POST /api/auth/register`
2. Copy the `accessToken` from response
3. Click "Authorize" button in Swagger UI
4. Enter token and authorize

### 4. Test Endpoints

Try creating a hackathon:
```bash
POST /api/hackathons
{
  "basicInfo": {
    "name": "My First Hackathon",
    "description": "Test hackathon"
  },
  "schedule": {
    "startDate": "2025-11-01T00:00:00.000Z",
    "endDate": "2025-11-03T23:59:59.000Z"
  }
}
```

## 📖 Documentation Overview

### API Documentation
Comprehensive REST API reference covering:
- All 48 endpoints across 9 modules
- Request/response schemas
- Authentication requirements
- Error handling
- Query parameters and filters

### Swagger Guide
Learn how to use the interactive API documentation:
- Authorization setup
- Testing endpoints
- Schema exploration
- Code generation
- Troubleshooting

### WebSocket Documentation
Real-time events guide covering:
- Connection and authentication
- Subscription management
- Analysis progress events
- AI Jury updates
- React integration examples

### Authentication Guide
Complete JWT authentication guide including:
- Registration and login flow
- Token management
- Frontend implementation (React Context, Hooks)
- Role-based access control
- Security best practices

### Testing Guide
Backend testing documentation:
- Health check procedures
- Endpoint testing with curl
- WebSocket testing
- Common issues and solutions

## 🏗️ Architecture Overview

### Technology Stack
- **Framework:** NestJS 11.x
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (Passport.js)
- **Real-time:** Socket.IO
- **Background Jobs:** Bull Queue with Redis
- **API Documentation:** Swagger/OpenAPI
- **Validation:** class-validator, class-transformer

### Module Structure

```
backend/src/
├── modules/
│   ├── auth/           # Authentication (JWT, Guards, Strategies)
│   ├── hackathons/     # Hackathon CRUD
│   ├── projects/       # Project management
│   ├── ai-agents/      # AI analysis (Innovation, Coherence, Hedera)
│   ├── ai-jury/        # Automated judging system
│   ├── notifications/  # Notification management
│   └── events/         # WebSocket gateway
├── database/           # Prisma service
└── main.ts            # Application entry point
```

### Key Features

1. **JWT Authentication**
   - Secure token-based auth
   - Global guard protection
   - Public decorator for opt-out

2. **AI-Powered Analysis**
   - Innovation analysis
   - Code coherence checking
   - Hedera integration analysis
   - Code quality evaluation

3. **Automated AI Jury**
   - 4-layer evaluation system
   - Batch processing
   - Real-time progress tracking

4. **Real-time Updates**
   - WebSocket support
   - Analysis progress events
   - AI Jury notifications

5. **Background Processing**
   - Bull queue integration
   - Redis-backed jobs
   - Asynchronous analysis

## 🔑 Environment Configuration

### Required Variables

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

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# AI Services
TOGETHER_AI_API_KEY="your-together-ai-key"
GITHUB_TOKEN="your-github-token"
```

See `backend/.env.example` for complete configuration.

## 🧪 Testing

### Run All Tests
```bash
npm run test
```

### Manual Testing
```bash
# Health check
curl http://localhost:4000/api/health

# Register user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

See [TESTING.md](../TESTING.md) for complete testing guide.

## 🔗 API Endpoints Summary

### Authentication (4 endpoints)
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get profile
- `GET /api/auth/register/status` - Check registration status

### Hackathons (5 endpoints)
- `GET /api/hackathons` - List hackathons
- `GET /api/hackathons/:id` - Get hackathon
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
- Innovation analysis (3 endpoints)
- Coherence analysis (4 endpoints)
- Hedera analysis (2 endpoints)

### Code Quality (2 endpoints)
- `POST /api/projects/:id/code-quality` - Start analysis
- `GET /api/projects/:id/code-quality/:reportId` - Get report

### Eligibility (1 endpoint)
- `POST /api/projects/:id/eligibility-check` - Check eligibility

### AI Jury (7 endpoints)
- Session management (3 endpoints)
- Progress tracking (2 endpoints)
- Layer execution (2 endpoints)

### Notifications (5 endpoints)
- `GET /api/notifications` - List notifications
- `POST /api/notifications` - Create notification
- `POST /api/notifications/mark-read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### WebSocket Events
- Project subscriptions
- AI Jury subscriptions
- Analysis progress
- Real-time notifications

**Total: 48 REST endpoints + WebSocket gateway**

## 📊 Database Schema

The backend uses Prisma ORM with PostgreSQL. Key models:

- **User** - Authentication and authorization
- **Hackathon** - Hackathon management
- **Track** - Hackathon tracks
- **Project** - Project submissions
- **InnovationReport** - Innovation analysis results
- **CoherenceReport** - Coherence analysis results
- **HederaAnalysisReport** - Hedera integration analysis
- **CodeQualityReport** - Code quality results
- **AIJurySession** - Jury session management
- **AIJuryLayerResult** - Layer evaluation results
- **Notification** - User notifications

## 🔧 Development

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm run start:prod
```

### Database Operations
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema changes
npm run db:push

# Open Prisma Studio
npm run db:studio
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format
```

## 📦 Dependencies

### Core
- `@nestjs/core` - NestJS framework
- `@nestjs/common` - Common utilities
- `@nestjs/swagger` - API documentation
- `@prisma/client` - Database ORM

### Authentication
- `@nestjs/jwt` - JWT implementation
- `@nestjs/passport` - Passport integration
- `passport-jwt` - JWT strategy
- `bcryptjs` - Password hashing

### Background Jobs
- `@nestjs/bull` - Bull queue integration
- `bull` - Job queue
- `redis` - Redis client (peer dependency)

### AI & External Services
- `together-ai` - AI analysis
- `@octokit/rest` - GitHub API

### Real-time
- `@nestjs/websockets` - WebSocket support
- `@nestjs/platform-socket.io` - Socket.IO adapter
- `socket.io` - WebSocket library

### Validation
- `class-validator` - DTO validation
- `class-transformer` - DTO transformation

## 🚨 Troubleshooting

### Common Issues

**Backend won't start:**
- Check PostgreSQL is running
- Verify `.env` configuration
- Run `npm install` to install dependencies
- Check Redis is running (for queue features)

**401 Unauthorized:**
- Verify JWT token is valid
- Check token is sent in Authorization header
- Ensure token format is `Bearer <token>`

**WebSocket connection fails:**
- Check backend is running
- Verify WebSocket URL (port 4000)
- Ensure JWT token is provided

**Database errors:**
- Run `npm run db:generate`
- Check DATABASE_URL in `.env`
- Verify PostgreSQL is accessible

See individual documentation files for detailed troubleshooting.

## 📝 Additional Resources

- **NestJS Docs:** https://docs.nestjs.com
- **Prisma Docs:** https://www.prisma.io/docs
- **Swagger/OpenAPI:** https://swagger.io/specification/
- **Socket.IO:** https://socket.io/docs/v4/
- **Bull Queue:** https://github.com/OptimalBits/bull

## 🤝 Contributing

When adding new endpoints:

1. Create controller with Swagger decorators
2. Add DTOs with `@ApiProperty()` decorators
3. Update API_DOCUMENTATION.md
4. Add tests
5. Update this README if needed

## 📄 License

[Your License Here]

---

**Last Updated:** October 4, 2025
**API Version:** 1.0
**Backend Version:** 1.0.0
