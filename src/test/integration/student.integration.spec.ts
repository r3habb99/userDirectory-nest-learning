import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../services/prisma/prisma.service';
import {
  IntegrationTestHelper,
  DatabaseTestHelper,
  MockDataFactory,
  TestAssertions,
} from '../../common/testing/test-utils';

/**
 * Student Integration Tests
 * Tests the complete student management flow including authentication
 */
describe('Student Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testHelper: IntegrationTestHelper;
  let dbHelper: DatabaseTestHelper;
  let authToken: string;
  let testData: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    testHelper = new IntegrationTestHelper(app);
    dbHelper = new DatabaseTestHelper(prisma);

    await testHelper.setupApp();

    // Clean and seed test data
    await dbHelper.cleanDatabase();
    testData = await dbHelper.seedTestData();

    // Authenticate for protected endpoints
    authToken = await testHelper.authenticate({
      email: 'test@admin.com',
      password: 'password123',
    });
  });

  afterAll(async () => {
    await dbHelper.cleanDatabase();
    await testHelper.cleanupApp();
  });

  describe('POST /students', () => {
    it('should create a new student successfully', async () => {
      const createStudentDto = {
        name: 'Integration Test Student',
        email: 'integration@test.com',
        phone: '+1234567890',
        age: 21,
        gender: 'MALE',
        address: '123 Integration Test St',
        admissionYear: 2024,
        passoutYear: 2027,
        courseId: testData.course.id,
      };

      const response = await testHelper
        .getAuthenticatedRequest('post', '/students')
        .send(createStudentDto)
        .expect(201);

      TestAssertions.expectValidApiResponse(response.body);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('enrollmentNumber');
      expect(response.body.data.name).toBe(createStudentDto.name);
      expect(response.body.data.email).toBe(createStudentDto.email);
    });

    it('should return 400 for invalid input data', async () => {
      const invalidDto = {
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid: bad email format
        age: 15, // Invalid: too young
      };

      const response = await testHelper
        .getAuthenticatedRequest('post', '/students')
        .send(invalidDto)
        .expect(400);

      TestAssertions.expectValidErrorResponse(response.body);
      expect(response.body.success).toBe(false);
      expect(response.body.details).toBeDefined();
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it('should return 409 for duplicate email', async () => {
      const duplicateDto = {
        name: 'Duplicate Student',
        email: testData.student.email, // Using existing email
        phone: '+9876543210',
        age: 22,
        gender: 'FEMALE',
        address: '456 Duplicate St',
        admissionYear: 2024,
        passoutYear: 2027,
        courseId: testData.course.id,
      };

      const response = await testHelper
        .getAuthenticatedRequest('post', '/students')
        .send(duplicateDto)
        .expect(409);

      TestAssertions.expectValidErrorResponse(response.body);
      expect(response.body.error).toBe('DUPLICATE_ENTRY');
    });

    it('should return 401 without authentication', async () => {
      const createStudentDto = {
        name: 'Unauthorized Student',
        email: 'unauthorized@test.com',
        phone: '+1234567890',
        age: 20,
        gender: 'MALE',
        address: '123 Unauthorized St',
        admissionYear: 2024,
        passoutYear: 2027,
        courseId: testData.course.id,
      };

      await request(app.getHttpServer())
        .post('/students')
        .send(createStudentDto)
        .expect(401);
    });
  });

  describe('GET /students', () => {
    it('should return paginated list of students', async () => {
      const response = await testHelper
        .getAuthenticatedRequest('get', '/students')
        .query({ page: 1, limit: 10 })
        .expect(200);

      TestAssertions.expectValidPaginatedResponse(response.body);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
    });

    it('should filter students by course', async () => {
      const response = await testHelper
        .getAuthenticatedRequest('get', '/students')
        .query({ courseId: testData.course.id })
        .expect(200);

      TestAssertions.expectValidPaginatedResponse(response.body);
      response.body.data.forEach((student: any) => {
        expect(student.courseId).toBe(testData.course.id);
      });
    });

    it('should filter students by admission year', async () => {
      const response = await testHelper
        .getAuthenticatedRequest('get', '/students')
        .query({ admissionYear: 2024 })
        .expect(200);

      TestAssertions.expectValidPaginatedResponse(response.body);
      response.body.data.forEach((student: any) => {
        expect(student.admissionYear).toBe(2024);
      });
    });

    it('should search students by name', async () => {
      const response = await testHelper
        .getAuthenticatedRequest('get', '/students')
        .query({ search: 'Test' })
        .expect(200);

      TestAssertions.expectValidPaginatedResponse(response.body);
      // Should find students with "Test" in their name
    });

    it('should sort students correctly', async () => {
      const response = await testHelper
        .getAuthenticatedRequest('get', '/students')
        .query({ sortBy: 'name', sortOrder: 'asc' })
        .expect(200);

      TestAssertions.expectValidPaginatedResponse(response.body);

      // Check if sorted by name in ascending order
      const names = response.body.data.map((student: any) => student.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });

  describe('GET /students/:id', () => {
    it('should return a specific student', async () => {
      const response = await testHelper
        .getAuthenticatedRequest('get', `/students/${testData.student.id}`)
        .expect(200);

      TestAssertions.expectValidApiResponse(response.body);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testData.student.id);
      expect(response.body.data).toHaveProperty('course');
    });

    it('should return 404 for non-existent student', async () => {
      const nonExistentId = 'clp1234567890abcdef999999';

      const response = await testHelper
        .getAuthenticatedRequest('get', `/students/${nonExistentId}`)
        .expect(404);

      TestAssertions.expectValidErrorResponse(response.body);
      expect(response.body.error).toBe('RECORD_NOT_FOUND');
    });

    it('should return 400 for invalid ID format', async () => {
      const invalidId = 'invalid-id-format';

      await testHelper
        .getAuthenticatedRequest('get', `/students/${invalidId}`)
        .expect(400);
    });
  });

  describe('PATCH /students/:id', () => {
    it('should update a student successfully', async () => {
      const updateDto = {
        name: 'Updated Test Student',
        phone: '+9876543210',
        age: 22,
      };

      const response = await testHelper
        .getAuthenticatedRequest('patch', `/students/${testData.student.id}`)
        .send(updateDto)
        .expect(200);

      TestAssertions.expectValidApiResponse(response.body);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateDto.name);
      expect(response.body.data.phone).toBe(updateDto.phone);
      expect(response.body.data.age).toBe(updateDto.age);
    });

    it('should return 404 for non-existent student', async () => {
      const nonExistentId = 'clp1234567890abcdef999999';
      const updateDto = { name: 'Updated Name' };

      const response = await testHelper
        .getAuthenticatedRequest('patch', `/students/${nonExistentId}`)
        .send(updateDto)
        .expect(404);

      TestAssertions.expectValidErrorResponse(response.body);
    });

    it('should return 400 for invalid update data', async () => {
      const invalidDto = {
        age: 15, // Invalid: too young
        email: 'invalid-email', // Invalid: bad format
      };

      await testHelper
        .getAuthenticatedRequest('patch', `/students/${testData.student.id}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('DELETE /students/:id', () => {
    it('should soft delete a student successfully', async () => {
      // Create a student to delete
      const studentToDelete = await prisma.student.create({
        data: {
          enrollmentNumber: '2024BCA999',
          name: 'Student To Delete',
          email: 'delete@test.com',
          phone: '+1111111111',
          age: 20,
          gender: 'MALE',
          address: 'Delete Address',
          admissionYear: 2024,
          passoutYear: 2027,
          courseId: testData.course.id,
          createdBy: testData.admin.id,
        },
      });

      const response = await testHelper
        .getAuthenticatedRequest('delete', `/students/${studentToDelete.id}`)
        .expect(200);

      TestAssertions.expectValidApiResponse(response.body);
      expect(response.body.success).toBe(true);

      // Verify student is soft deleted
      const deletedStudent = await prisma.student.findUnique({
        where: { id: studentToDelete.id },
      });
      expect(deletedStudent?.isActive).toBe(false);
    });

    it('should return 404 for non-existent student', async () => {
      const nonExistentId = 'clp1234567890abcdef999999';

      const response = await testHelper
        .getAuthenticatedRequest('delete', `/students/${nonExistentId}`)
        .expect(404);

      TestAssertions.expectValidErrorResponse(response.body);
    });
  });

  describe('GET /students/search', () => {
    it('should search students by query', async () => {
      const response = await testHelper
        .getAuthenticatedRequest('get', '/students/search')
        .query({ q: 'Test' })
        .expect(200);

      TestAssertions.expectValidPaginatedResponse(response.body);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for short search query', async () => {
      await testHelper
        .getAuthenticatedRequest('get', '/students/search')
        .query({ q: 'T' }) // Too short
        .expect(400);
    });
  });

  describe('GET /students/statistics', () => {
    it('should return student statistics', async () => {
      const response = await testHelper
        .getAuthenticatedRequest('get', '/students/statistics')
        .expect(200);

      TestAssertions.expectValidApiResponse(response.body);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalStudents');
      expect(response.body.data).toHaveProperty('activeStudents');
      expect(response.body.data).toHaveProperty('studentsByCourse');
      expect(response.body.data).toHaveProperty('studentsByYear');
    });
  });
});
