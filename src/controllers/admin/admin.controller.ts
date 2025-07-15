import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from '../../services/admin/admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiResponse,
  PaginatedResponse,
} from '../../common/interfaces/api-response.interface';
import { UpdateAdminStatusDto } from '../../dto/admin/update-admin-status.dto';

@ApiTags('Admin Management')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get all admins with pagination' })
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
  @SwaggerResponse({
    status: 200,
    description: 'Admins retrieved successfully',
  })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ): Promise<PaginatedResponse> {
    return this.adminService.findAll(page, limit);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get admin statistics' })
  @SwaggerResponse({
    status: 200,
    description: 'Admin statistics retrieved successfully',
  })
  async getStatistics(): Promise<ApiResponse> {
    return this.adminService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get admin by ID' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @SwaggerResponse({ status: 200, description: 'Admin retrieved successfully' })
  @SwaggerResponse({ status: 404, description: 'Admin not found' })
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    return this.adminService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update admin status (activate/deactivate)' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @SwaggerResponse({
    status: 200,
    description: 'Admin status updated successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Admin not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body(ValidationPipe) updateStatusDto: UpdateAdminStatusDto,
  ): Promise<ApiResponse> {
    return this.adminService.updateStatus(id, updateStatusDto.isActive);
  }
}
