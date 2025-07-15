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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CourseService } from '../../services/course/course.service';
import { CreateCourseDto } from '../../dto/course/create-course.dto';
import { UpdateCourseDto } from '../../dto/course/update-course.dto';
import {
  CourseType,
  PaginationOptions,
} from '../../common/types/enrollment.types';
import {
  ApiResponse,
  PaginatedResponse,
} from '../../common/interfaces/api-response.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Courses')
@Controller('courses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  @SwaggerResponse({ status: 201, description: 'Course created successfully' })
  @SwaggerResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body(ValidationPipe) createCourseDto: CreateCourseDto,
  ): Promise<ApiResponse> {
    return this.courseService.create(createCourseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses with pagination and filters' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by (default: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order (default: desc)',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Courses retrieved successfully',
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: boolean,
  ): Promise<PaginatedResponse> {
    const options: PaginationOptions & { isActive?: boolean } = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    };

    return this.courseService.findAll(options);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get course statistics' })
  @SwaggerResponse({
    status: 200,
    description: 'Course statistics retrieved successfully',
  })
  async getStatistics(): Promise<ApiResponse> {
    return this.courseService.getStatistics();
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get courses by type' })
  @ApiParam({ name: 'type', enum: CourseType, description: 'Course type' })
  @SwaggerResponse({
    status: 200,
    description: 'Courses retrieved successfully',
  })
  async findByType(@Param('type') type: CourseType): Promise<ApiResponse> {
    return this.courseService.findByType(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @SwaggerResponse({
    status: 200,
    description: 'Course retrieved successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Course not found' })
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    return this.courseService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update course by ID' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @SwaggerResponse({ status: 200, description: 'Course updated successfully' })
  @SwaggerResponse({ status: 404, description: 'Course not found' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateCourseDto: UpdateCourseDto,
  ): Promise<ApiResponse> {
    return this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete course by ID' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @SwaggerResponse({ status: 200, description: 'Course deleted successfully' })
  @SwaggerResponse({ status: 404, description: 'Course not found' })
  async remove(@Param('id') id: string): Promise<ApiResponse> {
    return this.courseService.remove(id);
  }
}
