# Security Overview

## Overview

The RobEurope platform implements multiple layers of security to protect user data, prevent unauthorized access, and ensure system integrity.

## Authentication & Authorization

### JWT Token Security
- **Algorithm**: HS256 (HMAC-SHA256)
- **Expiration**: 1 hour for access tokens
- **Storage**: Client-side localStorage (not secure for sensitive data)
- **Validation**: Server-side verification on every request

### Session Security
- **Storage**: Database-backed sessions (not memory)
- **Cookies**: `httpOnly`, `sameSite: 'lax'`
- **Expiration**: 1 hour inactivity
- **Regeneration**: On login to prevent session fixation

### Password Security
- **Hashing**: bcryptjs with salt rounds (configurable)
- **Minimum Requirements**: 8 characters, mixed case, numbers
- **No Plain Text Storage**: Never store passwords in logs or database

## Input Validation & Sanitization

### API Input Validation
- **Schema Validation**: Joi schemas for all endpoints
- **Type Checking**: Sequelize model validations
- **SQL Injection Prevention**: Parameterized queries only

### File Upload Security
- **Type Validation**: MIME type checking
- **Size Limits**: 10MB per file (configurable)
- **Path Traversal**: Sanitized file paths
- **Storage**: Local filesystem with access controls

## Network Security

### HTTPS Enforcement
- **SSL/TLS**: Required for production
- **Certificate**: Let's Encrypt or commercial certificates
- **HSTS**: HTTP Strict Transport Security headers

### CORS Configuration
- **Origins**: Configured per environment
- **Methods**: Restricted to necessary HTTP methods
- **Headers**: Limited to required headers only

### Rate Limiting
- **Global Limits**: 100 requests per minute per IP
- **Auth Endpoints**: 5 attempts per minute per IP
- **Upload Endpoints**: 10 uploads per hour per user

## Data Protection

### Database Security
- **Access Control**: Least privilege principle
- **Audit Logging**: All database changes logged

### LDAP Security
- **TLS**: LDAPS for encrypted connections
- **Access Controls**: ACLs restrict directory access
- **Password Policies**: Complexity requirements enforced

### Session Management
- **CSRF Protection**: Tokens on all forms
- **Session Hijacking**: Secure cookie attributes
- **Logout**: Proper session destruction

## Application Security

### Middleware Security
- **Helmet.js**: Security headers (CSP, HSTS, etc.)
- **Request ID**: Unique tracking for debugging
- **Timeout**: 30-second request timeout
- **Error Handling**: No sensitive data in error responses

### Code Security
- **Dependencies**: Regular security audits with npm audit
- **Input Sanitization**: All user inputs sanitized
- **Output Encoding**: XSS prevention in templates



## Security Configuration

### Environment Variables
```env
# Security Secrets
JWT_SECRET=<strong-random-secret>
SESSION_SECRET=<strong-random-secret>
LDAP_ADMIN_PASSWORD=<strong-password>

# Security Settings
NODE_ENV=production
FORCE_HTTPS=true
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Security Headers
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
```

