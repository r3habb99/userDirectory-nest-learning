import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiProduces,
  ApiHeader,
  getSchemaPath,
  ApiExtraModels,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiResponseDto,
  ErrorResponseDto,
  PaginatedResponseDto,
  BaseApiResponseDto,
} from '../dto/api-documentation.dto';
import { API_CONFIG } from '../config/api.config';

/**
 * Enhanced Swagger Decorators
 * Provides comprehensive API documentation decorators with consistent patterns
 */

// API Version Header Decorator
export const ApiVersionHeader = () => {
  return ApiHeader({
    name: API_CONFIG.VERSION_HEADER,
    description: 'API version',
    required: false,
    schema: {
      type: 'string',
      default: API_CONFIG.VERSION,
      example: API_CONFIG.VERSION,
    },
  });
};

// Enhanced API Tags with descriptions
export const ApiTagsWithDescription = (tag: string, description?: string) => {
  return applyDecorators(
    ApiTags(tag),
    ...(description ? [ApiOperation({ description })] : []),
  );
};

// Comprehensive API Response Decorator
export const ApiStandardResponses = () => {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid input data',
      type: ErrorResponseDto,
      schema: {
        example: {
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          timestamp: '2024-01-15T10:30:00.000Z',
          details: ['Name is required', 'Email must be valid'],
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Authentication required',
      type: ErrorResponseDto,
      schema: {
        example: {
          success: false,
          message: 'Authentication required',
          error: 'UNAUTHORIZED',
          statusCode: 401,
          timestamp: '2024-01-15T10:30:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      type: ErrorResponseDto,
      schema: {
        example: {
          success: false,
          message: 'Insufficient permissions',
          error: 'FORBIDDEN',
          statusCode: 403,
          timestamp: '2024-01-15T10:30:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - Resource not found',
      type: ErrorResponseDto,
      schema: {
        example: {
          success: false,
          message: 'Resource not found',
          error: 'NOT_FOUND',
          statusCode: 404,
          timestamp: '2024-01-15T10:30:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 429,
      description: 'Too Many Requests - Rate limit exceeded',
      type: ErrorResponseDto,
      schema: {
        example: {
          success: false,
          message: 'Rate limit exceeded',
          error: 'RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          timestamp: '2024-01-15T10:30:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
      type: ErrorResponseDto,
      schema: {
        example: {
          success: false,
          message: 'Internal server error',
          error: 'INTERNAL_ERROR',
          statusCode: 500,
          timestamp: '2024-01-15T10:30:00.000Z',
        },
      },
    }),
  );
};

// Standard API Response Decorators
export const ApiSuccessResponse = <TModel extends Type<any>>(
  model: TModel,
  description: string = 'Operation successful',
  status: number = 200,
) => {
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );
};

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
  description: string = 'Paginated data retrieved successfully',
) => {
  return applyDecorators(
    ApiExtraModels(PaginatedResponseDto, model),
    ApiResponse({
      status: 200,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiErrorResponses = () => {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid input data',
      schema: { $ref: getSchemaPath(ErrorResponseDto) },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Authentication required',
      schema: { $ref: getSchemaPath(ErrorResponseDto) },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      schema: { $ref: getSchemaPath(ErrorResponseDto) },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - Resource not found',
      schema: { $ref: getSchemaPath(ErrorResponseDto) },
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - Resource already exists',
      schema: { $ref: getSchemaPath(ErrorResponseDto) },
    }),
    ApiResponse({
      status: 422,
      description: 'Unprocessable Entity - Validation failed',
      schema: { $ref: getSchemaPath(ErrorResponseDto) },
    }),
    ApiResponse({
      status: 429,
      description: 'Too Many Requests - Rate limit exceeded',
      schema: { $ref: getSchemaPath(ErrorResponseDto) },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
      schema: { $ref: getSchemaPath(ErrorResponseDto) },
    }),
  );
};

// CRUD Operation Decorators
export const ApiCreateOperation = (
  resource: string,
  createDto: Type<any>,
  responseDto: Type<any>,
) => {
  return applyDecorators(
    ApiOperation({
      summary: `Create a new ${resource.toLowerCase()}`,
      description: `Creates a new ${resource.toLowerCase()} record with the provided data.`,
    }),
    ApiBody({
      type: createDto,
      description: `${resource} data to create`,
    }),
    ApiSuccessResponse(responseDto, `${resource} created successfully`, 201),
    ApiErrorResponses(),
  );
};

export const ApiGetAllOperation = (
  resource: string,
  responseDto: Type<any>,
  includeFilters: boolean = true,
) => {
  const decorators = [
    ApiOperation({
      summary: `Get all ${resource.toLowerCase()}s`,
      description: `Retrieves a paginated list of ${resource.toLowerCase()}s with optional filtering and sorting.`,
    }),
    ApiPaginatedResponse(responseDto),
    ApiErrorResponses(),
  ];

  if (includeFilters) {
    decorators.push(
      ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: 'Page number (default: 1)',
        example: 1,
      }),
      ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Items per page (default: 10, max: 100)',
        example: 10,
      }),
      ApiQuery({
        name: 'sortBy',
        required: false,
        type: String,
        description: 'Field to sort by (default: createdAt)',
        example: 'createdAt',
      }),
      ApiQuery({
        name: 'sortOrder',
        required: false,
        enum: ['asc', 'desc'],
        description: 'Sort order (default: desc)',
        example: 'desc',
      }),
    );
  }

  return applyDecorators(...decorators);
};

export const ApiGetByIdOperation = (
  resource: string,
  responseDto: Type<any>,
) => {
  return applyDecorators(
    ApiOperation({
      summary: `Get ${resource.toLowerCase()} by ID`,
      description: `Retrieves a specific ${resource.toLowerCase()} by its unique identifier.`,
    }),
    ApiParam({
      name: 'id',
      description: `${resource} unique identifier`,
      example: 'clp1234567890abcdef123456',
    }),
    ApiSuccessResponse(responseDto, `${resource} retrieved successfully`),
    ApiErrorResponses(),
  );
};

export const ApiUpdateOperation = (
  resource: string,
  updateDto: Type<any>,
  responseDto: Type<any>,
) => {
  return applyDecorators(
    ApiOperation({
      summary: `Update ${resource.toLowerCase()}`,
      description: `Updates an existing ${resource.toLowerCase()} with the provided data.`,
    }),
    ApiParam({
      name: 'id',
      description: `${resource} unique identifier`,
      example: 'clp1234567890abcdef123456',
    }),
    ApiBody({
      type: updateDto,
      description: `${resource} data to update`,
    }),
    ApiSuccessResponse(responseDto, `${resource} updated successfully`),
    ApiErrorResponses(),
  );
};

export const ApiDeleteOperation = (resource: string) => {
  return applyDecorators(
    ApiOperation({
      summary: `Delete ${resource.toLowerCase()}`,
      description: `Permanently deletes a ${resource.toLowerCase()} record.`,
    }),
    ApiParam({
      name: 'id',
      description: `${resource} unique identifier`,
      example: 'clp1234567890abcdef123456',
    }),
    ApiResponse({
      status: 200,
      description: `${resource} deleted successfully`,
      schema: { $ref: getSchemaPath(BaseApiResponseDto) },
    }),
    ApiErrorResponses(),
  );
};

// Search Operation Decorator
export const ApiSearchOperation = (
  resource: string,
  responseDto: Type<any>,
  searchFields: string[],
) => {
  return applyDecorators(
    ApiOperation({
      summary: `Search ${resource.toLowerCase()}s`,
      description: `Search ${resource.toLowerCase()}s by ${searchFields.join(', ')}.`,
    }),
    ApiQuery({
      name: 'q',
      description: `Search query (minimum 2 characters). Searches in: ${searchFields.join(', ')}`,
      example: 'John',
      minLength: 2,
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (default: 10)',
      example: 10,
    }),
    ApiPaginatedResponse(responseDto),
    ApiErrorResponses(),
  );
};

// Legacy File Upload Decorator (deprecated - use enhanced version below)
export const ApiLegacyFileUpload = (
  description: string = 'Upload file',
  fieldName: string = 'file',
  allowedTypes: string[] = ['image/jpeg', 'image/png'],
  maxSize: string = '5MB',
) => {
  return applyDecorators(
    ApiOperation({
      summary: description,
      description: `Upload a file. Allowed types: ${allowedTypes.join(', ')}. Max size: ${maxSize}`,
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          [fieldName]: {
            type: 'string',
            format: 'binary',
            description: `File to upload (${allowedTypes.join(', ')}, max ${maxSize})`,
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'File uploaded successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'File uploaded successfully' },
          data: {
            type: 'object',
            properties: {
              filename: { type: 'string', example: 'uploaded-file.jpg' },
              url: {
                type: 'string',
                example: 'https://example.com/uploads/uploaded-file.jpg',
              },
              size: { type: 'number', example: 1024000 },
              mimetype: { type: 'string', example: 'image/jpeg' },
            },
          },
        },
      },
    }),
    ApiErrorResponses(),
  );
};

// Statistics Decorator
export const ApiStatisticsOperation = (
  resource: string,
  responseDto: Type<any>,
) => {
  return applyDecorators(
    ApiOperation({
      summary: `Get ${resource.toLowerCase()} statistics`,
      description: `Retrieves comprehensive statistics and analytics for ${resource.toLowerCase()}s.`,
    }),
    ApiSuccessResponse(
      responseDto,
      `${resource} statistics retrieved successfully`,
    ),
    ApiErrorResponses(),
  );
};

// Bulk Operations Decorator
export const ApiBulkOperation = (
  operation: 'create' | 'update' | 'delete',
  resource: string,
  requestDto?: Type<any>,
) => {
  const operationMap = {
    create: 'Create multiple',
    update: 'Update multiple',
    delete: 'Delete multiple',
  };

  const decorators = [
    ApiOperation({
      summary: `${operationMap[operation]} ${resource.toLowerCase()}s`,
      description: `${operationMap[operation]} ${resource.toLowerCase()} records in a single operation.`,
    }),
  ];

  if (requestDto && operation !== 'delete') {
    decorators.push(
      ApiBody({
        type: [requestDto],
        description: `Array of ${resource.toLowerCase()} data`,
      }),
    );
  }

  if (operation === 'delete') {
    decorators.push(
      ApiBody({
        schema: {
          type: 'object',
          properties: {
            ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of IDs to delete',
              example: [
                'clp1234567890abcdef123456',
                'clp1234567890abcdef123457',
              ],
            },
          },
        },
      }),
    );
  }

  decorators.push(
    ApiResponse({
      status: 200,
      description: `Bulk ${operation} completed successfully`,
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: `Bulk ${operation} completed successfully`,
          },
          data: {
            type: 'object',
            properties: {
              processed: { type: 'number', example: 10 },
              successful: { type: 'number', example: 8 },
              failed: { type: 'number', example: 2 },
              errors: {
                type: 'array',
                items: { type: 'string' },
                example: [
                  'Item 3: Validation failed',
                  'Item 7: Duplicate entry',
                ],
              },
            },
          },
        },
      },
    }),
    ApiErrorResponses(),
  );

  return applyDecorators(...decorators);
};

