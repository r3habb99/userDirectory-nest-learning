import { ApiProperty } from '@nestjs/swagger';

/**
 * Supported file types for uploads
 */
export enum FileType {
  IMAGE_JPEG = 'image/jpeg',
  IMAGE_PNG = 'image/png',
  IMAGE_WEBP = 'image/webp',
  IMAGE_GIF = 'image/gif',
}

/**
 * Upload categories for organizing files
 */
export enum UploadCategory {
  PROFILE_PHOTOS = 'profile-photos',
  ID_CARDS = 'id-cards',
  DOCUMENTS = 'documents',
  GENERAL = 'general',
}

/**
 * Configuration for file upload validation
 */
export interface UploadConfig {
  /** Maximum file size in bytes */
  maxSize: number;
  /** Allowed file types */
  allowedTypes: FileType[];
  /** Upload category/directory */
  category: UploadCategory;
  /** Maximum width for images (optional) */
  maxWidth?: number;
  /** Maximum height for images (optional) */
  maxHeight?: number;
  /** Whether to resize images to fit dimensions */
  autoResize?: boolean;
  /** Quality for image compression (1-100) */
  quality?: number;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  /** Whether the file is valid */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** File metadata */
  metadata?: FileMetadata;
}

/**
 * File metadata information
 */
export interface FileMetadata {
  /** Original filename */
  originalName: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
  /** File extension */
  extension: string;
  /** Image dimensions (if applicable) */
  dimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Upload result response
 */
export interface UploadResult {
  /** Whether upload was successful */
  success: boolean;
  /** Generated filename */
  filename?: string;
  /** Full file path */
  filePath?: string;
  /** Public URL to access the file */
  url?: string;
  /** File metadata */
  metadata?: FileMetadata;
  /** Error message if upload failed */
  error?: string;
}

/**
 * Bulk upload result
 */
export interface BulkUploadResult {
  /** Whether all uploads were successful */
  success: boolean;
  /** Number of successful uploads */
  successCount: number;
  /** Number of failed uploads */
  failureCount: number;
  /** Individual upload results */
  results: UploadResult[];
  /** General error message if applicable */
  error?: string;
}

/**
 * File upload request DTO
 */
export class FileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload',
  })
  file: Express.Multer.File;

  @ApiProperty({
    enum: UploadCategory,
    description: 'Upload category',
    example: UploadCategory.PROFILE_PHOTOS,
    required: false,
  })
  category?: UploadCategory;
}

/**
 * Multiple file upload request DTO
 */
export class MultipleFileUploadDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Files to upload',
  })
  files: Express.Multer.File[];

  @ApiProperty({
    enum: UploadCategory,
    description: 'Upload category',
    example: UploadCategory.DOCUMENTS,
    required: false,
  })
  category?: UploadCategory;
}

/**
 * Upload response DTO for API responses
 */
export class UploadResponseDto {
  @ApiProperty({
    description: 'Whether upload was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Generated filename',
    example: 'profile-photo-1234567890.jpg',
    required: false,
  })
  filename?: string;

  @ApiProperty({
    description: 'Public URL to access the file',
    example: '/uploads/profile-photos/profile-photo-1234567890.jpg',
    required: false,
  })
  url?: string;

  @ApiProperty({
    description: 'File metadata',
    required: false,
  })
  metadata?: FileMetadata;

  @ApiProperty({
    description: 'Error message if upload failed',
    required: false,
  })
  error?: string;
}

/**
 * Predefined upload configurations for different use cases
 */
export const UPLOAD_CONFIGS: Record<string, UploadConfig> = {
  PROFILE_PHOTO: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      FileType.IMAGE_JPEG,
      FileType.IMAGE_PNG,
      FileType.IMAGE_WEBP,
    ],
    category: UploadCategory.PROFILE_PHOTOS,
    maxWidth: 1024,
    maxHeight: 1024,
    autoResize: true,
    quality: 85,
  },
  ID_CARD_PHOTO: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: [FileType.IMAGE_JPEG, FileType.IMAGE_PNG],
    category: UploadCategory.ID_CARDS,
    maxWidth: 800,
    maxHeight: 600,
    autoResize: true,
    quality: 90,
  },
  DOCUMENT: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [FileType.IMAGE_JPEG, FileType.IMAGE_PNG],
    category: UploadCategory.DOCUMENTS,
    maxWidth: 2048,
    maxHeight: 2048,
    autoResize: false,
    quality: 95,
  },
  GENERAL_IMAGE: {
    maxSize: 8 * 1024 * 1024, // 8MB
    allowedTypes: [
      FileType.IMAGE_JPEG,
      FileType.IMAGE_PNG,
      FileType.IMAGE_WEBP,
      FileType.IMAGE_GIF,
    ],
    category: UploadCategory.GENERAL,
    maxWidth: 1920,
    maxHeight: 1080,
    autoResize: true,
    quality: 80,
  },
};
