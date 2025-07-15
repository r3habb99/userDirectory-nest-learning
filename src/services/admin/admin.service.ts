import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseUtils } from '../../common/utils/response.utils';
import {
  ApiResponse,
  PaginatedResponse,
} from '../../common/interfaces/api-response.interface';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all admins with pagination
   */
  async findAll(page = 1, limit = 10): Promise<PaginatedResponse> {
    try {
      const skip = (page - 1) * limit;

      const [admins, total] = await Promise.all([
        this.prisma.admin.findMany({
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                createdStudents: true,
                attendanceRecords: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.admin.count(),
      ]);

      return ResponseUtils.paginated(
        admins,
        total,
        page,
        limit,
        'Admins retrieved successfully',
      );
    } catch (error) {
      this.logger.error(
        'Failed to retrieve admins',
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  /**
   * Get admin by ID
   */
  async findOne(id: string): Promise<ApiResponse> {
    try {
      const admin = await this.prisma.admin.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              createdStudents: true,
              attendanceRecords: true,
            },
          },
        },
      });

      if (!admin) {
        return ResponseUtils.notFound('Admin not found');
      }

      return ResponseUtils.success(admin, 'Admin retrieved successfully');
    } catch (error) {
      this.logger.error(
        `Failed to retrieve admin with ID: ${id}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  /**
   * Update admin status (activate/deactivate)
   */
  async updateStatus(id: string, isActive: boolean): Promise<ApiResponse> {
    try {
      const admin = await this.prisma.admin.findUnique({
        where: { id },
      });

      if (!admin) {
        return ResponseUtils.notFound('Admin not found');
      }

      const updatedAdmin = await this.prisma.admin.update({
        where: { id },
        data: { isActive },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return ResponseUtils.success(
        updatedAdmin,
        `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update admin status for ID: ${id}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  /**
   * Get admin statistics
   */
  async getStatistics(): Promise<ApiResponse> {
    try {
      const [
        totalAdmins,
        activeAdmins,
        totalStudentsCreated,
        totalAttendanceRecords,
      ] = await Promise.all([
        this.prisma.admin.count(),
        this.prisma.admin.count({ where: { isActive: true } }),
        this.prisma.student.count(),
        this.prisma.attendanceRecord.count(),
      ]);

      const statistics = {
        totalAdmins,
        activeAdmins,
        inactiveAdmins: totalAdmins - activeAdmins,
        totalStudentsCreated,
        totalAttendanceRecords,
      };

      return ResponseUtils.success(
        statistics,
        'Admin statistics retrieved successfully',
      );
    } catch (error) {
      this.logger.error(
        'Failed to retrieve admin statistics',
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
