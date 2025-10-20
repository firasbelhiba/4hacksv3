# ⚡ Quick Start - 4Hacks Platform

## 🚀 Run in 3 Steps

### Step 1: Backend (Terminal 1)
```bash
cd backend
npm install
npm run dev
```
**✅ Backend running:** http://localhost:4000
**📚 Swagger Docs:** http://localhost:4000/api/docs

### Step 2: Frontend (Terminal 2)
```bash
npm install
npm run dev
```
**✅ Frontend running:** http://localhost:3000

### Step 3: First Login
1. Open: http://localhost:3000/auth/register
2. Register first user (becomes SUPER_ADMIN)
3. Login and access dashboard

---

## 📌 Essential URLs

| Service | URL |
|---------|-----|
| 🎨 **Frontend** | http://localhost:3000 |
| 📚 **API Docs (Swagger)** | http://localhost:4000/api/docs |
| 🔌 **Backend API** | http://localhost:4000/api |
| 🗄️ **Database GUI** | http://localhost:5555 (run: `npx prisma studio`) |

---

## 🔧 Environment Setup

### Backend `.env` (Critical!)
```bash
cd backend
cp .env.example .env
# Edit backend/.env:
DATABASE_URL="your-database-url"
JWT_SECRET="your-secret-key"
```

### Frontend `.env.local`
```bash
cp .env.example .env.local
# Edit .env.local:
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

---

## 🐛 Quick Fixes

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :4000
kill -9 <PID>
```

**Database issues:**
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

**Clear caches:**
```bash
# Frontend
rm -rf .next node_modules
npm install

# Backend
cd backend
rm -rf node_modules
npm install
```

---

## 🧪 Test Backend (Swagger)

1. Open: http://localhost:4000/api/docs
2. Try: `POST /api/auth/register`
   ```json
   {
     "name": "Admin",
     "email": "admin@test.com",
     "password": "Test123456"
   }
   ```
3. Try: `POST /api/auth/login`
4. Copy `accessToken`
5. Click "Authorize" → Paste token
6. Test: `GET /api/hackathons`

---

## 📚 Full Documentation

- **Complete Guide:** [STARTUP_GUIDE.md](STARTUP_GUIDE.md)
- **Architecture:** [FINAL_PROJECT_AUDIT.md](FINAL_PROJECT_AUDIT.md)
- **API Docs:** http://localhost:4000/api/docs (when running)

---

**That's it! You're ready to go! 🎉**
