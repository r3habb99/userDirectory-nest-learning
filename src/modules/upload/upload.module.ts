import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FileUploadService } from '../../services/upload/file-upload.service';
import { UploadConfigService } from '../../common/config/upload.config';
import { UploadController } from '../../controllers/upload/upload.controller';
import { memoryStorage } from 'multer';

/**
 * Upload module for handling file uploads
 * Provides reusable upload services and controllers
 */
@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(), // Store files in memory for processing
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB global limit
        files: 10, // Maximum 10 files per request
      },
      fileFilter: (req, file, callback) => {
        // Basic file type check (more detailed validation in service)
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('Invalid file type'), false);
        }
      },
    }),
  ],
  controllers: [UploadController],
  providers: [FileUploadService, UploadConfigService],
  exports: [FileUploadService, UploadConfigService],
})
export class UploadModule {}
