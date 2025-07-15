import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Response data',
    example: {},
  })
  data?: any;
}

export class PaginatedResponseDto {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Data retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Array of data items',
    example: [],
  })
  data: any[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
      hasNext: true,
      hasPrev: false,
    },
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Indicates if the login was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Login response message',
    example: 'Login successful',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Authentication data',
    example: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      admin: {
        id: 'clp1234567890abcdef',
        email: 'admin@college.edu',
        name: 'John Admin',
        isActive: true,
      },
    },
  })
  data: {
    token: string;
    admin: {
      id: string;
      email: string;
      name: string;
      isActive: boolean;
    };
  };
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Indicates the request failed',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Error message',
    example: 'Resource not found',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Additional error details',
    example: ['Field validation error'],
  })
  errors?: string[];
}
