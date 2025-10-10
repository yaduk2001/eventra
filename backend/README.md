# Eventrra Backend

A Node.js + Express backend API for the Eventrra event management platform.

## Features

- Express.js server with middleware setup
- CORS configuration for frontend communication
- Environment variable configuration
- Health check endpoint
- Sample events API
- Security headers with Helmet
- Request logging with Morgan

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Rename the environment file:
```bash
# Windows
ren env.backend .env

# macOS/Linux
mv env.backend .env
```

The `.env` file contains:
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3000)

### 3. Start the Server

For development (with auto-restart):
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /` - Server status and info
- `GET /api/health` - Health check endpoint

### Events
- `GET /api/events` - Get all events (sample data)

## Project Structure

```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── .env              # Environment variables (create from env.backend)
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## Development

The server includes:
- **CORS**: Configured to allow requests from the frontend
- **Helmet**: Security headers
- **Morgan**: Request logging
- **Error handling**: Global error middleware
- **404 handling**: Catch-all route handler

## Next Steps

1. Add database integration (MongoDB, PostgreSQL, etc.)
2. Implement authentication (JWT)
3. Add more API endpoints for events management
4. Add input validation
5. Add API documentation (Swagger)
