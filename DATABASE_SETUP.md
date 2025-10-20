# 4hacks Database Setup Documentation

## 🗄️ PostgreSQL Database with Prisma ORM

This document outlines the comprehensive database setup for the 4hacks hackathon platform using PostgreSQL and Prisma ORM.

## 🔧 Setup Configuration

### Remote Database
- **Host**: codereview.hedera-quests.com:9000
- **Database**: fourhacks
- **Schema**: public
- **Connection**: Optimized for remote access with proper timeouts and pooling

### Environment Configuration
- **.env.local**: Local development with actual credentials
- **.env.example**: Template with placeholder values
- **DATABASE_URL**: PostgreSQL connection string with timeout settings

## 📊 Database Schema

### Core Models

#### User Management
- **User**: Admin accounts with role-based access (ADMIN, SUPER_ADMIN)
- **ApiKey**: API key management for external integrations

#### Hackathon Management
- **Hackathon**: Main hackathon entity with flexible JSON settings
- **Track**: Competition tracks within hackathons
- **EvaluationCriterion**: Customizable evaluation criteria per hackathon

#### Project Management
- **Project**: Submitted projects with team details and technologies
- **Evaluation**: AI evaluation results with detailed scoring

#### Tournament System
- **Tournament**: Tournament management with multiple formats
- **TournamentMatch**: Individual matches within tournaments

#### Audit & Logging
- **ActivityLog**: Complete audit trail of user actions

### Indexes & Performance
Strategic indexes on frequently queried fields:
- `slug` fields for URL routing
- `status` fields for filtering
- `hackathonId` for relation queries
- `overallScore` for ranking

## 🛠️ Available Scripts

```bash
# Database Management
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database (use with caution)
npm run db:migrate      # Create migration
npm run db:migrate:deploy # Deploy migrations
npm run db:studio       # Open Prisma Studio
npm run db:test         # Test database connection
npm run db:reset        # Reset database (dev only)
npm run db:seed         # Seed database with sample data

# Development
npm run type-check      # TypeScript validation
npm run lint            # ESLint validation
npm run format          # Code formatting
```

## 📂 File Structure

```
src/
├── generated/prisma/    # Generated Prisma client
├── lib/
│   ├── db.ts           # Prisma client singleton
│   ├── db-helpers.ts   # Database helper functions
│   ├── db-errors.ts    # Error handling & retry logic
│   ├── prisma-utils.ts # Advanced Prisma utilities
│   └── test-connection.ts # Connection testing utilities
├── types/
│   └── database.ts     # Type definitions & Zod schemas
prisma/
├── schema.prisma       # Database schema definition
└── seed.ts            # Database seeding script
```

## 🔍 Key Features

### Connection Management
- **Singleton Pattern**: Prevents multiple connections in development
- **Connection Pooling**: Optimized for remote database access
- **Health Checks**: Monitor database connectivity and performance
- **Retry Logic**: Exponential backoff for network issues

### Error Handling
- **Custom Error Types**: Specific error classes for different scenarios
- **Circuit Breaker**: Prevents cascading failures
- **Retry Mechanisms**: Automatic retry for transient failures
- **Comprehensive Logging**: Detailed error context and debugging

### Advanced Features
- **Pagination**: Both cursor and offset-based pagination
- **Dynamic Filtering**: Flexible query building with operators
- **Type Safety**: Full TypeScript integration with Zod validation
- **Bulk Operations**: Transaction support for batch updates

### Security
- **Password Hashing**: bcryptjs integration
- **API Key Management**: Secure external API access
- **Activity Logging**: Complete audit trail
- **Input Validation**: Zod schemas for all data operations

## 🚀 Getting Started

### 1. Configure Environment
```bash
# Copy example environment file
cp .env.example .env.local

# Update with actual database credentials
# DATABASE_URL="postgresql://username:password@codereview.hedera-quests.com:9000/fourhacks?schema=public&connect_timeout=30&pool_timeout=30&socket_timeout=30"
```

### 2. Generate Prisma Client
```bash
npm run db:generate
```

### 3. Test Connection
```bash
npm run db:test
```

### 4. Run Migrations (when ready)
```bash
npm run db:migrate:deploy
```

### 5. Seed Database (optional)
```bash
npm run db:seed
```

## 📋 Sample Data

The seed script creates:
- Super admin user (admin@4hacks.com / admin123)
- Demo hackathon with tracks
- Sample evaluation criteria
- Example project with evaluation
- API key for testing

## 🔒 Security Considerations

- Environment variables are properly ignored in git
- Password hashing using bcryptjs
- API keys with expiration and permissions
- Activity logging for audit trails
- Input validation using Zod schemas

## 🌐 Remote Database Features

- Connection timeouts optimized for remote access
- Retry logic for network interruptions
- Connection pooling for performance
- Health monitoring and alerting
- Circuit breaker pattern for reliability

## 📈 Performance Optimizations

- Strategic database indexes
- Connection pooling
- Query optimization helpers
- Cursor-based pagination for large datasets
- Bulk operation support

## 🔧 Troubleshooting

### Connection Issues
```bash
# Test database connectivity
npm run db:test

# Monitor connection over time
npm run db:test -- --monitor

# Check health status
npm run db:test -- --health
```

### Common Issues
1. **Connection Timeout**: Check network connectivity to remote host
2. **Authentication Failure**: Verify credentials in .env.local
3. **Schema Mismatch**: Run `npm run db:generate` after schema changes
4. **Migration Errors**: Check database permissions and connectivity

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Zod Validation](https://zod.dev)
- [Next.js Database Integration](https://nextjs.org/docs/basic-features/data-fetching)

---

✨ **Database setup complete!** The 4hacks platform now has a robust, type-safe, and scalable database layer ready for hackathon management.