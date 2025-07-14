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
import { CourseType } from '../../common/types/enrollment.types';

export class CreateCourseDto {
  @IsString({ message: 'Course name must be a string' })
  @IsNotEmpty({ message: 'Course name is required' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEnum(CourseType, {
    message: 'Course type must be one of: BCA, MCA, BBA, MBA, BCOM, MCOM',
  })
  type: CourseType;

  @IsInt({ message: 'Duration must be an integer' })
  @Min(1, { message: 'Duration must be at least 1 year' })
  @Max(5, { message: 'Duration cannot exceed 5 years' })
  duration: number;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean = true;
}
