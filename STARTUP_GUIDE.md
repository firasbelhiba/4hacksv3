# 🚀 Project Startup Guide

Complete guide to run the 4Hacks platform with NestJS backend and Next.js frontend.

---

## Quick Start (TL;DR)

```bash
# Terminal 1: Backend (NestJS)
cd backend
npm install
npm run dev

# Terminal 2: Frontend (Next.js)
npm install
npm run dev
```

**Then open:**
- 🎨 Frontend: http://localhost:3000
- 📚 Swagger API Docs: http://localhost:4000/api/docs
- 🔌 Backend API: http://localhost:4000/api

---

## 📋 Prerequisites

### Required Software
- ✅ Node.js 18+ (check: `node --version`)
- ✅ npm or yarn (check: `npm --version`)
- ✅ PostgreSQL database (already configured)

### Optional but Recommended
- 🔧 Git (for version control)
- 🐳 Docker (if using containerized services)
- 📦 Redis (for caching - optional)

---

## 🔧 Step-by-Step Setup

### 1. Backend Setup (NestJS)

#### A. Configure Environment Variables

```bash
cd backend
```

Check if `.env` file exists:
```bash
ls .env
```

If not, copy from example:
```bash
cp .env.example .env
```

**Edit `backend/.env`** with your configuration:
```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Database Configuration (IMPORTANT: Update this!)
DATABASE_URL="postgresql://[username]:[password]@codereview.hedera-quests.com:9000/fourhacks?schema=public&connect_timeout=30&pool_timeout=30&socket_timeout=30"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-here-change-this-in-production"
JWT_EXPIRATION="7d"

# API Keys for AI Services (if using AI features)
OPENAI_API_KEY="your-openai-api-key"
TOGETHER_AI_API_KEY="your-together-ai-api-key"

# GitHub API (for repository analysis)
GITHUB_TOKEN="your-github-token"
```

#### B. Install Dependencies

```bash
npm install
```

#### C. Setup Database

**Run Prisma migrations:**
```bash
npx prisma generate
npx prisma migrate dev
```

**Seed database (optional):**
```bash
npm run seed
```

#### D. Start Backend Server

**Development mode (with hot reload):**
```bash
npm run dev
```

**Alternative commands:**
```bash
# Standard start
npm start

# Debug mode
npm run start:debug

# Production mode
npm run start:prod
```

**Expected output:**
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [RoutesResolver] AuthController {/api/auth}:
[Nest] INFO [RouterExplorer] Mapped {/api/auth/register, POST} route
[Nest] INFO [RouterExplorer] Mapped {/api/auth/login, POST} route
[Nest] INFO [NestApplication] Nest application successfully started
[Nest] INFO Application is running on: http://localhost:4000
[Nest] INFO Swagger docs available at: http://localhost:4000/api/docs
```

#### E. Verify Backend is Running

Open in browser:
- 📚 **Swagger Documentation:** http://localhost:4000/api/docs
- 🔍 **API Health Check:** http://localhost:4000/api/health (if configured)

---

### 2. Frontend Setup (Next.js)

#### A. Configure Environment Variables

**From project root:**
```bash
# Check if .env.local exists
ls .env.local
```

If not, create it:
```bash
cp .env.example .env.local
```

**Edit `.env.local`** (or `.env`):
```env
# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Environment
NODE_ENV="development"

# Backend API URLs (IMPORTANT!)
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_WS_URL="http://localhost:4000"
```

#### B. Install Dependencies

```bash
npm install
```

#### C. Start Frontend Server

**Development mode:**
```bash
npm run dev
```

**Alternative commands:**
```bash
# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

**Expected output:**
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.5s
```

#### D. Verify Frontend is Running

Open in browser:
- 🎨 **Application:** http://localhost:3000
- 🔐 **Login:** http://localhost:3000/auth/login
- 📝 **Register:** http://localhost:3000/auth/register

---

## 🧪 Testing the Setup

### 1. Test Backend API (via Swagger)

1. Open **http://localhost:4000/api/docs**
2. You should see Swagger UI with all API endpoints
3. Test endpoints:

**A. Check Registration Status:**
```
GET /api/auth/register/status
```
Click "Try it out" → "Execute"

**B. Register First User (Becomes SUPER_ADMIN):**
```
POST /api/auth/register
```
Request body:
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "SecurePassword123"
}
```

