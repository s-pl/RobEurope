# System Architecture

## Overview

RobEurope follows a modular, layered architecture designed for scalability and maintainability. The system is built using modern web development practices with clear separation of concerns.

## Architecture Layers

### 1. Presentation Layer (Frontend)
- **Technology**: React with Vite
- **Purpose**: User interface and interaction
- **Components**:
  - React components for UI elements
  - State management
  - API communication
  - Routing

### 2. Application Layer (Backend)
- **Technology**: Node.js with Express.js
- **Purpose**: Business logic and API endpoints
- **Components**:
  - Route handlers
  - Controllers
  - Middleware
  - Business logic services

### 3. Data Access Layer
- **Technology**: Sequelize ORM
- **Purpose**: Database abstraction and queries
- **Components**:
  - Models
  - Migrations
  - Seeders
  - Database connections

### 4. Infrastructure Layer
- **Technology**: MySQL, File System
- **Purpose**: Data persistence and storage
- **Components**:
  - Database server
  - File storage
  - External services

## Component Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        React[React Application]
        Vite[Vite Build Tool]
        Components[UI Components]
    end

    subgraph "Backend Layer"
        Express[Express Server]
        Routes[API Routes]
        Controllers[Controllers]
        Middleware[Middleware]
    end

    subgraph "Data Layer"
        Sequelize[Sequelize ORM]
        Models[Data Models]
        Migrations[Database Migrations]
    end

    subgraph "Infrastructure"
        MySQL[(MySQL Database)]
        FileSystem[(File Storage)]
    end

    React --> Express
    Express --> Routes
    Routes --> Controllers
    Controllers --> Middleware
    Controllers --> Sequelize
    Sequelize --> Models
    Models --> Migrations
    Migrations --> MySQL
    Controllers --> FileSystem
```

## Database Schema (excerpt)

- User: id (uuid), username, email, first_name, last_name, password_hash, country_id (fk Country), role, is_active, created_at
- Country: id, name, code, flag_emoji
- Team: id, name, country_id, city, institution, logo_url, social_links, created_by_user_id, created_at, updated_at
- TeamMembers: id, team_id (fk), user_id (fk), role, joined_at, left_at
- TeamInvite: id (uuid), team_id (fk), email (nullable), user_id (nullable fk), token (unique), status (enum), expires_at, created_at
- TeamJoinRequest: id (pk), team_id (fk), user_id (fk), status (enum), created_at
- Competition: id, title, slug, description, dates, rules_url, stream_url
- Registration: id, team_id (fk), competition_id (fk), status, registration_date, decision_reason (optional string for admin decisions)
- Stream: id, title, platform (enum: twitch, youtube, etc.), stream_url, is_live, host_team_id (fk Team), competition_id (fk Competition), created_at, updated_at
- Notification: id (uuid), user_id (fk), title, message, type, is_read, created_at

Constraint: unique index on TeamMembers.user_id (un usuario solo puede pertenecer a un equipo activo).

## Realtime / Notifications

Las notificaciones se exponen vía REST (GET /notifications?user_id=...) y, cuando el backend emite eventos Socket.IO, el frontend se suscribe al canal `notification:{userId}`. Si el socket no está disponible, el frontend cae a carga inicial por REST.

## Data Flow

### User Request Flow
1. User interacts with React frontend
2. Frontend makes HTTP request to API
3. Express server receives request
4. Middleware processes authentication/authorization
5. Route handler delegates to controller
6. Controller executes business logic
7. Controller interacts with Sequelize models
8. Models execute database queries
9. Response flows back through the layers
10. Frontend receives and displays data

### File Upload Flow
1. User selects file in frontend
2. Frontend sends multipart/form-data to API
3. Multer middleware processes file upload
4. File is stored in local file system
5. File URL is stored in related database records
6. File URL is returned to frontend

## Security Architecture

### Authentication
- JWT-based token authentication
- Password hashing with bcryptjs
- Token expiration and refresh mechanisms

### Authorization
- Role-based access control (RBAC)
- Route-level middleware protection
- Super admin privileges for system management

### Data Protection
- Input validation and sanitization
- SQL injection prevention through ORM
- CORS configuration
- Rate limiting

