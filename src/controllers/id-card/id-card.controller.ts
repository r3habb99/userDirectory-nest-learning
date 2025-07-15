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
  async findByStudentId(
    @Param('studentId') studentId: string,
  ): Promise<ApiResponse> {
    return this.idCardService.findByStudentId(studentId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    return this.idCardService.findOne(id);
  }

  @Patch(':id/deactivate')
  async deactivateIdCard(@Param('id') id: string): Promise<ApiResponse> {
    return this.idCardService.deactivateIdCard(id);
  }
}
