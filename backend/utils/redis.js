import { createClient } from 'redis';
import logger from './logger.js';

/**
 * @fileoverview
 * Shared Redis client.
 *
 * Used for throttling, tokens, and other ephemeral data.
 * Connection URL is read from `REDIS_URL`.
 */

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

try {
  await redisClient.connect();
} catch (err) {
  logger.error('Redis connection failed — the server will start but features that depend on Redis (rate-limit dedup, scheduler dedup, etc.) will be unavailable.', err);
}

/**
 * Connected Redis client instance.
 * @type {object}
 */
export default redisClient;
