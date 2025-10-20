# Authentication Guide

## Overview

The 4Hacks backend uses JWT (JSON Web Token) based authentication for securing API endpoints. This guide covers the complete authentication flow, token management, and best practices.

## Authentication Flow

### 1. User Registration

**Endpoint:** `POST /api/auth/register`

```javascript
const response = await fetch('http://localhost:4000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});

const data = await response.json();
// {
//   user: { id, email, name, role, status, createdAt },
//   message: 'User created successfully'
// }
```

**Important Notes:**
- First user registered automatically becomes `SUPER_ADMIN`
- Subsequent users are assigned `ADMIN` role
- Passwords are hashed with bcrypt (12 rounds)
- Email must be unique

### 2. User Login

**Endpoint:** `POST /api/auth/login`

```javascript
const response = await fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});

const data = await response.json();
// {
//   accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
//   user: { id, email, name, role }
// }
```

### 3. Store Token Securely

```javascript
// Browser (localStorage)
localStorage.setItem('auth_token', data.accessToken);
localStorage.setItem('user', JSON.stringify(data.user));

// Or use a more secure approach (httpOnly cookies from server)
// Or use sessionStorage for single-tab sessions
```

### 4. Include Token in Requests

```javascript
const token = localStorage.getItem('auth_token');

const response = await fetch('http://localhost:4000/api/hackathons', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Token Structure

### JWT Payload

The JWT token contains:

```typescript
{
  sub: string;        // User ID
  email: string;      // User email
  role: string;       // User role (SUPER_ADMIN, ADMIN, USER)
  iat: number;        // Issued at (timestamp)
  exp: number;        // Expiration (timestamp)
}
```

### Token Verification

Tokens are verified on every protected endpoint:

1. Extract token from `Authorization: Bearer <token>` header
2. Verify signature with JWT_SECRET
3. Check expiration
4. Load user from database
5. Attach user to request context

## Frontend Implementation

### React Context Example

```typescript
// AuthContext.tsx
import React, { createContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();

    setToken(data.accessToken);
    setUser(data.user);

    localStorage.setItem('auth_token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

### Custom Hook

```typescript
// useAuth.ts
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Protected Route Component

```typescript
// ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

### Axios Interceptor

```typescript
// api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:4000/api'
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## Token Refresh (Future Enhancement)

Currently, tokens expire after 7 days. To implement token refresh:

### Backend Changes Needed

```typescript
// Add refresh token to login response
{
  accessToken: 'short-lived-jwt',
  refreshToken: 'long-lived-refresh-token'
}

// Add refresh endpoint
POST /api/auth/refresh
Body: { refreshToken }
Response: { accessToken }
```

### Frontend Implementation

```typescript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token');

  const response = await fetch('http://localhost:4000/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  const data = await response.json();
  localStorage.setItem('auth_token', data.accessToken);
  return data.accessToken;
}

// In axios interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

## Role-Based Access Control (RBAC)

### User Roles

- **SUPER_ADMIN:** Full system access (first user)
- **ADMIN:** Manage hackathons, projects, reviews
- **USER:** Limited access (if implemented)

### Backend Guards

The backend uses guards to protect routes:

```typescript
// All routes protected by default via APP_GUARD
@UseGuards(JwtAuthGuard)

// Public routes opt-out
@Public()
@Post('login')

// Role-based protection (if implemented)
@Roles('SUPER_ADMIN')
@Delete('hackathons/:id')
```

### Frontend Permission Checks

```typescript
function canDeleteHackathon(user: User) {
  return user.role === 'SUPER_ADMIN';
}

// In component
const { user } = useAuth();

{canDeleteHackathon(user) && (
  <button onClick={deleteHackathon}>Delete</button>
)}
```

## Security Best Practices

### 1. Secure Token Storage

**DO:**
- Use `httpOnly` cookies (requires backend support)
- Use secure session storage
- Encrypt sensitive data in localStorage

**DON'T:**
- Store tokens in URL parameters
- Log tokens to console in production
- Store tokens in global variables

### 2. Token Transmission

**DO:**
- Always use HTTPS in production
- Use `Authorization` header, not query params
- Validate tokens on every request

**DON'T:**
- Send tokens in URL
- Include tokens in client-side logs
- Share tokens between users

### 3. Password Handling

**DO:**
- Enforce minimum password length (6+ chars)
- Use strong password policies
- Hash passwords with bcrypt (12+ rounds)

**DON'T:**
- Store plain-text passwords
- Log passwords
- Use weak hashing algorithms (MD5, SHA1)

### 4. Error Handling

**DO:**
```javascript
try {
  await login(email, password);
} catch (error) {
  if (error.response?.status === 401) {
    setError('Invalid email or password');
  } else {
    setError('An error occurred. Please try again.');
  }
}
```

**DON'T:**
```javascript
// Don't expose detailed errors
setError(error.response.data.message); // Might leak sensitive info
```

## Testing Authentication

### Manual Testing

1. **Register User:**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"SecurePass123!"}'
```

2. **Login:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123!"}'
```

3. **Use Token:**
```bash
TOKEN="your-jwt-token-here"

curl http://localhost:4000/api/hackathons \
  -H "Authorization: Bearer $TOKEN"
```

### Automated Testing

```typescript
// auth.test.ts
describe('Authentication', () => {
  let token: string;

  test('should register new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123!'
      });

    expect(response.status).toBe(201);
    expect(response.body.user).toBeDefined();
  });

  test('should login user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!'
      });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    token = response.body.accessToken;
  });

  test('should access protected route', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('test@example.com');
  });

  test('should reject invalid token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });
});
```

## Common Issues

### 1. Token Expired
**Error:** `401 Unauthorized`
**Solution:** Re-login to get new token

### 2. Token Not Sent
**Error:** `401 Unauthorized`
**Solution:** Check Authorization header is included

### 3. CORS Issues
**Error:** `CORS policy error`
**Solution:** Ensure backend CORS allows your origin

### 4. Token in Wrong Format
**Error:** `401 Unauthorized`
**Solution:** Use `Bearer <token>`, not just `<token>`

## Environment Variables

```env
# Backend .env
JWT_SECRET="your-super-secure-secret-min-64-chars"
JWT_EXPIRATION="7d"

# Frontend .env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

## Migration from NextAuth

If migrating from NextAuth:

1. Replace `useSession()` with custom `useAuth()`
2. Remove `SessionProvider`
3. Update login to use `/api/auth/login`
4. Update token storage from session to localStorage/cookies
5. Update API calls to include Bearer token

```typescript
// Before (NextAuth)
import { useSession } from 'next-auth/react';
const { data: session } = useSession();

// After (JWT)
import { useAuth } from './useAuth';
const { user, token } = useAuth();
```

## Resources

- **JWT.io:** https://jwt.io/ (decode and verify tokens)
- **Passport.js:** http://www.passportjs.org/packages/passport-jwt/
- **NestJS Auth:** https://docs.nestjs.com/security/authentication

---

**Last Updated:** October 4, 2025
