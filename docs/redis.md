# Redis Integration

[![Redis](https://img.shields.io/badge/redis-alpine-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Status](https://img.shields.io/badge/status-active-success)](.)

---

## Table of Contents

- [Overview](#overview)
- [Infrastructure](#infrastructure)
- [Connection Setup](#connection-setup)
- [Login Throttling](#login-throttling)
- [Password Reset Tokens](#password-reset-tokens)
- [User Favorites](#user-favorites)
- [Push Notification Subscriptions](#push-notification-subscriptions)
- [Notification Deduplication](#notification-deduplication)
- [Admin Redis Explorer](#admin-redis-explorer)
- [Health Checks](#health-checks)
- [Key Patterns Reference](#key-patterns-reference)
- [Commands Reference](#commands-reference)

---

## Overview

Redis is used as an in-memory data store for ephemeral data that requires fast access and automatic expiration. The main use cases are:

| Use Case | Purpose |
|----------|---------|
| Login Throttling | Prevent brute-force attacks |
| Password Reset | Store temporary OTP codes and tokens |
| User Favorites | Cache favorite competitions per user |
| Push Subscriptions | Store push notification endpoints |
| Deduplication | Prevent duplicate notifications |
| Admin Tools | Inspect and manage Redis data |

---

## Infrastructure

Redis runs as a Docker container alongside the application:

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:alpine
    container_name: robeurope-redis
    ports:
      - "6379:6379"
    networks:
      - robeurope_network
```

### Environment Variable

```env
REDIS_URL=redis://localhost:6379
```

---

## Connection Setup

**File:** `backend/utils/redis.js`

```javascript
import { createClient } from 'redis';
import logger from './logger.js';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

await redisClient.connect();

export default redisClient;
```

The client is a singleton exported for use across all modules.

---

## Login Throttling

**File:** `backend/controller/auth.controller.js`

Prevents brute-force login attacks by tracking failed attempts and locking accounts temporarily.

### Flow Diagram

```
Login Attempt
     |
     v
Check if locked? -----> YES --> Return 429 "Account locked"
     |
     NO
     v
Validate credentials
     |
     +---> FAIL --> Increment attempts
     |              |
     |              v
     |         attempts >= 5?
     |              |
     |              +---> YES --> Lock account (10 min)
     |              |
     |              +---> NO --> Set 10-min window
     |
     +---> SUCCESS --> Clear attempts --> Return user
```

### Implementation

```javascript
const lockKey = `login:lock:${email}`;
const attemptsKey = `login:attempts:${email}`;

// Check if account is locked
const isLocked = await redisClient.get(lockKey);
if (isLocked) {
  return res.status(429).json({ 
    error: 'Account temporarily locked. Try again later.' 
  });
}

// On failed login
const attempts = await redisClient.incr(attemptsKey);
await redisClient.expire(attemptsKey, 600); // 10-minute window

if (attempts >= 5) {
  await redisClient.set(lockKey, '1', { EX: 600 }); // Lock for 10 minutes
}

// On successful login
await redisClient.del(attemptsKey);
await redisClient.del(lockKey);
```

### Keys Used

| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `login:lock:<email>` | String | 10 min | Account lockout flag |
| `login:attempts:<email>` | String (counter) | 10 min | Failed attempt count |

---

## Password Reset Tokens

**File:** `backend/controller/auth.controller.js`

Stores temporary tokens and OTP codes for password reset functionality.

### OTP Code Storage

```javascript
// Generate 6-digit code
const code = Math.floor(100000 + Math.random() * 900000).toString();
const key = `password_reset:${code}`;

// Store with 15-minute expiry
await redisClient.set(key, email, { EX: 900 });
```

### Token Validation

```javascript
const key = `password_reset:${token}`;
const storedEmail = await redisClient.get(key);

if (!storedEmail) {
  return res.status(400).json({ error: 'Invalid or expired token' });
}

// Consume token (one-time use)
await redisClient.del(key);
```

### Keys Used

| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `password_reset:<token>` | String | 15 min | Maps token/OTP to email |

---

## User Favorites

**File:** `backend/controller/competitions.controller.js`

Stores user's favorite competitions using Redis Sets for efficient membership operations.

### Add to Favorites

```javascript
const key = `user:${userId}:favorites`;
await redisClient.sAdd(key, String(competitionId));
```

### Remove from Favorites

```javascript
const key = `user:${userId}:favorites`;
await redisClient.sRem(key, String(competitionId));
```

### Get All Favorites

```javascript
const key = `user:${userId}:favorites`;
const favoriteIds = await redisClient.sMembers(key);
// Returns: ['1', '5', '12', ...]
```

### Keys Used

| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `user:<userId>:favorites` | Set | None | Competition IDs favorited by user |

---

## Push Notification Subscriptions

**File:** `backend/utils/push.js`

Manages Web Push notification subscriptions per user.

### Store Subscription

```javascript
const userKey = `user:${userId}:push_subs`;
const endpointIndex = 'push:endpoints';

// Add subscription to user's set
await redisClient.sAdd(userKey, JSON.stringify(subscription));

// Index endpoint to user for reverse lookup
await redisClient.hSet(endpointIndex, subscription.endpoint, userId);
```

### Remove Subscription

```javascript
const userKey = `user:${userId}:push_subs`;
const endpointIndex = 'push:endpoints';

// Get all subscriptions
const subs = await redisClient.sMembers(userKey);

// Find and remove matching subscription
for (const sub of subs) {
  const parsed = JSON.parse(sub);
  if (parsed.endpoint === endpoint) {
    await redisClient.sRem(userKey, sub);
    break;
  }
}

// Remove from endpoint index
await redisClient.hDel(endpointIndex, endpoint);
```

### Get User Subscriptions

```javascript
const key = `user:${userId}:push_subs`;
const subs = await redisClient.sMembers(key);
return subs.map(s => JSON.parse(s));
```

### Keys Used

| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `user:<userId>:push_subs` | Set | None | Push subscription JSON objects |
| `push:endpoints` | Hash | None | Maps endpoint URLs to user IDs |

---

## Notification Deduplication

**File:** `backend/utils/scheduler.js`

Prevents duplicate reminder notifications for competition registrations.

### Check and Mark as Sent

```javascript
const key = `reminder:sent:${registrationId}`;

// Check if already sent
const alreadySent = await redisClient.get(key);
if (alreadySent) {
  return; // Skip duplicate
}

// Send notification...

// Mark as sent with 48-hour TTL
await redisClient.set(key, '1', { EX: 172800 });
```

### Keys Used

| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `reminder:sent:<regId>` | String | 48 hours | Deduplication flag |

---

## Admin Redis Explorer

**File:** `backend/controller/admin.redis.controller.js`

Provides a web interface for super admins to inspect and manage Redis data.

### Available Operations

| Route | Method | Description |
|-------|--------|-------------|
| `/admin/redis` | GET | Explorer UI |
| `/admin/api/redis/keys` | GET | List keys with pattern matching |
| `/admin/api/redis/key/:key` | GET | Get key details |
| `/admin/api/redis/key/:key` | DELETE | Delete a key |
| `/admin/api/redis/overview` | GET | Server status and metrics |

### Key Listing

```javascript
// Non-blocking scan with pattern
const keys = [];
for await (const key of redisClient.scanIterator({ MATCH: pattern })) {
  keys.push(key);
}
```

### Get Key Details

```javascript
const type = await redisClient.type(key);
const ttl = await redisClient.ttl(key);

let value;
switch (type) {
  case 'string':
    value = await redisClient.get(key);
    break;
  case 'set':
    value = await redisClient.sMembers(key);
    break;
  case 'hash':
    value = await redisClient.hGetAll(key);
    break;
  case 'list':
    value = await redisClient.lRange(key, 0, -1);
    break;
  case 'zset':
    value = await redisClient.zRange(key, 0, -1, { WITHSCORES: true });
    break;
}
```

### Server Overview

```javascript
const info = await redisClient.info();
const dbSize = await redisClient.dbSize();
const memory = await redisClient.memoryUsage('key');
```

---

## Health Checks

**File:** `backend/controller/db.controller.js`

Redis connection status is reported in the admin dashboard health check.

```javascript
export const getHealthStatus = async (req, res) => {
  const redisStatus = redisClient.isReady ? 'connected' : 'disconnected';
  
  res.json({
    database: dbStatus,
    redis: redisStatus,
    // ...
  });
};
```

---

## Key Patterns Reference

| Pattern | Type | TTL | Module |
|---------|------|-----|--------|
| `login:lock:<email>` | String | 10 min | auth.controller |
| `login:attempts:<email>` | String | 10 min | auth.controller |
| `password_reset:<token>` | String | 15 min | auth.controller |
| `user:<id>:favorites` | Set | None | competitions.controller |
| `user:<id>:push_subs` | Set | None | push.js |
| `push:endpoints` | Hash | None | push.js |
| `reminder:sent:<regId>` | String | 48 hours | scheduler.js |

---

## Commands Reference

| Command | Usage |
|---------|-------|
| `GET` | Retrieve string value |
| `SET` | Store string with optional expiry |
| `DEL` | Delete key |
| `INCR` | Increment counter |
| `EXPIRE` | Set TTL on existing key |
| `SADD` | Add to set |
| `SREM` | Remove from set |
| `SMEMBERS` | Get all set members |
| `HSET` | Set hash field |
| `HGET` | Get hash field |
| `HGETALL` | Get all hash fields |
| `HDEL` | Delete hash field |
| `TYPE` | Get key type |
| `TTL` | Get remaining TTL |
| `SCAN` | Iterate keys (non-blocking) |
| `INFO` | Server statistics |
| `DBSIZE` | Total key count |

---

## Future Considerations

### Rate Limiting

The current rate limiter in `backend/middleware/rateLimit.middleware.js` uses an in-memory store. For production horizontal scaling with multiple server instances, it should be migrated to use Redis:

```javascript
import RedisStore from 'rate-limit-redis';

const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

### Session Storage

Currently sessions are stored in MySQL. For better performance, consider Redis session storage:

```javascript
import RedisStore from 'connect-redis';

app.use(session({
  store: new RedisStore({ client: redisClient }),
  // ...
}));
```

---

## Troubleshooting

### Connection Issues

```bash
# Check if Redis container is running
docker-compose ps

# Test connection
redis-cli ping
# Expected: PONG

# Check Redis logs
docker logs robeurope-redis
```

### Memory Usage

```bash
# Check memory usage
redis-cli INFO memory

# List all keys
redis-cli KEYS "*"

# Check specific key TTL
redis-cli TTL "login:lock:user@example.com"
```

### Clear All Data

```bash
# WARNING: Deletes all keys
redis-cli FLUSHALL
```
