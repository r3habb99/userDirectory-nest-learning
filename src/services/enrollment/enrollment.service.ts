import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseType } from '../../common/types/enrollment.types';
import { EnrollmentStats } from '../../common/interfaces';
import { EnrollmentUtils } from '../../common/utils/enrollment.utils';
import {
  DuplicateEnrollmentException,
  CourseNotFoundException,
} from '../../common/exceptions/custom.exceptions';

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate next enrollment number for a course and year
   */
  async generateEnrollmentNumber(
    courseId: string,
    admissionYear: number,
  ): Promise<string> {
    try {
      // Get course details
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new CourseNotFoundException(courseId);
      }

      // Get or create enrollment counter for this course and year
      const counter = await this.prisma.enrollmentCounter.upsert({
        where: {
          courseType_year: {
            courseType: course.type,
            year: admissionYear,
          },
        },
        update: {
          lastNumber: {
            increment: 1,
          },
        },
        create: {
          courseType: course.type,
          year: admissionYear,
          lastNumber: 1,
        },
      });

      // Check if we've exceeded the limit (300 students per course per year)
      if (counter.lastNumber > 300) {
        throw new Error(
          `Maximum enrollment limit (300) reached for ${course.type} ${admissionYear}`,
        );
      }

      // Generate enrollment number
      const enrollmentNumber = EnrollmentUtils.generateEnrollmentNumber(
        admissionYear,
        course.type,
        counter.lastNumber,
      );

      // Verify uniqueness (additional safety check)
      const existingStudent = await this.prisma.student.findUnique({
        where: { enrollmentNumber },
      });

      if (existingStudent) {
        this.logger.error(
          `Duplicate enrollment number generated: ${enrollmentNumber}`,
        );
        throw new DuplicateEnrollmentException(enrollmentNumber);
      }

      this.logger.log(
        `Generated enrollment number: ${enrollmentNumber} for course: ${course.type}`,
      );

      return enrollmentNumber;
    } catch (error) {
      this.logger.error(
        `Failed to generate enrollment number for course ${courseId}, year ${admissionYear}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get enrollment statistics for a course and year
   */
  async getEnrollmentStats(
    courseType: CourseType,
    year: number,
  ): Promise<{
    totalEnrolled: number;
    availableSlots: number;
    lastEnrollmentNumber: string | null;
  }> {
    try {
      const counter = await this.prisma.enrollmentCounter.findUnique({
        where: {
          courseType_year: {
            courseType,
            year,
          },
        },
      });

      const totalEnrolled = counter?.lastNumber || 0;
      const availableSlots = Math.max(0, 300 - totalEnrolled);
      const lastEnrollmentNumber = counter
        ? EnrollmentUtils.generateEnrollmentNumber(
            year,
            courseType,
            counter.lastNumber,
          )
        : null;

      return {
        totalEnrolled,
        availableSlots,
        lastEnrollmentNumber,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get enrollment stats for ${courseType} ${year}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get enrollment statistics for all courses and years
   */
  async getAllEnrollmentStats(): Promise<EnrollmentStats[]> {
    try {
      const counters = await this.prisma.enrollmentCounter.findMany({
        orderBy: [{ year: 'desc' }, { courseType: 'asc' }],
      });

      return counters.map((counter) => ({
        courseType: counter.courseType,
        year: counter.year,
        totalEnrolled: counter.lastNumber,
        availableSlots: Math.max(0, 300 - counter.lastNumber),
        lastEnrollmentNumber: EnrollmentUtils.generateEnrollmentNumber(
          counter.year,
          counter.courseType,
          counter.lastNumber,
        ),
      }));
    } catch (error) {
      this.logger.error(
        'Failed to get all enrollment stats',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Validate enrollment number format and availability
   */
  async validateEnrollmentNumber(enrollmentNumber: string): Promise<{
    isValid: boolean;
    isAvailable: boolean;
    parsedData: {
      year: number;
      course: CourseType;
      sequence: number;
    } | null;
  }> {
    try {
      // Parse enrollment number
      const parsedData =
        EnrollmentUtils.parseEnrollmentNumber(enrollmentNumber);

      if (!parsedData) {
        return {
          isValid: false,
          isAvailable: false,
          parsedData: null,
        };
      }

      // Check if sequence is in valid range
      if (!EnrollmentUtils.isSequenceInValidRange(parsedData.sequence)) {
        return {
          isValid: false,
          isAvailable: false,
          parsedData,
        };
      }

      // Check availability in database
      const existingStudent = await this.prisma.student.findUnique({
        where: { enrollmentNumber },
      });

      return {
        isValid: true,
        isAvailable: !existingStudent,
        parsedData,
      };
    } catch (error) {
      this.logger.error(
        `Failed to validate enrollment number: ${enrollmentNumber}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Reset enrollment counter for a course and year (admin only)
   */
  async resetEnrollmentCounter(
    courseType: CourseType,
    year: number,
  ): Promise<void> {
    try {
      await this.prisma.enrollmentCounter.upsert({
        where: {
          courseType_year: {
            courseType,
            year,
          },
        },
        update: {
          lastNumber: 0,
        },
        create: {
          courseType,
          year,
          lastNumber: 0,
        },
      });

      this.logger.log(`Reset enrollment counter for ${courseType} ${year}`);
    } catch (error) {
      this.logger.error(
        `Failed to reset enrollment counter for ${courseType} ${year}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
