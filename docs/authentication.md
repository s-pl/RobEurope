# Authentication System

[![Passport.js](https://img.shields.io/badge/passport-0.7.x-34E27A?logo=passport&logoColor=white)](http://www.passportjs.org/)
[![LDAP](https://img.shields.io/badge/LDAP-OpenLDAP-blue)](https://www.openldap.org/)
[![OAuth](https://img.shields.io/badge/OAuth-2.0-orange)](https://oauth.net/2/)
[![Sessions](https://img.shields.io/badge/sessions-express--session-lightgrey)](https://github.com/expressjs/session)

---

## Table of Contents

- [Overview](#overview)
- [Authentication Flow](#authentication-flow)
- [Session Management](#session-management)
- [Local Authentication](#local-authentication)
- [OAuth 2.0 Providers](#oauth-20-providers)
- [LDAP Authentication](#ldap-authentication)
- [Role-Based Access Control](#role-based-access-control)
- [Middleware Reference](#middleware-reference)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Overview

RobEurope implements a multi-provider authentication system using Passport.js. The system supports:

| Provider | Strategy | Status |
|----------|----------|--------|
| Local | Username/Password with bcrypt | Active |
| Google | OAuth 2.0 | Active |
| GitHub | OAuth 2.0 | Active |
| LDAP | passport-ldapauth | Active |
| Apple | OAuth 2.0 | Planned |

### Architecture Diagram

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|  React Frontend  +---->+  Express Backend +---->+  MySQL Database  |
|                  |     |                  |     |                  |
+------------------+     +--------+---------+     +------------------+
                                  |
                                  v
                    +-------------+-------------+
                    |                           |
          +---------v---------+     +-----------v-----------+
          |                   |     |                       |
          |  Passport.js      |     |  OpenLDAP Directory   |
          |  (Google/GitHub)  |     |  (User Directory)     |
          |                   |     |                       |
          +-------------------+     +-----------------------+
```

---

## Authentication Flow

### Local Login Flow

```
1. User submits credentials (email/password)
          |
          v
2. Backend validates input
          |
          v
3. User lookup by email
          |
          v
4. bcrypt.compare(password, hash)
          |
          v
5. Create session (req.session.user = user)
          |
          v
6. Return user data + set cookie
```

### OAuth Login Flow

```
1. User clicks "Login with Google/GitHub"
          |
          v
2. Redirect to provider authorization URL
          |
          v
3. User grants permission
          |
          v
4. Provider redirects to callback URL
          |
          v
5. Passport extracts profile + tokens
          |
          v
6. Find or create local user
          |
          v
7. Create session and redirect to frontend
```

### LDAP Login Flow

```
1. User submits credentials (uid/email + password)
          |
          v
2. Passport-ldapauth binds with service account
          |
          v
3. Search for user in LDAP directory
          |
          v
4. Attempt bind with user credentials
          |
          v
5. If successful, find/create local user
          |
          v
6. Create session and return user data
```

---

## Session Management

### Configuration

Sessions are stored in MySQL using `connect-session-sequelize`:

```javascript
import session from 'express-session';
import SequelizeStoreInit from 'connect-session-sequelize';

const SequelizeStore = SequelizeStoreInit(session.Store);
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'Session'
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));
```

### Cookie Security

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `secure` | true (production) | HTTPS only transmission |
| `httpOnly` | true | Prevent JavaScript access (XSS protection) |
| `sameSite` | lax | CSRF protection |
| `maxAge` | 24 hours | Session expiration |

### Session Table Schema

```sql
CREATE TABLE `Session` (
  `sid` VARCHAR(36) PRIMARY KEY,
  `expires` DATETIME,
  `data` TEXT,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL
);
```

---

## Local Authentication

### Password Hashing

Passwords are hashed using bcrypt with a cost factor of 10:

```javascript
import bcrypt from 'bcryptjs';

// Registration
const password_hash = await bcrypt.hash(password, 10);

// Login verification
const isValid = await bcrypt.compare(password, user.password_hash);
```

### Password Requirements

| Requirement | Value |
|-------------|-------|
| Minimum length | 8 characters |
| Complexity | 3 of 4 character types required |

Character types:
- Uppercase letters (A-Z)
- Lowercase letters (a-z)
- Numbers (0-9)
- Special characters (!@#$%^&*...)

### Login Endpoint

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response:
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Registration Endpoint

```
POST /api/auth/register
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "educational_center_id": 1  // optional
}
```

### Login Throttling

Failed login attempts are tracked in Redis:

```javascript
const key = `login:attempts:${email}`;
const attempts = await redis.incr(key);
await redis.expire(key, 900); // 15 minute window

if (attempts > 5) {
  return res.status(429).json({ 
    error: 'Too many failed attempts. Try again later.' 
  });
}
```

---

## OAuth 2.0 Providers

### Google OAuth

**Configuration file:** `backend/config/passport.js`

```javascript
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://api.robeurope.example.com/api/auth/google/callback",
  passReqToCallback: true
}, handleSocialLogin));
```

**Endpoints:**

| Endpoint | Purpose |
|----------|---------|
| `GET /api/auth/google` | Initiates Google OAuth flow |
| `GET /api/auth/google/callback` | Handles OAuth callback |

### GitHub OAuth

```javascript
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "https://api.robeurope.example.com/api/auth/github/callback",
  passReqToCallback: true
}, handleSocialLogin));
```

**Endpoints:**

| Endpoint | Purpose |
|----------|---------|
| `GET /api/auth/github` | Initiates GitHub OAuth flow |
| `GET /api/auth/github/callback` | Handles OAuth callback |

### Social Login Handler

When a user authenticates via OAuth:

1. Check if user exists with provider ID (`google_id` or `github_id`)
2. If not, check if email matches existing user and link accounts
3. If no match, create new user with profile data
4. Generate unique username if collision detected

```javascript
const handleSocialLogin = async (req, accessToken, refreshToken, profile, done, providerField) => {
  // Find by provider ID
  let user = await User.findOne({ where: { [providerField]: profile.id } });
  if (user) return done(null, user);

  // Find by email and link
  const email = profile.emails?.[0]?.value;
  if (email) {
    user = await User.findOne({ where: { email } });
    if (user) {
      user[providerField] = profile.id;
      await user.save();
      return done(null, user);
    }
  }

  // Create new user
  user = await User.create({
    first_name: profile.name?.givenName || 'User',
    last_name: profile.name?.familyName || 'Name',
    username: generateUniqueUsername(profile),
    email: email,
    [providerField]: profile.id
  });

  return done(null, user);
};
```

---

## LDAP Authentication

### Overview

LDAP (Lightweight Directory Access Protocol) authentication allows users to log in with their organizational directory credentials. RobEurope uses OpenLDAP as the directory server.

### Infrastructure

LDAP runs as a Docker container:

```yaml
# docker-compose.yml
services:
  openldap:
    image: osixia/openldap:1.5.0
    container_name: openldap
    environment:
      LDAP_ORGANISATION: "RobEurope"
      LDAP_DOMAIN: "robeurope.samuelponce.es"
      LDAP_ADMIN_PASSWORD: "adminpassword"
      LDAP_TLS: "false"
    ports:
      - "389:389"
      - "636:636"
    volumes:
      - ldap_data:/var/lib/ldap
      - ldap_config:/etc/ldap/slapd.d
```

### Directory Structure

```
dc=robeurope,dc=samuelponce,dc=es
    |
    +-- ou=users
         |
         +-- uid=user1
         +-- uid=user2
         +-- ...
```

### User Entry Schema

Each LDAP user has the following attributes:

| Attribute | Description | Example |
|-----------|-------------|---------|
| `uid` | Unique identifier | `johndoe` |
| `cn` | Common name | `John Doe` |
| `sn` | Surname | `Doe` |
| `givenName` | First name | `John` |
| `mail` | Email address | `john@example.com` |
| `userPassword` | Hashed password | `{SSHA}...` |
| `objectClass` | Entry type | `inetOrgPerson` |

### Passport LDAP Strategy

```javascript
const OPTS = {
  server: {
    url: process.env.LDAP_URL,
    bindDN: process.env.LDAP_BIND_DN,
    bindCredentials: process.env.LDAP_BIND_PASSWORD,
    searchBase: process.env.LDAP_SEARCH_BASE,
    searchFilter: '(|(mail={{username}})(uid={{username}}))',
    searchAttributes: ['dn', 'cn', 'sn', 'givenName', 'mail', 'uid']
  },
  usernameField: 'username',
  passwordField: 'password'
};

passport.use('ldapauth', new LdapStrategy(OPTS, async (req, ldapUser, done) => {
  // Find or create local user from LDAP profile
  let localUser = await User.findOne({ where: { email: ldapUser.mail } });
  
  if (!localUser) {
    localUser = await User.create({
      first_name: ldapUser.givenName || 'User',
      last_name: ldapUser.sn || 'LDAP',
      username: ldapUser.uid,
      email: ldapUser.mail
    });
  }
  
  return done(null, localUser);
}));
```

### LDAP Login Endpoint

```
POST /api/auth/ldap
Content-Type: application/json

{
  "username": "johndoe",  // Can be uid or email
  "password": "ldapPassword123"
}
```

### Admin LDAP Management

Super admins can manage LDAP users through a server-rendered admin panel:

| Route | Method | Description |
|-------|--------|-------------|
| `/admin/ldap-users` | GET | List all LDAP users |
| `/admin/ldap-users/add` | GET | Show add user form |
| `/admin/ldap-users/add` | POST | Create LDAP user |
| `/admin/ldap-users/edit/:uid` | GET | Show edit form |
| `/admin/ldap-users/edit/:uid` | POST | Update LDAP user |
| `/admin/ldap-users/delete/:uid` | POST | Delete LDAP user |

### LDAP Controller Operations

**File:** `backend/controller/ldap.controller.js`

```javascript
// List users
export const listLdapUsers = async (req, res) => {
  await bindClient();
  client.search(userDN, {
    filter: '(objectClass=person)',
    scope: 'sub',
    attributes: ['cn', 'sn', 'mail', 'uid']
  }, (err, search) => {
    const users = [];
    search.on('searchEntry', entry => users.push(entry.object));
    search.on('end', () => res.render('admin/ldap-users', { users }));
  });
};

// Add user
export const addLdapUser = async (req, res) => {
  const { uid, cn, sn, mail, password } = req.body;
  const dn = `uid=${uid},${userDN}`;
  const entry = {
    uid, cn, sn, mail,
    objectClass: ['person', 'organizationalPerson', 'inetOrgPerson'],
    userPassword: password
  };
  
  await bindClient();
  client.add(dn, entry, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.redirect('/admin/ldap-users');
  });
};
```

---

## Role-Based Access Control

### Available Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `user` | Regular participant | Own resources, teams, competitions |
| `center_admin` | Educational center administrator | Manage own center, approve registrations |
| `super_admin` | Global administrator | Full system access |

### Role Hierarchy

```
super_admin
    |
    +-- center_admin
         |
         +-- user
```

### Role Middleware

**File:** `backend/middleware/role.middleware.js`

```javascript
// Require specific role
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// Require any of specified roles
export function requireAnyRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// Require admin or center admin
export function requireAdminOrCenterAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!['super_admin', 'center_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
```

### Usage Examples

```javascript
// Only super_admin
router.delete('/users/:id', 
  authenticateToken, 
  requireRole('super_admin'), 
  deleteUser
);

// Admin or center admin
router.get('/centers/:id/teams',
  authenticateToken,
  requireAdminOrCenterAdmin,
  getCenterTeams
);

// Any authenticated user
router.get('/profile',
  authenticateToken,
  getProfile
);
```

---

## Middleware Reference

### Authentication Middleware

**File:** `backend/middleware/auth.middleware.js`

```javascript
export default function authenticateToken(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Session required' });
}
```

### Session Middleware (Admin Panel)

**File:** `backend/middleware/session.middleware.js`

```javascript
// For server-rendered admin pages
export function requireAdminSession(req, res, next) {
  const user = req.session?.user;
  if (!user) return res.redirect('/admin/login');
  if (user.role !== 'super_admin') {
    return res.status(403).send('Forbidden');
  }
  next();
}

// Redirect if already logged in
export function redirectIfAuthenticated(req, res, next) {
  if (req.session?.user?.role === 'super_admin') {
    return res.redirect('/admin');
  }
  next();
}
```

### Ownership Middleware

**File:** `backend/middleware/ownership.middleware.js`

```javascript
export function checkOwnership(model, paramKey = 'id', ownerField = 'user_id') {
  return async (req, res, next) => {
    const resource = await model.findByPk(req.params[paramKey]);
    
    if (!resource) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    const isOwner = resource[ownerField] === req.user.id;
    const isAdmin = req.user.role === 'super_admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    req.resource = resource;
    next();
  };
}
```

---

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SESSION_SECRET` | Secret for session signing | `your-secret-key` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `123...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-...` |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | `Iv1.abc123` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | `secret123` |
| `LDAP_URL` | LDAP server URL | `ldap://localhost:389` |
| `LDAP_BIND_DN` | Service account DN | `cn=admin,dc=robeurope,dc=samuelponce,dc=es` |
| `LDAP_BIND_PASSWORD` | Service account password | `adminpassword` |
| `LDAP_SEARCH_BASE` | Base DN for searches | `dc=robeurope,dc=samuelponce,dc=es` |
| `LDAP_SEARCH_FILTER` | User search filter | `(|(mail={{username}})(uid={{username}}))` |

### Example .env

```env
# Session
SESSION_SECRET=your-super-secret-session-key

# OAuth - Google
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret

# OAuth - GitHub
GITHUB_CLIENT_ID=Iv1.abcdef123456
GITHUB_CLIENT_SECRET=your-github-secret

# LDAP
LDAP_URL=ldap://localhost:389
LDAP_BIND_DN=cn=admin,dc=robeurope,dc=samuelponce,dc=es
LDAP_BIND_PASSWORD=adminpassword
LDAP_SEARCH_BASE=dc=robeurope,dc=samuelponce,dc=es
LDAP_SEARCH_FILTER=(|(mail={{username}})(uid={{username}}))

# Redis (for rate limiting)
REDIS_URL=redis://localhost:6379
```

---

## Troubleshooting

### Common Issues

#### Session Not Persisting

| Symptom | Cause | Solution |
|---------|-------|----------|
| Logged out after refresh | Cookie not set | Check `secure: true` with HTTPS |
| Session lost between requests | Proxy not trusted | Set `app.set('trust proxy', 1)` |
| Cookie rejected | SameSite mismatch | Verify frontend/backend domains |

#### LDAP Connection Failed

| Symptom | Cause | Solution |
|---------|-------|----------|
| ECONNREFUSED | LDAP server down | Check Docker container status |
| Invalid credentials | Wrong bind DN/password | Verify LDAP_BIND_DN and LDAP_BIND_PASSWORD |
| User not found | Wrong search base | Check LDAP_SEARCH_BASE matches directory |

#### OAuth Callback Error

| Symptom | Cause | Solution |
|---------|-------|----------|
| Redirect URI mismatch | Callback URL wrong | Update OAuth app settings |
| Invalid client | Wrong credentials | Verify CLIENT_ID and CLIENT_SECRET |
| Scope error | Missing permissions | Request required OAuth scopes |

### Debug Commands

```bash
# Test LDAP connection
ldapsearch -x -H ldap://localhost:389 -D "cn=admin,dc=robeurope,dc=samuelponce,dc=es" -w adminpassword -b "dc=robeurope,dc=samuelponce,dc=es"

# Check Redis connection
redis-cli ping

# View active sessions
SELECT * FROM Session WHERE expires > NOW();

# Check Docker containers
docker-compose ps
```

### Logging

Authentication events are logged via Winston:

```javascript
import logger from '../utils/logger.js';

// Successful login
logger.info(`User ${user.email} logged in successfully`);

// Failed login
logger.warn(`Failed login attempt for ${email}`);

// LDAP error
logger.error('LDAP bind failed', { error: err.message });
```

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Local login | No |
| POST | `/api/auth/logout` | End session | Yes |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/ldap` | LDAP login | No |
| GET | `/api/auth/google` | Google OAuth start | No |
| GET | `/api/auth/google/callback` | Google OAuth callback | No |
| GET | `/api/auth/github` | GitHub OAuth start | No |
| GET | `/api/auth/github/callback` | GitHub OAuth callback | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |

### Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (registration) |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (insufficient permissions) |
| 409 | Conflict (duplicate email/username) |
| 429 | Too many requests (rate limited) |
| 500 | Server error |
