import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UploadCategory } from '../../common/interfaces/upload.interface';

/**
 * Base upload DTO for single file uploads
 */
export class SingleFileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload',
  })
  file: Express.Multer.File;

  @ApiPropertyOptional({
    enum: UploadCategory,
    description: 'Upload category (optional, defaults to GENERAL)',
    example: UploadCategory.PROFILE_PHOTOS,
  })
  @IsOptional()
  @IsEnum(UploadCategory, {
    message: 'Category must be a valid upload category',
  })
  category?: UploadCategory;
}

/**
 * Profile photo upload DTO
 */
export class ProfilePhotoUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Profile photo to upload (JPEG, PNG, WebP)',
  })
  file: Express.Multer.File;
}

/**
 * ID card photo upload DTO
 */
export class IdCardPhotoUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'ID card photo to upload (JPEG, PNG)',
  })
  file: Express.Multer.File;
}

/**
 * Document upload DTO
 */
export class DocumentUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Document image to upload (JPEG, PNG)',
  })
  file: Express.Multer.File;

  @ApiPropertyOptional({
    description: 'Document title or description',
    example: 'Student Certificate',
  })
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  title?: string;
}

/**
 * Multiple files upload DTO
 */
export class MultipleFilesUploadDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Multiple files to upload',
  })
  files: Express.Multer.File[];

  @ApiPropertyOptional({
    enum: UploadCategory,
    description: 'Upload category for all files',
    example: UploadCategory.DOCUMENTS,
  })
  @IsOptional()
  @IsEnum(UploadCategory, {
    message: 'Category must be a valid upload category',
  })
  category?: UploadCategory;
}

/**
 * Student profile photo update DTO
 */
export class StudentProfilePhotoDto {
  @ApiProperty({
    description: 'Student ID',
    example: 'clp1234567890abcdef',
  })
  @IsString({ message: 'Student ID must be a string' })
  @IsNotEmpty({ message: 'Student ID is required' })
  studentId: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Profile photo file',
  })
  file: Express.Multer.File;
}

/**
 * File deletion DTO
 */
export class FileDeleteDto {
  @ApiProperty({
    enum: UploadCategory,
    description: 'File category',
    example: UploadCategory.PROFILE_PHOTOS,
  })
  @IsEnum(UploadCategory, {
    message: 'Category must be a valid upload category',
  })
  category: UploadCategory;

  @ApiProperty({
    description: 'Filename to delete',
    example: 'profile-photos-john-doe-1234567890-abc123.jpg',
  })
  @IsString({ message: 'Filename must be a string' })
  @IsNotEmpty({ message: 'Filename is required' })
  filename: string;
}

/**
 * File info request DTO
 */
export class FileInfoDto {
  @ApiProperty({
    enum: UploadCategory,
    description: 'File category',
    example: UploadCategory.PROFILE_PHOTOS,
  })
  @IsEnum(UploadCategory, {
    message: 'Category must be a valid upload category',
  })
  category: UploadCategory;

  @ApiProperty({
    description: 'Filename to get info for',
    example: 'profile-photos-john-doe-1234567890-abc123.jpg',
  })
  @IsString({ message: 'Filename must be a string' })
  @IsNotEmpty({ message: 'Filename is required' })
  filename: string;
}

/**
 * Upload response DTO
 */
export class UploadResponseDto {
  @ApiProperty({
    description: 'Whether upload was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'File uploaded successfully',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Generated filename',
    example: 'profile-photos-john-doe-1234567890-abc123.jpg',
  })
  filename?: string;

  @ApiPropertyOptional({
    description: 'Public URL to access the file',
    example:
      '/uploads/profile-photos/profile-photos-john-doe-1234567890-abc123.jpg',
  })
  url?: string;

  @ApiPropertyOptional({
    description: 'File metadata',
  })
  metadata?: {
    originalName: string;
    size: number;
    mimeType: string;
    extension: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };

  @ApiPropertyOptional({
    description: 'Error message if upload failed',
  })
  error?: string;
}

/**
 * Bulk upload response DTO
 */
export class BulkUploadResponseDto {
  @ApiProperty({
    description: 'Whether all uploads were successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'All files uploaded successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Number of successful uploads',
    example: 3,
  })
  successCount: number;

  @ApiProperty({
    description: 'Number of failed uploads',
    example: 0,
  })
  failureCount: number;

  @ApiProperty({
    description: 'Individual upload results',
    type: [UploadResponseDto],
  })
  results: UploadResponseDto[];
}

/**
 * File validation error DTO
 */
export class FileValidationErrorDto {
  @ApiProperty({
    description: 'Error message',
    example: 'File size exceeds limit of 5MB',
  })
  message: string;

  @ApiProperty({
    description: 'Error code',
    example: 'FILE_TOO_LARGE',
  })
  code: string;

  @ApiPropertyOptional({
    description: 'Additional error details',
  })
  details?: Record<string, any>;
}
