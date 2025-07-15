import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AttendanceService } from '../../services/attendance/attendance.service';
import { CreateAttendanceDto } from '../../dto/attendance/create-attendance.dto';
import { BulkAttendanceDto } from '../../dto/attendance/bulk-attendance.dto';
import { AttendanceFiltersDto } from '../../dto/attendance/attendance-filters.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiResponse,
  PaginatedResponse,
} from '../../common/interfaces/api-response.interface';
import { AuthenticatedRequest } from '../../common/interfaces/auth.interface';

@ApiTags('Attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @ApiOperation({ summary: 'Mark attendance for a student' })
  @SwaggerResponse({
    status: 201,
    description: 'Attendance marked successfully',
  })
  @SwaggerResponse({ status: 400, description: 'Student not found' })
  async markAttendance(
    @Body(ValidationPipe) createAttendanceDto: CreateAttendanceDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse> {
    const markedBy: string = req.user.id;
    return this.attendanceService.markAttendance(createAttendanceDto, markedBy);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Mark attendance for multiple students' })
  @SwaggerResponse({ status: 201, description: 'Bulk attendance processed' })
  @SwaggerResponse({
    status: 400,
    description: 'One or more students not found',
  })
  async markBulkAttendance(
    @Body(ValidationPipe) bulkAttendanceDto: BulkAttendanceDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse> {
    const markedBy: string = req.user.id;
    return this.attendanceService.markBulkAttendance(
      bulkAttendanceDto,
      markedBy,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all attendance records with pagination and filters',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Attendance records retrieved successfully',
  })
  async findAll(
    @Query(ValidationPipe) filters: AttendanceFiltersDto,
  ): Promise<PaginatedResponse> {
    return this.attendanceService.findAll(filters);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get attendance statistics' })
  @ApiQuery({
    name: 'studentId',
    required: false,
    description: 'Filter by student ID',
  })
  @ApiQuery({
    name: 'courseId',
    required: false,
    description: 'Filter by course ID',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'End date (YYYY-MM-DD)',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Attendance statistics retrieved successfully',
  })
  async getStatistics(
    @Query('studentId') studentId?: string,
    @Query('courseId') courseId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<ApiResponse> {
    return this.attendanceService.getAttendanceStatistics({
      studentId,
      courseId,
      dateFrom,
      dateTo,
    });
  }

  @Get('student/:studentId/report')
  @ApiOperation({ summary: 'Get attendance report for a specific student' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'End date (YYYY-MM-DD)',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Student attendance report retrieved successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Student not found' })
  async getStudentReport(
    @Param('studentId') studentId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<ApiResponse> {
    return this.attendanceService.getStudentAttendanceReport(
      studentId,
      dateFrom,
      dateTo,
    );
  }
}
