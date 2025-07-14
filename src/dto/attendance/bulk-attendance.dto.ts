import {
  IsArray,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AttendanceStatus } from '../../common/types/enrollment.types';

class BulkAttendanceItemDto {
  @IsString({ message: 'Student ID must be a string' })
  @IsNotEmpty({ message: 'Student ID is required' })
  studentId: string;

  @IsEnum(AttendanceStatus, {
    message: 'Status must be one of: PRESENT, ABSENT, LATE, EXCUSED',
  })
  status: AttendanceStatus;

  @IsOptional()
  @IsString({ message: 'Remarks must be a string' })
  @Transform(({ value }) => value?.trim())
  remarks?: string;
}

export class BulkAttendanceDto {
  @IsDateString({}, { message: 'Date must be a valid date string (YYYY-MM-DD)' })
  date: string;

  @IsArray({ message: 'Attendance records must be an array' })
  @ArrayMinSize(1, { message: 'At least one attendance record is required' })
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceItemDto)
  attendanceRecords: BulkAttendanceItemDto[];
}
