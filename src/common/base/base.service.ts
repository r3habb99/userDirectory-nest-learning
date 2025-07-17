import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma/prisma.service';
import {
  AuditLogService,
  AuditAction,
  AuditSeverity,
} from '../services/audit-log.service';
import { ValidationService } from '../services/validation.service';
import { SanitizationService } from '../services/sanitization.service';
import { ResponseUtils } from '../utils/response.utils';
import { ApiResponse, PaginatedResponse } from '../interfaces';

// Type for Prisma model delegate operations
interface PrismaModelDelegate {
  findUnique: (args: { where: { id: string } }) => Promise<unknown>;
  findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
  update: (args: {
    where: { id: string };
    data: Record<string, unknown>;
  }) => Promise<unknown>;
}

/**
 * Base Service Class
 * Provides common functionality and patterns for all service classes
 */
@Injectable()
export abstract class BaseService {
  protected readonly logger: Logger;
  protected readonly serviceName: string;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly auditLog: AuditLogService,
    protected readonly validation: ValidationService,
    protected readonly sanitization: SanitizationService,
  ) {
    this.serviceName = this.constructor.name;
    this.logger = new Logger(this.serviceName);
  }

  /**
   * Execute operation with comprehensive error handling and logging
   */
  protected async executeOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: {
      userId?: string;
      userEmail?: string;
      ipAddress?: string;
      resource?: string;
      resourceId?: string;
    },
  ): Promise<T> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Starting operation: ${operationName}`);

      const result = await operation();

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Operation completed: ${operationName} (${duration}ms)`,
      );

      // Log successful operation
      if (context) {
        await this.auditLog.logDataAccess(
          this.getAuditAction(operationName),
          context.resource || this.serviceName.toLowerCase(),
          context.resourceId,
          context.userId,
          context.userEmail,
          { operationName, duration },
          context.ipAddress,
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Operation failed: ${operationName} (${duration}ms)`,
        error instanceof Error ? error.stack : String(error),
      );

      // Log failed operation
      if (context) {
        await this.auditLog.log({
          userId: context.userId,
          userEmail: context.userEmail,
          action: this.getAuditAction(operationName),
          resource: context.resource || this.serviceName.toLowerCase(),
          resourceId: context.resourceId,
          details: {
            operationName,
            duration,
            error: error instanceof Error ? error.message : String(error),
          },
          ipAddress: context.ipAddress,
          severity: AuditSeverity.MEDIUM,
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }

      throw error;
    }
  }

  /**
   * Validate and sanitize input data
   */
  protected validateAndSanitizeInput<T extends object>(
    data: T,
    validationRules?: (data: T) => { isValid: boolean; errors: string[] },
  ): T {
    // Deep sanitize the input
    const sanitizedData = this.sanitization.deepSanitize(data) as T;

    // Apply custom validation rules if provided
    if (validationRules) {
      const validation = validationRules(sanitizedData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
    }

    return sanitizedData;
  }

  /**
   * Create paginated response with consistent format
   */
  protected createPaginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Data retrieved successfully',
  ): PaginatedResponse {
    return ResponseUtils.paginated(data, page, limit, total, message);
  }

  /**
   * Create success response with consistent format
   */
  protected createSuccessResponse<T>(
    data: T,
    message: string = 'Operation completed successfully',
  ): ApiResponse {
    return ResponseUtils.success(data, message);
  }

  /**
   * Handle database transaction with retry logic
   */
  protected async executeTransaction<T>(
    operation: (prisma: PrismaService) => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    return this.prisma.executeTransaction(operation, maxRetries);
  }

  /**
   * Validate pagination parameters
   */
  protected validatePagination(
    page?: number,
    limit?: number,
  ): { page: number; limit: number } {
    return this.validation.validatePagination(page || 1, limit || 10);
  }

  /**
   * Validate sort parameters
   */
  protected validateSort(
    sortBy?: string,
    allowedFields: string[] = ['createdAt'],
  ): string {
    return this.validation.validateSortParams(
      sortBy || 'createdAt',
      allowedFields,
    );
  }

  /**
   * Check if resource exists
   */
  protected async checkResourceExists<T = unknown>(
    model: string,
    id: string,
    errorMessage?: string,
  ): Promise<T> {
    const prismaClient = this.prisma as unknown as Record<
      string,
      PrismaModelDelegate
    >;
    const prismaModel = prismaClient[model];

    if (!prismaModel || typeof prismaModel.findUnique !== 'function') {
      throw new Error(`Invalid model: ${model}`);
    }

    const resource = await prismaModel.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new Error(errorMessage || `${model} with ID ${id} not found`);
    }

    return resource as T;
  }

  /**
   * Check for duplicate resource
   */
  protected async checkDuplicate(
    model: string,
    field: string,
    value: unknown,
    excludeId?: string,
  ): Promise<boolean> {
    const prismaClient = this.prisma as unknown as Record<
      string,
      PrismaModelDelegate
    >;
    const prismaModel = prismaClient[model];

    if (!prismaModel || typeof prismaModel.findFirst !== 'function') {
      throw new Error(`Invalid model: ${model}`);
    }

    const where: Record<string, unknown> = { [field]: value };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existing = await prismaModel.findFirst({ where });
    return !!existing;
  }

  /**
   * Soft delete resource (if supported)
   */
  protected async softDelete<T = unknown>(
    model: string,
    id: string,
    userId?: string,
  ): Promise<T> {
    const prismaClient = this.prisma as unknown as Record<
      string,
      PrismaModelDelegate
    >;
    const prismaModel = prismaClient[model];

    if (!prismaModel || typeof prismaModel.update !== 'function') {
      throw new Error(`Invalid model: ${model}`);
    }

    const result = await prismaModel.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
        ...(userId && { updatedBy: userId }),
      },
    });

    return result as T;
  }

  /**
   * Get audit action based on operation name
   */
  private getAuditAction(operationName: string): AuditAction {
    const lowerOperation = operationName.toLowerCase();

    if (lowerOperation.includes('create')) return AuditAction.CREATE;
    if (lowerOperation.includes('update')) return AuditAction.UPDATE;
    if (lowerOperation.includes('delete')) return AuditAction.DELETE;
    if (lowerOperation.includes('find') || lowerOperation.includes('get'))
      return AuditAction.READ;

    return AuditAction.READ; // Default to read
  }

  /**
   * Format error message for consistent error responses
   */
  protected formatErrorMessage(error: unknown, context?: string): string {
    const baseMessage = context ? `${context}: ` : '';

    if (error instanceof Error) {
      return `${baseMessage}${error.message}`;
    }

    return `${baseMessage}An unexpected error occurred`;
  }

  /**
   * Log performance metrics
   */
  protected logPerformanceMetric(
    operation: string,
    duration: number,
    additionalData?: Record<string, any>,
  ): void {
    const logData = {
      service: this.serviceName,
      operation,
      duration,
      ...additionalData,
    };

    if (duration > 1000) {
      this.logger.warn(`Slow operation detected: ${JSON.stringify(logData)}`);
    } else if (duration > 500) {
      this.logger.debug(`Operation performance: ${JSON.stringify(logData)}`);
    }
  }

  /**
   * Cache key generator for consistent caching
   */
  protected generateCacheKey(
    prefix: string,
    ...params: (string | number)[]
  ): string {
    return `${this.serviceName.toLowerCase()}:${prefix}:${params.join(':')}`;
  }
}
