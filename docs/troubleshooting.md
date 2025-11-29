# Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered during development and deployment of the RobEurope platform.

## Application Issues

### Backend Won't Start

#### Error: `Port 85 already in use`
```bash
# Find process using port
netstat -ano | findstr :85

# Kill process (Windows)
taskkill /PID <PID> /F


```

#### Error: `Cannot find module`
```bash
# Clear node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### Error: `SequelizeConnectionError`
```bash
# Check database is running
docker-compose ps

# Check database logs
docker-compose logs db

# Verify .env database configuration
cat .env | grep DB_
```

### Frontend Won't Start

#### Error: `Port 5173 already in use`
```bash
# Kill process using port
lsof -ti:5173 | xargs kill -9

# Or change port
npm run dev -- --port 5174
```

#### Error: `Module not found`
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database Issues

#### Migration Fails
```bash
# Check current migration status
cd backend
npx sequelize-cli db:migrate:status

# Reset and rerun migrations
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
```

#### Connection Timeout
```bash
# Check database container
docker-compose ps db

# Restart database
docker-compose restart db

# Check database logs
docker-compose logs db
```

#### Data Corruption
```bash
# Backup current data
docker-compose exec db mysqldump -u root -p robeurope > backup.sql

# Reset database
docker-compose down
docker-compose up -d db

# Restore from backup
docker-compose exec -T db mysql -u root -p robeurope < backup.sql
```

## Authentication Issues

### JWT Token Errors

#### Error: `Invalid token`
```javascript
// Check token format in request headers
console.log(req.headers.authorization);

// Verify JWT_SECRET in .env matches
echo $JWT_SECRET
```

#### Error: `Token expired`
```javascript
// Check token expiration time
const decoded = jwt.decode(token);
console.log(new Date(decoded.exp * 1000));
```

### Session Issues

#### Admin login not working
```bash
# Check session configuration
cat backend/.env | grep SESSION

# Clear browser cookies
# Or restart backend server
docker-compose restart backend
```

#### Session persistence problems
```bash
# Check database sessions table
docker-compose exec db mysql -u root -p robeurope -e "SELECT * FROM Sessions LIMIT 5"

# Verify session store configuration
cat backend/config/database.js
```

## API Issues

### 401 Unauthorized

#### JWT middleware failing
```javascript
// Check if Authorization header is present
console.log(req.headers.authorization);

// Verify token format: "Bearer <token>"
const token = req.headers.authorization?.split(' ')[1];
```

#### Role-based access failing
```javascript
// Check user role in database
SELECT role FROM users WHERE id = ?;

// Verify middleware order in route
app.get('/admin/*', requireAuth, requireAdmin);
```

### 500 Internal Server Error

#### Unhandled promise rejection
```javascript
// Add error handling to async functions
try {
  const result = await someAsyncOperation();
} catch (error) {
  console.error('Error:', error);
  next(error);
}
```

#### Database query errors
```javascript
// Log the actual SQL query
console.log(userQuery.toSQL());

// Check database connection
await sequelize.authenticate();
```

### CORS Issues

#### Frontend can't connect to API
```javascript
// Check CORS configuration in backend
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));
```

#### Preflight request failing
```bash
# Check nginx CORS headers
curl -I -X OPTIONS http://localhost:85/api/users
```

## File Upload Issues

### Upload fails silently
```javascript
// Check multer configuration
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // Validate file type
  }
});
```

### Files not accessible
```bash
# Check file permissions
ls -la backend/uploads/

