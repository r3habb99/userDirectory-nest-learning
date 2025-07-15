import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileUploadService } from '../../services/upload/file-upload.service';
import { UploadConfigService } from '../../common/config/upload.config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  UploadCategory,
  FileUploadDto,
  MultipleFileUploadDto,
  UploadResponseDto,
  UPLOAD_CONFIGS,
} from '../../common/interfaces/upload.interface';
import { ApiResponse } from '../../common/interfaces/api-response.interface';

@ApiTags('File Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly uploadConfigService: UploadConfigService,
  ) {}

  @Post('profile-photo')
  @ApiOperation({ summary: 'Upload profile photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Profile photo upload',
    type: FileUploadDto,
  })
  @SwaggerResponse({
    status: 201,
    description: 'Profile photo uploaded successfully',
    type: UploadResponseDto,
  })
  @SwaggerResponse({
    status: 400,
    description: 'Invalid file or validation failed',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.fileUploadService.uploadFile(
      file,
      UploadCategory.PROFILE_PHOTOS,
      UPLOAD_CONFIGS.PROFILE_PHOTO,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      message: 'Profile photo uploaded successfully',
      data: result,
      statusCode: 201,
    };
  }

  @Post('id-card-photo')
  @ApiOperation({ summary: 'Upload ID card photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'ID card photo upload',
    type: FileUploadDto,
  })
  @SwaggerResponse({
    status: 201,
    description: 'ID card photo uploaded successfully',
    type: UploadResponseDto,
  })
  @SwaggerResponse({
    status: 400,
    description: 'Invalid file or validation failed',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadIdCardPhoto(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.fileUploadService.uploadFile(
      file,
      UploadCategory.ID_CARDS,
      UPLOAD_CONFIGS.ID_CARD_PHOTO,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      message: 'ID card photo uploaded successfully',
      data: result,
      statusCode: 201,
    };
  }

  @Post('document')
  @ApiOperation({ summary: 'Upload document image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document upload',
    type: FileUploadDto,
  })
  @SwaggerResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: UploadResponseDto,
  })
  @SwaggerResponse({
    status: 400,
    description: 'Invalid file or validation failed',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.fileUploadService.uploadFile(
      file,
      UploadCategory.DOCUMENTS,
      UPLOAD_CONFIGS.DOCUMENT,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      message: 'Document uploaded successfully',
      data: result,
      statusCode: 201,
    };
  }

  @Post('general')
  @ApiOperation({ summary: 'Upload general image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'General image upload',
    type: FileUploadDto,
  })
  @SwaggerResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: UploadResponseDto,
  })
  @SwaggerResponse({
    status: 400,
    description: 'Invalid file or validation failed',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadGeneralImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.fileUploadService.uploadFile(
      file,
      UploadCategory.GENERAL,
      UPLOAD_CONFIGS.GENERAL_IMAGE,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      message: 'Image uploaded successfully',
      data: result,
      statusCode: 201,
    };
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Multiple file upload',
    type: MultipleFileUploadDto,
  })
  @SwaggerResponse({
    status: 201,
    description: 'Files uploaded successfully',
  })
  @SwaggerResponse({
    status: 400,
    description: 'Invalid files or validation failed',
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('category') category: UploadCategory = UploadCategory.GENERAL,
  ): Promise<ApiResponse> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const config = UPLOAD_CONFIGS.GENERAL_IMAGE;
    const result = await this.fileUploadService.uploadMultipleFiles(
      files,
      category,
      config,
    );

    return {
      success: result.success,
      message: result.success
        ? 'All files uploaded successfully'
        : `${result.successCount} files uploaded, ${result.failureCount} failed`,
      data: result,
      statusCode: result.success ? 201 : 207, // 207 Multi-Status for partial success
    };
  }

  @Get('info/:category/:filename')
  @ApiOperation({ summary: 'Get file information' })
  @ApiParam({
    name: 'category',
    enum: UploadCategory,
    description: 'File category',
  })
  @ApiParam({
    name: 'filename',
    description: 'Filename',
  })
  @SwaggerResponse({
    status: 200,
    description: 'File information retrieved successfully',
  })
  @SwaggerResponse({
    status: 404,
    description: 'File not found',
  })
  async getFileInfo(
    @Param('category') category: UploadCategory,
    @Param('filename') filename: string,
  ): Promise<ApiResponse> {
    const fileInfo = await this.fileUploadService.getFileInfo(category, filename);
    
    if (!fileInfo) {
      throw new NotFoundException('File not found');
    }

    return {
      success: true,
      message: 'File information retrieved successfully',
      data: fileInfo,
      statusCode: 200,
    };
  }

  @Delete(':category/:filename')
  @ApiOperation({ summary: 'Delete uploaded file' })
  @ApiParam({
    name: 'category',
    enum: UploadCategory,
    description: 'File category',
  })
  @ApiParam({
    name: 'filename',
    description: 'Filename to delete',
  })
  @SwaggerResponse({
    status: 200,
    description: 'File deleted successfully',
  })
  @SwaggerResponse({
    status: 404,
    description: 'File not found',
  })
  async deleteFile(
    @Param('category') category: UploadCategory,
    @Param('filename') filename: string,
  ): Promise<ApiResponse> {
    const deleted = await this.fileUploadService.deleteFile(category, filename);
    
    if (!deleted) {
      throw new NotFoundException('File not found');
    }

    return {
      success: true,
      message: 'File deleted successfully',
      statusCode: 200,
    };
  }

  @Get('disk-usage')
  @ApiOperation({ summary: 'Get disk usage statistics' })
  @SwaggerResponse({
    status: 200,
    description: 'Disk usage statistics retrieved successfully',
  })
  async getDiskUsage(): Promise<ApiResponse> {
    const usage = await this.uploadConfigService.getDiskUsage();

    return {
      success: true,
      message: 'Disk usage statistics retrieved successfully',
      data: usage,
      statusCode: 200,
    };
  }
}
