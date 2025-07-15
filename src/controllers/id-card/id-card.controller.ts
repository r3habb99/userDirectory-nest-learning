import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
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
import { IdCardService } from '../../services/id-card/id-card.service';
import { CreateIdCardDto } from '../../dto/id-card/create-id-card.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiResponse,
  PaginatedResponse,
} from '../../common/interfaces/api-response.interface';

@ApiTags('ID Cards')
@Controller('id-cards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class IdCardController {
  constructor(private readonly idCardService: IdCardService) {}

  @Post()
  @ApiOperation({ summary: 'Generate ID card for a student' })
  @SwaggerResponse({
    status: 201,
    description: 'ID card generated successfully',
  })
  @SwaggerResponse({
    status: 400,
    description: 'Student not found or active ID card already exists',
  })
  async generateIdCard(
    @Body(ValidationPipe) createIdCardDto: CreateIdCardDto,
  ): Promise<ApiResponse> {
    return this.idCardService.generateIdCard(createIdCardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ID cards with pagination' })
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
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @SwaggerResponse({
    status: 200,
    description: 'ID cards retrieved successfully',
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isActive') isActive?: boolean,
  ): Promise<PaginatedResponse> {
    return this.idCardService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      isActive !== undefined ? Boolean(isActive) : undefined,
    );
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get ID card by student ID' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @SwaggerResponse({
    status: 200,
    description: 'ID card retrieved successfully',
  })
  @SwaggerResponse({ status: 404, description: 'ID card not found' })
  async findByStudentId(
    @Param('studentId') studentId: string,
  ): Promise<ApiResponse> {
    return this.idCardService.findByStudentId(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ID card by ID' })
  @ApiParam({ name: 'id', description: 'ID card ID' })
  @SwaggerResponse({
    status: 200,
    description: 'ID card retrieved successfully',
  })
  @SwaggerResponse({ status: 404, description: 'ID card not found' })
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    return this.idCardService.findOne(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate an ID card' })
  @ApiParam({ name: 'id', description: 'ID card ID' })
  @SwaggerResponse({
    status: 200,
    description: 'ID card deactivated successfully',
  })
  @SwaggerResponse({ status: 404, description: 'ID card not found' })
  async deactivateIdCard(@Param('id') id: string): Promise<ApiResponse> {
    return this.idCardService.deactivateIdCard(id);
  }
}
