import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';

/**
 * API Documentation DTOs
 * Comprehensive DTOs for Swagger documentation
 */

// Base API Response
export class BaseApiResponseDto {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Operation completed successfully',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  @IsNumber()
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Timestamp of the response',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsString()
  timestamp?: string;
}

// Success Response with Data
export class ApiResponseDto<T = any> extends BaseApiResponseDto {
  @ApiProperty({
    description: 'Response data',
  })
  data: T;
}

// Error Response
export class ErrorResponseDto extends BaseApiResponseDto {
  @ApiProperty({
    description: 'Error code for programmatic handling',
    example: 'VALIDATION_ERROR',
  })
  @IsString()
  error: string;

  @ApiPropertyOptional({
    description: 'Additional error details',
    example: ['Name is required', 'Email must be valid'],
  })
  @IsOptional()
  details?: any;
}

// Pagination Metadata
export class PaginationMetaDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 150,
  })
  @IsNumber()
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 15,
  })
  @IsNumber()
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  @IsBoolean()
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  @IsBoolean()
  hasPrev: boolean;
}

// Paginated Response
export class PaginatedResponseDto<T = any> extends BaseApiResponseDto {
  @ApiProperty({
    description: 'Array of data items',
    type: 'array',
  })
  @IsArray()
  data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  @ValidateNested()
  @Type(() => PaginationMetaDto)
  pagination: PaginationMetaDto;
}

// Student Response DTO
export class StudentResponseDto {
  @ApiProperty({
    description: 'Unique student identifier',
    example: 'clp1234567890abcdef123456',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Auto-generated enrollment number',
    example: '2024BCA001',
  })
  @IsString()
  enrollmentNumber: string;

  @ApiProperty({
    description: 'Student full name',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Student email address',
    example: 'john.doe@email.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'Student phone number',
    example: '+1234567890',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Student age',
    example: 20,
    minimum: 16,
    maximum: 60,
  })
  @IsNumber()
  age: number;

  @ApiProperty({
    description: 'Student gender',
    enum: ['MALE', 'FEMALE', 'OTHER'],
    example: 'MALE',
  })
  @IsString()
  gender: string;

  @ApiProperty({
    description: 'Student address',
    example: '123 Main St, City, State 12345',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Year of admission',
    example: 2024,
  })
  @IsNumber()
  admissionYear: number;

  @ApiProperty({
    description: 'Expected year of graduation',
    example: 2027,
  })
  @IsNumber()
  passoutYear: number;

  @ApiPropertyOptional({
    description: 'URL to student profile photo',
    example: 'https://example.com/photos/student123.jpg',
  })
  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @ApiProperty({
    description: 'Whether the student record is active',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: 'Course information',
    type: 'object',
  })
  course: {
    id: string;
    name: string;
    type: string;
    duration: number;
  };

  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsString()
  createdAt: string;

