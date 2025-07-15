import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from '../../dto/attendance/create-attendance.dto';
import { BulkAttendanceDto } from '../../dto/attendance/bulk-attendance.dto';
import { AttendanceFiltersDto } from '../../dto/attendance/attendance-filters.dto';
import { ResponseUtils } from '../../common/utils/response.utils';
import {
  ApiResponse,
  PaginatedResponse,
} from '../../common/interfaces/api-response.interface';
import { AttendanceRecord, Prisma } from '@prisma/client';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mark attendance for a single student
   */
  async markAttendance(
    createAttendanceDto: CreateAttendanceDto,
    markedBy: string,
  ): Promise<ApiResponse> {
    try {
      const { studentId, date, status, remarks } = createAttendanceDto;

      // Check if student exists
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: { course: true },
      });

      if (!student) {
        throw new BadRequestException('Student not found');
      }

      // Check if attendance already exists for this date
      const existingAttendance = await this.prisma.attendanceRecord.findUnique({
        where: {
          studentId_date: {
            studentId,
            date: new Date(date),
          },
        },
      });

      let attendance: AttendanceRecord & {
        student: {
          id: string;
          name: string;
          enrollmentNumber: string;
          course: { name: string; type: any };
        };
        admin: { id: string; name: string };
      };
      if (existingAttendance) {
        // Update existing attendance
        attendance = await this.prisma.attendanceRecord.update({
          where: { id: existingAttendance.id },
          data: { status, remarks },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                enrollmentNumber: true,
                course: { select: { name: true, type: true } },
              },
            },
            admin: {
              select: { id: true, name: true },
            },
          },
        });
      } else {
        // Create new attendance record
        attendance = await this.prisma.attendanceRecord.create({
          data: {
            studentId,
            date: new Date(date),
            status,
            remarks,
            markedBy,
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                enrollmentNumber: true,
                course: { select: { name: true, type: true } },
              },
            },
            admin: {
              select: { id: true, name: true },
            },
          },
        });
      }

      return ResponseUtils.success(
        attendance,
        existingAttendance
          ? 'Attendance updated successfully'
          : 'Attendance marked successfully',
      );
    } catch (error) {
      this.logger.error(
        'Failed to mark attendance',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Mark attendance for multiple students (bulk operation)
   */
  async markBulkAttendance(
    bulkAttendanceDto: BulkAttendanceDto,
    markedBy: string,
  ): Promise<ApiResponse> {
    try {
      const { date, attendanceRecords } = bulkAttendanceDto;
      const attendanceDate = new Date(date);

      // Validate all students exist
      const studentIds = attendanceRecords.map((record) => record.studentId);
      const students = await this.prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { id: true },
      });

      if (students.length !== studentIds.length) {
        throw new BadRequestException('One or more students not found');
      }

      // Process attendance records
      const results: Array<{
        studentId: string;
        status: 'success' | 'error';
        attendanceId?: string;
        error?: string;
      }> = [];

      for (const record of attendanceRecords) {
        try {
          // Check if attendance already exists
          const existingAttendance =
            await this.prisma.attendanceRecord.findUnique({
              where: {
                studentId_date: {
                  studentId: record.studentId,
                  date: attendanceDate,
                },
              },
            });

          let attendance: AttendanceRecord;
          if (existingAttendance) {
            // Update existing
            attendance = await this.prisma.attendanceRecord.update({
              where: { id: existingAttendance.id },
              data: {
                status: record.status,
                remarks: record.remarks,
              },
            });
          } else {
            // Create new
            attendance = await this.prisma.attendanceRecord.create({
              data: {
                studentId: record.studentId,
                date: attendanceDate,
                status: record.status,
                remarks: record.remarks,
                markedBy,
              },
            });
          }

          results.push({
            studentId: record.studentId,
            status: 'success',
            attendanceId: attendance.id,
          });
        } catch (error) {
          results.push({
            studentId: record.studentId,
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const successCount = results.filter((r) => r.status === 'success').length;
      const errorCount = results.filter((r) => r.status === 'error').length;

      return ResponseUtils.success(
        {
          results,
          summary: {
            total: attendanceRecords.length,
            successful: successCount,
            failed: errorCount,
          },
        },
        `Bulk attendance processed: ${successCount} successful, ${errorCount} failed`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to mark bulk attendance',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get attendance records with filters and pagination
   */
  async findAll(filters: AttendanceFiltersDto): Promise<PaginatedResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        studentId,
        courseId,
        status,
        dateFrom,
        dateTo,
        sortBy = 'date',
        sortOrder = 'desc',
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.AttendanceRecordWhereInput = {};

      if (studentId) {
        where.studentId = studentId;
      }

      if (courseId) {
        where.student = { courseId };
      }

      if (status) {
        where.status = status;
      }

      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) {
          where.date = { ...where.date, gte: new Date(dateFrom) };
        }
        if (dateTo) {
          where.date = { ...where.date, lte: new Date(dateTo) };
        }
      }

      const [attendanceRecords, total] = await Promise.all([
        this.prisma.attendanceRecord.findMany({
          where,
          skip,
          take: limit,
          include: {
            student: {
              select: {
                id: true,
                name: true,
                enrollmentNumber: true,
                course: { select: { name: true, type: true } },
              },
            },
            admin: {
              select: { id: true, name: true },
            },
          },
          orderBy: { [sortBy]: sortOrder },
        }),
        this.prisma.attendanceRecord.count({ where }),
      ]);

      return ResponseUtils.paginated(
        attendanceRecords,
        total,
        page,
        limit,
        'Attendance records retrieved successfully',
      );
    } catch (error) {
      this.logger.error(
        'Failed to retrieve attendance records',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get attendance statistics
   */
  async getAttendanceStatistics(filters?: {
    studentId?: string;
    courseId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse> {
    try {
      const where: Prisma.AttendanceRecordWhereInput = {};

      if (filters?.studentId) {
        where.studentId = filters.studentId;
      }

      if (filters?.courseId) {
        where.student = { courseId: filters.courseId };
      }

      if (filters?.dateFrom || filters?.dateTo) {
        where.date = {};
        if (filters.dateFrom) {
          where.date = { ...where.date, gte: new Date(filters.dateFrom) };
        }
        if (filters.dateTo) {
          where.date = { ...where.date, lte: new Date(filters.dateTo) };
        }
      }

      const [totalRecords, presentCount, absentCount, lateCount, excusedCount] =
        await Promise.all([
          this.prisma.attendanceRecord.count({ where }),
          this.prisma.attendanceRecord.count({
            where: { ...where, status: 'PRESENT' },
          }),
          this.prisma.attendanceRecord.count({
            where: { ...where, status: 'ABSENT' },
          }),
          this.prisma.attendanceRecord.count({
            where: { ...where, status: 'LATE' },
          }),
          this.prisma.attendanceRecord.count({
            where: { ...where, status: 'EXCUSED' },
          }),
        ]);

      const statistics = {
        totalRecords,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
        attendanceRate:
          totalRecords > 0
            ? (((presentCount + lateCount) / totalRecords) * 100).toFixed(2)
            : '0.00',
      };

      return ResponseUtils.success(
        statistics,
        'Attendance statistics retrieved successfully',
      );
    } catch (error) {
      this.logger.error(
        'Failed to retrieve attendance statistics',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get student attendance report
   */
  async getStudentAttendanceReport(
    studentId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<ApiResponse> {
    try {
      // Check if student exists
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: { course: true },
      });

      if (!student) {
        throw new BadRequestException('Student not found');
      }

      const where: Prisma.AttendanceRecordWhereInput = { studentId };

      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) {
          where.date = { ...where.date, gte: new Date(dateFrom) };
        }
        if (dateTo) {
          where.date = { ...where.date, lte: new Date(dateTo) };
        }
      }

      const [attendanceRecords, statistics] = (await Promise.all([
        this.prisma.attendanceRecord.findMany({
          where,
          include: {
            admin: {
              select: { id: true, name: true },
            },
          },
          orderBy: { date: 'desc' },
        }),
        this.getAttendanceStatistics({ studentId, dateFrom, dateTo }),
      ])) as [AttendanceRecord[], ApiResponse];

      // Extract statistics data safely
      const statsData: Record<string, any> = statistics.data || {};

      return ResponseUtils.success(
        {
          student: {
            id: student.id,
            name: student.name,
            enrollmentNumber: student.enrollmentNumber,
            course: student.course,
          },
          attendanceRecords,
          statistics: statsData,
        },
        'Student attendance report retrieved successfully',
      );
    } catch (error) {
      this.logger.error(
        `Failed to retrieve attendance report for student: ${studentId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
