# LDAP Integration

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Infrastructure Setup](#infrastructure-setup)
- [Directory Structure](#directory-structure)
- [Environment Configuration](#environment-configuration)
- [Authentication Flow](#authentication-flow)
- [Passport.js LDAP Strategy](#passportjs-ldap-strategy)
- [LDAP Controller Operations](#ldap-controller-operations)
- [Admin Panel Management](#admin-panel-management)
- [API Endpoints](#api-endpoints)
- [Utility Scripts](#utility-scripts)
- [Troubleshooting](#troubleshooting)

---

## Overview

RobEurope integrates LDAP (Lightweight Directory Access Protocol) as an alternative authentication mechanism, allowing users to authenticate against an organizational directory service. The implementation uses OpenLDAP as the directory server and the `passport-ldapauth` strategy for Passport.js integration.

Key features:

- Directory-based user authentication
- Automatic local user creation upon first LDAP login
- Admin panel for managing LDAP users (CRUD operations)
- Support for authentication via UID or email
- Seamless integration with the existing session-based authentication system

---

## Architecture

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|  React Frontend  +---->+  Express Backend +---->+  MySQL Database  |
|                  |     |                  |     |                  |
+------------------+     +--------+---------+     +------------------+
                                  |
                                  |
                    +-------------v-------------+
                    |                           |
                    |     OpenLDAP Container    |
                    |     (Port 389/636)        |
                    |                           |
                    +---------------------------+
```

The LDAP server runs as a Docker container alongside the main application stack. When a user authenticates via LDAP:

1. The backend connects to OpenLDAP using a service account
2. User credentials are validated against the directory
3. A local user record is created or retrieved from MySQL
4. A session is established using the standard session mechanism

---

## Infrastructure Setup

### Docker Compose Configuration

The OpenLDAP server is defined in the project root `docker-compose.yml`:

```yaml
services:
  openldap:
    image: osixia/openldap:1.5.0
    container_name: openldap
    environment:
      LDAP_ORGANISATION: "RobEurope"
      LDAP_DOMAIN: "robeurope.samuelponce.es"
      LDAP_ADMIN_PASSWORD: "adminpassword"
      LDAP_CONFIG_PASSWORD: "configpassword"
      LDAP_TLS: "false"
    ports:
      - "389:389"   # LDAP
      - "636:636"   # LDAPS (TLS)
    volumes:
      - ldap_data:/var/lib/ldap
      - ldap_config:/etc/ldap/slapd.d
    networks:
      - robeurope_network

volumes:
  ldap_data:
  ldap_config:
```

### Starting the LDAP Server

```bash
# Start OpenLDAP container
docker-compose up -d openldap

# Verify container is running
docker ps | grep openldap
```

---

## Directory Structure

The LDAP directory follows a hierarchical structure based on the configured domain:

```
dc=robeurope,dc=samuelponce,dc=es        (Base DN - root)
    |
    +-- ou=users                          (Organizational Unit for users)
         |
         +-- uid=user1                    (Individual user entries)
         +-- uid=user2
         +-- uid=admin1
         +-- ...
```

### Base Distinguished Name (DN)

The base DN is derived from the domain `robeurope.samuelponce.es`:

- Base DN: `dc=robeurope,dc=samuelponce,dc=es`
- Users OU: `ou=users,dc=robeurope,dc=samuelponce,dc=es`

### User Entry Schema

Each LDAP user entry uses the `inetOrgPerson` object class and contains:

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| `uid` | String | Unique user identifier (login name) | Yes |
| `cn` | String | Common name (full name or first name) | Yes |
| `sn` | String | Surname (last name) | Yes |
| `mail` | String | Email address | Yes |
| `userPassword` | String | User password (stored hashed by OpenLDAP) | Yes |
| `objectClass` | Array | `['person', 'organizationalPerson', 'inetOrgPerson']` | Yes |
| `givenName` | String | First name (optional) | No |

### Example User Entry

```ldif
dn: uid=johndoe,ou=users,dc=robeurope,dc=samuelponce,dc=es
objectClass: person
objectClass: organizationalPerson
objectClass: inetOrgPerson
uid: johndoe
cn: John
sn: Doe
mail: john.doe@example.com
userPassword: {SSHA}hashedpasswordvalue
```

---

## Environment Configuration

The following environment variables configure LDAP connectivity in `backend/.env`:

```env
# LDAP Server Connection
LDAP_URL=ldap://localhost:389

# Service Account for Binding
LDAP_BIND_DN=cn=admin,dc=robeurope,dc=samuelponce,dc=es
LDAP_BIND_PASSWORD=adminpassword

# Search Configuration
LDAP_BASE_DN=dc=robeurope,dc=samuelponce,dc=es
LDAP_SEARCH_BASE=dc=robeurope,dc=samuelponce,dc=es
LDAP_USER_DN=ou=users,dc=robeurope,dc=samuelponce,dc=es

# Search Filter (optional - defaults shown)
LDAP_SEARCH_FILTER=(|(mail={{username}})(uid={{username}}))
```

### Variable Descriptions

| Variable | Purpose |
|----------|---------|
| `LDAP_URL` | LDAP server URL (ldap:// or ldaps://) |
| `LDAP_BIND_DN` | Distinguished Name of the service account used for initial bind |
| `LDAP_BIND_PASSWORD` | Password for the service account |
| `LDAP_BASE_DN` | Base DN for the directory tree |
| `LDAP_SEARCH_BASE` | Base DN used when searching for users |
| `LDAP_USER_DN` | Full DN path to the users organizational unit |
| `LDAP_SEARCH_FILTER` | LDAP filter to locate users (supports username substitution) |

---

## Authentication Flow

### LDAP Login Sequence

```
1. User submits credentials to POST /api/auth/ldap
   (username can be uid or email, plus password)
                    |
                    v
2. Passport-ldapauth strategy initiates
                    |
                    v
3. Backend binds to LDAP with service account
   (LDAP_BIND_DN + LDAP_BIND_PASSWORD)
                    |
                    v
4. Search for user entry matching username
   Filter: (|(mail={{username}})(uid={{username}}))
                    |
                    v
5. If user found, attempt bind with user credentials
                    |
                    v
6. If bind succeeds, authentication is valid
                    |
                    v
7. Check if local user exists in MySQL (by email or username)
                    |
                    v
8. If not found, create new local user record
                    |
                    v
9. Establish session (req.session.user = localUser)
                    |
                    v
10. Return success response with user data
```

### Local User Synchronization

When an LDAP user successfully authenticates, the system ensures a corresponding local user exists:

1. Search MySQL for user with matching email
2. If not found, search by username (uid)
3. If still not found, create a new user record with:
   - `first_name`: From LDAP `givenName` or `cn`, defaults to "User"
   - `last_name`: From LDAP `sn`, defaults to "LDAP"
   - `username`: From LDAP `uid`
   - `email`: From LDAP `mail`
   - `password_hash`: Set to null (LDAP handles authentication)

---

## Passport.js LDAP Strategy

### Configuration

The LDAP strategy is registered in `backend/config/passport.js`:

```javascript
import LdapStrategy from 'passport-ldapauth';

const OPTS = {
  server: {
    url: process.env.LDAP_URL,
    bindDN: process.env.LDAP_BIND_DN,
    bindCredentials: process.env.LDAP_BIND_PASSWORD,
    searchBase: process.env.LDAP_SEARCH_BASE,
    searchFilter: process.env.LDAP_SEARCH_FILTER || '(|(mail={{username}})(uid={{username}}))',
    searchAttributes: ['dn', 'cn', 'sn', 'givenName', 'mail', 'uid']
  },
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
};

passport.use('ldapauth', new LdapStrategy(OPTS, async (req, ldapUser, done) => {
  try {
    const email = ldapUser.mail || null;
    const uid = ldapUser.uid || null;
    const firstName = ldapUser.givenName || 'User';
    const lastName = ldapUser.sn || 'LDAP';

    // Find or create local user
    let localUser = email ? await User.findOne({ where: { email } }) : null;
    if (!localUser) {
      localUser = await User.findOne({ where: { username: uid } });
    }

    if (!localUser) {
      localUser = await User.create({
        first_name: firstName,
        last_name: lastName,
        username: uid,
        email: email,
        password_hash: null
      });
    }

    return done(null, localUser);
  } catch (err) {
    return done(err);
  }
}));
```

### Strategy Options

| Option | Description |
|--------|-------------|
| `usernameField` | Form field name for username input |
| `passwordField` | Form field name for password input |
| `passReqToCallback` | Pass request object to verify callback |
| `server.searchFilter` | LDAP filter with `{{username}}` placeholder |
| `server.searchAttributes` | Attributes to retrieve from LDAP entries |

---

## LDAP Controller Operations

The LDAP controller (`backend/controller/ldap.controller.js`) provides admin-only functionality for managing LDAP users directly.

### Client Initialization

```javascript
import ldap from 'ldapjs';

const client = ldap.createClient({
  url: process.env.LDAP_URL
});

const bindClient = () => {
  return new Promise((resolve, reject) => {
    client.bind(process.env.LDAP_BIND_DN, process.env.LDAP_BIND_PASSWORD, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};
```

### Available Operations

#### List Users

Searches the LDAP directory for all person entries:

```javascript
export const listLdapUsers = async (req, res) => {
  await bindClient();
  const opts = {
    filter: '(objectClass=person)',
    scope: 'sub',
    attributes: ['cn', 'sn', 'mail', 'uid']
  };
  
  client.search(userDN, opts, (err, search) => {
    const users = [];
    search.on('searchEntry', (entry) => users.push(entry.object));
    search.on('end', () => res.render('admin/ldap-users', { users }));
  });
};
```

#### Add User

Creates a new user entry in the LDAP directory:

```javascript
export const addLdapUser = async (req, res) => {
  const { uid, cn, sn, mail, password } = req.body;
  const dn = `uid=${uid},ou=users,${baseDN}`;
  
  const entry = {
    uid,
    cn,
    sn,
    mail,
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

#### Update User

Modifies attributes of an existing LDAP user:

```javascript
export const updateLdapUser = async (req, res) => {
  const uid = req.params.uid || req.body.uid;
  const { cn, sn, mail, password } = req.body;
  const dn = `uid=${uid},ou=users,${baseDN}`;

  const changes = [];
  if (cn) changes.push(new ldap.Change({ 
    operation: 'replace', 
    modification: { cn } 
  }));
  if (sn) changes.push(new ldap.Change({ 
    operation: 'replace', 
    modification: { sn } 
  }));
  // ... additional attributes

  await bindClient();
  client.modify(dn, changes, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.redirect('/admin/ldap-users');
  });
};
```

#### Delete User

Removes a user entry from the LDAP directory:

```javascript
export const deleteLdapUser = async (req, res) => {
  const uid = req.params.uid;
  const dn = `uid=${uid},ou=users,${baseDN}`;

  await bindClient();
  client.del(dn, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.redirect('/admin/ldap-users');
  });
};
```

---

## Admin Panel Management

### Route Configuration

LDAP admin routes are defined in `backend/routes/admin.route.js`:

```javascript
import * as ldapController from '../controller/ldap.controller.js';

// LDAP routes (require admin session)
router.get('/ldap-users', requireAdminSession, ldapController.listLdapUsers);
router.get('/ldap-users/add', requireAdminSession, ldapController.renderAddLdapUser);
router.post('/ldap-users/add', requireAdminSession, ldapController.addLdapUser);
router.get('/ldap-users/edit/:uid', requireAdminSession, ldapController.renderEditLdapUser);
router.post('/ldap-users/edit/:uid', requireAdminSession, ldapController.updateLdapUser);
router.post('/ldap-users/edit', requireAdminSession, ldapController.updateLdapUser);
router.post('/ldap-users/delete/:uid', requireAdminSession, ldapController.deleteLdapUser);
```

### Available Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/admin/ldap-users` | GET | List all LDAP users in a table view |
| `/admin/ldap-users/add` | GET | Display the add user form |
| `/admin/ldap-users/add` | POST | Create a new LDAP user |
| `/admin/ldap-users/edit/:uid` | GET | Display the edit form for a user |
| `/admin/ldap-users/edit/:uid` | POST | Update an existing LDAP user |
| `/admin/ldap-users/delete/:uid` | POST | Delete an LDAP user |

### View Templates

The admin panel uses EJS templates located in `backend/views/admin/`:

- `ldap-users.ejs`: Displays a table of all LDAP users with actions
- `ldap-user-form.ejs`: Shared form for add/edit operations

---

## API Endpoints

### LDAP Authentication Endpoint

**Endpoint:** `POST /api/auth/ldap`

Authenticates a user against the LDAP directory.

**Request:**

```json
{
  "username": "johndoe",
  "password": "userPassword123"
}
```

The `username` field accepts either:
- The user's `uid` (e.g., "johndoe")
- The user's email address (e.g., "john@example.com")

**Success Response (200):**

```json
{
  "success": true
}
```

A session cookie (`connect.sid`) is set upon successful authentication.

**Error Responses:**

| Status | Description |
|--------|-------------|
| 401 | Invalid LDAP credentials |
| 500 | LDAP server error or session error |

### Implementation

From `backend/routes/api/auth.route.js`:

```javascript
router.post('/ldap', (req, res, next) => {
  passport.authenticate('ldapauth', (err, user, info) => {
    if (err) {
      console.error('LDAP error:', err);
      return res.status(500).json({ error: 'LDAP authentication failed' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid LDAP credentials' });
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.status(500).json({ error: 'Session error' });
      }
      req.session.user = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        role: user.role
      };
      req.session.save((saveErr) => {
        if (saveErr) return res.status(500).json({ error: 'Session save failed' });
        return res.json({ success: true });
      });
    });
  })(req, res, next);
});
```

---

## Utility Scripts

### Initialize LDAP Structure

**File:** `backend/init-ldap.js`

Creates the `ou=users` organizational unit if it does not exist:

```bash
node backend/init-ldap.js
```

```javascript
const ouEntry = {
  objectClass: ['top', 'organizationalUnit'],
  ou: 'users'
};

client.add(usersOU, ouEntry, (err) => {
  if (err && err.code !== 68) { // 68 = already exists
    console.error('Add ou error:', err);
  } else {
    console.log('OU users added or already exists');
  }
});
```

### Test LDAP Connection

**File:** `backend/test-ldap-connection.js`

Verifies connectivity and configuration:

```bash
node backend/test-ldap-connection.js
```

This script:
1. Displays current LDAP configuration from environment
2. Attempts to bind with the service account
3. Performs a base search on the root DN
4. Reports success or failure

### Debug LDAP Entries

**File:** `backend/debug-ldap-entry.js`

Searches and displays detailed information about user entries:

```bash
node backend/debug-ldap-entry.js
```

Useful for inspecting the structure of LDAP entries and troubleshooting attribute mapping.

### LDIF File for Manual Setup

**File:** `add-ou.ldif`

An LDIF file to manually add the users organizational unit:

```ldif
dn: ou=users,dc=robeurope,dc=samuelponce,dc=es
objectClass: organizationalUnit
ou: users
```

Apply with:

```bash
ldapadd -x -D "cn=admin,dc=robeurope,dc=samuelponce,dc=es" -W -f add-ou.ldif
```

---

## Troubleshooting

### Common Issues

#### Cannot Connect to LDAP Server

**Symptoms:** Connection timeout or refused

**Solutions:**
1. Verify Docker container is running: `docker ps | grep openldap`
2. Check port availability: `netstat -an | grep 389`
3. Verify `LDAP_URL` is correct in `.env`
4. Ensure firewall allows connections on port 389

#### Bind Fails with Invalid Credentials

**Symptoms:** Error code 49 (invalid credentials)

**Solutions:**
1. Verify `LDAP_BIND_DN` format matches your directory structure
2. Confirm `LDAP_BIND_PASSWORD` is correct
3. Check that the admin account exists in the container

#### User Search Returns Empty

**Symptoms:** No users found despite existing entries

**Solutions:**
1. Verify `LDAP_SEARCH_BASE` points to correct DN
2. Check that users exist under `ou=users`
3. Run `debug-ldap-entry.js` to inspect directory contents
4. Confirm search filter syntax is valid

#### User Cannot Login Despite Correct Password

**Symptoms:** Authentication fails with valid LDAP credentials

**Solutions:**
1. Verify user entry has correct `objectClass` (must include `person`)
2. Check password was stored correctly
3. Ensure search filter matches user's attributes
4. Test with both `uid` and `mail` as username

### Debug Commands

```bash
# Check LDAP container logs
docker logs openldap

# Search LDAP directory manually
ldapsearch -x -H ldap://localhost:389 \
  -D "cn=admin,dc=robeurope,dc=samuelponce,dc=es" \
  -w adminpassword \
  -b "ou=users,dc=robeurope,dc=samuelponce,dc=es" \
  "(objectClass=person)"

# Test bind with specific user
ldapwhoami -x -H ldap://localhost:389 \
  -D "uid=testuser,ou=users,dc=robeurope,dc=samuelponce,dc=es" \
  -w userpassword
```

### Logging

Enable debug logging by setting environment variable:

```bash
DEBUG=passport-ldapauth npm run dev
```

The LDAP controller logs operations to the console:
- Search operations and results
- Add/modify/delete operations
- Error messages with details

---

## Security Considerations

1. **TLS/SSL**: Production environments should enable LDAPS (port 636) with proper certificates
2. **Service Account**: Use a dedicated service account with minimal required permissions
3. **Password Storage**: OpenLDAP automatically hashes passwords; avoid plain text storage
4. **Access Control**: LDAP admin routes are protected by `requireAdminSession` middleware
5. **Rate Limiting**: Consider implementing rate limiting on the `/api/auth/ldap` endpoint
6. **Audit Logging**: Log authentication attempts for security monitoring

---

## Related Documentation

- [Authentication System](authentication.md) - Overview of all authentication methods
- [Security Guide](security.md) - Security best practices and configurations
- [Deployment Guide](deployment.md) - Production deployment instructions
