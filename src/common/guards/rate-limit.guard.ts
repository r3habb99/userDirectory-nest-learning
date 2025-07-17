import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

interface SocketWithAddress {
  remoteAddress?: string;
}

/**
 * Rate Limiting Guard
 * Implements rate limiting to prevent abuse and DDoS attacks
 */

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly store: RateLimitStore = {};
  private readonly defaultOptions: RateLimitOptions;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.defaultOptions = {
      windowMs: this.configService.get<number>(
        'RATE_LIMIT_WINDOW_MS',
        10 * 60 * 1000,
      ), // 10 minutes
      max: this.configService.get<number>('RATE_LIMIT_MAX', 100),
      message: 'Too many requests from this IP, please try again later',
    };

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Get rate limit options from decorator or use defaults
    const options = this.getRateLimitOptions(context);

    // Skip rate limiting for certain conditions
    if (this.shouldSkip(request)) {
      return true;
    }

    const key = this.generateKey(request);
    const now = Date.now();

    // Get or create rate limit entry
    let entry = this.store[key];
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + options.windowMs,
      };
      this.store[key] = entry;
    }

    // Increment counter
    entry.count++;

    // Check if limit exceeded
    if (entry.count > options.max) {
      this.logger.warn(
        `Rate limit exceeded for ${this.getClientInfo(request)}. ` +
          `${entry.count}/${options.max} requests in window`,
      );

      throw new HttpException(
        {
          success: false,
          message: options.message,
          error: 'RATE_LIMIT_EXCEEDED',
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          details: {
            limit: options.max,
            windowMs: options.windowMs,
            retryAfter: Math.ceil((entry.resetTime - now) / 1000),
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add rate limit headers
    this.addRateLimitHeaders(request, entry, options);

    return true;
  }

  private getRateLimitOptions(context: ExecutionContext): RateLimitOptions {
    const customOptions = this.reflector.get<Partial<RateLimitOptions>>(
      'rateLimit',
      context.getHandler(),
    );

    return { ...this.defaultOptions, ...customOptions };
  }

  private shouldSkip(request: Request): boolean {
    // Skip for localhost in development
    if (
      process.env.NODE_ENV === 'development' &&
      (request.ip === '127.0.0.1' || request.ip === '::1')
    ) {
      return true;
    }

    // Skip for health check endpoints
    if (request.path === '/health' || request.path === '/') {
      return true;
    }

    return false;
  }

  private generateKey(request: Request): string {
    // Use IP address and user agent for more specific rate limiting
    const ip = this.getClientIp(request);
    const userAgent = request.get('User-Agent') || 'unknown';
    const endpoint = `${request.method}:${request.path}`;

    return `${ip}:${this.hashString(userAgent)}:${endpoint}`;
  }

  private getClientIp(request: Request): string {
    const socket = request.socket as SocketWithAddress;
    const socketAddress = socket?.remoteAddress;
    return (
      request.ip ||
      (typeof socketAddress === 'string' ? socketAddress : 'unknown')
    );
  }

  private getClientInfo(request: Request): string {
    const ip = this.getClientIp(request);
    const userAgent = request.get('User-Agent') || 'unknown';
    return `IP: ${ip}, User-Agent: ${userAgent.substring(0, 50)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private addRateLimitHeaders(
    request: Request,
    entry: { count: number; resetTime: number },
    options: RateLimitOptions,
  ): void {
    const response = request.res;
    if (response) {
      response.setHeader('X-RateLimit-Limit', options.max);
      response.setHeader(
        'X-RateLimit-Remaining',
        Math.max(0, options.max - entry.count),
      );
      response.setHeader(
        'X-RateLimit-Reset',
        Math.ceil(entry.resetTime / 1000),
      );
      response.setHeader(
        'X-RateLimit-Window',
        Math.ceil(options.windowMs / 1000),
      );
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of Object.entries(this.store)) {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => delete this.store[key]);

    if (keysToDelete.length > 0) {
      this.logger.debug(
        `Cleaned up ${keysToDelete.length} expired rate limit entries`,
      );
    }
  }

  /**
   * Get current rate limit status for debugging
   */
  getRateLimitStatus(): {
    totalEntries: number;
    activeEntries: number;
    memoryUsage: string;
  } {
    const now = Date.now();
    const activeEntries = Object.values(this.store).filter(
      (entry) => now <= entry.resetTime,
    ).length;

    return {
      totalEntries: Object.keys(this.store).length,
      activeEntries,
      memoryUsage: `${Math.round(JSON.stringify(this.store).length / 1024)}KB`,
    };
  }
}

// Decorator for setting custom rate limit options
export const RateLimit = (options: Partial<RateLimitOptions>) => {
  return (
    target: any,
    _propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      Reflect.defineMetadata('rateLimit', options, descriptor.value as object);
    } else {
      Reflect.defineMetadata('rateLimit', options, target as object);
    }
  };
};

// Predefined rate limit configurations
export const RateLimitConfigs = {
  // Strict rate limiting for authentication endpoints
  AUTH: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 requests per 15 minutes

  // Moderate rate limiting for API endpoints
  API: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes

  // Lenient rate limiting for read operations
  READ: { windowMs: 15 * 60 * 1000, max: 1000 }, // 1000 requests per 15 minutes

  // Very strict for password reset
  PASSWORD_RESET: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 requests per hour

  // File upload rate limiting
  UPLOAD: { windowMs: 60 * 60 * 1000, max: 50 }, // 50 uploads per hour
};
