import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { FileUploadService } from '../../services/upload/file-upload.service';
import { UploadConfigService } from '../../common/config/upload.config';
import { UploadCategory } from '../../common/interfaces/upload.interface';

describe('UploadController', () => {
  let controller: UploadController;
  let fileUploadService: jest.Mocked<FileUploadService>;
  let uploadConfigService: jest.Mocked<UploadConfigService>;

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

  const mockUploadResult = {
    success: true,
    filename: 'test-file-123.jpg',
    filePath: '/uploads/profile-photos/test-file-123.jpg',
    url: '/uploads/profile-photos/test-file-123.jpg',
    metadata: {
      originalName: 'test-image.jpg',
      size: 1024 * 1024,
      mimeType: 'image/jpeg',
      extension: 'jpg',
    },
  };

  beforeEach(async () => {
    const mockFileUploadService = {
      uploadFile: jest.fn(),
      uploadMultipleFiles: jest.fn(),
      deleteFile: jest.fn(),
      getFileInfo: jest.fn(),
    };

    const mockUploadConfigService = {
      getDiskUsage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: FileUploadService,
          useValue: mockFileUploadService,
        },
        {
          provide: UploadConfigService,
          useValue: mockUploadConfigService,
        },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
    fileUploadService = module.get(FileUploadService);
    uploadConfigService = module.get(UploadConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadProfilePhoto', () => {
    it('should successfully upload a profile photo', async () => {
      fileUploadService.uploadFile.mockResolvedValue(mockUploadResult);

      const result = await controller.uploadProfilePhoto(mockFile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile photo uploaded successfully');
      expect(result.data).toEqual(mockUploadResult);
      expect(result.statusCode).toBe(201);
      expect(fileUploadService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        UploadCategory.PROFILE_PHOTOS,
        expect.any(Object),
      );
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(controller.uploadProfilePhoto(undefined as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when upload fails', async () => {
      const failedResult = { success: false, error: 'File too large' };
      fileUploadService.uploadFile.mockResolvedValue(failedResult);

      await expect(controller.uploadProfilePhoto(mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadIdCardPhoto', () => {
    it('should successfully upload an ID card photo', async () => {
      fileUploadService.uploadFile.mockResolvedValue(mockUploadResult);

      const result = await controller.uploadIdCardPhoto(mockFile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('ID card photo uploaded successfully');
      expect(fileUploadService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        UploadCategory.ID_CARDS,
        expect.any(Object),
      );
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(controller.uploadIdCardPhoto(undefined as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadDocument', () => {
    it('should successfully upload a document', async () => {
      fileUploadService.uploadFile.mockResolvedValue(mockUploadResult);

      const result = await controller.uploadDocument(mockFile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Document uploaded successfully');
      expect(fileUploadService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        UploadCategory.DOCUMENTS,
        expect.any(Object),
      );
    });
  });

  describe('uploadGeneralImage', () => {
    it('should successfully upload a general image', async () => {
      fileUploadService.uploadFile.mockResolvedValue(mockUploadResult);

      const result = await controller.uploadGeneralImage(mockFile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Image uploaded successfully');
      expect(fileUploadService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        UploadCategory.GENERAL,
        expect.any(Object),
      );
    });
  });

  describe('uploadMultipleFiles', () => {
    it('should successfully upload multiple files', async () => {
      const files = [mockFile, { ...mockFile, originalname: 'test2.jpg' }];
      const bulkResult = {
        success: true,
        successCount: 2,
        failureCount: 0,
        results: [mockUploadResult, mockUploadResult],
      };
      fileUploadService.uploadMultipleFiles.mockResolvedValue(bulkResult);

      const result = await controller.uploadMultipleFiles(files, UploadCategory.GENERAL);

      expect(result.success).toBe(true);
      expect(result.message).toBe('All files uploaded successfully');
      expect(result.statusCode).toBe(201);
      expect(fileUploadService.uploadMultipleFiles).toHaveBeenCalledWith(
        files,
        UploadCategory.GENERAL,
        expect.any(Object),
      );
    });

    it('should handle partial success', async () => {
      const files = [mockFile, { ...mockFile, originalname: 'test2.jpg' }];
      const bulkResult = {
        success: false,
        successCount: 1,
        failureCount: 1,
        results: [mockUploadResult, { success: false, error: 'Failed' }],
      };
      fileUploadService.uploadMultipleFiles.mockResolvedValue(bulkResult);

      const result = await controller.uploadMultipleFiles(files, UploadCategory.GENERAL);

      expect(result.success).toBe(false);
      expect(result.message).toBe('1 files uploaded, 1 failed');
      expect(result.statusCode).toBe(207); // Multi-Status
    });

    it('should throw BadRequestException when no files provided', async () => {
      await expect(controller.uploadMultipleFiles([], UploadCategory.GENERAL)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getFileInfo', () => {
    it('should return file information', async () => {
      const fileInfo = {
        originalName: 'test.jpg',
        size: 1024,
        mimeType: 'image/jpeg',
        extension: 'jpg',
      };
      fileUploadService.getFileInfo.mockResolvedValue(fileInfo);

      const result = await controller.getFileInfo(UploadCategory.PROFILE_PHOTOS, 'test.jpg');

      expect(result.success).toBe(true);
      expect(result.message).toBe('File information retrieved successfully');
      expect(result.data).toEqual(fileInfo);
    });

    it('should throw NotFoundException when file not found', async () => {
      fileUploadService.getFileInfo.mockResolvedValue(null);

      await expect(
        controller.getFileInfo(UploadCategory.PROFILE_PHOTOS, 'nonexistent.jpg'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteFile', () => {
    it('should successfully delete a file', async () => {
      fileUploadService.deleteFile.mockResolvedValue(true);

      const result = await controller.deleteFile(UploadCategory.PROFILE_PHOTOS, 'test.jpg');

      expect(result.success).toBe(true);
      expect(result.message).toBe('File deleted successfully');
      expect(fileUploadService.deleteFile).toHaveBeenCalledWith(
        UploadCategory.PROFILE_PHOTOS,
        'test.jpg',
      );
    });

    it('should throw NotFoundException when file not found', async () => {
      fileUploadService.deleteFile.mockResolvedValue(false);

      await expect(
        controller.deleteFile(UploadCategory.PROFILE_PHOTOS, 'nonexistent.jpg'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDiskUsage', () => {
    it('should return disk usage statistics', async () => {
      const usage = {
        [UploadCategory.PROFILE_PHOTOS]: { files: 10, size: 1024 * 1024 },
        [UploadCategory.ID_CARDS]: { files: 5, size: 512 * 1024 },
        [UploadCategory.DOCUMENTS]: { files: 3, size: 256 * 1024 },
        [UploadCategory.GENERAL]: { files: 8, size: 2048 * 1024 },
      };
      uploadConfigService.getDiskUsage.mockResolvedValue(usage);

      const result = await controller.getDiskUsage();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Disk usage statistics retrieved successfully');
      expect(result.data).toEqual(usage);
    });
  });
});
