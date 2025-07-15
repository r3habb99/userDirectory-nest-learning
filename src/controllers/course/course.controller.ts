import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  // UseGuards,
  ValidationPipe,
} from '@nestjs/common';
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

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  async create(
    @Body(ValidationPipe) createCourseDto: CreateCourseDto,
  ): Promise<ApiResponse> {
    return this.courseService.create(createCourseDto);
  }

  @Get()
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
  async getStatistics(): Promise<ApiResponse> {
    return this.courseService.getStatistics();
  }

  @Get('type/:type')
  async findByType(@Param('type') type: CourseType): Promise<ApiResponse> {
    return this.courseService.findByType(type);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    return this.courseService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateCourseDto: UpdateCourseDto,
  ): Promise<ApiResponse> {
    return this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse> {
    return this.courseService.remove(id);
  }
}