  @ApiProperty({
    description: 'Record last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsString()
  updatedAt: string;
}

// Course Response DTO
export class CourseResponseDto {
  @ApiProperty({
    description: 'Unique course identifier',
    example: 'clp1234567890abcdef123456',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Course name',
    example: 'Bachelor of Computer Applications',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Course type/code',
    enum: ['BCA', 'MCA', 'BBA', 'MBA', 'BCOM', 'MCOM'],
    example: 'BCA',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Course duration in years',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  duration: number;

  @ApiPropertyOptional({
    description: 'Course description',
    example: 'A comprehensive program covering computer applications and programming',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Maximum number of students allowed',
    example: 60,
  })
  @IsNumber()
  maxStudents: number;

  @ApiProperty({
    description: 'Current number of enrolled students',
    example: 45,
  })
  @IsNumber()
  currentStudents: number;

  @ApiProperty({
    description: 'Whether the course is currently active',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsString()
  createdAt: string;

  @ApiProperty({
    description: 'Record last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsString()
  updatedAt: string;
}

// Attendance Response DTO
export class AttendanceResponseDto {
  @ApiProperty({
    description: 'Unique attendance record identifier',
    example: 'clp1234567890abcdef123456',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Date of attendance',
    example: '2024-01-15',
  })
  @IsString()
  date: string;

  @ApiProperty({
    description: 'Attendance status',
    enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
    example: 'PRESENT',
  })
  @IsString()
  status: string;

  @ApiPropertyOptional({
    description: 'Additional remarks',
    example: 'Arrived 10 minutes late',
  })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({
    description: 'Student information',
    type: 'object',
  })
  student: {
    id: string;
    name: string;
    enrollmentNumber: string;
  };

  @ApiProperty({
    description: 'Admin who marked the attendance',
    type: 'object',
  })
  markedBy: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsString()
  createdAt: string;
}

// ID Card Response DTO
export class IdCardResponseDto {
  @ApiProperty({
    description: 'Unique ID card identifier',
    example: 'clp1234567890abcdef123456',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Unique card number',
    example: 'CARD2024001',
  })
  @IsString()
  cardNumber: string;

  @ApiProperty({
    description: 'Date of issue',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsString()
  issueDate: string;

  @ApiProperty({
    description: 'Expiry date',
    example: '2028-01-15T10:30:00.000Z',
  })
  @IsString()
  expiryDate: string;

  @ApiProperty({
    description: 'QR code data for verification',
    example: 'QR_DATA_STRING',
  })
  @IsString()
  qrCode: string;

  @ApiPropertyOptional({
    description: 'URL to generated ID card image',
    example: 'https://example.com/id-cards/card123.png',
  })
  @IsOptional()
  @IsString()
  cardImageUrl?: string;

  @ApiProperty({
    description: 'Whether the ID card is active',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: 'Student information',
    type: 'object',
  })
  student: {
    id: string;
    name: string;
    enrollmentNumber: string;
    course: {
      name: string;
      type: string;
    };
  };

  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsString()
  createdAt: string;
}

// Statistics Response DTO
export class StatisticsResponseDto {
  @ApiProperty({
    description: 'Total number of students',
    example: 1250,
  })
  @IsNumber()
  totalStudents: number;

  @ApiProperty({
    description: 'Number of active students',
    example: 1200,
  })
  @IsNumber()
  activeStudents: number;

  @ApiProperty({
    description: 'Total number of courses',
    example: 6,
  })
  @IsNumber()
  totalCourses: number;

  @ApiProperty({
    description: 'Students by course breakdown',
    type: 'object',
    example: {
      BCA: 400,
      MCA: 200,
      BBA: 350,
      MBA: 150,
      BCOM: 100,
      MCOM: 50,
    },
  })
  studentsByCourse: Record<string, number>;

  @ApiProperty({
    description: 'Students by admission year',
    type: 'object',
    example: {
      2024: 300,
      2023: 350,
      2022: 400,
      2021: 200,
    },
  })
  studentsByYear: Record<string, number>;

  @ApiProperty({
    description: 'Recent activity summary',
    type: 'object',
    example: {
      newStudentsThisMonth: 25,
      attendanceMarkedToday: 150,
      idCardsGeneratedThisWeek: 30,
    },
  })
  recentActivity: {
    newStudentsThisMonth: number;
    attendanceMarkedToday: number;
    idCardsGeneratedThisWeek: number;
  };
}

// Enhanced Login Response DTO
export class LoginResponseDto extends BaseApiResponseDto {
  @ApiProperty({
    description: 'Login response data',
    type: 'object',
    example: {
      user: {
        id: 'clp1234567890abcdef123456',
        email: 'admin@college.edu',
        name: 'Admin User',
        role: 'ADMIN',
        createdAt: '2024-01-15T10:30:00.000Z',
        lastLoginAt: '2024-01-15T10:30:00.000Z',
      },
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHAxMjM0NTY3ODkwYWJjZGVmMTIzNDU2IiwiaWF0IjoxNzA1MzE0NjAwLCJleHAiOjE3MDU0MDEwMDB9.example_signature',
      expiresIn: '24h',
      tokenType: 'Bearer',
    },
  })
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      createdAt: string;
      lastLoginAt: string;
    };
    accessToken: string;
    expiresIn: string;
    tokenType: string;
  };
}

// Enhanced File Upload Response DTO
export class FileUploadResponseDto extends BaseApiResponseDto {
  @ApiProperty({
    description: 'File upload response data',
    type: 'object',
    example: {
      filename: 'profile_image_1705314600.jpg',
      originalName: 'john_doe_photo.jpg',
      mimetype: 'image/jpeg',
      size: 245760,
      url: '/uploads/profiles/profile_image_1705314600.jpg',
      uploadedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  data: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    uploadedAt: string;
  };
}
