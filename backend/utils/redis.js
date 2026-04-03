import { createClient } from 'redis';
import logger from './logger.js';

/**
 * @fileoverview
 * Shared Redis client — compatible with Upstash (rediss://) and local Redis (redis://).
 *
 * Set REDIS_URL to your Upstash connection string (rediss://...) for free-tier hosting.
 * Falls back to redis://localhost:6379 for local dev.
 */

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
  socket: {
    // Upstash requires TLS; the rediss:// scheme enables it automatically.
    // Reconnect strategy: exponential backoff capped at 10s.
    reconnectStrategy: (retries) => Math.min(retries * 100, 10000),
  },
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

try {
  await redisClient.connect();
} catch (err) {
  logger.error(
    'Redis connection failed — rate-limit dedup, scheduler dedup, etc. will be unavailable.',
    err
  );
}

export default redisClient;
