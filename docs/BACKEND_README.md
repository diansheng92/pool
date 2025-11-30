# Five Star Pools - Backend Setup

## Overview
This backend provides authentication and database storage for the Five Star Pools safety cover configurator.

## Tech Stack
- **Node.js** + **Express** - API server
- **SQLite3** - Lightweight database
- **bcrypt** - Password hashing
- **JWT** - Authentication tokens
- **CORS** - Cross-origin requests

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Edit `.env` file:
```env
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=3000
```

### 3. Start Server
```bash
# Production
npm start

# Development (auto-restart)
npm run dev
```

Server will run on: `http://localhost:3000`

## API Endpoints

### Public Endpoints

**POST /api/register**
Create a new user account
```json
Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}

Response:
{
  "message": "Account created successfully",
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**POST /api/login**
Login with existing account
```json
Request:
{
  "email": "john@example.com",
  "password": "securepass123"
}

Response:
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Protected Endpoints
Require `Authorization: Bearer <token>` header

**GET /api/user**
Get current user information
```json
Response:
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2025-11-28 12:00:00"
  }
}
```

**GET /api/users** (Dev only - remove in production)
List all users

**GET /api/health**
Health check endpoint

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens with 7-day expiration
- ✅ Email uniqueness constraint
- ✅ Password minimum length validation
- ✅ CORS enabled for frontend
- ✅ Environment variables for secrets

## Frontend Integration

The frontend automatically:
1. Stores JWT token in `localStorage` on login/signup
2. Sends token in `Authorization` header for protected routes
3. Checks authentication on page load
4. Updates UI to show logged-in user

## Development

### View Database
```bash
sqlite3 users.db
sqlite> SELECT * FROM users;
sqlite> .quit
```

### Test API with curl
```bash
# Register
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Get user (with token)
curl http://localhost:3000/api/user \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Production Deployment

### Environment Variables
Set in production environment:
- `JWT_SECRET` - Strong random secret (use: `openssl rand -base64 32`)
- `PORT` - Server port (default: 3000)

### Security Checklist
- [ ] Change JWT_SECRET to a strong random value
- [ ] Remove `/api/users` endpoint
- [ ] Enable HTTPS
- [ ] Set secure cookie options
- [ ] Add rate limiting (express-rate-limit)
- [ ] Add input sanitization
- [ ] Set up database backups
- [ ] Monitor error logs

### Hosting Options
- **Heroku** - Free tier available
- **Railway** - Easy deployment
- **DigitalOcean** - Full control
- **AWS/Azure** - Enterprise scale

## Troubleshooting

**Port already in use**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Database locked**
Close all connections and restart server

**CORS errors**
Make sure frontend is making requests to `http://localhost:3000/api`

## License
MIT
