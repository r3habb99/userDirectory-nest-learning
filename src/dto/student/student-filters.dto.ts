import { IsOptional, IsEnum, IsInt, IsBoolean, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CourseType } from '../../common/types/enrollment.types';

export class StudentFiltersDto {
  @IsOptional()
  @IsEnum(CourseType, {
    message: 'Course must be one of: BCA, MCA, BBA, MBA, BCOM, MCOM',
  })
  course?: CourseType;

  @IsOptional()
  @IsInt({ message: 'Admission year must be an integer' })
  @Type(() => Number)
  admissionYear?: number;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @Transform(({ value }) => value?.trim())
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
