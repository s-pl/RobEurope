import { Redis } from '@upstash/redis';
import logger from './logger.js';

/**
 * @fileoverview
 * Upstash Redis client (HTTP-based, no persistent TCP connection).
 * Compatible with Vercel serverless — no connect() needed.
 *
 * Requires:
 *   UPSTASH_REDIS_REST_URL   — e.g. https://awake-swift-77830.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN — Upstash REST token
 */

let redisClient;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  logger.info('Upstash Redis client initialised');
} else {
  // Fallback no-op client for local dev without Redis
  logger.warn('UPSTASH_REDIS_REST_URL/TOKEN not set — Redis features disabled');
  const noop = async () => null;
  redisClient = new Proxy({}, { get: () => noop });
}

export default redisClient;
