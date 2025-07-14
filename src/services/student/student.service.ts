import { Injectable, Logger } from '@nestjs/common';
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
import { ApiResponse, PaginatedResponse } from '../../common/interfaces/api-response.interface';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollmentService: EnrollmentService,
  ) {}

  /**
   * Create a new student with auto-generated enrollment number
   */
  async create(createStudentDto: CreateStudentDto, createdBy: string): Promise<ApiResponse> {
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
      const enrollmentNumber = await this.enrollmentService.generateEnrollmentNumber(
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

      this.logger.log(`Created student: ${student.name} (${student.enrollmentNumber})`);

      return ResponseUtils.created(student, 'Student created successfully');
    } catch (error) {
      this.logger.error('Failed to create student', error.stack);
      throw error;
    }
  }

  /**
   * Get all students with filtering and pagination
   */
  async findAll(filters: StudentFiltersDto): Promise<PaginatedResponse> {
    try {
      const {
        course,
        admissionYear,
        isActive,
        search,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (course) {
        where.course = { type: course };
      }

      if (admissionYear) {
        where.admissionYear = admissionYear;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { enrollmentNumber: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ];
      }

      const [students, total] = await Promise.all([
        this.prisma.student.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            course: {
              select: {
                id: true,
                name: true,
                type: true,
                duration: true,
              },
            },
            admin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.student.count({ where }),
      ]);

      return ResponseUtils.paginated(
        students,
        page,
        limit,
        total,
        'Students retrieved successfully',
      );
    } catch (error) {
      this.logger.error('Failed to retrieve students', error.stack);
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
      this.logger.error(`Failed to retrieve student with ID: ${id}`, error.stack);
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
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update student
   */
  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<ApiResponse> {
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
      if (updateStudentDto.email && updateStudentDto.email !== existingStudent.email) {
        const studentWithEmail = await this.prisma.student.findUnique({
          where: { email: updateStudentDto.email },
        });

        if (studentWithEmail) {
          throw new DuplicateEmailException(updateStudentDto.email);
        }
      }

      // Validate years if updating them
      if (updateStudentDto.admissionYear || updateStudentDto.passoutYear) {
        const admissionYear = updateStudentDto.admissionYear || existingStudent.admissionYear;
        const passoutYear = updateStudentDto.passoutYear || existingStudent.passoutYear;

        const yearValidation = EnrollmentUtils.validateYears(
          admissionYear,
          passoutYear,
          existingStudent.course.type,
        );

        if (!yearValidation.isValid) {
          return ResponseUtils.badRequest(yearValidation.error, 'INVALID_YEARS');
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

      this.logger.log(`Updated student: ${updatedStudent.name} (${updatedStudent.enrollmentNumber})`);

      return ResponseUtils.success(updatedStudent, 'Student updated successfully');
    } catch (error) {
      this.logger.error(`Failed to update student with ID: ${id}`, error.stack);
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

      this.logger.log(`Deactivated student: ${student.name} (${student.enrollmentNumber})`);

      return ResponseUtils.success(null, 'Student deactivated successfully');
    } catch (error) {
      this.logger.error(`Failed to delete student with ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * Get student statistics
   */
  async getStatistics(): Promise<ApiResponse> {
    try {
      const [
        totalStudents,
        activeStudents,
        courseStats,
        yearStats,
      ] = await Promise.all([
        this.prisma.student.count(),
        this.prisma.student.count({ where: { isActive: true } }),
        this.prisma.student.groupBy({
          by: ['courseId'],
          _count: { id: true },
          where: { isActive: true },
        }),
        this.prisma.student.groupBy({
          by: ['admissionYear'],
          _count: { id: true },
          where: { isActive: true },
          orderBy: { admissionYear: 'desc' },
        }),
      ]);

      // Get course details for course stats
      const courseDetails = await this.prisma.course.findMany({
        where: {
          id: { in: courseStats.map(stat => stat.courseId) },
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
      });

      const enrichedCourseStats = courseStats.map(stat => {
        const course = courseDetails.find(c => c.id === stat.courseId);
        return {
          courseId: stat.courseId,
          courseName: course?.name,
          courseType: course?.type,
          studentCount: stat._count.id,
        };
      });

      const result = {
        totalStudents,
        activeStudents,
        inactiveStudents: totalStudents - activeStudents,
        courseStats: enrichedCourseStats,
        yearStats: yearStats.map(stat => ({
          admissionYear: stat.admissionYear,
          studentCount: stat._count.id,
        })),
      };

      return ResponseUtils.success(result, 'Student statistics retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to retrieve student statistics', error.stack);
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
      this.logger.error(`Failed to search students with query: ${query}`, error.stack);
      throw error;
    }
  }
}
