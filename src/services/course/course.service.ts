import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from '../../dto/course/create-course.dto';
import { UpdateCourseDto } from '../../dto/course/update-course.dto';
import {
  CourseType,
  PaginationOptions,
} from '../../common/types/enrollment.types';
import { CourseNotFoundException } from '../../common/exceptions/custom.exceptions';
import { ResponseUtils } from '../../common/utils/response.utils';
import {
  ApiResponse,
  PaginatedResponse,
} from '../../common/interfaces/api-response.interface';

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new course
   */
  async create(createCourseDto: CreateCourseDto): Promise<ApiResponse> {
    try {
      // Check if course type already exists
      const existingCourse = await this.prisma.course.findUnique({
        where: { type: createCourseDto.type },
      });

      if (existingCourse) {
        return ResponseUtils.conflict(
          `Course with type ${createCourseDto.type} already exists`,
          'COURSE_TYPE_EXISTS',
        );
      }

      const course = await this.prisma.course.create({
        data: createCourseDto,
        include: {
          _count: {
            select: { students: true },
          },
        },
      });

      this.logger.log(`Created course: ${course.name} (${course.type})`);

      return ResponseUtils.created(course, 'Course created successfully');
    } catch (error) {
      this.logger.error(
        'Failed to create course',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get all courses with pagination and filtering
   */
  async findAll(
    options: PaginationOptions & { isActive?: boolean },
  ): Promise<PaginatedResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        isActive,
      } = options;

      const skip = (page - 1) * limit;

      const where = isActive !== undefined ? { isActive } : {};

      const [courses, total] = await Promise.all([
        this.prisma.course.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            _count: {
              select: { students: true },
            },
          },
        }),
        this.prisma.course.count({ where }),
      ]);

      return ResponseUtils.paginated(
        courses,
        page,
        limit,
        total,
        'Courses retrieved successfully',
      );
    } catch (error) {
      this.logger.error(
        'Failed to retrieve courses',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get course by ID
   */
  async findOne(id: string): Promise<ApiResponse> {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id },
        include: {
          students: {
            select: {
              id: true,
              enrollmentNumber: true,
              name: true,
              admissionYear: true,
              passoutYear: true,
              isActive: true,
            },
            orderBy: { enrollmentNumber: 'asc' },
          },
          _count: {
            select: { students: true },
          },
        },
      });

      if (!course) {
        throw new CourseNotFoundException(id);
      }

      return ResponseUtils.success(course, 'Course retrieved successfully');
    } catch (error) {
      this.logger.error(
        `Failed to retrieve course with ID: ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get course by type
   */
  async findByType(type: CourseType): Promise<ApiResponse> {
    try {
      const course = await this.prisma.course.findUnique({
        where: { type },
        include: {
          students: {
            select: {
              id: true,
              enrollmentNumber: true,
              name: true,
              admissionYear: true,
              passoutYear: true,
              isActive: true,
            },
            orderBy: { enrollmentNumber: 'asc' },
          },
          _count: {
            select: { students: true },
          },
        },
      });

      if (!course) {
        throw new CourseNotFoundException(type);
      }

      return ResponseUtils.success(course, 'Course retrieved successfully');
    } catch (error) {
      this.logger.error(
        `Failed to retrieve course with type: ${type}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Update course
   */
  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<ApiResponse> {
    try {
      // Check if course exists
      const existingCourse = await this.prisma.course.findUnique({
        where: { id },
      });

      if (!existingCourse) {
        throw new CourseNotFoundException(id);
      }

      // If updating type, check if new type already exists
      if (
        updateCourseDto.type &&
        updateCourseDto.type !== existingCourse.type
      ) {
        const courseWithNewType = await this.prisma.course.findUnique({
          where: { type: updateCourseDto.type },
        });

        if (courseWithNewType) {
          return ResponseUtils.conflict(
            `Course with type ${updateCourseDto.type} already exists`,
            'COURSE_TYPE_EXISTS',
          );
        }
      }

      const updatedCourse = await this.prisma.course.update({
        where: { id },
        data: updateCourseDto,
        include: {
          _count: {
            select: { students: true },
          },
        },
      });

      this.logger.log(
        `Updated course: ${updatedCourse.name} (${updatedCourse.type})`,
      );

      return ResponseUtils.success(
        updatedCourse,
        'Course updated successfully',
      );
    } catch (error) {
      this.logger.error(
        `Failed to update course with ID: ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Delete course (soft delete by setting isActive to false)
   */
  async remove(id: string): Promise<ApiResponse> {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id },
        include: {
          _count: {
            select: { students: true },
          },
        },
      });

      if (!course) {
        throw new CourseNotFoundException(id);
      }

      // Check if course has active students
      if (course._count.students > 0) {
        return ResponseUtils.badRequest(
          'Cannot delete course with enrolled students. Please transfer or graduate students first.',
          'COURSE_HAS_STUDENTS',
        );
      }

      await this.prisma.course.update({
        where: { id },
        data: { isActive: false },
      });

      this.logger.log(`Deactivated course: ${course.name} (${course.type})`);

      return ResponseUtils.success(null, 'Course deactivated successfully');
    } catch (error) {
      this.logger.error(
        `Failed to delete course with ID: ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get course statistics
   */
  async getStatistics(): Promise<ApiResponse> {
    try {
      const stats = await this.prisma.course.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          duration: true,
          isActive: true,
          _count: {
            select: { students: true },
          },
        },
        orderBy: { type: 'asc' },
      });

      const totalCourses = stats.length;
      const activeCourses = stats.filter((course) => course.isActive).length;
      const totalStudents = stats.reduce(
        (sum, course) => sum + course._count.students,
        0,
      );

      const result = {
        totalCourses,
        activeCourses,
        totalStudents,
        courseDetails: stats,
      };

      return ResponseUtils.success(
        result,
        'Course statistics retrieved successfully',
      );
    } catch (error) {
      this.logger.error(
        'Failed to retrieve course statistics',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
