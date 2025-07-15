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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../../common/types/enrollment.types';

export class CreateStudentDto {
  @ApiProperty({
    description: 'Full name of the student',
    example: 'John Doe',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @Transform(({ value }: { value: string }) => value?.trim())
  name: string;

  @ApiPropertyOptional({
    description: 'Email address of the student',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email?: string;

  @ApiProperty({
    description: 'Phone number of the student',
    example: '+1234567890',
    pattern: '^[+]?[\\d\\s\\-()]{10,15}$',
  })
  @IsString({ message: 'Phone must be a string' })
  @IsNotEmpty({ message: 'Phone is required' })
  @Matches(/^[+]?[\d\s\-()]{10,15}$/, {
    message: 'Please provide a valid phone number',
  })
  phone: string;

  @ApiProperty({
    description: 'Age of the student',
    example: 20,
    minimum: 16,
    maximum: 50,
  })
  @IsInt({ message: 'Age must be an integer' })
  @Type(() => Number)
  @Min(16, { message: 'Age must be at least 16 years' })
  @Max(50, { message: 'Age cannot exceed 50 years' })
  age: number;

  @ApiProperty({
    description: 'Gender of the student',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsEnum(Gender, {
    message: 'Gender must be one of: MALE, FEMALE, OTHER',
  })
  gender: Gender;

  @ApiProperty({
    description: 'Complete address of the student',
    example: '123 Main Street, City, State, ZIP',
    minLength: 1,
    maxLength: 500,
  })
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  @ApiProperty({
    description: 'Year of admission to the college',
    example: 2024,
    minimum: 2020,
    maximum: new Date().getFullYear() + 1,
  })
  @IsInt({ message: 'Admission year must be an integer' })
  @Type(() => Number)
  @Min(2020, { message: 'Admission year cannot be before 2020' })
  @Max(new Date().getFullYear() + 1, {
    message: 'Admission year cannot be more than one year in the future',
  })
  admissionYear: number;

  @ApiProperty({
    description: 'Expected year of graduation',
    example: 2027,
    minimum: 2021,
    maximum: new Date().getFullYear() + 10,
  })
  @IsInt({ message: 'Passout year must be an integer' })
  @Type(() => Number)
  @Min(2021, { message: 'Passout year cannot be before 2021' })
  @Max(new Date().getFullYear() + 10, {
    message: 'Passout year cannot be more than 10 years in the future',
  })
  passoutYear: number;

  @ApiPropertyOptional({
    description: 'URL or path to student profile photo',
    example: 'https://example.com/photos/student.jpg',
  })
  @IsOptional()
  @IsString({ message: 'Profile photo must be a string' })
  profilePhoto?: string;

  @ApiProperty({
    description: 'ID of the course the student is enrolled in',
    example: 'clp1234567890abcdef',
    format: 'uuid',
  })
  @IsString({ message: 'Course ID is required' })
  @IsNotEmpty({ message: 'Course ID cannot be empty' })
  courseId: string;

  @ApiPropertyOptional({
    description: 'Whether the student is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean = true;
}
