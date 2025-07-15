import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseType } from '../../common/types/enrollment.types';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Name of the course',
    example: 'Bachelor of Computer Applications',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'Course name must be a string' })
  @IsNotEmpty({ message: 'Course name is required' })
  @Transform(({ value }: { value: string }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Type of the course',
    enum: CourseType,
    example: CourseType.BCA,
  })
  @IsEnum(CourseType, {
    message: 'Course type must be one of: BCA, MCA, BBA, MBA, BCOM, MCOM',
  })
  type: CourseType;

  @ApiProperty({
    description: 'Duration of the course in years',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: 'Duration must be an integer' })
  @Min(1, { message: 'Duration must be at least 1 year' })
  @Max(5, { message: 'Duration cannot exceed 5 years' })
  duration: number;

  @ApiPropertyOptional({
    description: 'Detailed description of the course',
    example: 'A comprehensive 3-year undergraduate program in computer applications',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the course is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean = true;
}
