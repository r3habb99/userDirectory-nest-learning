import { Test, TestingModule } from '@nestjs/testing';
import { FileUploadService } from './file-upload.service';
import { UploadConfigService } from '../../common/config/upload.config';
import { UploadCategory, FileType } from '../../common/interfaces/upload.interface';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock sharp module
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue(undefined),
  }));
});

// Mock file-type module
jest.mock('file-type', () => ({
  fileTypeFromBuffer: jest.fn().mockResolvedValue({
    mime: 'image/jpeg',
    ext: 'jpg',
  }),
}));

describe('FileUploadService', () => {
  let service: FileUploadService;
  let uploadConfig: UploadConfigService;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 1024, // 1MB
    buffer: Buffer.from('fake-image-data'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        {
          provide: UploadConfigService,
          useValue: {
            generateFilename: jest.fn().mockReturnValue('test-file-123.jpg'),
            getFilePath: jest.fn().mockReturnValue('/uploads/test/test-file-123.jpg'),
            getFileUrl: jest.fn().mockReturnValue('/uploads/test/test-file-123.jpg'),
            getMaxFileSize: jest.fn().mockReturnValue(5 * 1024 * 1024), // 5MB
            getAllowedTypes: jest.fn().mockReturnValue([FileType.IMAGE_JPEG, FileType.IMAGE_PNG]),
            formatFileSize: jest.fn().mockReturnValue('1 MB'),
          },
        },
      ],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);
    uploadConfig = module.get<UploadConfigService>(UploadConfigService);

    // Setup fs mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue(undefined);
    mockFs.unlinkSync.mockReturnValue(undefined);
    mockFs.statSync.mockReturnValue({ size: 1024 } as any);
    mockFs.readFileSync.mockReturnValue(Buffer.from('fake-data'));
    mockFs.readdirSync.mockReturnValue(['file1.jpg', 'file2.png'] as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should successfully upload a valid file', async () => {
      const result = await service.uploadFile(mockFile, UploadCategory.PROFILE_PHOTOS);

      expect(result.success).toBe(true);
      expect(result.filename).toBe('test-file-123.jpg');
      expect(result.url).toBe('/uploads/test/test-file-123.jpg');
      expect(uploadConfig.generateFilename).toHaveBeenCalledWith(
        mockFile.originalname,
        UploadCategory.PROFILE_PHOTOS,
      );
    });

    it('should fail validation for oversized file', async () => {
      const largeFile = { ...mockFile, size: 10 * 1024 * 1024 }; // 10MB
      (uploadConfig.getMaxFileSize as jest.Mock).mockReturnValue(5 * 1024 * 1024); // 5MB limit

      const result = await service.uploadFile(largeFile, UploadCategory.PROFILE_PHOTOS);

      expect(result.success).toBe(false);
      expect(result.error).toContain('File size exceeds limit');
    });

    it('should fail validation for invalid file type', async () => {
      const { fileTypeFromBuffer } = require('file-type');
      fileTypeFromBuffer.mockResolvedValueOnce({
        mime: 'application/pdf',
        ext: 'pdf',
      });

      const result = await service.uploadFile(mockFile, UploadCategory.PROFILE_PHOTOS);

      expect(result.success).toBe(false);
      expect(result.error).toContain('File type application/pdf is not allowed');
    });

    it('should handle missing file', async () => {
      const result = await service.uploadFile(null as any, UploadCategory.PROFILE_PHOTOS);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No file provided');
    });
  });

  describe('uploadMultipleFiles', () => {
    it('should upload multiple valid files', async () => {
      const files = [mockFile, { ...mockFile, originalname: 'test2.jpg' }];

      const result = await service.uploadMultipleFiles(files, UploadCategory.DOCUMENTS);

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.results).toHaveLength(2);
    });

    it('should handle mixed success and failure', async () => {
      const files = [
        mockFile,
        { ...mockFile, size: 10 * 1024 * 1024, originalname: 'large.jpg' }, // Too large
      ];
      (uploadConfig.getMaxFileSize as jest.Mock).mockReturnValue(5 * 1024 * 1024);

      const result = await service.uploadMultipleFiles(files, UploadCategory.DOCUMENTS);

      expect(result.success).toBe(false);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.results).toHaveLength(2);
    });
  });

  describe('validateFile', () => {
    it('should validate a correct file', async () => {
      const result = await service.validateFile(mockFile, UploadCategory.PROFILE_PHOTOS);

      expect(result.isValid).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.originalName).toBe('test-image.jpg');
      expect(result.metadata?.mimeType).toBe('image/jpeg');
    });

    it('should reject file without buffer', async () => {
      const invalidFile = { ...mockFile, buffer: undefined as any };

      const result = await service.validateFile(invalidFile, UploadCategory.PROFILE_PHOTOS);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No file provided');
    });

    it('should validate image dimensions', async () => {
      const config = {
        maxWidth: 500,
        maxHeight: 400,
        allowedTypes: [FileType.IMAGE_JPEG],
        maxSize: 5 * 1024 * 1024,
      };

      const result = await service.validateFile(mockFile, UploadCategory.PROFILE_PHOTOS, config);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Image width 800px exceeds maximum of 500px');
    });
  });

  describe('deleteFile', () => {
    it('should successfully delete an existing file', async () => {
      mockFs.existsSync.mockReturnValue(true);

      const result = await service.deleteFile(UploadCategory.PROFILE_PHOTOS, 'test-file.jpg');

      expect(result).toBe(true);
      expect(mockFs.unlinkSync).toHaveBeenCalled();
    });

    it('should return false for non-existent file', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await service.deleteFile(UploadCategory.PROFILE_PHOTOS, 'non-existent.jpg');

      expect(result).toBe(false);
      expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should handle deletion errors gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await service.deleteFile(UploadCategory.PROFILE_PHOTOS, 'test-file.jpg');

      expect(result).toBe(false);
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', () => {
      mockFs.existsSync.mockReturnValue(true);

      const result = service.fileExists(UploadCategory.PROFILE_PHOTOS, 'test-file.jpg');

      expect(result).toBe(true);
    });

    it('should return false for non-existing file', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = service.fileExists(UploadCategory.PROFILE_PHOTOS, 'test-file.jpg');

      expect(result).toBe(false);
    });
  });

  describe('getFileInfo', () => {
    it('should return file info for existing file', async () => {
      mockFs.existsSync.mockReturnValue(true);

      const result = await service.getFileInfo(UploadCategory.PROFILE_PHOTOS, 'test-file.jpg');

      expect(result).toBeDefined();
      expect(result?.originalName).toBe('test-file.jpg');
      expect(result?.size).toBe(1024);
      expect(result?.mimeType).toBe('image/jpeg');
    });

    it('should return null for non-existing file', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await service.getFileInfo(UploadCategory.PROFILE_PHOTOS, 'non-existent.jpg');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockImplementation(() => {
        throw new Error('File access error');
      });

      const result = await service.getFileInfo(UploadCategory.PROFILE_PHOTOS, 'test-file.jpg');

      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle file processing errors', async () => {
      const sharp = require('sharp');
      sharp.mockImplementation(() => {
        throw new Error('Sharp processing error');
      });

      const result = await service.uploadFile(mockFile, UploadCategory.PROFILE_PHOTOS);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle file system errors', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Disk full');
      });

      const result = await service.uploadFile(mockFile, UploadCategory.PROFILE_PHOTOS);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
