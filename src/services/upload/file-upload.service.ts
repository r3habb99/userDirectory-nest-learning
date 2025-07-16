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
import { CacheService } from '../../common/services/cache.service';
import { PerformanceMonitorService } from '../../common/services/performance-monitor.service';

/**
 * Enhanced File upload service with performance optimizations
 * Handles image uploads with validation, processing, caching, and monitoring
 */
@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(
    private readonly uploadConfig: UploadConfigService,
    private readonly cache: CacheService,
    private readonly performanceMonitor: PerformanceMonitorService,
  ) {}

  /**
   * Upload a single file with performance monitoring
   */
  async uploadFile(
    file: Express.Multer.File,
    category: UploadCategory = UploadCategory.GENERAL,
    config?: Partial<UploadConfig>,
  ): Promise<UploadResult> {
    const startTime = Date.now();

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

      // Process and save file with optimization
      await this.processAndSaveFileOptimized(file, filePath, config);

      // Get file metadata
      const metadata = await this.getFileMetadata(file, filePath);

      // Cache file metadata for quick access
      const cacheKey = `file:metadata:${filename}`;
      await this.cache.set(cacheKey, metadata, 24 * 60 * 60 * 1000); // 24 hours

      const duration = Date.now() - startTime;
      this.logger.debug(`File upload completed: ${filename} (${duration}ms)`);

      return {
        success: true,
        filename,
        filePath,
        url: this.uploadConfig.getFileUrl(category, filename),
        metadata,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`File upload failed: (${duration}ms)`, error);
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
   * Process and save file with enhanced optimization and performance monitoring
   */
  private async processAndSaveFileOptimized(
    file: Express.Multer.File,
    filePath: string,
    config?: Partial<UploadConfig>,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Ensure directory exists
      const directory = path.dirname(filePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      // Check if it's an image that needs processing
      const fileTypeResult = await fileTypeFromBuffer(file.buffer);
      const isImage = fileTypeResult?.mime.startsWith('image/');

      if (isImage && (config?.autoResize || config?.quality) && fileTypeResult) {
        await this.processImageOptimized(file, filePath, config);
      } else {
        // Save file directly for non-images or when no processing needed
        await fs.promises.writeFile(filePath, file.buffer);
      }

      const duration = Date.now() - startTime;
      this.logger.debug(`File processed and saved: ${path.basename(filePath)} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`File processing failed: (${duration}ms)`, error);
      throw error;
    }
  }

  /**
   * Legacy method - kept for backward compatibility
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

  /**
   * Optimized image processing with performance monitoring
   */
  private async processImageOptimized(
    file: Express.Multer.File,
    filePath: string,
    config?: Partial<UploadConfig>,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      let sharpInstance = sharp(file.buffer);

      // Apply optimizations based on config
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

      // Apply quality settings for JPEG
      if (config?.quality && path.extname(filePath).toLowerCase() === '.jpg') {
        sharpInstance = sharpInstance.jpeg({ quality: config.quality });
      }

      // Apply PNG optimization
      if (path.extname(filePath).toLowerCase() === '.png') {
        sharpInstance = sharpInstance.png({
          compressionLevel: 9,
          adaptiveFiltering: true,
        });
      }

      // Apply WebP conversion if enabled
      if (config?.convertToWebP) {
        const webpPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        await sharpInstance.webp({ quality: config.quality || 80 }).toFile(webpPath);

        // Also save original format
        await sharpInstance.toFile(filePath);
      } else {
        await sharpInstance.toFile(filePath);
      }

      const duration = Date.now() - startTime;
      this.logger.debug(`Image processed: ${path.basename(filePath)} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Image processing failed: (${duration}ms)`, error);
      throw error;
    }
  }
}
