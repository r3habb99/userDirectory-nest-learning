import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIdCardDto {
  @ApiProperty({
    description: 'ID of the student for whom the ID card is being generated',
    example: 'clp1234567890abcdef',
    format: 'uuid',
  })
  @IsString({ message: 'Student ID must be a string' })
  @IsNotEmpty({ message: 'Student ID is required' })
  studentId: string;

  @ApiProperty({
    description: 'Expiry date of the ID card',
    example: '2027-12-31',
    format: 'date',
  })
  @IsDateString(
    {},
    { message: 'Expiry date must be a valid date string (YYYY-MM-DD)' },
  )
  expiryDate: string;
}
