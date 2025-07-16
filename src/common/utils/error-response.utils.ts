import { HttpStatus, HttpException } from '@nestjs/common';
import { ApiResponse } from '../interfaces/api-response.interface';

/**
 * Enhanced Error Response Utilities
 * Provides standardized error responses with detailed information
 */
export class ErrorResponseUtils {
  /**
   * Create a validation error response
   */
  static validationError(
    errors: string[],
    message: string = 'Validation failed',
  ): never {
    throw new HttpException(
      {
        success: false,
        message,
        error: 'VALIDATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
        details: errors,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * Create a business rule violation error
   */
  static businessRuleViolation(
    rule: string,
    message: string,
    details?: any,
  ): never {
    throw new HttpException(
      {
        success: false,
        message,
        error: 'BUSINESS_RULE_VIOLATION',
        statusCode: HttpStatus.BAD_REQUEST,
        details: {
          rule,
          ...details,
        },
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * Create a resource not found error
   */
  static notFound(
    resource: string,
    identifier?: string,
    suggestions?: string[],
  ): never {
    throw new HttpException(
      {
        success: false,
        message: `${resource}${identifier ? ` with identifier '${identifier}'` : ''} not found`,
        error: 'RESOURCE_NOT_FOUND',
        statusCode: HttpStatus.NOT_FOUND,
        details: {
          resource,
          identifier,
          suggestions,
        },
        timestamp: new Date().toISOString(),
      },
      HttpStatus.NOT_FOUND,
    );
  }

  /**
   * Create a conflict error (duplicate resource)
   */
  static conflict(
    resource: string,
    field: string,
    value: string,
    suggestions?: string[],
  ): never {
    throw new HttpException(
      {
        success: false,
        message: `${resource} with ${field} '${value}' already exists`,
        error: 'RESOURCE_CONFLICT',
        statusCode: HttpStatus.CONFLICT,
        details: {
          resource,
          field,
          value,
          suggestions,
        },
        timestamp: new Date().toISOString(),
      },
      HttpStatus.CONFLICT,
    );
  }

  /**
   * Create an unauthorized error
   */
  static unauthorized(
    reason: string = 'Authentication required',
    details?: any,
  ): never {
    throw new HttpException(
      {
        success: false,
        message: reason,
        error: 'UNAUTHORIZED',
        statusCode: HttpStatus.UNAUTHORIZED,
        details,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.UNAUTHORIZED,
    );
  }

  /**
   * Create a forbidden error
   */
  static forbidden(
    resource: string,
    action: string,
    reason?: string,
  ): never {
    throw new HttpException(
      {
        success: false,
        message: `Access denied: Cannot ${action} ${resource}${reason ? `. ${reason}` : ''}`,
        error: 'FORBIDDEN',
        statusCode: HttpStatus.FORBIDDEN,
        details: {
          resource,
          action,
          reason,
        },
        timestamp: new Date().toISOString(),
      },
      HttpStatus.FORBIDDEN,
    );
  }

  /**
   * Create a rate limit error
   */
  static rateLimitExceeded(
    limit: number,
    windowMs: number,
    retryAfter?: number,
  ): never {
    throw new HttpException(
      {
        success: false,
        message: `Rate limit exceeded: ${limit} requests per ${windowMs / 1000} seconds`,
        error: 'RATE_LIMIT_EXCEEDED',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        details: {
          limit,
          windowMs,
          retryAfter,
        },
        timestamp: new Date().toISOString(),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  /**
   * Create a file upload error
   */
  static fileUploadError(
    reason: string,
    allowedTypes?: string[],
    maxSize?: number,
  ): never {
    throw new HttpException(
      {
        success: false,
        message: `File upload failed: ${reason}`,
        error: 'FILE_UPLOAD_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
        details: {
          reason,
          allowedTypes,
          maxSize,
        },
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * Create a database error
   */
  static databaseError(
    operation: string,
    details?: any,
  ): never {
    throw new HttpException(
      {
        success: false,
        message: `Database operation failed: ${operation}`,
        error: 'DATABASE_ERROR',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        details: {
          operation,
          ...details,
        },
        timestamp: new Date().toISOString(),
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  /**
   * Create an external service error
   */
  static externalServiceError(
    service: string,
    operation: string,
    statusCode?: number,
  ): never {
    throw new HttpException(
      {
        success: false,
        message: `External service error: ${service} ${operation} failed`,
        error: 'EXTERNAL_SERVICE_ERROR',
        statusCode: HttpStatus.BAD_GATEWAY,
        details: {
          service,
          operation,
          externalStatusCode: statusCode,
        },
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_GATEWAY,
    );
  }

  /**
   * Create a timeout error
   */
  static timeout(
    operation: string,
    timeoutMs: number,
  ): never {
    throw new HttpException(
      {
        success: false,
        message: `Operation timed out: ${operation} exceeded ${timeoutMs}ms`,
        error: 'OPERATION_TIMEOUT',
        statusCode: HttpStatus.REQUEST_TIMEOUT,
        details: {
          operation,
          timeoutMs,
        },
        timestamp: new Date().toISOString(),
      },
      HttpStatus.REQUEST_TIMEOUT,
    );
  }

  /**
   * Create a maintenance mode error
   */
  static maintenanceMode(
    estimatedDuration?: string,
  ): never {
    throw new HttpException(
      {
        success: false,
        message: 'Service temporarily unavailable due to maintenance',
        error: 'MAINTENANCE_MODE',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        details: {
          estimatedDuration,
        },
        timestamp: new Date().toISOString(),
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  /**
   * Create a generic error response
   */
  static createErrorResponse(
    message: string,
    error: string,
    statusCode: HttpStatus,
    details?: any,
  ): ApiResponse {
    return {
      success: false,
      message,
      error,
      statusCode,
      details,
      timestamp: new Date().toISOString(),
    };
  }
}
