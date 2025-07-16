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
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import {
  ApiStandardResponses,
  ApiPaginationQuery,
  ApiSortingQuery,
  ApiSearchQuery,
  ApiVersionHeader,
} from '../../common/decorators/swagger.decorators';
import { StudentService } from '../../services/student/student.service';
import { CreateStudentDto } from '../../dto/student/create-student.dto';
import { UpdateStudentDto } from '../../dto/student/update-student.dto';
import { StudentFiltersDto } from '../../dto/student/student-filters.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiResponse,
  PaginatedResponse,
  AuthenticatedRequest,
} from '../../common/interfaces';

@ApiTags('Students')
@Controller('students')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiVersionHeader()
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new student' })
  @SwaggerResponse({ status: 201, description: 'Student created successfully' })
  @SwaggerResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body(ValidationPipe) createStudentDto: CreateStudentDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse> {
    const createdBy: string = req.user.id;
    return this.studentService.create(createStudentDto, createdBy);
  }

  @Get()
  @ApiOperation({ summary: 'Get all students with pagination and filters' })
  @SwaggerResponse({
    status: 200,
    description: 'Students retrieved successfully',
  })
  @ApiPaginationQuery()
  @ApiSortingQuery(['name', 'enrollmentNumber', 'course', 'admissionYear', 'createdAt'])
  @ApiStandardResponses()
  async findAll(
    @Query(ValidationPipe) filters: StudentFiltersDto,
  ): Promise<PaginatedResponse> {
    return this.studentService.findAll(filters);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get student statistics' })
  @SwaggerResponse({
    status: 200,
    description: 'Student statistics retrieved successfully',
  })
  async getStatistics(): Promise<ApiResponse> {
    return this.studentService.getStatistics();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search students by name, email, or enrollment number',
  })
  @ApiSearchQuery(['name', 'email', 'enrollmentNumber', 'phone'])
  @SwaggerResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  @SwaggerResponse({ status: 400, description: 'Search query too short' })
  @ApiStandardResponses()
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
  @ApiOperation({ summary: 'Get student by enrollment number' })
  @ApiParam({
    name: 'enrollmentNumber',
    description: 'Student enrollment number',
    example: '2024BCA001',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Student retrieved successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Student not found' })
  async findByEnrollmentNumber(
    @Param('enrollmentNumber') enrollmentNumber: string,
  ): Promise<ApiResponse> {
    return this.studentService.findByEnrollmentNumber(enrollmentNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @SwaggerResponse({
    status: 200,
    description: 'Student retrieved successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Student not found' })
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    return this.studentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update student by ID' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @SwaggerResponse({ status: 200, description: 'Student updated successfully' })
  @SwaggerResponse({ status: 404, description: 'Student not found' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateStudentDto: UpdateStudentDto,
  ): Promise<ApiResponse> {
    return this.studentService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete student by ID' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @SwaggerResponse({ status: 200, description: 'Student deleted successfully' })
  @SwaggerResponse({ status: 404, description: 'Student not found' })
  async remove(@Param('id') id: string): Promise<ApiResponse> {
    return this.studentService.remove(id);
  }
}
