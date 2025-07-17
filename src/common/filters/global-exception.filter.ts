import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { ApiResponse } from '../interfaces/api-response.interface';

// Type definitions for better type safety
interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
  details?: unknown;
}

interface ValidationErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

interface ErrorHandlerResult {
  status: number;
  message: string;
  error: string;
  details?: unknown;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'INTERNAL_SERVER_ERROR';
    let details: unknown = undefined;

    // Handle validation errors from class-validator
    if (exception instanceof BadRequestException) {
      const validationError = this.handleValidationError(exception);
      status = validationError.status;
      message = validationError.message;
      error = validationError.error;
      details = validationError.details;
    }
    // Handle HTTP exceptions
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as HttpExceptionResponse;

        // Handle array of validation messages
        if (Array.isArray(responseObj.message)) {
          message = 'Validation failed';
          details = responseObj.message;
          error = 'VALIDATION_ERROR';
        } else {
          message = responseObj.message || exception.message;
          error = responseObj.error || 'HTTP_EXCEPTION';
          details = responseObj.details;
        }
      } else {
        message = String(exceptionResponse);
      }
    }
    // Handle Prisma validation errors
    else if (exception instanceof PrismaClientValidationError) {
      const prismaValidationError = this.handlePrismaValidationError(exception);
      status = prismaValidationError.status;
      message = prismaValidationError.message;
      error = prismaValidationError.error;
      details = prismaValidationError.details;
    }
    // Handle Prisma known request errors
    else if (exception instanceof PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
      error = prismaError.error;
      details = prismaError.details;
    }
    // Handle other errors
    else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse: ApiResponse = {
      success: false,
      message,
      error,
      statusCode: status,
      ...(details !== undefined &&
      typeof details === 'object' &&
      details !== null
        ? { details }
        : {}),
    };

    // Enhanced error logging with context
    const logContext = {
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      {
        exception:
          exception instanceof Error ? exception.stack : String(exception),
        context: logContext,
        details,
      },
    );

    response.status(status).json(errorResponse);
  }

  /**
   * Handle validation errors from class-validator
   */
  private handleValidationError(
    exception: BadRequestException,
  ): ErrorHandlerResult {
    const response = exception.getResponse() as ValidationErrorResponse;

    if (response && Array.isArray(response.message)) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: response.message,
      };
    }

    return {
      status: HttpStatus.BAD_REQUEST,
      message:
        typeof response?.message === 'string'
          ? response.message
          : 'Validation failed',
      error: 'VALIDATION_ERROR',
    };
  }

  /**
   * Handle Prisma validation errors
   */
  private handlePrismaValidationError(
    error: PrismaClientValidationError,
  ): ErrorHandlerResult {
    return {
      status: HttpStatus.BAD_REQUEST,
      message: 'Invalid data provided to database',
      error: 'DATABASE_VALIDATION_ERROR',
      details: {
        originalError: error.message,
      },
    };
  }

  private handlePrismaError(
    error: PrismaClientKnownRequestError,
  ): ErrorHandlerResult {
    switch (error.code) {
      case 'P2002': {
        const target = error.meta?.target;
        const targetString = Array.isArray(target)
          ? target.join(', ')
          : typeof target === 'string'
            ? target
            : 'field';
        return {
          status: HttpStatus.CONFLICT,
          message: `Duplicate entry for ${targetString}`,
          error: 'DUPLICATE_ENTRY',
          details: {
            field: targetString,
            code: error.code,
          },
        };
      }
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'RECORD_NOT_FOUND',
          details: {
            code: error.code,
            meta: error.meta,
          },
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Foreign key constraint failed',
          error: 'FOREIGN_KEY_CONSTRAINT',
          details: {
            field: error.meta?.field_name,
            code: error.code,
          },
        };
      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid ID provided',
          error: 'INVALID_ID',
          details: {
            code: error.code,
          },
        };
      case 'P2021':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Table does not exist',
          error: 'TABLE_NOT_FOUND',
          details: {
            table: error.meta?.table,
            code: error.code,
          },
        };
      case 'P2022':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Column does not exist',
          error: 'COLUMN_NOT_FOUND',
          details: {
            column: error.meta?.column,
            code: error.code,
          },
        };
      case 'P2023':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Inconsistent column data',
          error: 'INCONSISTENT_COLUMN_DATA',
          details: {
            message: error.meta?.message,
            code: error.code,
          },
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error occurred',
          error: 'DATABASE_ERROR',
          details: {
            code: error.code,
            meta: error.meta,
          },
        };
    }
  }
}
