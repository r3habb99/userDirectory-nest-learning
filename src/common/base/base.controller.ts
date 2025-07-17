import { Injectable, Logger } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuditLogService } from '../services/audit-log.service';
import { SanitizationService } from '../services/sanitization.service';
import { AuthenticatedRequest } from '../interfaces';

/**
 * Base Controller Class
 * Provides common functionality and patterns for all controller classes
 */
@Injectable()
export abstract class BaseController {
  protected readonly logger: Logger;
  protected readonly controllerName: string;

  constructor(
    protected readonly auditLog: AuditLogService,
    protected readonly sanitization: SanitizationService,
  ) {
    this.controllerName = this.constructor.name;
    this.logger = new Logger(this.controllerName);
  }

  /**
   * Extract user context from authenticated request
   */
  protected getUserContext(req: AuthenticatedRequest): {
    userId: string;
    userEmail: string;
    userName: string;
    userRole: string;
  } {
    return {
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      userRole: req.user.role,
    };
  }

  /**
   * Extract request metadata for logging and auditing
   */
  protected getRequestMetadata(req: ExpressRequest): {
    ipAddress: string;
    userAgent: string;
    method: string;
    url: string;
    timestamp: Date;
  } {
    return {
      ipAddress: this.getClientIp(req),
      userAgent: req.get('User-Agent') || 'unknown',
      method: req.method,
      url: req.url,
      timestamp: new Date(),
    };
  }

  /**
   * Get client IP address with proxy support
   */
  protected getClientIp(req: ExpressRequest): string {
    const forwardedFor = req.get('X-Forwarded-For');
    const realIp = req.get('X-Real-IP');

    return (
      (forwardedFor ? forwardedFor.split(',')[0]?.trim() : null) ||
      realIp ||
      req.ip ||
      'unknown'
    );
  }

  /**
   * Sanitize query parameters
   */
  protected sanitizeQuery<T extends Record<string, any>>(
    query: T,
    sanitizers: Partial<Record<keyof T, (value: any) => any>>,
  ): Partial<T> {
    return this.sanitization.sanitizeObject(query, sanitizers);
  }

  /**
   * Sanitize and validate pagination parameters
   */
  protected sanitizePagination(query: Record<string, any>): {
    page: number;
    limit: number;
  } {
    return this.sanitization.sanitizePagination(query?.page, query?.limit);
  }

  /**
   * Sanitize sort parameters
   */
  protected sanitizeSort(
    sortBy: string,
    sortOrder: string,
    allowedFields: string[],
  ): { sortBy: string; sortOrder: 'asc' | 'desc' } {
    const sanitizedSortBy = this.sanitization.sanitizeSortField(
      sortBy,
      allowedFields,
    );
    const sanitizedSortOrder: 'asc' | 'desc' = ['asc', 'desc'].includes(
      sortOrder,
    )
      ? (sortOrder as 'asc' | 'desc')
      : 'desc';

    return {
      sortBy: sanitizedSortBy,
      sortOrder: sanitizedSortOrder,
    };
  }

  /**
   * Validate and sanitize ID parameter
   */
  protected sanitizeId(id: string): string {
    const sanitizedId = this.sanitization.sanitizeId(id);
    if (!sanitizedId) {
      throw new Error('Invalid ID format');
    }
    return sanitizedId;
  }

  /**
   * Sanitize search query
   */
  protected sanitizeSearchQuery(query: string): string {
    return this.sanitization.sanitizeSearchQuery(query);
  }

  /**
   * Log controller action for debugging
   */
  protected logAction(
    action: string,
    userId?: string,
    additionalData?: Record<string, any>,
  ): void {
    const logData = {
      controller: this.controllerName,
      action,
      userId,
      timestamp: new Date().toISOString(),
      ...additionalData,
    };

    this.logger.debug(`Action: ${JSON.stringify(logData)}`);
  }

  /**
   * Handle controller errors with consistent logging
   */
  protected handleError(
    error: unknown,
    action: string,
    context?: Record<string, any>,
  ): never {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logData = {
      controller: this.controllerName,
      action,
      error: errorMessage,
      context,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(`Error in ${action}: ${JSON.stringify(logData)}`);
    throw error;
  }

  /**
   * Validate required permissions
   */
  protected validatePermissions(
    userRole: string,
    requiredRoles: string[],
    resource?: string,
  ): void {
    if (!requiredRoles.includes(userRole)) {
      throw new Error(
        `Insufficient permissions. Required: ${requiredRoles.join(' or ')}, Current: ${userRole}${
          resource ? ` for resource: ${resource}` : ''
        }`,
      );
    }
  }

  /**
   * Check if user can access resource
   */
  protected canAccessResource(
    userId: string,
    resourceOwnerId: string,
    userRole: string,
    adminRoles: string[] = ['ADMIN', 'SUPER_ADMIN'],
  ): boolean {
    // Admin users can access any resource
    if (adminRoles.includes(userRole)) {
      return true;
    }

    // Users can only access their own resources
    return userId === resourceOwnerId;
  }

  /**
   * Extract and validate file upload
   */
  protected validateFileUpload(
    file: Express.Multer.File,
    allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: number = 5 * 1024 * 1024, // 5MB
  ): Express.Multer.File {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // Validate file type
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    // Validate file size
    if (file.size > maxSize) {
      throw new Error(
        `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
      );
    }

    // Sanitize filename
    const sanitizedFilename = this.sanitization.sanitizeFilename(
      file.originalname,
    );
    if (!sanitizedFilename) {
      throw new Error('Invalid filename');
    }

    return {
      ...file,
      originalname: sanitizedFilename,
    };
  }

  /**
   * Create standardized response metadata
   */
  protected createResponseMetadata(req: ExpressRequest): Record<string, any> {
    return {
      timestamp: new Date().toISOString(),
      requestId: req.get('X-Request-ID'),
      path: req.path,
      method: req.method,
    };
  }

  /**
   * Rate limit check helper
   */
  protected checkRateLimit(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _req: ExpressRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _identifier: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _limit: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _windowMs: number,
  ): boolean {
    // This would integrate with the rate limiting service
    // For now, return true (no rate limiting)
    return true;
  }

  /**
   * Validate request content type
   */
  protected validateContentType(
    req: ExpressRequest,
    expectedTypes: string[] = ['application/json'],
  ): void {
    const contentType = req.get('Content-Type');
    if (
      contentType &&
      !expectedTypes.some((type) => contentType.includes(type))
    ) {
      throw new Error(
        `Invalid content type. Expected: ${expectedTypes.join(' or ')}, Received: ${contentType}`,
      );
    }
  }

  /**
   * Extract and validate API version
   */
  protected validateApiVersion(
    req: ExpressRequest,
    supportedVersions: string[] = ['v1'],
  ): string {
    const version = req.get('API-Version') || 'v1';
    if (!supportedVersions.includes(version)) {
      throw new Error(
        `Unsupported API version. Supported versions: ${supportedVersions.join(', ')}`,
      );
    }
    return version;
  }
}
