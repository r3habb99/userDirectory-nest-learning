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
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'Student ID must be a string' })
  studentId?: string;

  @IsOptional()
  @IsString({ message: 'Course ID must be a string' })
  courseId?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus, {
    message: 'Status must be one of: PRESENT, ABSENT, LATE, EXCUSED',
  })
  status?: AttendanceStatus;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Date from must be a valid date string (YYYY-MM-DD)' },
  )
  dateFrom?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Date to must be a valid date string (YYYY-MM-DD)' },
  )
  dateTo?: string;

  @IsOptional()
  @IsString({ message: 'Sort by must be a string' })
  @Transform(({ value }: { value: string }) => value?.trim())
  sortBy?: string = 'date';

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Sort order must be either asc or desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
