# Logging and Log Rotation

> **A comprehensive guide to application logs in the RobEurope backend**

This document explains how application logs are produced, where they are written, and how log rotation works in the RobEurope backend.

---

##  Overview

The backend uses a robust logging stack:

- **Winston** — Core logging library
- **winston-daily-rotate-file** — Automatic daily log rotation
- **Morgan** — HTTP access logs integrated with Winston

###  Key Code Locations

| Component | Location |
|-----------|----------|
| Logger setup | [`backend/utils/logger.js`](../backend/utils/logger.js) |
| Morgan integration | [`backend/index.js`](../backend/index.js) → `app.use(morgan('combined', ...))` |
| Error handler | [`backend/index.js`](../backend/index.js) → Centralized error handler |
| Crash handlers | [`backend/index.js`](../backend/index.js) → `uncaughtException` & `unhandledRejection` |
| Request ID middleware | [`backend/middleware/requestId.middleware.js`](../backend/middleware/requestId.middleware.js) |

---

##  Log Files and Format

Logs are written to `backend/logs/` as **structured JSON**, one file per day. Console output during development shows colored text for readability.

### Rotated File Patterns

```
logs/
├── access-YYYY-MM-DD.log      # HTTP requests (14 days retention)
├── error-YYYY-MM-DD.log       # Application errors (30 days retention)
└── exceptions-YYYY-MM-DD.log  # Uncaught exceptions (daily rotation)
```

**Example log entry:**
```json
{
  "timestamp": "2024-12-04T10:30:45.123Z",
  "level": "info",
  "message": "User login successful",
  "requestId": "a1b2c3d4",
  "userId": 42
}
```

---

##  Log Sources

### 1️ Access Logs (HTTP Requests)

Morgan captures every HTTP request in Apache combined format:

```javascript
app.use(morgan('combined', { 
  stream: { write: msg => logger.info(msg.trim()) } 
}));
```

**Stored in:** `access-*.log`

### 2️ Application Logs

Use the shared logger throughout the codebase:

```javascript
logger.info({ socket: 'connected', id: socket.id });
logger.error({ message: err.message, stack: err.stack });
```

- **Info level** → `access-*.log`
- **Error level** → `error-*.log`

###  Centralized Error Handling

Express error handler logs structured details:

```javascript
logger.error({
  path: req.path,
  method: req.method,
  message: err.message,
  stack: err.stack
});
```

**Stored in:** `error-*.log`

###  Uncaught Errors and Rejections

Process-level handlers capture critical failures:

- `uncaughtException` — Logs error and exits gracefully
- `unhandledRejection` — Logs promise rejection and exits

⚠️ These signal serious issues; the app restarts in a clean state via your process manager.

###  Request Correlation

Every request gets a unique ID via middleware:

```javascript
logger.info({ 
  requestId: req.id, 
  route: req.originalUrl,
  // ... other context
});
```

Trace a single request across all log types using `X-Request-Id`.

---

## Rotation and Retention

Rotation is automatic via `winston-daily-rotate-file`:

| Log Type | Pattern | Retention |
|----------|---------|-----------|
| Access | `access-%DATE%.log` | 14 days |
| Error | `error-%DATE%.log` | 30 days |
| Exceptions | `exceptions-%DATE%.log` | Not configured |

### Customizing Retention

Edit `backend/utils/logger.js`:

```javascript
new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '60d' // Keep for 60 days
})
```

---

## Viewing Logs

### Linux/macOS

```bash
# Access log (today)
tail -f backend/logs/access-$(date +%F).log

# Error log (today)
tail -f backend/logs/error-$(date +%F).log

# Exceptions (today)
tail -f backend/logs/exceptions-$(date +%F).log
```

### Windows PowerShell

```powershell
Get-Content backend\logs\access-$(Get-Date -Format 'yyyy-MM-dd').log -Wait
Get-Content backend\logs\error-$(Get-Date -Format 'yyyy-MM-dd').log -Wait
```

---

## ⚙ Configuration

### Changing Log Levels

Edit `backend/utils/logger.js`:

```javascript
const logger = winston.createLogger({
  level: 'debug', // Change from 'info' to 'debug' for more verbosity
  // ...
});
```

### Customizing Formats

Modify the `format` property:

```javascript
format: winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)
```

---

##  Best Practices

| Practice | Description |
|----------|-------------|
| **Include context** | Always add `requestId`, `userId`, `entityId` for traceability |
| **Appropriate levels** | Use `error` for unexpected issues with stack traces; `warn` for anomalies; `info` for normal operations |
| **Protect PII** | Avoid logging personal information unless absolutely necessary |
| **Structured data** | Use JSON objects rather than string concatenation |
| **Regular cleanup** | Monitor disk usage; adjust retention as needed |

### Example Structured Log

```javascript
logger.info({
  event: 'order.created',
  requestId: req.id,
  userId: user.id,
  orderId: order.id,
  amount: order.total,
  timestamp: new Date().toISOString()
});
```

---

##  Troubleshooting

**Logs not rotating?**
- Check file permissions on `backend/logs/`
- Verify `winston-daily-rotate-file` is installed

**Disk space issues?**
- Reduce retention periods in `logger.js`
- Set up log compression or external archival

**Missing request IDs?**
- Ensure request ID middleware is mounted before routes
- Check `backend/index.js` for `app.use(requestId())`

---

##  Additional Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Morgan Documentation](https://github.com/expressjs/morgan)
- [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file)

---

