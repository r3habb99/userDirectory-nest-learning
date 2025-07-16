import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PerformanceMonitorService } from '../services/performance-monitor.service';

/**
 * Performance Monitoring Middleware
 * Tracks request performance metrics and response times
 */
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);

  constructor(
    private readonly performanceMonitor: PerformanceMonitorService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const requestId = (req as any).requestId || `req_${Date.now()}`;

    // Add performance tracking to request
    (req as any).startTime = startTime;
    (req as any).performanceMetrics = {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    };

    // Track response completion
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const success = res.statusCode < 400;

      // Record performance metrics
      this.performanceMonitor.recordRequest(duration, success);

      // Log slow requests
      if (duration > 1000) {
        this.logger.warn(
          `Slow request detected: ${req.method} ${req.url} - ${duration}ms (${res.statusCode})`,
        );
      }

      // Log request details in debug mode
      if (process.env.NODE_ENV === 'development' && duration > 100) {
        this.logger.debug(
          `Request: ${req.method} ${req.url} - ${duration}ms (${res.statusCode})`,
        );
      }

      // Add performance headers
      res.setHeader('X-Response-Time', `${duration}ms`);
      res.setHeader('X-Request-ID', requestId);
    });

    next();
  }
}

/**
 * Database Query Performance Middleware
 * Integrates with Prisma to track query performance
 */
@Injectable()
export class DatabasePerformanceMiddleware {
  private readonly logger = new Logger(DatabasePerformanceMiddleware.name);

  constructor(
    private readonly performanceMonitor: PerformanceMonitorService,
  ) {}

  /**
   * Create Prisma middleware for query performance tracking
   */
  createPrismaMiddleware() {
    return async (params: any, next: any) => {
      const startTime = Date.now();
      
      try {
        const result = await next(params);
        const duration = Date.now() - startTime;

        // Record query performance
        this.performanceMonitor.recordQuery(duration);

        // Log slow queries
        if (duration > 1000) {
          this.logger.warn(
            `Slow query detected: ${params.model}.${params.action} - ${duration}ms`,
          );
        }

        // Log query details in debug mode
        if (process.env.NODE_ENV === 'development' && duration > 100) {
          this.logger.debug(
            `Query: ${params.model}.${params.action} - ${duration}ms`,
          );
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.performanceMonitor.recordQuery(duration);
        
        this.logger.error(
          `Query failed: ${params.model}.${params.action} - ${duration}ms`,
          error,
        );
        
        throw error;
      }
    };
  }
}

/**
 * Cache Performance Middleware
 * Tracks cache hit/miss rates and performance
 */
@Injectable()
export class CachePerformanceMiddleware {
  private readonly logger = new Logger(CachePerformanceMiddleware.name);

  constructor(
    private readonly performanceMonitor: PerformanceMonitorService,
  ) {}

  /**
   * Wrap cache operations with performance tracking
   */
  wrapCacheOperation<T>(
    operation: () => Promise<T>,
    operationType: 'get' | 'set' | 'delete',
    key: string,
  ): Promise<T> {
    const startTime = Date.now();

    return operation()
      .then((result) => {
        const duration = Date.now() - startTime;

        // Record cache metrics based on operation type
        if (operationType === 'get') {
          if (result !== null && result !== undefined) {
            this.performanceMonitor.recordCacheHit();
          } else {
            this.performanceMonitor.recordCacheMiss();
          }
        }

        // Log slow cache operations
        if (duration > 100) {
          this.logger.warn(
            `Slow cache operation: ${operationType} ${key} - ${duration}ms`,
          );
        }

        return result;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          `Cache operation failed: ${operationType} ${key} - ${duration}ms`,
          error,
        );
        throw error;
      });
  }
}

/**
 * Memory Usage Monitoring Middleware
 * Tracks memory usage and triggers garbage collection if needed
 */
@Injectable()
export class MemoryMonitoringMiddleware implements NestMiddleware {
  private readonly logger = new Logger(MemoryMonitoringMiddleware.name);
  private lastGCTime = 0;
  private readonly gcThreshold = 500 * 1024 * 1024; // 500MB
  private readonly gcCooldown = 60000; // 1 minute

  use(req: Request, res: Response, next: NextFunction) {
    // Check memory usage periodically
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / (1024 * 1024);

    // Log memory usage for high-memory requests
    if (heapUsedMB > 200) {
      this.logger.debug(
        `High memory usage: ${heapUsedMB.toFixed(2)}MB heap used`,
      );
    }

    // Trigger garbage collection if memory usage is high
    if (
      memUsage.heapUsed > this.gcThreshold &&
      Date.now() - this.lastGCTime > this.gcCooldown
    ) {
      this.triggerGarbageCollection();
      this.lastGCTime = Date.now();
    }

    next();
  }

  private triggerGarbageCollection() {
    try {
      if (global.gc) {
        global.gc();
        this.logger.debug('Garbage collection triggered');
      }
    } catch (error) {
      this.logger.warn('Failed to trigger garbage collection', error);
    }
  }
}

/**
 * Request Size Monitoring Middleware
 * Monitors request payload sizes and warns about large requests
 */
@Injectable()
export class RequestSizeMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestSizeMiddleware.name);
  private readonly maxRequestSize = 10 * 1024 * 1024; // 10MB
  private readonly warnRequestSize = 5 * 1024 * 1024; // 5MB

  use(req: Request, res: Response, next: NextFunction) {
    const contentLength = parseInt(req.get('content-length') || '0', 10);

    if (contentLength > this.maxRequestSize) {
      this.logger.error(
        `Request too large: ${(contentLength / (1024 * 1024)).toFixed(2)}MB from ${req.ip}`,
      );
      return res.status(413).json({
        success: false,
        message: 'Request entity too large',
        error: 'PAYLOAD_TOO_LARGE',
        statusCode: 413,
      });
    }

    if (contentLength > this.warnRequestSize) {
      this.logger.warn(
        `Large request detected: ${(contentLength / (1024 * 1024)).toFixed(2)}MB from ${req.ip}`,
      );
    }

    next();
  }
}

/**
 * API Rate Limiting with Performance Tracking
 */
@Injectable()
export class PerformanceRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceRateLimitMiddleware.name);
  private readonly requestCounts = new Map<string, { count: number; resetTime: number }>();
  private readonly windowMs = 60000; // 1 minute
  private readonly maxRequests = 100;

  use(req: Request, res: Response, next: NextFunction) {
    const clientId = req.ip;
    const now = Date.now();
    
    // Clean up expired entries
    this.cleanupExpiredEntries(now);
    
    // Get or create client entry
    let clientData = this.requestCounts.get(clientId);
    if (!clientData || now > clientData.resetTime) {
      clientData = { count: 0, resetTime: now + this.windowMs };
      this.requestCounts.set(clientId, clientData);
    }
    
    clientData.count++;
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - clientData.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(clientData.resetTime / 1000));
    
    // Check if rate limit exceeded
    if (clientData.count > this.maxRequests) {
      this.logger.warn(`Rate limit exceeded for ${clientId}: ${clientData.count} requests`);
      
      return res.status(429).json({
        success: false,
        message: 'Too many requests',
        error: 'RATE_LIMIT_EXCEEDED',
        statusCode: 429,
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
    }
    
    next();
  }
  
  private cleanupExpiredEntries(now: number) {
    for (const [clientId, data] of this.requestCounts.entries()) {
      if (now > data.resetTime) {
        this.requestCounts.delete(clientId);
      }
    }
  }
}
