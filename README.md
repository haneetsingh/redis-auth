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
- **API Versioning**: API versioning through `/v1` prefix.

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: Redis
- **Language**: TypeScript
- **Testing**: Jest, Supertest
- **Security**: Helmet, Argon2, Zod, express-rate-limit

## Prerequisites

- Node.js (v22 or higher)
- Redis

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/node-redis-auth.git
   cd node-redis-auth
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Environment Configuration:**
   Copy `env.example` to `.env` and configure:
   ```bash
   cp env.example .env
   ```
   Fill in the required environment variables in `.env`.
4. **Redis Setup:**
   Ensure Redis is running and accessible.
5. **Build and Run:**
   ```bash
   npm run build
   npm start
   ```
6. **Development Mode:**
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:8080` by default.

## Testing

This project uses Jest for testing.

- **Run all tests:**
  ```bash
  npm test
  ```
- **Run tests in watch mode:**
  ```bash
  npm run test:watch
  ```
- **Run tests with coverage:**
  ```bash
  npm run test:coverage
  ```
- **Run unit tests:**
  ```bash
  npm run test:unit
  ```
- **Run integration tests:**
  ```bash
  npm run test:integration
  ```

## API Endpoints

All endpoints are prefixed with `/v1`.

### `POST /auth/register`

Register a new user.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Responses:**

- `201 Created`: User registered successfully
  ```json
  {
    "ok": true,
    "username": "testuser",
    "message": "User registered successfully"
  }
  ```
- `400 Bad Request`: Invalid input data
  ```json
  {
    "ok": false, 
    "error": "Invalid request",
    "details": {
      "password": [
        "Password must be at least 8 characters long."
      ]
    }
  }
  ```
- `409 Conflict`: Username already exists
  ```json
  {
    "ok": false,
    "error": "Username already exists",
    "details": {
      "username": [
        "This username is already taken"
      ]
    }
  }
  ```

### `POST /auth/login`

Authenticate a user.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Responses:**

- `200 OK`: Authentication successful
  ```json
  {
    "ok": true,
    "authenticated": true,
    "username": "testuser"
  }
  ```
- `401 Unauthorized`: Invalid credentials
  ```json
  {
    "ok": false,
    "error": "Invalid username or password"
  }
  ```
- `429 Too Many Requests`: Rate limit exceeded
  ```json
  {
    "ok": false,
    "error": "Too many requests"
  }
  ```

## Environment Variables

- `REDIS_URL`: Redis connection string (default: `redis://localhost:6379`)
- `PORT`: Server port (default: `8080`)
- `RATE_MAX`: Maximum requests per window (default: `20`)
- `RATE_WINDOW_MS`: Rate limit window in milliseconds (default: `60000`)
- `AUTH_MAX_FAILS`: Maximum failed attempts before lockout (default: `5`)
- `AUTH_LOCK_SECONDS`: Lockout duration in seconds (default: `900`)

## Architecture

This API follows a layered architecture pattern:

- **Routes**: Handle HTTP requests and responses.
- **Services**: Business logic for authentication operations.
- **Models**: Data structures and Redis key management.
- **Middleware**: Rate limiting, error handling, and security.
- **Utils**: Configuration, security functions, and Redis connection.

## Security

- **Password Hashing**: Argon2id with optimized parameters.
- **Password Complexity**: OWASP password strength requirements.
- **Rate Limiting**: Prevents brute force attacks.
- **Account Lockout**: Temporary lockout after 5 failed attempts.
- **Security Headers**: Helmet.js for XSS, CSRF, and other protections.
- **Input Validation**: Strict schema validation with Zod.

## Future Enhancements

- **Password Expiry Notifications**: Notify users when their password is about to expire
  - Track password expiration dates in user records
  - Show warnings during login when password is near expiry
  - Automatic password expiry enforcement based on configurable policies
- **JWT Token-based Sessions**: Replace basic authentication with JWT tokens
- **Refresh Token Rotation**: Implement secure token refresh mechanisms
- **Audit Logging**: Track authentication events and security incidents
- **Two-Factor Authentication**: Add TOTP/SMS-based 2FA support
- **Password Reset Functionality**: Secure password reset via email/SMS
- **Account Management**: User profile updates and account deletion
- **API Key Management**: Generate and manage API keys for service-to-service auth

## Deployment

1. Set appropriate environment variables.
2. Use a process manager like PM2.
3. Use a reverse proxy like Nginx.
4. Set up logging and monitoring.
5. For high availability, use a Redis cluster.
