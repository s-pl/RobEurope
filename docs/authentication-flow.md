# Authentication Flow

## Overview

The RobEurope platform implements dual authentication mechanisms: JWT-based tokens for API access and session-based authentication for the admin panel.

## JWT Authentication (API)

### Flow
1. **Registration/Login Request**
   - Client sends POST to `/api/auth/login` or `/api/auth/register`
   - Server validates credentials against database
   - On success, generates JWT token

2. **Token Generation**
   - Payload: `{ userId, username, role, iat, exp }`
   - Expires in 1 hour (configurable)
   - Signed with `JWT_SECRET` from environment

3. **Token Usage**
   - Client includes `Authorization: Bearer <token>` header
   - Server validates token on protected routes
   - Invalid/expired tokens return 401

### Protected Routes
- `/api/users/*` - User profile management
- `/api/teams/*` - Team operations
- `/api/competitions/*` - Competition data
- `/api/streams/*` - Stream access

## Session Authentication (Admin Panel)

### Flow
1. **Login Request**
   - Admin submits POST to `/admin/login`
   - Server validates against database
   - On success, creates session

2. **Session Management**
   - Uses `express-session` with Sequelize store
   - Session data: `{ userId, username, role }`
   - Expires after 1 hour of inactivity
   - Stored in `Session` table

3. **Access Control**
   - Middleware `requireAdminSession` checks session
   - Only `super_admin` or `admin` roles allowed
   - Invalid sessions redirect to login

### Protected Routes
- `/admin/*` - All admin panel routes
- CSRF protection on all forms

## LDAP Integration

### User Creation
- Admin can create LDAP users via `/admin/ldap-users/add`
- Credentials stored in OpenLDAP directory
- Separate from database authentication

### Future Integration
- Planned: LDAP authentication for admin panel
- Would allow centralized user management

## Security Measures

- Password hashing with bcryptjs
- JWT tokens signed and verified
- Session cookies: `httpOnly`, `sameSite: 'lax'`
- CSRF tokens on admin forms
- Rate limiting on auth endpoints
- Failed login tracking (planned)

## Token/Session Validation

### JWT
```javascript
const token = jwt.verify(req.headers.authorization.split(' ')[1], JWT_SECRET);
req.user = await User.findByPk(token.userId);
```

### Session
```javascript
if (!req.session.user) return res.redirect('/admin/login');
```

## Logout

### JWT
- Client-side: Remove token from storage
- No server-side invalidation (stateless)

### Session
- POST `/admin/logout` destroys session
- Redirects to login page