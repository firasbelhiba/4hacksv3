# Swagger/OpenAPI Documentation Guide

## Accessing Swagger UI

Once the backend server is running, access the interactive API documentation at:

```
http://localhost:4000/api/docs
```

## Features

### Interactive API Explorer
- **Try It Out:** Test API endpoints directly from the browser
- **Request/Response Examples:** See sample payloads and responses
- **Schema Validation:** View DTO validation rules and constraints
- **Authentication:** Authorize once, test all protected endpoints

### Authorization

1. Click the **"Authorize"** button (lock icon) at the top right
2. Enter your JWT token in the format: `Bearer your-jwt-token-here`
3. Click **"Authorize"**
4. All subsequent requests will include the token automatically

**To get a token:**
1. Use `/api/auth/register` to create an account (or `/api/auth/login` if you have one)
2. Copy the `accessToken` from the response
3. Use it in the Authorize dialog

### Testing Endpoints

1. **Expand an endpoint** by clicking on it
2. Click **"Try it out"** button
3. **Fill in parameters:**
   - Path parameters (e.g., `id`)
   - Query parameters (e.g., `status`, `page`)
   - Request body (pre-filled with example)
4. Click **"Execute"**
5. View the response below

### Endpoint Organization

Endpoints are organized by tags:

- **Authentication** - User registration, login, profile
- **Hackathons** - Hackathon CRUD operations
- **Tracks** - Track management within hackathons
- **Projects** - Project submissions and management
- **Reviews** - AI-powered code reviews
- **Code Quality** - Code quality analysis
- **Eligibility** - Project eligibility validation
- **AI Jury** - Automated jury evaluation
- **Notifications** - Notification management
- **WebSocket** - Real-time events (see WebSocket docs)

### Response Examples

Each endpoint shows:
- **200/201** Success responses with example data
- **400** Validation error examples
- **401** Unauthorized examples
- **404** Not found examples

### Schema Explorer

Click **"Schemas"** at the bottom to explore:
- All DTO (Data Transfer Object) structures
- Validation rules (min length, required fields, etc.)
- Property types and formats
- Nested object structures

## Customization

The Swagger UI is configured with:
- **Persistent Authorization:** Token persists across page refreshes
- **Collapsed Sections:** Endpoints are collapsed by default
- **Search Functionality:** Filter endpoints by name
- **Request Duration:** Shows how long each request took

## Best Practices

### 1. Start with Authentication
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

### 2. Authorize with Token
Copy `accessToken` → Click Authorize → Paste token → Authorize

### 3. Test Endpoints in Order
1. Create hackathon: `POST /api/hackathons`
2. Get hackathon: `GET /api/hackathons/{id}`
3. Create project: `POST /api/projects`
4. Start reviews: `POST /api/projects/{id}/review/innovation`

### 4. Monitor Real-time Updates
While testing analysis endpoints, connect via WebSocket (see WEBSOCKET_DOCUMENTATION.md) to see live progress

## Common Issues

### "Unauthorized" Error
- **Solution:** Make sure you've authorized with a valid JWT token
- Check token hasn't expired (7-day expiration)
- Re-login if needed

### Validation Errors
- **Solution:** Check the schema for required fields and validation rules
- Look at the example request body
- Ensure data types match (string, number, boolean)

### CORS Errors
- **Solution:** Backend must be configured with correct FRONTEND_URL
- Check `.env` file: `FRONTEND_URL=http://localhost:3000`

## Export Options

Swagger allows you to:
1. **Download OpenAPI Spec:** Click top bar → Download specification
2. **Generate Client Code:** Use OpenAPI Generator with the spec
3. **Import to Postman:** File → Import → Paste Swagger URL

## Environment Variables

Configure Swagger behavior via environment:

```env
# Backend Port
PORT=4000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## Advanced Features

### Filter Endpoints
Use the search box to filter by:
- Endpoint path (e.g., "hackathon")
- HTTP method (e.g., "POST")
- Tag name (e.g., "Authentication")

### Model Schemas
Click any schema name (e.g., `CreateHackathonDto`) to see:
- All properties with types
- Validation constraints
- Required vs optional fields
- Default values
- Examples

### Code Generation
Generate client SDKs using the OpenAPI spec:

```bash
# TypeScript/JavaScript
npx openapi-generator-cli generate \
  -i http://localhost:4000/api/docs-json \
  -g typescript-axios \
  -o ./generated/api-client

# Python
npx openapi-generator-cli generate \
  -i http://localhost:4000/api/docs-json \
  -g python \
  -o ./generated/python-client
```

## Troubleshooting

### Swagger UI Not Loading
1. Check backend is running: `http://localhost:4000`
2. Verify route: `http://localhost:4000/api/docs`
3. Check console for errors
4. Clear browser cache

### Request Fails with Network Error
1. Check backend logs for errors
2. Verify database is running
3. Ensure Redis is running (for queue features)
4. Check firewall/antivirus settings

### Schema Not Updating
1. Restart backend server
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R)

## Resources

- **OpenAPI Specification:** https://swagger.io/specification/
- **Swagger UI Docs:** https://swagger.io/tools/swagger-ui/
- **NestJS Swagger:** https://docs.nestjs.com/openapi/introduction

---

**Last Updated:** October 4, 2025
