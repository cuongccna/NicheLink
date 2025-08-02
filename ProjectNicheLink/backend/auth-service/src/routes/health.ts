import { Router } from 'express';
import { checkDatabaseConnection } from '../config/database';
import { getCacheClient } from '../config/cache';
import { logger } from '../utils/logger';

const router = Router();

// Basic health check
router.get('/', async (req, res) => {
  try {
    const dbStatus = await checkDatabaseConnection();
    let cacheStatus = false;
    
    try {
      const cacheClient = getCacheClient();
      // Test cache by setting and getting a test value
      await cacheClient.set('health_check', 'test', 5);
      const testValue = await cacheClient.get('health_check');
      cacheStatus = testValue === 'test';
      await cacheClient.delete('health_check');
    } catch (error) {
      logger.warn('Cache health check failed:', error);
    }

    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'auth-service',
      version: '1.0.0',
      checks: {
        database: dbStatus ? 'healthy' : 'unhealthy',
        cache: cacheStatus ? 'healthy' : 'unhealthy',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
          unit: 'MB'
        }
      }
    };

    const statusCode = dbStatus && cacheStatus ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      message: 'Service unavailable'
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Database connectivity test
    const dbStartTime = Date.now();
    const dbStatus = await checkDatabaseConnection();
    const dbResponseTime = Date.now() - dbStartTime;

    // Cache connectivity test
    let cacheStatus = false;
    let cacheResponseTime = 0;
    try {
      const cacheStartTime = Date.now();
      const cacheClient = getCacheClient();
      // Test cache with a simple set/get operation
      await cacheClient.set('health_check', 'ok', 1); // 1 second expiration
      const testValue = await cacheClient.get('health_check');
      await cacheClient.delete('health_check');
      cacheResponseTime = Date.now() - cacheStartTime;
      cacheStatus = testValue === 'ok';
    } catch (error) {
      logger.warn('Cache detailed check failed:', error);
    }

    const totalResponseTime = Date.now() - startTime;

    const health = {
      status: dbStatus && cacheStatus ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: {
        name: 'auth-service',
        version: '1.0.0',
        uptime: process.uptime(),
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version
      },
      checks: {
        database: {
          status: dbStatus ? 'healthy' : 'unhealthy',
          responseTime: `${dbResponseTime}ms`
        },
        cache: {
          status: cacheStatus ? 'healthy' : 'unhealthy',
          responseTime: `${cacheResponseTime}ms`
        }
      },
      performance: {
        totalResponseTime: `${totalResponseTime}ms`,
        memory: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100,
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
          external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100,
          unit: 'MB'
        },
        cpu: {
          loadAverage: process.platform !== 'win32' ? require('os').loadavg() : 'N/A (Windows)'
        }
      }
    };

    const statusCode = dbStatus && cacheStatus ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;
