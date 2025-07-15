import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import {
  UploadConfig,
  UploadCategory,
  FileType,
  FileValidationResult,
  FileMetadata,
  UploadResult,
  BulkUploadResult,
} from '../../common/interfaces/upload.interface';
import { UploadConfigService } from '../../common/config/upload.config';

/**
 * File upload service for handling image uploads with validation and processing
 */
@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(private readonly uploadConfig: UploadConfigService) {}

  /**
   * Upload a single file
   */
  async uploadFile(
    file: Express.Multer.File,
    category: UploadCategory = UploadCategory.GENERAL,
    config?: Partial<UploadConfig>,
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = await this.validateFile(file, category, config);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generate unique filename
      const filename = this.uploadConfig.generateFilename(
        file.originalname,
        category,
      );
      const filePath = this.uploadConfig.getFilePath(category, filename);

      // Process and save file
      await this.processAndSaveFile(file, filePath, config);

      // Get file metadata
      const metadata = await this.getFileMetadata(file, filePath);

      return {
        success: true,
        filename,
        filePath,
        url: this.uploadConfig.getFileUrl(category, filename),
        metadata,
      };
    } catch (error) {
      this.logger.error('File upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    category: UploadCategory = UploadCategory.GENERAL,
    config?: Partial<UploadConfig>,
  ): Promise<BulkUploadResult> {
    const results: UploadResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const file of files) {
      const result = await this.uploadFile(file, category, config);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    return {
      success: failureCount === 0,
      successCount,
      failureCount,
      results,
      error: failureCount > 0 ? `${failureCount} uploads failed` : undefined,
    };
  }

  /**
   * Validate uploaded file
   */
  async validateFile(
    file: Express.Multer.File,
    category: UploadCategory,
    config?: Partial<UploadConfig>,
  ): Promise<FileValidationResult> {
    try {
      // Check if file exists
      if (!file || !file.buffer) {
        return {
          isValid: false,
          error: 'No file provided',
        };
      }

      // Check file size
      const maxSize =
        config?.maxSize || this.uploadConfig.getMaxFileSize(category);
      if (file.size > maxSize) {
        return {
          isValid: false,
          error: `File size exceeds limit of ${this.uploadConfig.formatFileSize(maxSize)}`,
        };
      }

      // Detect actual file type from buffer
      const fileTypeResult = await fileTypeFromBuffer(file.buffer);
      if (!fileTypeResult) {
        return {
          isValid: false,
          error: 'Unable to determine file type',
        };
      }

      // Check if file type is allowed
      const allowedTypes =
        config?.allowedTypes || this.uploadConfig.getAllowedTypes(category);
      if (!allowedTypes.includes(fileTypeResult.mime as FileType)) {
        return {
          isValid: false,
          error: `File type ${fileTypeResult.mime} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        };
      }

      // Get image dimensions if it's an image
      let dimensions: { width: number; height: number } | undefined;
      if (fileTypeResult.mime.startsWith('image/')) {
        try {
          const imageInfo = await sharp(file.buffer).metadata();
          dimensions = {
            width: imageInfo.width || 0,
            height: imageInfo.height || 0,
          };

          // Check image dimensions if specified
          if (config?.maxWidth && dimensions.width > config.maxWidth) {
            return {
              isValid: false,
              error: `Image width ${dimensions.width}px exceeds maximum of ${config.maxWidth}px`,
            };
          }

          if (config?.maxHeight && dimensions.height > config.maxHeight) {
            return {
              isValid: false,
              error: `Image height ${dimensions.height}px exceeds maximum of ${config.maxHeight}px`,
            };
          }
        } catch (error) {
          this.logger.warn('Could not get image dimensions:', error);
        }
      }

      const metadata: FileMetadata = {
        originalName: file.originalname,
        size: file.size,
        mimeType: fileTypeResult.mime,
        extension: fileTypeResult.ext,
        dimensions,
      };

      return {
        isValid: true,
        metadata,
      };
    } catch (error) {
      this.logger.error('File validation failed:', error);
      return {
        isValid: false,
        error: 'File validation failed',
      };
    }
  }

  /**
   * Process and save file with optional image optimization
   */
  private async processAndSaveFile(
    file: Express.Multer.File,
    filePath: string,
    config?: Partial<UploadConfig>,
  ): Promise<void> {
    // Ensure directory exists
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Check if it's an image that needs processing
    const fileTypeResult = await fileTypeFromBuffer(file.buffer);
    const isImage = fileTypeResult?.mime.startsWith('image/');

    if (isImage && (config?.autoResize || config?.quality) && fileTypeResult) {
      // Process image with Sharp
      let sharpInstance = sharp(file.buffer);

      // Resize if needed
      if (config?.autoResize && (config?.maxWidth || config?.maxHeight)) {
        sharpInstance = sharpInstance.resize(
          config.maxWidth,
          config.maxHeight,
          {
            fit: 'inside',
            withoutEnlargement: true,
          },
        );
      }

      // Set quality if specified
      if (config?.quality) {
        if (fileTypeResult.mime === 'image/jpeg') {
          sharpInstance = sharpInstance.jpeg({ quality: config.quality });
        } else if (fileTypeResult.mime === 'image/png') {
          sharpInstance = sharpInstance.png({ quality: config.quality });
        } else if (fileTypeResult.mime === 'image/webp') {
          sharpInstance = sharpInstance.webp({ quality: config.quality });
        }
      }

      // Save processed image
      await sharpInstance.toFile(filePath);
    } else {
      // Save file as-is
      fs.writeFileSync(filePath, file.buffer);
    }
  }

  /**
   * Get file metadata
   */
  private async getFileMetadata(
    file: Express.Multer.File,
    filePath: string,
  ): Promise<FileMetadata> {
    const fileTypeResult = await fileTypeFromBuffer(file.buffer);
    let dimensions: { width: number; height: number } | undefined;

    // Get image dimensions if it's an image
    if (fileTypeResult?.mime.startsWith('image/')) {
      try {
        const imageInfo = await sharp(filePath).metadata();
        dimensions = {
          width: imageInfo.width || 0,
          height: imageInfo.height || 0,
        };
      } catch (error) {
        this.logger.warn('Could not get image dimensions:', error);
      }
    }

    return {
      originalName: file.originalname,
      size: file.size,
      mimeType: fileTypeResult?.mime || 'application/octet-stream',
      extension: fileTypeResult?.ext || '',
      dimensions,
    };
  }

  /**
   * Delete a file
   */
  async deleteFile(
    category: UploadCategory,
    filename: string,
  ): Promise<boolean> {
    try {
      const filePath = this.uploadConfig.getFilePath(category, filename);

      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        this.logger.log(`Deleted file: ${filePath}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('File deletion failed:', error);
      return false;
    }
  }

  /**
   * Check if file exists
   */
  fileExists(category: UploadCategory, filename: string): boolean {
    const filePath = this.uploadConfig.getFilePath(category, filename);
    return fs.existsSync(filePath);
  }

  /**
   * Get file info
   */
  async getFileInfo(
    category: UploadCategory,
    filename: string,
  ): Promise<FileMetadata | null> {
    try {
      const filePath = this.uploadConfig.getFilePath(category, filename);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      const stats = fs.statSync(filePath);
      const buffer = fs.readFileSync(filePath);
      const fileTypeResult = await fileTypeFromBuffer(buffer);

      let dimensions: { width: number; height: number } | undefined;
      if (fileTypeResult?.mime.startsWith('image/')) {
        try {
          const imageInfo = await sharp(filePath).metadata();
          dimensions = {
            width: imageInfo.width || 0,
            height: imageInfo.height || 0,
          };
        } catch (error) {
          this.logger.warn('Could not get image dimensions:', error);
        }
      }

      return {
        originalName: filename,
        size: stats.size,
        mimeType: fileTypeResult?.mime || 'application/octet-stream',
        extension: fileTypeResult?.ext || '',
        dimensions,
      };
    } catch (error) {
      this.logger.error('Failed to get file info:', error);
      return null;
    }
  }
}
