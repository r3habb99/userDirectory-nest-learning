import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * Security Headers Middleware
 * Adds security headers to protect against common web vulnerabilities
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Content Security Policy (CSP)
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for Swagger
      "style-src 'self' 'unsafe-inline'", // Allow inline styles for Swagger
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "child-src 'none'",
      "worker-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "manifest-src 'self'",
    ];

    // In development, allow more permissive CSP for development tools
    if (this.configService.get('NODE_ENV') === 'development') {
      cspDirectives.push(
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:*",
      );
      cspDirectives.push("connect-src 'self' localhost:* ws: wss:");
    }

    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

    // X-Content-Type-Options: Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options: Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // X-XSS-Protection: Enable XSS filtering
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer-Policy: Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions-Policy: Control browser features
    const permissionsPolicyDirectives = [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'battery=()',
      'camera=()',
      'cross-origin-isolated=()',
      'display-capture=()',
      'document-domain=()',
      'encrypted-media=()',
      'execution-while-not-rendered=()',
      'execution-while-out-of-viewport=()',
      'fullscreen=()',
      'geolocation=()',
      'gyroscope=()',
      'keyboard-map=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'navigation-override=()',
      'payment=()',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=()',
      'xr-spatial-tracking=()',
    ];

    res.setHeader('Permissions-Policy', permissionsPolicyDirectives.join(', '));

    // Strict-Transport-Security: Enforce HTTPS
    if (req.secure || req.get('X-Forwarded-Proto') === 'https') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    // X-Permitted-Cross-Domain-Policies: Restrict cross-domain policies
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Cross-Origin-Embedder-Policy: Control embedding of cross-origin resources
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    // Cross-Origin-Opener-Policy: Control cross-origin window interactions
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    // Cross-Origin-Resource-Policy: Control cross-origin resource sharing
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Remove server information
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // Cache-Control for sensitive endpoints
    if (this.isSensitiveEndpoint(req.path)) {
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, private',
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    // Add custom security headers for API responses
    res.setHeader(
      'X-API-Version',
      this.configService.get('API_VERSION', '1.0.0'),
    );
    res.setHeader('X-Request-ID', this.generateRequestId());

    next();
  }

  private isSensitiveEndpoint(path: string): boolean {
    const sensitivePatterns = [
      '/api/v1/auth',
      '/api/v1/admin',
      '/api/v1/students',
      '/api/v1/attendance',
    ];

    return sensitivePatterns.some((pattern) => path.startsWith(pattern));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * CORS Security Configuration
 */
export class CorsSecurityConfig {
  static getConfig(configService: ConfigService) {
    const allowedOrigins = configService
      .get<string>('CORS_ORIGINS', 'http://localhost:3001')
      .split(',')
      .map((origin) => origin.trim());

    return {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }

        // In development, allow localhost with any port
        if (
          configService.get('NODE_ENV') === 'development' &&
          origin.match(/^https?:\/\/localhost(:\d+)?$/)
        ) {
          return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-Request-ID',
      ],
      exposedHeaders: [
        'X-Total-Count',
        'X-Page',
        'X-Per-Page',
        'X-Request-ID',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
      ],
      maxAge: 86400, // 24 hours
    };
  }
}

/**
 * Security Validation Utilities
 */
export class SecurityValidationUtils {
  /**
   * Validate if request is from a trusted source
   */
  static isTrustedRequest(req: Request): boolean {
    const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
    const clientIP = req.ip || req.connection.remoteAddress;

    return trustedIPs.includes(clientIP || '');
  }

  /**
   * Check for suspicious request patterns
   */
  static isSuspiciousRequest(req: Request): boolean {
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /javascript:/i, // JavaScript injection
      /vbscript:/i, // VBScript injection
      /onload=/i, // Event handler injection
    ];

    const checkString = `${req.url} ${req.get('User-Agent')} ${JSON.stringify(req.body)}`;

    return suspiciousPatterns.some((pattern) => pattern.test(checkString));
  }

  /**
   * Validate file upload security
   */
  static validateFileUpload(file: Express.Multer.File): {
    isValid: boolean;
    reason?: string;
  } {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, reason: 'File too large' };
    }

    // Check for dangerous file types
    const dangerousTypes = [
      'application/x-executable',
      'application/x-msdownload',
      'application/x-msdos-program',
      'application/x-msi',
      'application/x-bat',
      'application/x-sh',
      'text/x-script',
    ];

    if (dangerousTypes.includes(file.mimetype)) {
      return { isValid: false, reason: 'Dangerous file type' };
    }

    // Check filename for suspicious patterns
    const suspiciousFilenamePatterns = [
      /\.\./,
      /[<>:"|?*]/,
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,
    ];

    if (
      suspiciousFilenamePatterns.some((pattern) =>
        pattern.test(file.originalname),
      )
    ) {
      return { isValid: false, reason: 'Suspicious filename' };
    }

    return { isValid: true };
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }
}
