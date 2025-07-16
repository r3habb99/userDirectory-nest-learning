import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
 * End-to-End Student Workflow Tests
 * Tests complete student management workflows from start to finish
 */
describe('Student Workflow E2E Tests', () => {
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

    await app.init();

    testHelper = new IntegrationTestHelper(app);
    dbHelper = new DatabaseTestHelper(prisma);
    authToken = await testHelper.getAuthToken();
  });

  beforeEach(async () => {
    await dbHelper.cleanDatabase();
    testData = await dbHelper.seedTestData();
  });

  afterAll(async () => {
    await dbHelper.cleanDatabase();
    await testHelper.cleanupApp();
  });

  describe('Complete Student Lifecycle', () => {
    it('should handle complete student registration workflow', async () => {
      // Step 1: Create a new course
      const courseDto = {
        name: 'Bachelor of Computer Science',
        type: 'BCS',
        duration: 4,
        description: 'Computer Science degree program',
      };

      const courseResponse = await testHelper
        .getAuthenticatedRequest('post', '/courses')
        .send(courseDto)
        .expect(201);

      expect(courseResponse.body.success).toBe(true);
      const courseId = courseResponse.body.data.id;

      // Step 2: Register a new student
      const studentDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        age: 20,
        gender: 'MALE',
        address: '123 Main Street, City, State, ZIP',
        admissionYear: 2024,
        passoutYear: 2028,
        courseId: courseId,
      };

      const studentResponse = await testHelper
        .getAuthenticatedRequest('post', '/students')
        .send(studentDto)
        .expect(201);

      expect(studentResponse.body.success).toBe(true);
      expect(studentResponse.body.data.enrollmentNumber).toMatch(/^2024BCS\d{3}$/);
      const studentId = studentResponse.body.data.id;

      // Step 3: Upload student profile image
      const imageBuffer = Buffer.from('fake-image-data');
      const uploadResponse = await testHelper
        .getAuthenticatedRequest('post', '/upload/profile')
        .attach('file', imageBuffer, 'profile.jpg')
        .expect(201);

      expect(uploadResponse.body.success).toBe(true);
      expect(uploadResponse.body.data.url).toBeDefined();

      // Step 4: Update student with profile image
      const updateResponse = await testHelper
        .getAuthenticatedRequest('patch', `/students/${studentId}`)
        .send({ profileImageUrl: uploadResponse.body.data.url })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);

      // Step 5: Generate ID card
      const idCardResponse = await testHelper
        .getAuthenticatedRequest('post', `/students/${studentId}/id-card`)
        .expect(201);

      expect(idCardResponse.body.success).toBe(true);
      expect(idCardResponse.body.data.cardNumber).toBeDefined();

      // Step 6: Mark attendance
      const attendanceDto = {
        studentId: studentId,
        date: new Date().toISOString().split('T')[0],
        status: 'PRESENT',
        subject: 'Computer Science Fundamentals',
      };

      const attendanceResponse = await testHelper
        .getAuthenticatedRequest('post', '/attendance')
        .send(attendanceDto)
        .expect(201);

      expect(attendanceResponse.body.success).toBe(true);

      // Step 7: Verify student data integrity
      const finalStudentResponse = await testHelper
        .getAuthenticatedRequest('get', `/students/${studentId}`)
        .expect(200);

      const finalStudent = finalStudentResponse.body.data;
      expect(finalStudent.name).toBe(studentDto.name);
      expect(finalStudent.email).toBe(studentDto.email);
      expect(finalStudent.course.id).toBe(courseId);
      expect(finalStudent.profileImageUrl).toBe(uploadResponse.body.data.url);
    });

    it('should handle student transfer workflow', async () => {
      // Create two courses
      const course1 = await MockDataFactory.createCourse(prisma, { type: 'BCA' });
      const course2 = await MockDataFactory.createCourse(prisma, { type: 'MCA' });

      // Create student in first course
      const studentDto = MockDataFactory.createStudentDto(course1.id);
      const studentResponse = await testHelper
        .getAuthenticatedRequest('post', '/students')
        .send(studentDto)
        .expect(201);

      const studentId = studentResponse.body.data.id;
      const originalEnrollment = studentResponse.body.data.enrollmentNumber;

      // Transfer student to second course
      const transferResponse = await testHelper
        .getAuthenticatedRequest('patch', `/students/${studentId}`)
        .send({ courseId: course2.id })
        .expect(200);

      expect(transferResponse.body.success).toBe(true);

      // Verify transfer
      const updatedStudentResponse = await testHelper
        .getAuthenticatedRequest('get', `/students/${studentId}`)
        .expect(200);

      const updatedStudent = updatedStudentResponse.body.data;
      expect(updatedStudent.course.id).toBe(course2.id);
      expect(updatedStudent.enrollmentNumber).not.toBe(originalEnrollment);
      expect(updatedStudent.enrollmentNumber).toContain('MCA');
    });
  });

  describe('Bulk Operations Workflow', () => {
    it('should handle bulk student import workflow', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      
      // Create multiple students
      const studentsData = Array.from({ length: 10 }, (_, index) => ({
        name: `Student ${index + 1}`,
        email: `student${index + 1}@example.com`,
        phone: `+123456789${index}`,
        age: 20 + index,
        gender: index % 2 === 0 ? 'MALE' : 'FEMALE',
        address: `Address ${index + 1}`,
        admissionYear: 2024,
        passoutYear: 2028,
        courseId: course.id,
      }));

      const bulkResponse = await testHelper
        .getAuthenticatedRequest('post', '/students/bulk')
        .send({ students: studentsData })
        .expect(201);

      expect(bulkResponse.body.success).toBe(true);
      expect(bulkResponse.body.data.created).toBe(10);
      expect(bulkResponse.body.data.failed).toBe(0);

      // Verify all students were created
      const studentsListResponse = await testHelper
        .getAuthenticatedRequest('get', '/students?limit=20')
        .expect(200);

      expect(studentsListResponse.body.data).toHaveLength(10);
    });

    it('should handle bulk attendance marking workflow', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      const students = await MockDataFactory.createMultipleStudents(prisma, 5, course.id);
      
      const attendanceData = students.map(student => ({
        studentId: student.id,
        date: new Date().toISOString().split('T')[0],
        status: 'PRESENT',
        subject: 'Mathematics',
      }));

      const bulkAttendanceResponse = await testHelper
        .getAuthenticatedRequest('post', '/attendance/bulk')
        .send({ records: attendanceData })
        .expect(201);

      expect(bulkAttendanceResponse.body.success).toBe(true);
      expect(bulkAttendanceResponse.body.data.created).toBe(5);

      // Verify attendance records
      const attendanceListResponse = await testHelper
        .getAuthenticatedRequest('get', '/attendance')
        .expect(200);

      expect(attendanceListResponse.body.data).toHaveLength(5);
    });
  });

  describe('Search and Filter Workflow', () => {
    it('should handle complex search and filter operations', async () => {
      const bcaCourse = await MockDataFactory.createCourse(prisma, { type: 'BCA' });
      const mcaCourse = await MockDataFactory.createCourse(prisma, { type: 'MCA' });

      // Create students in different courses and years
      await MockDataFactory.createMultipleStudents(prisma, 5, bcaCourse.id, { admissionYear: 2023 });
      await MockDataFactory.createMultipleStudents(prisma, 5, bcaCourse.id, { admissionYear: 2024 });
      await MockDataFactory.createMultipleStudents(prisma, 5, mcaCourse.id, { admissionYear: 2024 });

      // Test course filter
      const bcaStudentsResponse = await testHelper
        .getAuthenticatedRequest('get', '/students?course=BCA')
        .expect(200);

      expect(bcaStudentsResponse.body.data).toHaveLength(10);

      // Test year filter
      const year2024Response = await testHelper
        .getAuthenticatedRequest('get', '/students?admissionYear=2024')
        .expect(200);

      expect(year2024Response.body.data).toHaveLength(10);

      // Test combined filters
      const combinedResponse = await testHelper
        .getAuthenticatedRequest('get', '/students?course=BCA&admissionYear=2024')
        .expect(200);

      expect(combinedResponse.body.data).toHaveLength(5);

      // Test search functionality
      const searchResponse = await testHelper
        .getAuthenticatedRequest('get', '/students/search?q=test')
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
    });

    it('should handle pagination workflow', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      await MockDataFactory.createMultipleStudents(prisma, 25, course.id);

      // Test first page
      const page1Response = await testHelper
        .getAuthenticatedRequest('get', '/students?page=1&limit=10')
        .expect(200);

      expect(page1Response.body.data).toHaveLength(10);
      expect(page1Response.body.pagination.page).toBe(1);
      expect(page1Response.body.pagination.total).toBe(25);
      expect(page1Response.body.pagination.hasNext).toBe(true);
      expect(page1Response.body.pagination.hasPrev).toBe(false);

      // Test middle page
      const page2Response = await testHelper
        .getAuthenticatedRequest('get', '/students?page=2&limit=10')
        .expect(200);

      expect(page2Response.body.data).toHaveLength(10);
      expect(page2Response.body.pagination.page).toBe(2);
      expect(page2Response.body.pagination.hasNext).toBe(true);
      expect(page2Response.body.pagination.hasPrev).toBe(true);

      // Test last page
      const page3Response = await testHelper
        .getAuthenticatedRequest('get', '/students?page=3&limit=10')
        .expect(200);

      expect(page3Response.body.data).toHaveLength(5);
      expect(page3Response.body.pagination.page).toBe(3);
      expect(page3Response.body.pagination.hasNext).toBe(false);
      expect(page3Response.body.pagination.hasPrev).toBe(true);
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle validation errors gracefully', async () => {
      const invalidStudentDto = {
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid: bad format
        age: 15, // Invalid: too young
        phone: '123', // Invalid: too short
      };

      const response = await testHelper
        .getAuthenticatedRequest('post', '/students')
        .send(invalidStudentDto)
        .expect(400);

      TestAssertions.expectValidErrorResponse(response.body);
      expect(response.body.details).toBeDefined();
      expect(Array.isArray(response.body.details)).toBe(true);
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it('should handle duplicate data errors', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      const studentDto = MockDataFactory.createStudentDto(course.id);

      // Create first student
      await testHelper
        .getAuthenticatedRequest('post', '/students')
        .send(studentDto)
        .expect(201);

      // Try to create duplicate
      const duplicateResponse = await testHelper
        .getAuthenticatedRequest('post', '/students')
        .send(studentDto)
        .expect(409);

      TestAssertions.expectValidErrorResponse(duplicateResponse.body);
      expect(duplicateResponse.body.error).toBe('DUPLICATE_ENTRY');
    });

    it('should handle not found errors', async () => {
      const nonExistentId = 'clp1234567890abcdef999999';

      const response = await testHelper
        .getAuthenticatedRequest('get', `/students/${nonExistentId}`)
        .expect(404);

      TestAssertions.expectValidErrorResponse(response.body);
      expect(response.body.error).toBe('RECORD_NOT_FOUND');
    });
  });

  describe('Statistics and Reporting Workflow', () => {
    it('should generate comprehensive statistics', async () => {
      const bcaCourse = await MockDataFactory.createCourse(prisma, { type: 'BCA' });
      const mcaCourse = await MockDataFactory.createCourse(prisma, { type: 'MCA' });

      // Create students
      await MockDataFactory.createMultipleStudents(prisma, 10, bcaCourse.id);
      await MockDataFactory.createMultipleStudents(prisma, 5, mcaCourse.id);

      const statsResponse = await testHelper
        .getAuthenticatedRequest('get', '/students/statistics')
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data.totalStudents).toBe(15);
      expect(statsResponse.body.data.activeStudents).toBe(15);
      expect(statsResponse.body.data.courseStats).toHaveLength(2);
    });

    it('should handle export functionality', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      await MockDataFactory.createMultipleStudents(prisma, 10, course.id);

      const exportResponse = await testHelper
        .getAuthenticatedRequest('get', '/students/export?format=csv')
        .expect(200);

      expect(exportResponse.headers['content-type']).toContain('text/csv');
      expect(exportResponse.text).toContain('name,email,enrollmentNumber');
    });
  });
});
