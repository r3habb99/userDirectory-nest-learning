import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  Matches,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender } from '../../common/types/enrollment.types';

export class CreateStudentDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @IsString({ message: 'Phone must be a string' })
  @IsNotEmpty({ message: 'Phone is required' })
  @Matches(/^[+]?[\d\s\-\(\)]{10,15}$/, {
    message: 'Please provide a valid phone number',
  })
  phone: string;

  @IsInt({ message: 'Age must be an integer' })
  @Type(() => Number)
  @Min(16, { message: 'Age must be at least 16 years' })
  @Max(50, { message: 'Age cannot exceed 50 years' })
  age: number;

  @IsEnum(Gender, {
    message: 'Gender must be one of: MALE, FEMALE, OTHER',
  })
  gender: Gender;

  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  @IsInt({ message: 'Admission year must be an integer' })
  @Type(() => Number)
  @Min(2020, { message: 'Admission year cannot be before 2020' })
  @Max(new Date().getFullYear() + 1, { 
    message: 'Admission year cannot be more than one year in the future' 
  })
  admissionYear: number;

  @IsInt({ message: 'Passout year must be an integer' })
  @Type(() => Number)
  @Min(2021, { message: 'Passout year cannot be before 2021' })
  @Max(new Date().getFullYear() + 10, { 
    message: 'Passout year cannot be more than 10 years in the future' 
  })
  passoutYear: number;

  @IsOptional()
  @IsString({ message: 'Profile photo must be a string' })
  profilePhoto?: string;

  @IsString({ message: 'Course ID is required' })
  @IsNotEmpty({ message: 'Course ID cannot be empty' })
  courseId: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean = true;
}
