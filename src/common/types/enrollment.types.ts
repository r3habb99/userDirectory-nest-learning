// Re-export Prisma enums for consistency
export { CourseType, UserRole, AttendanceStatus, Gender } from '@prisma/client';

// Re-export interfaces from the interfaces folder
export {
  EnrollmentNumberConfig,
  StudentFilters,
  AttendanceFilters,
  PaginationOptions,
  EnrollmentStats,
} from '../interfaces/enrollment.interface';
