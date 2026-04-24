import Redis from 'ioredis';
import logger from '../utils/logger';

let client: Redis;

export async function connectRedis(): Promise<void> {
  client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  await client.connect();
  logger.info('✅ Redis connected');

  client.on('error', (err) => logger.error('Redis error:', err));
}

export function getRedis(): Redis {
  if (!client) throw new Error('Redis not connected');
  return client;
}
