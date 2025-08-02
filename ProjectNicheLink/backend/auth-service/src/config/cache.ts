import fs from 'fs/promises';
import path from 'path';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

class FileCache {
  private cacheDir: string;

  constructor(cacheDir: string = './cache') {
    this.cacheDir = cacheDir;
    this.ensureCacheDir();
  }

  private async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create cache directory:', error);
    }
  }

  private getCacheFilePath(key: string): string {
    // Replace invalid filename characters
    const safeKey = key.replace(/[^\w-]/g, '_');
    return path.join(this.cacheDir, `${safeKey}.json`);
  }

  async set(key: string, value: any, expiration?: number): Promise<void> {
    try {
      const cacheData = {
        value,
        expiration: expiration ? Date.now() + (expiration * 1000) : null,
        createdAt: Date.now()
      };

      const filePath = this.getCacheFilePath(key);
      await fs.writeFile(filePath, JSON.stringify(cacheData));
    } catch (error) {
      logger.error('Failed to set cache:', error);
    }
  }

  async get(key: string): Promise<any> {
    try {
      const filePath = this.getCacheFilePath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      const cacheData = JSON.parse(data);

      // Check expiration
      if (cacheData.expiration && Date.now() > cacheData.expiration) {
        await this.delete(key);
        return null;
      }

      return cacheData.value;
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        logger.error('Failed to get cache:', error);
      }
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = this.getCacheFilePath(key);
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        logger.error('Failed to delete cache:', error);
      }
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map(file => 
          fs.unlink(path.join(this.cacheDir, file)).catch(() => {})
        )
      );
    } catch (error) {
      logger.error('Failed to clear cache:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = Date.now();

      for (const file of files) {
        try {
          const filePath = path.join(this.cacheDir, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const cacheData = JSON.parse(data);

          if (cacheData.expiration && now > cacheData.expiration) {
            await fs.unlink(filePath);
          }
        } catch (error) {
          // Skip invalid files
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup cache:', error);
    }
  }
}

let cacheInstance: FileCache;

export const connectCache = async () => {
  try {
    const cacheDir = process.env.CACHE_DIR || './cache';
    cacheInstance = new FileCache(cacheDir);
    
    // Run cleanup on startup
    await cacheInstance.cleanup();
    
    // Schedule periodic cleanup (every hour)
    setInterval(() => {
      cacheInstance.cleanup();
    }, 60 * 60 * 1000);

    logger.info('File-based cache initialized');
    return cacheInstance;
  } catch (error) {
    logger.error('Failed to initialize cache:', error);
    throw error;
  }
};

export const getCacheClient = () => {
  if (!cacheInstance) {
    throw new Error('Cache not initialized. Call connectCache() first.');
  }
  return cacheInstance;
};

export const disconnectCache = async () => {
  if (cacheInstance) {
    logger.info('File-based cache disconnected');
  }
};

// Cache utilities
export const setCache = async (key: string, value: any, expiration?: number) => {
  try {
    const client = getCacheClient();
    await client.set(key, value, expiration);
  } catch (error) {
    logger.error('Failed to set cache:', error);
  }
};

export const getCache = async (key: string) => {
  try {
    const client = getCacheClient();
    return await client.get(key);
  } catch (error) {
    logger.error('Failed to get cache:', error);
    return null;
  }
};

export const deleteCache = async (key: string) => {
  try {
    const client = getCacheClient();
    await client.delete(key);
  } catch (error) {
    logger.error('Failed to delete cache:', error);
  }
};

export const deleteCachePattern = async (pattern: string) => {
  try {
    const client = getCacheClient();
    // For file-based cache, we'll implement a simple pattern matching
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      const cacheDir = (client as any).cacheDir;
      const files = await fs.readdir(cacheDir);
      
      for (const file of files) {
        if (file.startsWith(prefix.replace(/[^\w-]/g, '_'))) {
          await fs.unlink(path.join(cacheDir, file));
        }
      }
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
