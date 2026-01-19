# Logs — Configuration and Usage

This document describes the central logger configuration in `backend/utils/logger.js`.

Overview
- Library: `winston` with `winston-daily-rotate-file` for daily rotation.
- Formats: timestamps + JSON for files, colored/simple console output.
- Transports:
  - `access-<DATE>.log` (`info` level), retained `14d`.
  - `error-<DATE>.log` (`error` level), retained `30d`.
  - `Console` (`debug` level) for development/interactive output.
- Exception handling: `exceptions-<DATE>.log` file.

Locations and file names
- Base log folder: `logs` (resolved via `path.resolve('logs')`).
- Names: `access-YYYY-MM-DD.log`, `error-YYYY-MM-DD.log`, `exceptions-YYYY-MM-DD.log`.

Format and levels
- The main logger uses JSON with `timestamp` for files (useful for ingestion/log-reading systems).
- Console output uses a readable format (colors + plain text) and shows messages at `debug` or higher.
- Default level is set to `info`; the console transport emits `debug`.

How to use the logger in code
1. Import the shared instance:

```js
import logger from '../utils/logger.js';

logger.info('Server started on port 3000');
logger.error('Error processing request', { err });
logger.debug('Input values', { body });
```

Operational considerations
- Ensure the `logs` folder exists and is writable by the Node.js process.
- When running in containers, mount a volume or route the logs to `stdout`/`stderr` as needed (console already emits visible logs).
- Retention: old files are deleted automatically according to `maxFiles` (`14d` / `30d`). Adjust in `logger.js` if necessary.

Customization
- Change the log folder: modify `const logDir = path.resolve('logs')`.
- Adjust levels/global config: tweak `level` in `createLogger` or parameterize via `process.env.LOG_LEVEL`.
- Add transports (e.g., Elasticsearch, syslog): follow the `transports: [...]` pattern and keep the same `format`.

Errors and exceptions
- Uncaught exceptions are logged to `exceptions-<DATE>.log` through `exceptionHandlers`.
- To capture rejected promises globally, add an `unhandledRejection` handler that calls `logger.error` and exits when appropriate.

Where to look first
- `backend/utils/logger.js` — full implementation and defaults.

If you want, I can extend this document with rotation examples, environment-specific config, or integration with a collector (ELK/Datadog). Just let me know.
