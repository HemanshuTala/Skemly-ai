import { Request, Response, NextFunction } from 'express';
import { getRedis, isRedisAvailable } from '../config/redis';
import logger from '../utils/logger';

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only apply idempotency to mutating requests (POST, PUT, DELETE, PATCH)
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  const key = req.headers['idempotency-key'] as string;
  if (!key) {
    return next();
  }

  if (!isRedisAvailable()) {
    logger.warn(`Redis is unavailable, skipping idempotency check for key: ${key}`);
    return next();
  }

  const redis = getRedis();
  const token = req.headers['authorization'] || 'anon';
  const redisKey = `idempotency:${token}:${key}`;

  try {
    const cached = await redis.get(redisKey);

    if (cached) {
      if (cached === 'processing') {
        return res.status(409).json({
          error: {
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'A request with the same idempotency key is currently being processed.',
            retryable: true,
          },
        });
      }

      const response = JSON.parse(cached);
      logger.info(`Idempotency key hit: ${key}. Returning cached response.`);

      // Set cached headers
      if (response.headers) {
        Object.entries(response.headers).forEach(([name, val]) => {
          if (val !== undefined) {
            res.setHeader(name, val as any);
          }
        });
      }
      res.setHeader('X-Cache-Lookup', 'HIT - Idempotent');
      return res.status(response.statusCode).send(response.body);
    }

    // Lock the key (expire in 60s to prevent deadlocks)
    const acquired = await redis.set(redisKey, 'processing', 'PX', 60000, 'NX');
    if (!acquired) {
      return res.status(409).json({
        error: {
          code: 'IDEMPOTENCY_CONFLICT',
          message: 'A request with the same idempotency key is currently being processed.',
          retryable: true,
        },
      });
    }

    // Intercept send to cache response payload
    const originalSend = res.send;
    res.send = function (body: any): Response {
      res.send = originalSend;

      if (res.statusCode < 500) {
        const payload = {
          statusCode: res.statusCode,
          headers: res.getHeaders(),
          body: typeof body === 'object' ? JSON.stringify(body) : body,
        };

        // Cache response for 24 hours
        redis.set(redisKey, JSON.stringify(payload), 'EX', 86400).catch((err) => {
          logger.error(`Failed to store response in Redis for idempotency key: ${key}`, err);
        });
      } else {
        // Clear lock on server error to allow retries
        redis.del(redisKey).catch((err) => {
          logger.error(`Failed to delete lock key on 5xx error for: ${key}`, err);
        });
      }

      return originalSend.call(this, body);
    };

    next();
  } catch (err) {
    logger.error(`Idempotency middleware error for key ${key}:`, err);
    next();
  }
}
