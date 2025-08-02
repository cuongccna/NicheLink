import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

// Custom token for user ID
morgan.token('user', (req: any) => {
  return req.user ? req.user.id : 'anonymous';
});

// Custom token for request body (limited)
morgan.token('body', (req: any) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const body = { ...req.body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'cardNumber', 'cvv', 'pin'];
    sensitiveFields.forEach(field => {
      if (body[field]) {
        body[field] = '[REDACTED]';
      }
    });
    
    // Limit size
    const bodyString = JSON.stringify(body);
    return bodyString.length > 500 ? bodyString.substring(0, 500) + '...' : bodyString;
  }
  return '';
});

// Request logging format
const logFormat = process.env.NODE_ENV === 'production'
  ? ':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'
  : ':method :url :status :response-time ms - :user - :body';

export const requestLogger = morgan(logFormat, {
  stream: {
    write: (message: string) => {
      // Use console.log in development, proper logger in production
      if (process.env.NODE_ENV === 'production') {
        // Here you would typically use a proper logger like Winston
        console.log(message.trim());
      } else {
        console.log(`📝 ${message.trim()}`);
      }
    }
  },
  skip: (req: Request) => {
    // Skip logging for health checks and static assets
    return req.url === '/health' || req.url.startsWith('/static');
  }
});

export const apiLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    };
    
    if (res.statusCode >= 400) {
      console.error('🔴 API Error:', logData);
    } else {
      console.log('✅ API Success:', logData);
    }
  });
  
  next();
};
