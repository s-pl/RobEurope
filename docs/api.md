# API Documentation

## Overview

The RobEurope API is built with RESTful principles and provides comprehensive endpoints for managing all aspects of the gaming platform. The API uses JSON for request/response bodies and follows standard HTTP status codes.

## Base URL
```
http://localhost:85/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "username": "string",
  "email": "string",
  "password": "string",
  "phone": "string (optional)"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "first_name": "string",
    "last_name": "string",
    "username": "string",
    "email": "string",
    "role": "user",
    "is_active": true
  },
  "token": "jwt_token"
}
```

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "string",
    "first_name": "string",
    "last_name": "string",
    "username": "string",
    "email": "string",
    "role": "string"
  },
  "token": "jwt_token"
}
```

## User Management

### GET /user
Get current user profile.

**Response:**
```json
{
  "id": "string",
  "first_name": "string",
  "last_name": "string",
  "username": "string",
  "email": "string",
  "phone": "string",
  "profile_photo_url": "string",
  "role": "string",
  "is_active": true,
  "created_at": "datetime"
}
```

### PUT /user
Update current user profile.

**Request Body:**
```json
{
  "first_name": "string (optional)",
  "last_name": "string (optional)",
  "phone": "string (optional)"
}
```

### GET /user/:id
Get user profile by ID (admin only).

### PUT /user/:id
Update user by ID (admin only).

### DELETE /user/:id
Delete user by ID (admin only).

## Team Management

### GET /teams
Get all teams with pagination.

**Query Parameters:**
- `limit`: number (default: 10)
- `offset`: number (default: 0)
- `country_id`: number (optional)

**Response:**
```json
{
  "teams": [
    {
      "id": 1,
      "name": "string",
      "country": {
        "id": 1,
        "name": "string",
        "code": "string"
      },
      "city": "string",
      "institution": "string",
      "logo_url": "string",
      "social_links": {},
      "created_by_user_id": "string",
      "member_count": 5,
      "created_at": "datetime"
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0
}
```

### POST /teams
Create a new team. The authenticated user becomes the owner and cannot belong to more than one team.

**Request Body:**
```json
{
  "name": "string",
  "country_id": 1,
  "city": "string",
  "institution": "string",
  "social_links": {
    "twitter": "string",
    "discord": "string"
  }
}
```

### GET /teams/:id
Get team details by ID.

### PUT /teams/:id
Update team (team creator or admin only).

### DELETE /teams/:id
Delete team (team creator or admin only).

### POST /teams/:id/invite
Create an invitation (owner). Body:
```json
{ "email": "optional", "user_id": "optional-uuid", "expires_in_hours": 168 }
```
Response includes a `token` used to accept the invitation.

### POST /teams/invitations/accept
Accept invitation. Body:
```json
{ "token": "string" }
```

### POST /teams/:id/requests
Request to join a team (authenticated user). Returns the created request.

### POST /teams/requests/:requestId/approve
Approve a join request (team owner).

### POST /teams/:id/register-competition
Register a team in a competition. Body:
```json
{ "competition_id": 1 }
```

## Competition Management

### GET /competitions
Get all competitions.

**Response:**
```json
{
  "competitions": [
    {
      "id": 1,
      "title": "string",
      "slug": "string",
      "description": "string",
      "country": {
        "id": 1,
        "name": "string",
        "code": "string"
      },
      "registration_start": "datetime",
      "registration_end": "datetime",
      "start_date": "datetime",
      "end_date": "datetime",
      "rules_url": "string",
      "stream_url": {}
    }
  ]
}
```

### POST /competitions
Create competition (admin only).

### GET /competitions/:id
Get competition details.

### PUT /competitions/:id
Update competition (admin only).

### DELETE /competitions/:id
Delete competition (admin only).

## Registration Management

### GET /registrations
Get team registrations.

### POST /registrations
Register team for competition.

**Request Body:**
```json
{
  "team_id": 1,
  "competition_id": 1
}
```

### PUT /registrations/:id
Update registration status (admin only).

**Request Body:**
```json
{
  "status": "approved|rejected",
  "decision_reason": "Optional reason for approval/rejection"
}
```

### PUT /registrations/:id/approve
Approve a pending registration (admin only).

**Request Body:**
```json
{
  "decision_reason": "Optional reason for approval"
}
```

### PUT /registrations/:id/reject
Reject a pending registration (admin only).

**Request Body:**
```json
{
  "decision_reason": "Required reason for rejection"
}
```

## Post Management

### GET /posts
Get all posts with pagination.

**Query Parameters:**
- `limit`: number (default: 10)
- `offset`: number (default: 0)
- `author_id`: string (optional)

### POST /posts
Create a new post.

**Request Body:**
```json
{
  "title": "string",
  "content": "string",
  "media_urls": ["string"]
}
```

### GET /posts/:id
Get post details.

### PUT /posts/:id
Update post (author or admin only).

### DELETE /posts/:id
Delete post (author or admin only).

## File Upload

The API supports file uploads through integrated endpoints. Files are processed using Multer middleware and stored locally on the server. File URLs are stored in JSON fields of related records (such as `media_urls` in posts).

**Supported file types:** Images (JPEG, PNG, GIF, WebP), Videos (MP4, WebM)
**Maximum file size:** 10MB per file
**Storage:** Local file system with secure permissions

File uploads are handled automatically when creating or updating resources that support media attachments.

## System Logs (Admin Only)

### GET /system-logs
Get system audit logs.

**Query Parameters:**
- `limit`: number (default: 50)
- `offset`: number (default: 0)
- `action`: string (optional)
- `entity_type`: string (optional)
- `user_id`: string (optional)
- `date_from`: string (ISO date)
- `date_to`: string (ISO date)

### GET /system-logs/stats
Get system statistics.

**Response:**
```json
{
  "actionStats": [
    {"action": "LOGIN", "count": 150},
    {"action": "CREATE_POST", "count": 45}
  ],
  "entityStats": [
    {"entity_type": "User", "count": 120},
    {"entity_type": "Post", "count": 89}
  ],
  "dailyStats": [
    {"date": "2025-11-01", "count": 25},
    {"date": "2025-11-02", "count": 30}
  ],
  "userStats": [
    {
      "user_id": "user123",
      "count": 15,
      "user": {
        "first_name": "John",
        "last_name": "Doe",
        "username": "johndoe"
      }
    }
  ]
}
```

### DELETE /system-logs/cleanup
Clean up old system logs.

**Query Parameters:**
- `days_old`: number (default: 90)

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Resource already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- General endpoints: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes
- File upload endpoints: 10 requests per hour

## Pagination

List endpoints support pagination using `limit` and `offset` query parameters:
- `limit`: Maximum number of items to return (default: 10-50 depending on endpoint)
- `offset`: Number of items to skip (default: 0)

Response includes pagination metadata:
```json
{
  "data": [...],
  "total": 150,
  "limit": 10,
  "offset": 0
}
```</content>
