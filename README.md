# Redis Authentication API

A production-ready, secure authentication API built with Node.js, Express, and Redis. This API provides user registration and authentication endpoints with enterprise-grade security features.

## Features

- **User Registration**: Create new users with unique usernames
- **User Authentication**: Secure login with password verification
- **Password Security**: Argon2id hashing + OWASP password strength validation
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Account Lockout**: Temporary account lockout after failed attempts
- **Security Headers**: Helmet.js for security headers
- **Input Validation**: Zod schema validation for all inputs
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

## Security Features

- **Password Hashing**: Argon2id with optimized parameters
- **Password Complexity**: OWASP password strength requirements
- **Rate Limiting**: Prevents brute force attacks
- **Account Lockout**: Temporary lockout after 5 failed attempts
- **Security Headers**: Helmet.js for XSS, CSRF, and other protections
- **Input Validation**: Strict schema validation with Zod

## API Endpoints

### POST `/v1/auth/register`
Register a new user.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
- `201 Created`: User registered successfully
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Username already exists

### POST `/v1/auth/login`
Authenticate a user.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
- `200 OK`: Authentication successful
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded

## Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Copy `env.example` to `.env` and configure:
   ```bash
   cp env.example .env
   ```

3. **Redis Setup:**
   Ensure Redis is running and accessible

4. **Build and Run:**
   ```bash
   npm run build
   npm start
   ```

5. **Development Mode:**
   ```bash
   npm run dev
   ```

## Environment Variables

- `REDIS_URL`: Redis connection string (default: redis://localhost:6379)
- `PORT`: Server port (default: 8080)
- `RATE_MAX`: Maximum requests per window (default: 20)
- `RATE_WINDOW_MS`: Rate limit window in milliseconds (default: 60000)
- `AUTH_MAX_FAILS`: Maximum failed attempts before lockout (default: 5)
- `AUTH_LOCK_SECONDS`: Lockout duration in seconds (default: 900)

## Architecture Approach

This API follows a layered architecture pattern:

- **Routes**: Handle HTTP requests and responses
- **Services**: Business logic for authentication operations
- **Models**: Data structures and Redis key management
- **Middleware**: Rate limiting, error handling, and security
- **Utils**: Configuration, security functions, and Redis connection

## Security Considerations

### Implemented
- Strong password hashing with Argon2id
- OWASP password strength validation
- Rate limiting and account lockout
- Security headers via Helmet.js
- Input validation with Zod schemas

### Future Enhancements
- JWT token-based sessions
- Refresh token rotation
- Audit logging
- Two-factor authentication
- Password reset functionality
- Account deletion
- API key management for internal services

## Performance

- Redis for fast data access
- Optimized Argon2id parameters
- Efficient rate limiting
- Minimal middleware overhead

## Testing

```bash
npm test
```

## Production Deployment

1. Set appropriate environment variables
2. Use Redis cluster for high availability
3. Implement proper logging and monitoring
4. Set up health checks
5. Configure reverse proxy (nginx)
6. Use PM2 or similar process manager
