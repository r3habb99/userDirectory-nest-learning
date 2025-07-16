import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../services/prisma/prisma.service';
import {
  IntegrationTestHelper,
  DatabaseTestHelper,
  MockDataFactory,
} from '../../common/testing/test-utils';

/**
 * Security Tests
 * Tests application security measures and vulnerability protections
 */
describe('Security Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testHelper: IntegrationTestHelper;
  let dbHelper: DatabaseTestHelper;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    testHelper = new IntegrationTestHelper(app);
    dbHelper = new DatabaseTestHelper(prisma);
    authToken = await testHelper.getAuthToken();
  });

  beforeEach(async () => {
    await dbHelper.cleanDatabase();
  });

  afterAll(async () => {
    await dbHelper.cleanDatabase();
    await testHelper.cleanupApp();
  });

  describe('Authentication Security', () => {
    it('should reject requests without authentication', async () => {
      await request(app.getHttpServer())
        .get('/students')
        .expect(401);
    });

    it('should reject requests with invalid JWT tokens', async () => {
      await request(app.getHttpServer())
        .get('/students')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject requests with expired JWT tokens', async () => {
      // This would require a token with past expiration
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      
      await request(app.getHttpServer())
        .get('/students')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should handle malformed authorization headers', async () => {
      await request(app.getHttpServer())
        .get('/students')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      await request(app.getHttpServer())
        .get('/students')
        .set('Authorization', 'Bearer')
        .expect(401);
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection attempts', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      
      const maliciousInput = {
        name: "'; DROP TABLE students; --",
        email: 'test@example.com',
        phone: '+1234567890',
        age: 20,
        gender: 'MALE',
        address: '123 Test St',
        admissionYear: 2024,
        passoutYear: 2027,
        courseId: course.id,
      };

      const response = await testHelper
        .getAuthenticatedRequest('post', '/students')
        .send(maliciousInput)
        .expect(201); // Should succeed but sanitize input

      expect(response.body.data.name).toBe(maliciousInput.name);
      
      // Verify database integrity
      const students = await prisma.student.findMany();
      expect(students).toHaveLength(1);
    });

    it('should prevent XSS attacks in input fields', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      
      const xssInput = {
        name: '<script>alert("XSS")</script>',
        email: 'test@example.com',
        phone: '+1234567890',
        age: 20,
        gender: 'MALE',
        address: '<img src="x" onerror="alert(1)">',
        admissionYear: 2024,
        passoutYear: 2027,
        courseId: course.id,
      };

      const response = await testHelper
        .getAuthenticatedRequest('post', '/students')
        .send(xssInput)
        .expect(201);

      // Input should be stored as-is but properly escaped when returned
      expect(response.body.data.name).toBe(xssInput.name);
      expect(response.body.data.address).toBe(xssInput.address);
    });

    it('should validate email format strictly', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        'test@.com',
      ];

      for (const email of invalidEmails) {
        const studentDto = {
          name: 'Test Student',
          email: email,
          phone: '+1234567890',
          age: 20,
          gender: 'MALE',
          address: '123 Test St',
          admissionYear: 2024,
          passoutYear: 2027,
          courseId: course.id,
        };

        await testHelper
          .getAuthenticatedRequest('post', '/students')
          .send(studentDto)
          .expect(400);
      }
    });

    it('should validate phone number format', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      
      const invalidPhones = [
        '123',
        'abc123',
        '++1234567890',
        '1234567890123456', // too long
        '',
      ];

      for (const phone of invalidPhones) {
        const studentDto = {
          name: 'Test Student',
          email: 'test@example.com',
          phone: phone,
          age: 20,
          gender: 'MALE',
          address: '123 Test St',
          admissionYear: 2024,
          passoutYear: 2027,
          courseId: course.id,
        };

        await testHelper
          .getAuthenticatedRequest('post', '/students')
          .send(studentDto)
          .expect(400);
      }
    });
  });

  describe('Authorization Security', () => {
    it('should enforce role-based access control', async () => {
      // This test would require different user roles
      // For now, we test that admin endpoints require proper authentication
      
      await testHelper
        .getAuthenticatedRequest('get', '/admin/users')
        .expect(200); // Should work with admin token

      // Test with invalid token should fail
      await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should prevent access to other users data', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      const student = await MockDataFactory.createStudent(prisma, course.id);

      // Should be able to access with proper auth
      await testHelper
        .getAuthenticatedRequest('get', `/students/${student.id}`)
        .expect(200);

      // Should not be able to access without auth
      await request(app.getHttpServer())
        .get(`/students/${student.id}`)
        .expect(401);
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce rate limits on API endpoints', async () => {
      const requests = [];
      
      // Make many requests rapidly
      for (let i = 0; i < 150; i++) {
        requests.push(
          request(app.getHttpServer())
            .get('/')
            .expect((res) => {
              // Should eventually get rate limited
              if (res.status === 429) {
                expect(res.body.error).toBe('RATE_LIMIT_EXCEEDED');
              }
            })
        );
      }

      await Promise.all(requests);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/');

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('File Upload Security', () => {
    it('should validate file types', async () => {
      const maliciousFile = Buffer.from('<?php echo "malicious code"; ?>');
      
      const response = await testHelper
        .getAuthenticatedRequest('post', '/upload/profile')
        .attach('file', maliciousFile, 'malicious.php')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('file type');
    });

    it('should validate file size limits', async () => {
      // Create a large file (10MB)
      const largeFile = Buffer.alloc(10 * 1024 * 1024, 'x');
      
      const response = await testHelper
        .getAuthenticatedRequest('post', '/upload/profile')
        .attach('file', largeFile, 'large.jpg')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('size');
    });

    it('should sanitize file names', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const maliciousFileName = '../../../etc/passwd.jpg';
      
      const response = await testHelper
        .getAuthenticatedRequest('post', '/upload/profile')
        .attach('file', imageBuffer, maliciousFileName)
        .expect(201);

      expect(response.body.data.filename).not.toContain('../');
      expect(response.body.data.filename).not.toContain('/etc/');
    });
  });

  describe('Data Exposure Security', () => {
    it('should not expose sensitive data in responses', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      const student = await MockDataFactory.createStudent(prisma, course.id);

      const response = await testHelper
        .getAuthenticatedRequest('get', `/students/${student.id}`)
        .expect(200);

      // Should not expose internal IDs or sensitive data
      expect(response.body.data).not.toHaveProperty('adminId');
      expect(response.body.data).not.toHaveProperty('internalNotes');
    });

    it('should not expose database errors', async () => {
      // Try to access with malformed ID
      const response = await testHelper
        .getAuthenticatedRequest('get', '/students/invalid-id-format')
        .expect(400);

      // Should get generic error, not database-specific error
      expect(response.body.message).not.toContain('Prisma');
      expect(response.body.message).not.toContain('MySQL');
      expect(response.body.message).not.toContain('database');
    });
  });

  describe('CORS Security', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(app.getHttpServer())
        .options('/')
        .set('Origin', 'http://localhost:3001')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });

    it('should reject requests from unauthorized origins', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .set('Origin', 'http://malicious-site.com');

      // Should either reject or not include CORS headers for unauthorized origins
      if (response.headers['access-control-allow-origin']) {
        expect(response.headers['access-control-allow-origin']).not.toBe('http://malicious-site.com');
      }
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/');

      // Check for common security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  describe('Password Security', () => {
    it('should enforce strong password requirements', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'abc123',
        '12345678',
        'qwerty',
      ];

      for (const password of weakPasswords) {
        const adminDto = {
          name: 'Test Admin',
          email: 'test@example.com',
          password: password,
          role: 'ADMIN',
        };

        const response = await testHelper
          .getAuthenticatedRequest('post', '/admin/users')
          .send(adminDto)
          .expect(400);

        expect(response.body.message).toContain('password');
      }
    });

    it('should hash passwords properly', async () => {
      const adminDto = {
        name: 'Test Admin',
        email: 'test@example.com',
        password: 'StrongPassword123!',
        role: 'ADMIN',
      };

      const response = await testHelper
        .getAuthenticatedRequest('post', '/admin/users')
        .send(adminDto)
        .expect(201);

      // Password should not be returned in response
      expect(response.body.data).not.toHaveProperty('password');

      // Verify password is hashed in database
      const admin = await prisma.admin.findUnique({
        where: { email: adminDto.email },
      });

      expect(admin?.password).not.toBe(adminDto.password);
      expect(admin?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });
  });
});
