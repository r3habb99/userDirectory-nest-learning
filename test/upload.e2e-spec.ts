import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/services/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Upload (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  // Create a test image buffer
  const createTestImageBuffer = (): Buffer => {
    // Simple 1x1 PNG image
    return Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
      0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5c, 0xc2, 0x8a, 0x8e, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Create test admin and get auth token
    const adminData = {
      email: 'test-upload@example.com',
      password: 'password123',
      name: 'Upload Test Admin',
      phone: '+1234567890',
    };

    // Register admin
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(adminData)
      .expect(201);

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminData.email,
        password: adminData.password,
      })
      .expect(200);

    authToken = loginResponse.body.data.accessToken;

    // Ensure upload directories exist
    const uploadDirs = [
      'uploads/profile-photos',
      'uploads/id-cards',
      'uploads/documents',
      'uploads/general',
    ];

    uploadDirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.admin.deleteMany({
      where: { email: 'test-upload@example.com' },
    });

    // Clean up test files
    const uploadDirs = [
      'uploads/profile-photos',
      'uploads/id-cards',
      'uploads/documents',
      'uploads/general',
    ];

    uploadDirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        files.forEach(file => {
          if (file.includes('test-')) {
            fs.unlinkSync(path.join(fullPath, file));
          }
        });
      }
    });

    await app.close();
  });

  describe('/upload/profile-photo (POST)', () => {
    it('should upload a profile photo successfully', () => {
      return request(app.getHttpServer())
        .post('/upload/profile-photo')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', createTestImageBuffer(), 'test-profile.png')
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Profile photo uploaded successfully');
          expect(res.body.data.filename).toBeDefined();
          expect(res.body.data.url).toContain('/uploads/profile-photos/');
        });
    });

    it('should reject upload without file', () => {
      return request(app.getHttpServer())
        .post('/upload/profile-photo')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should reject upload without authentication', () => {
      return request(app.getHttpServer())
        .post('/upload/profile-photo')
        .attach('file', createTestImageBuffer(), 'test-profile.png')
        .expect(401);
    });
  });

  describe('/upload/id-card-photo (POST)', () => {
    it('should upload an ID card photo successfully', () => {
      return request(app.getHttpServer())
        .post('/upload/id-card-photo')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', createTestImageBuffer(), 'test-id-card.png')
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('ID card photo uploaded successfully');
          expect(res.body.data.url).toContain('/uploads/id-cards/');
        });
    });
  });

  describe('/upload/document (POST)', () => {
    it('should upload a document successfully', () => {
      return request(app.getHttpServer())
        .post('/upload/document')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', createTestImageBuffer(), 'test-document.png')
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Document uploaded successfully');
          expect(res.body.data.url).toContain('/uploads/documents/');
        });
    });
  });

  describe('/upload/general (POST)', () => {
    it('should upload a general image successfully', () => {
      return request(app.getHttpServer())
        .post('/upload/general')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', createTestImageBuffer(), 'test-general.png')
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Image uploaded successfully');
          expect(res.body.data.url).toContain('/uploads/general/');
        });
    });
  });

  describe('/upload/multiple (POST)', () => {
    it('should upload multiple files successfully', () => {
      return request(app.getHttpServer())
        .post('/upload/multiple?category=general')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', createTestImageBuffer(), 'test-multi-1.png')
        .attach('files', createTestImageBuffer(), 'test-multi-2.png')
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.successCount).toBe(2);
          expect(res.body.data.failureCount).toBe(0);
          expect(res.body.data.results).toHaveLength(2);
        });
    });
  });

  describe('/upload/disk-usage (GET)', () => {
    it('should return disk usage statistics', () => {
      return request(app.getHttpServer())
        .get('/upload/disk-usage')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Disk usage statistics retrieved successfully');
          expect(res.body.data).toBeDefined();
          expect(res.body.data['profile-photos']).toBeDefined();
          expect(res.body.data['id-cards']).toBeDefined();
          expect(res.body.data['documents']).toBeDefined();
          expect(res.body.data['general']).toBeDefined();
        });
    });
  });

  describe('File operations', () => {
    let uploadedFilename: string;

    beforeAll(async () => {
      // Upload a test file for operations
      const response = await request(app.getHttpServer())
        .post('/upload/general')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', createTestImageBuffer(), 'test-operations.png')
        .expect(201);

      uploadedFilename = response.body.data.filename;
    });

    it('should get file information', () => {
      return request(app.getHttpServer())
        .get(`/upload/info/general/${uploadedFilename}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('File information retrieved successfully');
          expect(res.body.data.originalName).toBeDefined();
          expect(res.body.data.size).toBeDefined();
          expect(res.body.data.mimeType).toBeDefined();
        });
    });

    it('should delete a file', () => {
      return request(app.getHttpServer())
        .delete(`/upload/general/${uploadedFilename}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('File deleted successfully');
        });
    });

    it('should return 404 for non-existent file info', () => {
      return request(app.getHttpServer())
        .get('/upload/info/general/non-existent-file.jpg')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for deleting non-existent file', () => {
      return request(app.getHttpServer())
        .delete('/upload/general/non-existent-file.jpg')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('File serving', () => {
    let uploadedFileUrl: string;

    beforeAll(async () => {
      // Upload a test file for serving
      const response = await request(app.getHttpServer())
        .post('/upload/general')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', createTestImageBuffer(), 'test-serving.png')
        .expect(201);

      uploadedFileUrl = response.body.data.url;
    });

    it('should serve uploaded files', () => {
      return request(app.getHttpServer())
        .get(uploadedFileUrl)
        .expect(200)
        .expect('Content-Type', /image/);
    });
  });
});