# Fix permissions
chmod 755 backend/uploads/
chmod 644 backend/uploads/*
```

## LDAP Issues

### Connection fails
```bash
# Test LDAP connection
ldapsearch -x -H ldap://localhost:389 -b "dc=robeurope,dc=com"

# Check LDAP service status
docker-compose ps ldap
docker-compose logs ldap
```

### Authentication fails
```javascript
// Check LDAP configuration
console.log({
  url: process.env.LDAP_URL,
  baseDN: process.env.LDAP_BASE_DN,
  adminDN: process.env.LDAP_ADMIN_DN
});
```

### User creation fails
```javascript
// Check LDAP entry format
const entry = {
  cn: username,
  sn: username,
  uid: username,
  userPassword: hashedPassword,
  objectClass: ['person', 'organizationalPerson', 'inetOrgPerson']
};
```

## Docker Issues

### Container won't start
```bash
# Check container logs
docker-compose logs <service-name>

# Check container status
docker-compose ps

# Rebuild container
docker-compose up -d --build <service-name>
```

### Port binding issues
```bash
# Check port availability
netstat -tlnp | grep :5000

# Change host port mapping
# In docker-compose.yml
ports:
  - "5001:5000"
```

### Volume permission issues
```bash
# Fix volume permissions
sudo chown -R 1000:1000 backend/uploads/
sudo chown -R 999:999 mysql/data/
```

## Performance Issues

### Slow API responses
```bash
# Enable query logging
const sequelize = new Sequelize({
  logging: console.log,
  // ... other options
});
```

### Memory leaks
```bash
# Monitor memory usage
docker stats

# Check for circular references
# Use memory profiling tools
```

### Database slow queries
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- Check slow queries
SELECT * FROM mysql.slow_log;
```

## Frontend Issues

### Build fails
```bash
# Clear build cache
cd frontend
rm -rf dist node_modules/.vite
npm run build
```

### Hot reload not working
```bash
# Check file watching limits
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### State not updating
```javascript
// Check component re-rendering
console.log('Component re-rendered');

// Verify state updates
useEffect(() => {
  console.log('State changed:', state);
}, [state]);
```

## Deployment Issues

### Nginx configuration problems
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Reload nginx
sudo systemctl reload nginx
```

### SSL certificate issues
```bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/cert.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew
```

### Database migration in production
```bash
# Backup before migration
docker-compose exec db mysqldump -u root -p robeurope > pre_migration.sql

# Run migrations
docker-compose exec backend npx sequelize-cli db:migrate

# Verify data integrity
docker-compose exec db mysql -u root -p robeurope -e "SHOW TABLES;"
```

## Monitoring and Logs

### Application Logs
```bash
# View backend logs
docker-compose logs -f backend

# Search for specific errors
docker-compose logs backend | grep "ERROR"
```

### Database Logs
```bash
# MySQL error log
docker-compose exec db tail -f /var/log/mysql/error.log

# General query log
docker-compose exec db mysql -u root -p -e "SET GLOBAL general_log = 'ON';"
```

### System Logs
```bash
# System journal
journalctl -u docker -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Common Error Patterns

### `ECONNREFUSED`
- Service not running
- Wrong host/port configuration
- Firewall blocking connection

### `ENOTFOUND`
- DNS resolution issues
- Wrong hostname in configuration
- Network connectivity problems

### `EACCES`
- File permission issues
- Running process as wrong user
- Directory access restrictions

### `EMFILE`
- Too many open files
- File descriptor limits
- Memory leaks in file handling

## Getting Help

### Debug Information to Collect
```bash
# System information
uname -a
node --version
docker --version

# Environment variables (redact secrets)
env | grep -E "(NODE_ENV|DB_|JWT_|SESSION_)"

# Container status
docker-compose ps
docker-compose logs --tail=50

# Database status
docker-compose exec db mysqladmin -u root -p ping
```

### Support Checklist
- [ ] Error messages and stack traces
- [ ] Environment configuration (redacted)
- [ ] Steps to reproduce the issue
- [ ] System and software versions
- [ ] Recent changes to codebase
- [ ] Log files from relevant services

### Emergency Recovery
```bash
# Quick restart all services
docker-compose down
docker-compose up -d

# Restore from backup
docker-compose exec -T db mysql -u root -p robeurope < backup.sql

# Reset to clean state (development only)
docker-compose down -v
docker-compose up -d --build
```