import Redis from 'ioredis';
import logger from '../utils/logger';

let client: Redis | null = null;
let isConnected = false;

export async function connectRedis(): Promise<void> {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  // Hide sensitive credentials in logging
  const safeUrl = url.replace(/redis:\/\/([^:]+):([^@]+)@/, 'redis://$1:***@');
  logger.info(`Connecting to Redis at: ${safeUrl}`);

  client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 5) {
        logger.warn('Redis reconnection failed after 5 attempts. Disabling Redis operations.');
        return null; // Stop retrying
      }
      return Math.min(times * 200, 3000);
    },
  });

  try {
    await client.connect();
    isConnected = true;
    logger.info('✅ Redis connected successfully');
  } catch (err: any) {
    logger.error('⚠️  Failed to connect to Redis on startup. Running in fallback mode without caching.', err);
    isConnected = false;
  }

  client.on('error', (err) => {
    logger.error('Redis connection error:', err);
  });

  client.on('connect', () => {
    isConnected = true;
    logger.info('Redis connection established');
  });
}

export function getRedis(): Redis {
  if (!client) {
    throw new Error('Redis client not initialized');
  }
  return client;
}

export function isRedisAvailable(): boolean {
  return isConnected;
}
