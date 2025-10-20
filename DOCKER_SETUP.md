# Docker Setup Guide

This guide provides instructions for setting up and running the FourHacks application using Docker.

## Table of Contents
1. [Quick Start](#quick-start)
2. [AWS Deployment](#aws-deployment)
3. [Service Options](#service-options)
4. [Configuration](#configuration)
5. [Common Commands](#common-commands)

---

## Quick Start

### Prerequisites
- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)

### Run All Services (Redis + PostgreSQL + Backend)
```bash
# Navigate to project root
cd forhacks

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## AWS Deployment

### Option 1: Redis Only (Recommended if PostgreSQL already running)

If you already have PostgreSQL running on your AWS instance and just need Redis:

```bash
# SSH into your AWS instance
ssh root@35.95.138.191

# Install Docker (Amazon Linux 2023)
sudo dnf install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Run Redis container
sudo docker run -d \
  --name fourhacks-redis \
  --restart always \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --requirepass "4hacks_redis_2025!"

# Verify Redis is running
sudo docker ps
sudo docker exec -it fourhacks-redis redis-cli -a "4hacks_redis_2025!" ping
# Should output: PONG

# Configure firewall (if needed)
sudo firewall-cmd --permanent --add-port=6379/tcp
sudo firewall-cmd --reload
```

**Update your local `.env` file:**
```env
REDIS_HOST="35.95.138.191"
REDIS_PORT="6379"
REDIS_PASSWORD="4hacks_redis_2025!"
```

### Option 2: Full Stack Deployment

To run everything (Redis + PostgreSQL + Backend) on AWS:

```bash
# Clone your repository on AWS instance
git clone <your-repo-url>
cd forhacks

# Create .env file in backend directory
cd backend
cp .env.example .env
# Edit .env with your production values

# Go back to root and start all services
cd ..
docker-compose up -d

# Check all services are running
docker-compose ps
```

---

## Service Options

The `docker-compose.yml` includes three services. You can run them individually:

### Redis Only
```bash
docker-compose up -d redis
```

### PostgreSQL Only
```bash
docker-compose up -d postgres
```

### Backend Only (requires Redis and PostgreSQL)
```bash
docker-compose up -d backend
```

### All Services
```bash
docker-compose up -d
```

---

## Configuration

### Environment Variables

The backend service uses environment variables from `backend/.env`. Key variables:

```env
# Database
DATABASE_URL="postgresql://forhacks_user:forhacks_dev_pass@postgres:5432/fourhacks?schema=public"

# Redis
REDIS_HOST="redis"           # Service name when running in Docker
REDIS_PORT="6379"
REDIS_PASSWORD="4hacks_redis_2025!"

# JWT
JWT_SECRET="your-secure-secret"
JWT_EXPIRATION="7d"

# AI Services
TOGETHER_AI_API_KEY="your-api-key"
GITHUB_TOKEN="your-github-token"
```

### Ports

| Service    | Container Port | Host Port |
|------------|----------------|-----------|
| Backend    | 4000           | 4000      |
| PostgreSQL | 5432           | 9000      |
| Redis      | 6379           | 6379      |

---

## Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f redis
docker-compose logs -f postgres
docker-compose logs -f backend
```

### Stop Services
```bash
# Stop all
docker-compose down

# Stop but keep data
docker-compose stop

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart redis
```

### Access Container Shell
```bash
# Redis CLI
docker-compose exec redis redis-cli -a "4hacks_redis_2025!"

# PostgreSQL CLI
docker-compose exec postgres psql -U forhacks_user -d fourhacks

# Backend shell
docker-compose exec backend sh
```

### Database Migrations
```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Open Prisma Studio
docker-compose exec backend npx prisma studio
```

### Rebuild After Code Changes
```bash
# Rebuild and restart backend
docker-compose up -d --build backend

# Rebuild all services
docker-compose up -d --build
```

### Monitor Resources
```bash
# View resource usage
docker stats

# View specific container
docker stats fourhacks-backend
```

---

## Troubleshooting

### Check Container Status
```bash
docker-compose ps
```

### Check Container Logs
```bash
docker-compose logs backend
```

### Test Redis Connection
```bash
# From host
docker exec -it fourhacks-redis redis-cli -a "4hacks_redis_2025!" ping

# From backend container
docker-compose exec backend sh
nc -zv redis 6379
```

### Test PostgreSQL Connection
```bash
# From host
docker exec -it fourhacks-postgres psql -U forhacks_user -d fourhacks -c "SELECT 1"

# From backend container
docker-compose exec backend sh
nc -zv postgres 5432
```

### Reset Everything
```bash
# Stop and remove everything including volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

---

## Production Considerations

1. **Security:**
   - Change default passwords in production
   - Use Docker secrets for sensitive data
   - Configure firewall rules appropriately
   - Use SSL/TLS for database connections

2. **Performance:**
   - Adjust Redis memory limits
   - Configure PostgreSQL connection pooling
   - Set appropriate resource limits in docker-compose.yml

3. **Backup:**
   - Regularly backup PostgreSQL data volume
   - Backup Redis data if using persistence

4. **Monitoring:**
   - Set up health checks
   - Monitor container logs
   - Use Docker monitoring tools (Prometheus, Grafana, etc.)

---

## Contact

For issues or questions, please contact the development team.
