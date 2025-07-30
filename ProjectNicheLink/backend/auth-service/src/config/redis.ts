import Redis from 'redis';
import { logger } from '@/utils/logger';

let redisClient: Redis.RedisClientType;

export const connectRedis = async () => {
  try {
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redisClient.on('ready', () => {
      logger.info('Redis is ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis connection ended');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

export const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Disconnected from Redis');
  }
};

// Cache utilities
export const setCache = async (key: string, value: any, expiration?: number) => {
  try {
    const client = getRedisClient();
    const serializedValue = JSON.stringify(value);
    
    if (expiration) {
      await client.setEx(key, expiration, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }
  } catch (error) {
    logger.error('Failed to set cache:', error);
  }
};

export const getCache = async (key: string) => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Failed to get cache:', error);
    return null;
  }
};

export const deleteCache = async (key: string) => {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    logger.error('Failed to delete cache:', error);
  }
};

export const deleteCachePattern = async (pattern: string) => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    logger.error('Failed to delete cache pattern:', error);
  }
};

// Session management
export const setSession = async (sessionId: string, data: any, expiration: number = 7 * 24 * 60 * 60) => {
  await setCache(`session:${sessionId}`, data, expiration);
};

export const getSession = async (sessionId: string) => {
  return await getCache(`session:${sessionId}`);
};

export const deleteSession = async (sessionId: string) => {
  await deleteCache(`session:${sessionId}`);
};

// User-specific cache
export const setUserCache = async (userId: string, key: string, value: any, expiration?: number) => {
  await setCache(`user:${userId}:${key}`, value, expiration);
};

export const getUserCache = async (userId: string, key: string) => {
  return await getCache(`user:${userId}:${key}`);
};

export const deleteUserCache = async (userId: string, key?: string) => {
  if (key) {
    await deleteCache(`user:${userId}:${key}`);
  } else {
    await deleteCachePattern(`user:${userId}:*`);
  }
};
