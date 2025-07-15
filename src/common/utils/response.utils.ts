import { HttpStatus } from '@nestjs/common';
import {
  ApiResponse,
  PaginatedResponse,
} from '../interfaces/api-response.interface';

export class ResponseUtils {
  /**
   * Create a success response
   */
  static success<T>(
    data: T,
    message = 'Operation successful',
    statusCode = HttpStatus.OK,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      statusCode,
    };
  }

  /**
   * Create an error response
   */
  static error(
    message: string,
    error?: string,
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
  ): ApiResponse {
    return {
      success: false,
      message,
      error,
      statusCode,
    };
  }

  /**
   * Create a paginated response
   */
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message = 'Data retrieved successfully',
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      success: true,
      message,
      data,
      statusCode: HttpStatus.OK,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  /**
   * Create a created response
   */
  static created<T>(
    data: T,
    message = 'Resource created successfully',
  ): ApiResponse<T> {
    return this.success(data, message, HttpStatus.CREATED);
  }

  /**
   * Create a no content response
   */
  static noContent(message = 'Operation completed successfully'): ApiResponse {
    return {
      success: true,
      message,
      statusCode: HttpStatus.NO_CONTENT,
    };
  }

  /**
   * Create a not found response
   */
  static notFound(message = 'Resource not found'): ApiResponse {
    return this.error(message, 'NOT_FOUND', HttpStatus.NOT_FOUND);
  }

  /**
   * Create a bad request response
   */
  static badRequest(message = 'Bad request', error?: string): ApiResponse {
    return this.error(message, error, HttpStatus.BAD_REQUEST);
  }

  /**
   * Create an unauthorized response
   */
  static unauthorized(message = 'Unauthorized access'): ApiResponse {
    return this.error(message, 'UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
  }

  /**
   * Create a forbidden response
   */
  static forbidden(message = 'Access forbidden'): ApiResponse {
    return this.error(message, 'FORBIDDEN', HttpStatus.FORBIDDEN);
  }

  /**
   * Create a conflict response
   */
  static conflict(message = 'Resource conflict', error?: string): ApiResponse {
    return this.error(message, error, HttpStatus.CONFLICT);
  }
}
