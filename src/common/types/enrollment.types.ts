// Re-export Prisma enums for consistency
export { CourseType, UserRole, AttendanceStatus, Gender } from '@prisma/client';
import type { CourseType, AttendanceStatus } from '@prisma/client';

export interface EnrollmentNumberConfig {
  year: number;
  course: CourseType;
  sequence: number;
}

export interface StudentFilters {
  course?: CourseType;
  admissionYear?: number;
  isActive?: boolean;
  search?: string;
}

export interface AttendanceFilters {
  studentId?: string;
  date?: Date;
  dateFrom?: Date;
  dateTo?: Date;
  status?: AttendanceStatus;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
