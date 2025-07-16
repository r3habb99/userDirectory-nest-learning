import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { CreateStudentDto } from '../../dto/student/create-student.dto';
import { UpdateStudentDto } from '../../dto/student/update-student.dto';
import { StudentFiltersDto } from '../../dto/student/student-filters.dto';
import {
  StudentNotFoundException,
  CourseNotFoundException,
  DuplicateEmailException,
} from '../../common/exceptions/custom.exceptions';
import { ResponseUtils } from '../../common/utils/response.utils';
import { EnrollmentUtils } from '../../common/utils/enrollment.utils';
import { ValidationService } from '../../common/services/validation.service';
import { AuditLogService } from '../../common/middleware/security.middleware';
import { QueryOptimizerService } from '../../common/services/query-optimizer.service';
import { CacheService } from '../../common/services/cache.service';
import {
  ApiResponse,
  PaginatedResponse,
} from '../../common/interfaces/api-response.interface';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollmentService: EnrollmentService,
    private readonly validationService: ValidationService,
    private readonly auditLogService: AuditLogService,
    private readonly queryOptimizer: QueryOptimizerService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Create a new student with auto-generated enrollment number
   */
  async create(
    createStudentDto: CreateStudentDto,
    createdBy: string,
  ): Promise<ApiResponse> {
    try {
      // Validate course exists
      const course = await this.prisma.course.findUnique({
        where: { id: createStudentDto.courseId },
      });

      if (!course) {
        throw new CourseNotFoundException(createStudentDto.courseId);
      }

      // Validate years
      const yearValidation = EnrollmentUtils.validateYears(
        createStudentDto.admissionYear,
        createStudentDto.passoutYear,
        course.type,
      );

      if (!yearValidation.isValid) {
        return ResponseUtils.badRequest(yearValidation.error, 'INVALID_YEARS');
      }

      // Check for duplicate email if provided
      if (createStudentDto.email) {
        const existingStudent = await this.prisma.student.findUnique({
          where: { email: createStudentDto.email },
        });

        if (existingStudent) {
          throw new DuplicateEmailException(createStudentDto.email);
        }
      }

      // Generate enrollment number
      const enrollmentNumber =
        await this.enrollmentService.generateEnrollmentNumber(
          createStudentDto.courseId,
          createStudentDto.admissionYear,
        );

      // Create student
      const student = await this.prisma.student.create({
        data: {
          ...createStudentDto,
          enrollmentNumber,
          createdBy,
        },
        include: {
          course: true,
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(
        `Created student: ${student.name} (${student.enrollmentNumber})`,
      );

      return ResponseUtils.created(student, 'Student created successfully');
    } catch (error) {
      this.logger.error(
        'Failed to create student',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get all students with filtering and pagination (optimized)
   */
  async findAll(filters: StudentFiltersDto): Promise<PaginatedResponse> {
    try {
      // Use query optimizer for better performance
      const result = await this.queryOptimizer.findStudentsOptimized({
        course: filters.course,
        admissionYear: filters.admissionYear,
        isActive: filters.isActive,
        search: filters.search,
        page: filters.page || 1,
        limit: filters.limit || 10,
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc',
        includeRelations: true,
      });

      return ResponseUtils.paginated(
        result.students,
        result.page,
        result.limit,
        result.total,
        'Students retrieved successfully',
      );
    } catch (error) {
      this.logger.error(
        'Failed to retrieve students',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get student by ID
   */
  async findOne(id: string): Promise<ApiResponse> {
    try {
      const student = await this.prisma.student.findUnique({
        where: { id },
        include: {
          course: true,
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attendanceRecords: {
            orderBy: { date: 'desc' },
            take: 10, // Last 10 attendance records
            include: {
              admin: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          idCards: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!student) {
        throw new StudentNotFoundException(id);
      }

      return ResponseUtils.success(student, 'Student retrieved successfully');
    } catch (error) {
      this.logger.error(
        `Failed to retrieve student with ID: ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get student by enrollment number
   */
  async findByEnrollmentNumber(enrollmentNumber: string): Promise<ApiResponse> {
    try {
      const student = await this.prisma.student.findUnique({
        where: { enrollmentNumber },
        include: {
          course: true,
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attendanceRecords: {
            orderBy: { date: 'desc' },
            take: 10,
            include: {
              admin: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          idCards: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!student) {
        throw new StudentNotFoundException(enrollmentNumber);
      }

      return ResponseUtils.success(student, 'Student retrieved successfully');
    } catch (error) {
      this.logger.error(
        `Failed to retrieve student with enrollment number: ${enrollmentNumber}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Update student
   */
  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
  ): Promise<ApiResponse> {
    try {
      // Check if student exists
      const existingStudent = await this.prisma.student.findUnique({
        where: { id },
        include: { course: true },
      });

      if (!existingStudent) {
        throw new StudentNotFoundException(id);
      }

      // Check for duplicate email if updating email
      if (
        updateStudentDto.email &&
        updateStudentDto.email !== existingStudent.email
      ) {
        const studentWithEmail = await this.prisma.student.findUnique({
          where: { email: updateStudentDto.email },
        });

        if (studentWithEmail) {
          throw new DuplicateEmailException(updateStudentDto.email);
        }
      }

      // Validate years if updating them
      if (updateStudentDto.admissionYear || updateStudentDto.passoutYear) {
        const admissionYear =
          updateStudentDto.admissionYear || existingStudent.admissionYear;
        const passoutYear =
          updateStudentDto.passoutYear || existingStudent.passoutYear;

        const yearValidation = EnrollmentUtils.validateYears(
          admissionYear,
          passoutYear,
          existingStudent.course.type,
        );

        if (!yearValidation.isValid) {
          return ResponseUtils.badRequest(
            yearValidation.error,
            'INVALID_YEARS',
          );
        }
      }

      const updatedStudent = await this.prisma.student.update({
        where: { id },
        data: updateStudentDto,
        include: {
          course: true,
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(
        `Updated student: ${updatedStudent.name} (${updatedStudent.enrollmentNumber})`,
      );

      return ResponseUtils.success(
        updatedStudent,
        'Student updated successfully',
      );
    } catch (error) {
      this.logger.error(
        `Failed to update student with ID: ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Delete student (soft delete by setting isActive to false)
   */
  async remove(id: string): Promise<ApiResponse> {
    try {
      const student = await this.prisma.student.findUnique({
        where: { id },
      });

      if (!student) {
        throw new StudentNotFoundException(id);
      }

      await this.prisma.student.update({
        where: { id },
        data: { isActive: false },
      });

      this.logger.log(
        `Deactivated student: ${student.name} (${student.enrollmentNumber})`,
      );

      return ResponseUtils.success(null, 'Student deactivated successfully');
    } catch (error) {
      this.logger.error(
        `Failed to delete student with ID: ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get student statistics (optimized with caching)
   */
  async getStatistics(): Promise<ApiResponse> {
    try {
      // Use query optimizer with aggressive caching for statistics
      const stats =
        await this.queryOptimizer.getStatisticsOptimized('students');

      // Get course details for course stats
      const courseDetails = await this.prisma.course.findMany({
        where: {
          id: { in: stats.courseStats.map((stat) => stat.courseId) },
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
      });

      const enrichedCourseStats = stats.courseStats.map((stat) => {
        const course = courseDetails.find((c) => c.id === stat.courseId);
        return {
          courseId: stat.courseId,
          courseName: course?.name || 'Unknown',
          courseType: course?.type || 'Unknown',
          studentCount: stat._count.id,
        };
      });

      const result = {
        totalStudents: stats.totalStudents,
        activeStudents: stats.activeStudents,
        inactiveStudents: stats.totalStudents - stats.activeStudents,
        courseStats: enrichedCourseStats,
        yearStats: stats.yearStats.map((stat) => ({
          admissionYear: stat.admissionYear,
          studentCount: stat._count.id,
        })),
      };

      return ResponseUtils.success(
        result,
        'Student statistics retrieved successfully',
      );
    } catch (error) {
      this.logger.error(
        'Failed to retrieve student statistics',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Search students by various criteria
   */
  async search(query: string): Promise<ApiResponse> {
    try {
      const students = await this.prisma.student.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { name: { contains: query } },
                { enrollmentNumber: { contains: query } },
                { email: { contains: query } },
                { phone: { contains: query } },
              ],
            },
          ],
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        take: 20, // Limit search results
        orderBy: { name: 'asc' },
      });

      return ResponseUtils.success(students, 'Search completed successfully');
    } catch (error) {
      this.logger.error(
        `Failed to search students with query: ${query}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
