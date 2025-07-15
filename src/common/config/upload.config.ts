import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import {
  UploadConfig,
  UploadCategory,
  FileType,
  UPLOAD_CONFIGS,
} from '../interfaces/upload.interface';
import { getBaseUrl } from './api.config';

/**
 * Upload configuration service
 * Manages upload settings, paths, and validation rules
 */
@Injectable()
export class UploadConfigService {
  private readonly baseUploadPath: string;
  private readonly baseUrl: string;

  constructor() {
    // Set base upload directory
    this.baseUploadPath =
      process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');

    // Set base URL for serving files
    this.baseUrl = process.env.BASE_URL || getBaseUrl();

    // Ensure upload directories exist
    this.ensureUploadDirectories();
  }

  /**
   * Get upload configuration for a specific type
   */
  getUploadConfig(configName: string): UploadConfig {
    const config = UPLOAD_CONFIGS[configName];
    if (!config) {
      throw new Error(`Upload configuration '${configName}' not found`);
    }
    return config;
  }

  /**
   * Get upload path for a category
   */
  getUploadPath(category: UploadCategory): string {
    return path.join(this.baseUploadPath, category);
  }

  /**
   * Get full file path
   */
  getFilePath(category: UploadCategory, filename: string): string {
    return path.join(this.getUploadPath(category), filename);
  }

  /**
   * Get public URL for a file
   */
  getFileUrl(category: UploadCategory, filename: string): string {
    return `/uploads/${category}/${filename}`;
  }

  /**
   * Get absolute URL for a file
   */
  getAbsoluteFileUrl(category: UploadCategory, filename: string): string {
    return `${this.baseUrl}${this.getFileUrl(category, filename)}`;
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalName: string, category: UploadCategory): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName).toLowerCase();
    const baseName = path
      .basename(originalName, extension)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .substring(0, 20);

    return `${category}-${baseName}-${timestamp}-${randomSuffix}${extension}`;
  }

  /**
   * Get maximum file size for a category
   */
  getMaxFileSize(category: UploadCategory): number {
    // Default max sizes by category
    const defaultSizes = {
      [UploadCategory.PROFILE_PHOTOS]: 5 * 1024 * 1024, // 5MB
      [UploadCategory.ID_CARDS]: 2 * 1024 * 1024, // 2MB
      [UploadCategory.DOCUMENTS]: 10 * 1024 * 1024, // 10MB
      [UploadCategory.GENERAL]: 8 * 1024 * 1024, // 8MB
    };

    return defaultSizes[category] || 5 * 1024 * 1024; // Default 5MB
  }

  /**
   * Get allowed file types for a category
   */
  getAllowedTypes(category: UploadCategory): FileType[] {
    const defaultTypes = {
      [UploadCategory.PROFILE_PHOTOS]: [
        FileType.IMAGE_JPEG,
        FileType.IMAGE_PNG,
        FileType.IMAGE_WEBP,
      ],
      [UploadCategory.ID_CARDS]: [FileType.IMAGE_JPEG, FileType.IMAGE_PNG],
      [UploadCategory.DOCUMENTS]: [FileType.IMAGE_JPEG, FileType.IMAGE_PNG],
      [UploadCategory.GENERAL]: [
        FileType.IMAGE_JPEG,
        FileType.IMAGE_PNG,
        FileType.IMAGE_WEBP,
        FileType.IMAGE_GIF,
      ],
    };

    return defaultTypes[category] || [FileType.IMAGE_JPEG, FileType.IMAGE_PNG];
  }

  /**
   * Check if file type is allowed for category
   */
  isFileTypeAllowed(mimeType: string, category: UploadCategory): boolean {
    const allowedTypes = this.getAllowedTypes(category);
    return allowedTypes.includes(mimeType as FileType);
  }

  /**
   * Check if file size is within limits
   */
  isFileSizeValid(size: number, category: UploadCategory): boolean {
    const maxSize = this.getMaxFileSize(category);
    return size <= maxSize;
  }

  /**
   * Get human-readable file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file extension from mime type
   */
  getExtensionFromMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };

    return extensions[mimeType] || '.bin';
  }

  /**
   * Ensure all upload directories exist
   */
  private ensureUploadDirectories(): void {
    // Create base upload directory
    if (!fs.existsSync(this.baseUploadPath)) {
      fs.mkdirSync(this.baseUploadPath, { recursive: true });
    }

    // Create category directories
    Object.values(UploadCategory).forEach((category) => {
      const categoryPath = this.getUploadPath(category);
      if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
      }
    });
  }

  /**
   * Clean up old files (optional utility method)
   */
  cleanupOldFiles(category: UploadCategory, maxAgeInDays: number = 30): number {
    const categoryPath = this.getUploadPath(category);
    const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000; // Convert to milliseconds
    const now = Date.now();
    let deletedCount = 0;

    try {
      const files = fs.readdirSync(categoryPath);

      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    } catch (error) {
      console.error(`Error cleaning up files in ${category}:`, error);
    }

    return deletedCount;
  }

  /**
   * Get disk usage for upload directories
   */
  getDiskUsage(): Record<UploadCategory, { files: number; size: number }> {
    const usage = {} as Record<UploadCategory, { files: number; size: number }>;

    for (const category of Object.values(UploadCategory)) {
      const categoryPath = this.getUploadPath(category);
      let files = 0;
      let size = 0;

      try {
        if (fs.existsSync(categoryPath)) {
          const fileList = fs.readdirSync(categoryPath);
          files = fileList.length;

          for (const file of fileList) {
            const filePath = path.join(categoryPath, file);
            const stats = fs.statSync(filePath);
            size += stats.size;
          }
        }
      } catch (error) {
        console.error(`Error calculating disk usage for ${category}:`, error);
      }

      usage[category] = { files, size };
    }

    return usage;
  }
}
