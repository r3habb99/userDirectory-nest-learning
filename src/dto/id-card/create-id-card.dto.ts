import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateIdCardDto {
  @IsString({ message: 'Student ID must be a string' })
  @IsNotEmpty({ message: 'Student ID is required' })
  studentId: string;

  @IsDateString(
    {},
    { message: 'Expiry date must be a valid date string (YYYY-MM-DD)' },
  )
  expiryDate: string;
}
