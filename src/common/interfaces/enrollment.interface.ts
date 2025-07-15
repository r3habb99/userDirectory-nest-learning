import { CourseType, AttendanceStatus } from '@prisma/client';

/**
 * Interface for enrollment number configuration
 */
export interface EnrollmentNumberConfig {
  year: number;
  course: CourseType;
  sequence: number;
}

/**
 * Interface for student filters
 */
export interface StudentFilters {
  course?: CourseType;
  admissionYear?: number;
  isActive?: boolean;
  search?: string;
}

/**
 * Interface for attendance filters
 */
export interface AttendanceFilters {
  studentId?: string;
  date?: Date;
  dateFrom?: Date;
  dateTo?: Date;
  status?: AttendanceStatus;
}

/**
 * Interface for pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Interface for enrollment statistics
 */
export interface EnrollmentStats {
  courseType: CourseType;
  year: number;
  totalEnrolled: number;
  availableSlots: number;
  lastEnrollmentNumber: string | null;
}
