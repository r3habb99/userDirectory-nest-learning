import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '../../common/types/enrollment.types';

export class CreateAttendanceDto {
  @ApiProperty({
    description: 'ID of the student for attendance marking',
    example: 'clp1234567890abcdef',
    format: 'uuid',
  })
  @IsString({ message: 'Student ID must be a string' })
  @IsNotEmpty({ message: 'Student ID is required' })
  studentId: string;

  @ApiProperty({
    description: 'Date for which attendance is being marked',
    example: '2024-01-15',
    format: 'date',
  })
  @IsDateString(
    {},
    { message: 'Date must be a valid date string (YYYY-MM-DD)' },
  )
  date: string;

  @ApiProperty({
    description: 'Attendance status of the student',
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
  })
  @IsEnum(AttendanceStatus, {
    message: 'Status must be one of: PRESENT, ABSENT, LATE, EXCUSED',
  })
  status: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Additional remarks or notes about the attendance',
    example: 'Student arrived 10 minutes late due to traffic',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Remarks must be a string' })
  @Transform(({ value }: { value: string }) => value?.trim())
  remarks?: string;
}