**C. Login:**
```
POST /api/auth/login
```
Request body:
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123"
}
```

Copy the `accessToken` from response.

**D. Authenticate:**
Click "Authorize" button at top → Paste token → Click "Authorize"

**E. Test Protected Endpoints:**
```
GET /api/hackathons
GET /api/auth/me
```

### 2. Test Frontend

1. Open **http://localhost:3000**
2. Click "Register" or navigate to **http://localhost:3000/auth/register**
3. Create your first user (will be SUPER_ADMIN)
4. Login with credentials
5. You should see the dashboard

---

## 📊 Prisma Studio (Database GUI)

To view and edit database directly:

```bash
cd backend
npx prisma studio
```

Opens at: **http://localhost:5555**

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "Port 4000 already in use"**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :4000
kill -9 <PID>
```

**Error: "Cannot connect to database"**
- Check `DATABASE_URL` in `backend/.env`
- Verify database is running
- Test connection:
```bash
cd backend
npx prisma db push
```

**Error: "Prisma Client not generated"**
```bash
cd backend
npx prisma generate
```

**Error: "JWT_SECRET not defined"**
- Check `JWT_SECRET` in `backend/.env`
- Make sure it's not empty

### Frontend Issues

**Error: "Port 3000 already in use"**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

**Error: "API calls failing (404)"**
- Verify backend is running on port 4000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Should be: `http://localhost:4000/api`

**Error: "Module not found"**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Error: ".next cache issues"**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## 🔥 Hot Tips

### Development Workflow

**Two Terminal Setup:**
```bash
# Terminal 1: Backend (keep running)
cd backend && npm run dev

# Terminal 2: Frontend (keep running)
npm run dev
```

### Quick Restart

**Restart Backend:**
- Press `Ctrl+C` to stop
- Run `npm run dev` again

**Restart Frontend:**
- Press `Ctrl+C` to stop
- Run `npm run dev` again

### Watch for Changes

Both servers have **hot reload** enabled:
- Backend: Changes to `.ts` files auto-restart server
- Frontend: Changes to components auto-refresh browser

---

## 📁 Important URLs Reference

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend App** | http://localhost:3000 | Main application |
| **Backend API** | http://localhost:4000/api | REST API endpoints |
| **Swagger Docs** | http://localhost:4000/api/docs | Interactive API docs |
| **Prisma Studio** | http://localhost:5555 | Database GUI |
| **Login Page** | http://localhost:3000/auth/login | User login |
| **Register Page** | http://localhost:3000/auth/register | User registration |
| **Dashboard** | http://localhost:3000/dashboard | Admin dashboard |

---

## 🔐 First-Time Setup Checklist

- [ ] Backend `.env` configured with DATABASE_URL
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Database migrated (`cd backend && npx prisma migrate dev`)
- [ ] Backend running on port 4000 (`cd backend && npm run dev`)
- [ ] Swagger docs accessible at http://localhost:4000/api/docs
- [ ] Frontend `.env.local` configured with API URL
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend running on port 3000 (`npm run dev`)
- [ ] First user registered (becomes SUPER_ADMIN)
- [ ] Can login and access dashboard

---

## 📝 Common Commands Reference

### Backend Commands
```bash
# Development
cd backend
npm run dev              # Start with hot reload
npm run start:debug      # Start with debugger
npm run build            # Build for production
npm run start:prod       # Run production build

# Database
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open database GUI
npx prisma db push       # Push schema without migration
npm run seed             # Seed database

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:cov         # Coverage report
```

### Frontend Commands
```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Run production build
npm run lint             # Run ESLint

# Cleanup
rm -rf .next             # Clear Next.js cache
rm -rf node_modules      # Remove dependencies
```

---

## 🎯 Next Steps After Setup

1. **Create Your First Hackathon**
   - Navigate to Dashboard → Hackathons → Create
   - Use the wizard to set up a hackathon

2. **Test API Endpoints**
   - Use Swagger UI to test all endpoints
   - Try authentication flow
   - Test CRUD operations

3. **Explore Features**
   - Project submission
   - AI-powered code review
   - Innovation analysis
   - Hedera integration

4. **Development**
   - Check [FINAL_PROJECT_AUDIT.md](FINAL_PROJECT_AUDIT.md) for architecture
   - Review API documentation in Swagger
   - See code examples in existing components

---

## 🆘 Getting Help

**Documentation:**
- Architecture: [FINAL_PROJECT_AUDIT.md](FINAL_PROJECT_AUDIT.md)
- Cleanup History: [FRONTEND_SERVICE_CLEANUP.md](FRONTEND_SERVICE_CLEANUP.md)
- API Docs: http://localhost:4000/api/docs (when running)

**Common Issues:**
- Check environment variables first
- Ensure both servers are running
- Verify database connection
- Clear caches (.next, node_modules)

---

**Happy Coding! 🚀**
