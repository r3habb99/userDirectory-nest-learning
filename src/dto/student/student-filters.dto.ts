import {
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseType } from '../../common/types/enrollment.types';

export class StudentFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter students by course type',
    enum: CourseType,
    example: CourseType.BCA,
  })
  @IsOptional()
  @IsEnum(CourseType, {
    message: 'Course must be one of: BCA, MCA, BBA, MBA, BCOM, MCOM',
  })
  course?: CourseType;

  @ApiPropertyOptional({
    description: 'Filter students by admission year',
    example: 2024,
    type: Number,
  })
  @IsOptional()
  @IsInt({ message: 'Admission year must be an integer' })
  @Type(() => Number)
  admissionYear?: number;

  @ApiPropertyOptional({
    description: 'Filter students by active status',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  @Transform(({ value }): boolean | undefined => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @Transform(({ value }: { value: string }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'Sort by must be a string' })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'], {
    message: 'Sort order must be either asc or desc',
  })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
