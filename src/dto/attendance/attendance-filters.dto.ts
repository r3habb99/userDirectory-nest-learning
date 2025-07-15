import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AttendanceStatus } from '../../common/types/enrollment.types';

export class AttendanceFiltersDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by student ID',
    example: 'clp1234567890abcdef',
  })
  @IsOptional()
  @IsString({ message: 'Student ID must be a string' })
  studentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by course ID',
    example: 'clp1234567890abcdef',
  })
  @IsOptional()
  @IsString({ message: 'Course ID must be a string' })
  courseId?: string;

  @ApiPropertyOptional({
    description: 'Filter by attendance status',
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus, {
    message: 'Status must be one of: PRESENT, ABSENT, LATE, EXCUSED',
  })
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Filter attendance from this date',
    example: '2024-01-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Date from must be a valid date string (YYYY-MM-DD)' },
  )
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter attendance to this date',
    example: '2024-12-31',
    format: 'date',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Date to must be a valid date string (YYYY-MM-DD)' },
  )
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'date',
    default: 'date',
  })
  @IsOptional()
  @IsString({ message: 'Sort by must be a string' })
  @Transform(({ value }: { value: string }) => value?.trim())
  sortBy?: string = 'date';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Sort order must be either asc or desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