// Custom Header Decorator
export const ApiCustomHeaders = () => {
  return applyDecorators(
    ApiHeader({
      name: 'X-Request-ID',
      description: 'Unique request identifier for tracking',
      required: false,
      example: 'req_1234567890abcdef',
    }),
    ApiVersionHeader(),
  );
};

// Enhanced Pagination Query Decorators
export const ApiPaginationQuery = () => {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: `Page number (default: ${API_CONFIG.PAGINATION.DEFAULT_PAGE})`,
      example: API_CONFIG.PAGINATION.DEFAULT_PAGE,
      minimum: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: `Items per page (default: ${API_CONFIG.PAGINATION.DEFAULT_LIMIT}, max: ${API_CONFIG.PAGINATION.MAX_LIMIT})`,
      example: API_CONFIG.PAGINATION.DEFAULT_LIMIT,
      minimum: 1,
      maximum: API_CONFIG.PAGINATION.MAX_LIMIT,
    }),
  );
};

// Enhanced Sorting Query Decorators
export const ApiSortingQuery = (sortableFields: string[]) => {
  return applyDecorators(
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      description: `Field to sort by. Available fields: ${sortableFields.join(', ')}`,
      example: sortableFields[0] || 'createdAt',
      enum: sortableFields,
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      type: String,
      description: 'Sort order',
      example: 'desc',
      enum: ['asc', 'desc'],
    }),
  );
};

// Enhanced Search Query Decorator
export const ApiSearchQuery = (searchFields: string[], minLength = 2) => {
  return ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: `Search query (minimum ${minLength} characters). Searches in: ${searchFields.join(', ')}`,
    example: 'John',
    minLength,
  });
};

// File Upload Decorators
export const ApiFileUpload = (
  fieldName: string = 'file',
  description: string = 'File to upload',
  required: boolean = true,
  allowedTypes?: string[],
  maxSize?: number,
) => {
  const schema: any = {
    type: 'object',
    properties: {
      [fieldName]: {
        type: 'string',
        format: 'binary',
        description: allowedTypes
          ? `${description}. Allowed types: ${allowedTypes.join(', ')}`
          : description,
      },
    },
    required: required ? [fieldName] : [],
  };

  if (maxSize) {
    schema.properties[fieldName].maxLength = maxSize;
  }

  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description,
      required,
      schema,
    }),
  );
};
