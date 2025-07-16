import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { API_CONFIG } from '../config/api.config';

/**
 * API Version Middleware
 * Handles API versioning through headers and URL prefixes
 */
@Injectable()
export class ApiVersionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Set API version header if not present
    if (!req.headers[API_CONFIG.VERSION_HEADER.toLowerCase()]) {
      req.headers[API_CONFIG.VERSION_HEADER.toLowerCase()] = API_CONFIG.VERSION;
    }

    // Add version to response headers
    res.setHeader(API_CONFIG.VERSION_HEADER, API_CONFIG.VERSION);
    res.setHeader('X-API-Supported-Versions', 'v1');

    // Add CORS headers for API versioning
    res.setHeader('Access-Control-Expose-Headers', [
      API_CONFIG.VERSION_HEADER,
      'X-API-Supported-Versions',
      'X-Request-ID',
      'X-Response-Time',
    ].join(', '));

    next();
  }
}

/**
 * Request ID Middleware
 * Adds unique request ID for tracking
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] as string || 
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to request for logging
    (req as any).requestId = requestId;
    
    // Add to response headers
    res.setHeader('X-Request-ID', requestId);
    
    next();
  }
}

/**
 * Response Time Middleware
 * Tracks and adds response time header
 */
@Injectable()
export class ResponseTimeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${responseTime}ms`);
    });
    
    next();
  }
}
