import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ValidationPipe,
  Request,
} from '@nestjs/common';
import { StudentService } from '../../services/student/student.service';
import { CreateStudentDto } from '../../dto/student/create-student.dto';
import { UpdateStudentDto } from '../../dto/student/update-student.dto';
import { StudentFiltersDto } from '../../dto/student/student-filters.dto';
import { ApiResponse, PaginatedResponse } from '../../common/interfaces/api-response.interface';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  async create(
    @Body(ValidationPipe) createStudentDto: CreateStudentDto,
    @Request() req: any, // Will be replaced with proper auth guard
  ): Promise<ApiResponse> {
    // For now, using a placeholder admin ID
    // This will be replaced with actual admin ID from JWT token
    const createdBy = req.user?.id || 'admin-placeholder';
    return this.studentService.create(createStudentDto, createdBy);
  }

  @Get()
  async findAll(
    @Query(ValidationPipe) filters: StudentFiltersDto,
  ): Promise<PaginatedResponse> {
    return this.studentService.findAll(filters);
  }

  @Get('statistics')
  async getStatistics(): Promise<ApiResponse> {
    return this.studentService.getStatistics();
  }

  @Get('search')
  async search(@Query('q') query: string): Promise<ApiResponse> {
    if (!query || query.trim().length < 2) {
      return {
        success: false,
        message: 'Search query must be at least 2 characters long',
        statusCode: 400,
      };
    }
    return this.studentService.search(query.trim());
  }

  @Get('enrollment/:enrollmentNumber')
  async findByEnrollmentNumber(
    @Param('enrollmentNumber') enrollmentNumber: string,
  ): Promise<ApiResponse> {
    return this.studentService.findByEnrollmentNumber(enrollmentNumber);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    return this.studentService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateStudentDto: UpdateStudentDto,
  ): Promise<ApiResponse> {
    return this.studentService.update(id, updateStudentDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse> {
    return this.studentService.remove(id);
  }
}
