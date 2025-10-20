# Backend API - 4Hacks

NestJS backend server for the 4Hacks hackathon management platform.

## Project Structure

```
backend/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── config/                 # Configuration files
│   ├── common/                 # Shared utilities, guards, interceptors
│   ├── database/               # Prisma service & migrations
│   │   ├── prisma.service.ts
│   │   └── database.module.ts
│   └── modules/
│       ├── auth/               # Authentication & authorization
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth.module.ts
│       │   ├── dto/            # Data transfer objects
│       │   ├── guards/         # Auth guards (JWT, Roles)
│       │   ├── strategies/     # Passport strategies
│       │   └── decorators/     # Custom decorators
│       ├── hackathons/         # (TODO) Hackathon management
│       ├── projects/           # (TODO) Project management
│       ├── ai-agents/          # (TODO) AI analysis agents
│       ├── ai-jury/            # (TODO) AI Jury system
│       ├── notifications/      # (TODO) Notification system
│       └── analytics/          # (TODO) Analytics & stats
├── prisma/                     # Prisma schema & migrations
│   └── schema.prisma
├── .env                        # Environment variables
├── .env.example                # Environment template
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## Setup

### Prerequisites

- Node.js >= 18
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials and secrets
```

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed database
npm run db:seed
```

## Development

```bash
# Start dev server with hot reload
npm run dev

# Server will run on http://localhost:4000
# API available at http://localhost:4000/api
```

## API Endpoints

### Authentication (`/api/auth`)

#### `POST /api/auth/register`
Register a new user. First user becomes SUPER_ADMIN.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123"
}
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ADMIN",
    "createdAt": "..."
  },
  "message": "User created successfully"
}
```

#### `POST /api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "secure123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ADMIN"
  }
}
```

#### `GET /api/auth/register/status`
Check if registration is allowed (no users exist).

**Response:**
```json
{
  "registrationAllowed": true,
  "message": "Registration is allowed for the first admin user"
}
```

#### `GET /api/auth/me`
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ADMIN"
  }
}
```

## Authentication

All API endpoints require authentication via JWT token, except routes marked with `@Public()` decorator:
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/register/status`

### Using Authentication

1. **Register** or **Login** to get `accessToken`
2. Include token in all subsequent requests:
   ```
   Authorization: Bearer <your-access-token>
   ```

### Role-Based Access Control

Use `@Roles()` decorator to restrict endpoints:
```typescript
@Roles('ADMIN', 'SUPER_ADMIN')
@Get('admin-only')
adminOnlyRoute() { ... }
```

## Environment Variables

```env
# Server
PORT=4000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:pass@host:port/database

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# AI Services (for future modules)
OPENAI_API_KEY=...
TOGETHER_AI_API_KEY=...

# GitHub API
GITHUB_TOKEN=...
```

## Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run start:debug      # Start with debugging

# Build & Production
npm run build            # Build for production
npm run start            # Start built server
npm run start:prod       # Start in production mode

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to DB
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database

# Testing
npm run test             # Run unit tests
npm run test:watch       # Watch mode
npm run test:cov         # With coverage
npm run test:e2e         # E2E tests
```

## Architecture

### Module-Based Design
Each feature is isolated in its own module with:
- Controller (HTTP routes)
- Service (business logic)
- DTOs (data validation)
- Guards (authorization)
- Entities/Interfaces

### Global Features
- **JWT Authentication** - Automatic on all routes via `APP_GUARD`
- **Validation Pipe** - Automatic request validation with `class-validator`
- **CORS** - Configured for frontend origin
- **Global API Prefix** - All routes under `/api`

### Database Access
- **Prisma ORM** - Type-safe database access
- **Global PrismaService** - Available in all modules
- **Migrations** - Version-controlled schema changes

## Migration Progress

### ✅ Completed
- [x] Phase 1.1: NestJS project initialization
- [x] Phase 1.2: Prisma setup in backend
- [x] Phase 1.3: Environment and CORS configuration
- [x] Phase 2.1: Auth module with JWT strategy
- [x] Phase 2.2: Hackathons and Tracks modules
- [x] Phase 2.3: Projects module (Reviews, Code Quality, Eligibility)
- [x] Phase 2.4: AI Agents module with Bull queues (Innovation processor)

### 🚧 In Progress
- [ ] Phase 2.4: Complete AI Agents (Coherence and Hedera processors)
- [ ] Phase 2.5: AI Jury module
- [ ] Phase 2.6: Analysis Engine
- [ ] Phase 2.7: Notifications and Analytics
- [ ] Phase 2.8: WebSocket gateways

### 📋 Upcoming
- [ ] Phase 3: Frontend API client
- [ ] Phase 4: Cleanup old Next.js API routes
- [ ] Phase 5: Docker, Redis, optimization
- [ ] Phase 6: Deployment

## Tech Stack

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Prisma** - Modern ORM
- **PostgreSQL** - Relational database
- **JWT** - Stateless authentication
- **Passport** - Authentication middleware
- **class-validator** - DTO validation

## Next Steps

1. Migrate Hackathons module from `src/app/api/hackathons`
2. Migrate Projects module from `src/app/api/projects`
3. Migrate AI Agents from `src/lib/ai-agents`
4. Set up Bull queue for background jobs
5. Create WebSocket gateways for real-time updates
6. Update frontend to use backend API
