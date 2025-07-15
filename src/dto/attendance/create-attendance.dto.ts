import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AttendanceStatus } from '../../common/types/enrollment.types';

export class CreateAttendanceDto {
  @IsString({ message: 'Student ID must be a string' })
  @IsNotEmpty({ message: 'Student ID is required' })
  studentId: string;

  @IsDateString(
    {},
    { message: 'Date must be a valid date string (YYYY-MM-DD)' },
  )
  date: string;

  @IsEnum(AttendanceStatus, {
    message: 'Status must be one of: PRESENT, ABSENT, LATE, EXCUSED',
  })
  status: AttendanceStatus;

  @IsOptional()
  @IsString({ message: 'Remarks must be a string' })
  @Transform(({ value }: { value: string }) => value?.trim())
  remarks?: string;
}
