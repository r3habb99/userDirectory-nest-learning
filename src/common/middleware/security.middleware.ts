import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Security Middleware
 * Implements various security measures for the application
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Set security headers
    this.setSecurityHeaders(res);

    // Log request for audit
    this.logRequest(req);

    // Sanitize request
    this.sanitizeRequest(req);

    next();
  }

  private setSecurityHeaders(res: Response): void {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Strict transport security (HTTPS only)
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );

    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    );

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Remove server information
    res.removeHeader('X-Powered-By');
  }

  private logRequest(req: Request): void {
    const { method, url, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'Unknown';

    this.logger.log(`${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`);
  }

  private sanitizeRequest(req: Request): void {
    // Basic input sanitization
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }

    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return obj
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  }
}

/**
 * Rate Limiting Service
 */
@Injectable()
export class RateLimitService {
  private readonly requests = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private readonly logger = new Logger(RateLimitService.name);

  /**
   * Check if request is within rate limit
   */
  isWithinLimit(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 15 * 60 * 1000, // 15 minutes
  ): boolean {
    const now = Date.now();
    const requestData = this.requests.get(identifier);

    if (!requestData || now > requestData.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (requestData.count >= maxRequests) {
      this.logger.warn(`Rate limit exceeded for identifier: ${identifier}`);
      return false;
    }

    // Increment count
    requestData.count++;
    this.requests.set(identifier, requestData);
    return true;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemainingRequests(identifier: string, maxRequests: number = 100): number {
    const requestData = this.requests.get(identifier);
    if (!requestData || Date.now() > requestData.resetTime) {
      return maxRequests;
    }
    return Math.max(0, maxRequests - requestData.count);
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

/**
 * Audit Log Service
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  /**
   * Log user action
   */
  logAction(
    userId: string,
    action: string,
    resource: string,
    details?: any,
    ip?: string,
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      resource,
      details,
      ip,
    };

    this.logger.log(`AUDIT: ${JSON.stringify(logEntry)}`);

    // In production, you might want to store this in a separate audit database
    // or send to a logging service like ELK stack
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: any,
    ip?: string,
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      severity,
      details,
      ip,
    };

    this.logger.warn(`SECURITY: ${JSON.stringify(logEntry)}`);
  }
}

/**
 * Input Sanitization Service
 */
@Injectable()
export class SanitizationService {
  /**
   * Sanitize HTML content
   */
  sanitizeHtml(input: string): string {
    if (!input) return '';

    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  /**
   * Sanitize SQL input (basic protection)
   */
  sanitizeSql(input: string): string {
    if (!input) return '';

    const sqlKeywords = [
      'SELECT',
      'INSERT',
      'UPDATE',
      'DELETE',
      'DROP',
      'CREATE',
      'ALTER',
      'EXEC',
      'EXECUTE',
      'UNION',
      'SCRIPT',
      '--',
      ';',
    ];

    let sanitized = input;
    sqlKeywords.forEach((keyword) => {
      const regex = new RegExp(keyword, 'gi');
      sanitized = sanitized.replace(regex, '');
    });

    return sanitized.trim();
  }

  /**
   * Sanitize file name
   */
  sanitizeFileName(fileName: string): string {
    if (!fileName) return '';

    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  /**
   * Validate and sanitize email
   */
  sanitizeEmail(email: string): string {
    if (!email) return '';

    return email.toLowerCase().trim().replace(/[<>]/g, '');
  }
}
