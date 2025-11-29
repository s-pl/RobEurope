# Data Flow

## Overview

The RobEurope platform manages data flow between multiple components: frontend, backend API, database, LDAP directory, and external services.

## System Architecture

```
Frontend (React/Vite) <-> Backend (Express) <-> Database (MySQL)
     ^                        ^                        ^
     |                        |                        |
     v                        v                        v
Admin Panel (EJS)        Controllers/Models        LDAP (OpenLDAP)
```

## Data Flow Patterns

### 1. User Registration Flow

```
Frontend Form -> POST /api/auth/register -> Auth Controller
    -> Validate Input -> Hash Password -> Create User Model
    -> Save to Database -> Return JWT Token -> Frontend Storage
```

### 2. Team Creation Flow

```
Admin Panel Form -> POST /admin/teams -> Team Controller
    -> Validate Input -> Create Team Model -> Save to Database
    -> Create Team Members -> Send Notifications -> Redirect
```

### 3. Competition Management Flow

```
Admin Panel -> GET /admin/competitions -> Competition Controller
    -> Query Database -> Return JSON -> EJS Template -> Render Page
```

### 4. Stream Access Flow

```
Frontend -> GET /api/streams -> Stream Controller
    -> Check User Permissions -> Query Database -> Return Stream Data
    -> Frontend -> Display Stream Interface
```

## Database Relationships

### Core Entities
- **Users**: Central user management
- **Teams**: Group users for competitions
- **Competitions**: Events with teams
- **Posts**: User-generated content
- **Streams**: Live streaming data

### Relationship Flow
```
Users (1) -> (N) Team Members (N) <- (1) Teams
Teams (N) -> (1) Competitions
Users (1) -> (N) Posts
Posts (1) -> (N) Comments
Competitions (1) -> (N) Streams
```

## API Data Flow

### Request Processing
1. **Middleware Chain**
   - `requestId` - Add unique request ID
   - `rateLimit` - Check request frequency
   - `auth` - Validate JWT token
   - `role` - Check user permissions
   - `ownership` - Verify resource ownership

2. **Controller Logic**
   - Parse request parameters
   - Validate input data
   - Execute business logic
   - Query/update database
   - Return response

### Response Format
```json
{
  "success": true,
  "data": { /* payload */ },
  "message": "Operation successful",
  "requestId": "req-12345"
}
```

## File Upload Flow

```
Frontend Form -> POST /api/media/upload -> Upload Middleware
    -> Validate File Type/Size -> Save to /uploads -> Create Media Record
    -> Return File URL -> Frontend Display
```

## Notification Flow

```
Event Trigger -> Notification Controller -> Create Notification
    -> Save to Database -> Send Email/Socket -> User Receives
```

## LDAP Data Flow

```
Admin Panel -> POST /admin/ldap-users -> LDAP Controller
    -> Connect to OpenLDAP -> Create User Entry -> Return Success
```

## Caching Strategy

- **Database Queries**: No explicit caching (Sequelize default)
- **Static Assets**: Served directly from `/public`
- **Session Data**: Stored in database via Sequelize store

## Error Handling Flow

```
Error Occurs -> Middleware Catches -> Log Error -> Format Response
    -> Return Error JSON -> Frontend Handles -> Display Message
```

## Data Validation

### Input Validation
- **Frontend**: HTML5 validation + custom JS
- **Backend**: Joi schemas in controllers
- **Database**: Sequelize model validations

### Output Sanitization
- **HTML**: EJS auto-escapes
- **JSON**: No additional sanitization needed
- **Files**: Type/size validation on upload

## Transaction Management

### Database Transactions
- Used for multi-table operations
- Example: Team creation with members
- Rollback on any failure

### Code Example
```javascript
const transaction = await sequelize.transaction();
try {
  const team = await Team.create(teamData, { transaction });
  await TeamMember.bulkCreate(members, { transaction });
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```