import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../services/prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

/**
 * Test Utilities
 * Provides common testing utilities and helpers
 */

// Mock Data Factories
export class MockDataFactory {
  static createMockStudent(overrides: Partial<any> = {}) {
    return {
      id: 'clp1234567890abcdef123456',
      enrollmentNumber: '2024BCA001',
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1234567890',
      age: 20,
      gender: 'MALE',
      address: '123 Main St, City, State 12345',
      admissionYear: 2024,
      passoutYear: 2027,
      profilePhoto: null,
      isActive: true,
      courseId: 'clp1234567890abcdef123457',
      createdBy: 'clp1234567890abcdef123458',
      createdAt: new Date('2024-01-15T10:30:00.000Z'),
      updatedAt: new Date('2024-01-15T10:30:00.000Z'),
      course: {
        id: 'clp1234567890abcdef123457',
        name: 'Bachelor of Computer Applications',
        type: 'BCA',
        duration: 3,
      },
      ...overrides,
    };
  }

  static createMockCourse(overrides: Partial<any> = {}) {
    return {
      id: 'clp1234567890abcdef123457',
      name: 'Bachelor of Computer Applications',
      type: 'BCA',
      duration: 3,
      description: 'A comprehensive program covering computer applications',
      maxStudents: 60,
      isActive: true,
      createdAt: new Date('2024-01-15T10:30:00.000Z'),
      updatedAt: new Date('2024-01-15T10:30:00.000Z'),
      ...overrides,
    };
  }

  static createMockAdmin(overrides: Partial<any> = {}) {
    return {
      id: 'clp1234567890abcdef123458',
      name: 'Admin User',
      email: 'admin@college.edu',
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date('2024-01-15T10:30:00.000Z'),
      updatedAt: new Date('2024-01-15T10:30:00.000Z'),
      ...overrides,
    };
  }

  static createMockAttendance(overrides: Partial<any> = {}) {
    return {
      id: 'clp1234567890abcdef123459',
      date: new Date('2024-01-15'),
      status: 'PRESENT',
      remarks: null,
      studentId: 'clp1234567890abcdef123456',
      markedBy: 'clp1234567890abcdef123458',
      createdAt: new Date('2024-01-15T10:30:00.000Z'),
      updatedAt: new Date('2024-01-15T10:30:00.000Z'),
      student: MockDataFactory.createMockStudent(),
      admin: MockDataFactory.createMockAdmin(),
      ...overrides,
    };
  }

  static createMockIdCard(overrides: Partial<any> = {}) {
    return {
      id: 'clp1234567890abcdef123460',
      cardNumber: 'CARD2024001',
      issueDate: new Date('2024-01-15T10:30:00.000Z'),
      expiryDate: new Date('2028-01-15T10:30:00.000Z'),
      qrCode: 'QR_DATA_STRING',
      cardImageUrl: 'https://example.com/id-cards/card123.png',
      isActive: true,
      studentId: 'clp1234567890abcdef123456',
      createdAt: new Date('2024-01-15T10:30:00.000Z'),
      updatedAt: new Date('2024-01-15T10:30:00.000Z'),
      student: MockDataFactory.createMockStudent(),
      ...overrides,
    };
  }

  static createMockPaginatedResponse<T>(
    data: T[],
    page: number = 1,
    limit: number = 10,
    total: number = data.length,
  ) {
    const totalPages = Math.ceil(total / limit);
    return {
      success: true,
      message: 'Data retrieved successfully',
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      statusCode: 200,
    };
  }

  static createMockApiResponse<T>(
    data: T,
    message: string = 'Operation successful',
    statusCode: number = 200,
  ) {
    return {
      success: true,
      message,
      data,
      statusCode,
    };
  }

  static createMockErrorResponse(
    message: string = 'An error occurred',
    error: string = 'ERROR',
    statusCode: number = 400,
    details?: any,
  ) {
    return {
      success: false,
      message,
      error,
      statusCode,
      ...(details && { details }),
    };
  }
}

// Enhanced Mock Services
export class MockPrismaService {
  student = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    createMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
  };

  course = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };

  admin = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };

  attendanceRecord = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    groupBy: jest.fn(),
  };

  idCard = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };

  $transaction = jest.fn();
  $connect = jest.fn();
  $disconnect = jest.fn();
  $queryRaw = jest.fn();
  $executeRaw = jest.fn();
  $on = jest.fn();
  $use = jest.fn();

  // Performance monitoring methods
  getDatabaseStats = jest.fn().mockResolvedValue({
    totalQueries: 100,
    slowQueries: 5,
    averageQueryTime: 50,
  });

  getConnectionPoolStatus = jest.fn().mockResolvedValue({
    active: 5,
    idle: 3,
    total: 8,
  });
}

export class MockJwtService {
  sign = jest.fn().mockReturnValue('mock-jwt-token');
  verify = jest
    .fn()
    .mockReturnValue({ id: 'mock-user-id', email: 'mock@email.com' });
  decode = jest
    .fn()
    .mockReturnValue({ id: 'mock-user-id', email: 'mock@email.com' });
}

export class MockCacheService {
  get = jest.fn().mockResolvedValue(null);
  set = jest.fn().mockResolvedValue(undefined);
  delete = jest.fn().mockResolvedValue(undefined);
  clear = jest.fn().mockResolvedValue(undefined);
  invalidatePattern = jest.fn().mockResolvedValue(undefined);
  getStats = jest.fn().mockResolvedValue({
    hits: 100,
    misses: 20,
    hitRate: 83.33,
    size: 50,
  });
}

export class MockPerformanceMonitorService {
  recordRequest = jest.fn();
  recordQuery = jest.fn();
  recordCacheHit = jest.fn();
  recordCacheMiss = jest.fn();
  recordCacheEviction = jest.fn();
  getMetrics = jest.fn().mockReturnValue({
    requests: { total: 100, successful: 95, failed: 5 },
    database: { queries: 200, slowQueries: 5 },
    cache: { hits: 80, misses: 20, hitRate: 80 },
  });
  getPerformanceSummary = jest.fn().mockReturnValue({
    health: 85,
    alerts: [],
    recommendations: [],
    summary: { totalRequests: 100, averageResponseTime: 150 },
  });
  resetMetrics = jest.fn();
}

export class MockQueryOptimizerService {
  executeOptimizedQuery = jest.fn();
  findStudentsOptimized = jest.fn();
  getStatisticsOptimized = jest.fn();
  executeBatchQueries = jest.fn();
  invalidateRelatedCache = jest.fn();
}

export class MockFileUploadService {
  uploadFile = jest.fn().mockResolvedValue({
    success: true,
    filename: 'test-file.jpg',
    url: '/uploads/test-file.jpg',
  });
  uploadMultipleFiles = jest.fn().mockResolvedValue({
    success: true,
    files: [{ filename: 'test-file.jpg', url: '/uploads/test-file.jpg' }],
  });
  deleteFile = jest.fn().mockResolvedValue({ success: true });
}

export class MockHealthService {
  getHealthStatus = jest.fn().mockResolvedValue({
    status: 'healthy',
    checks: {
      database: { status: 'healthy' },
      disk: { status: 'healthy' },
      memory: { status: 'healthy' },
    },
  });
  getMetrics = jest.fn().mockResolvedValue({
    uptime: 3600,
    memory: { heapUsed: 100, heapTotal: 200 },
    cpu: { usage: 45 },
  });
}

export class MockConfigService {
  get = jest.fn().mockImplementation((key: string, defaultValue?: any) => {
    const config: Record<string, any> = {
      JWT_SECRET: 'test-secret',
      DATABASE_URL: 'test-database-url',
      NODE_ENV: 'test',
      PORT: 3000,
    };
    return config[key] || defaultValue;
  });
}

// Test Module Builder
export class TestModuleBuilder {
  private moduleBuilder: any;

  constructor() {
    this.moduleBuilder = Test.createTestingModule({});
  }

  withController(controller: any) {
    this.moduleBuilder = this.moduleBuilder.overrideProvider
      ? this.moduleBuilder
      : Test.createTestingModule({
          controllers: [controller],
        });
    return this;
  }

  withService(service: any) {
    this.moduleBuilder = this.moduleBuilder.overrideProvider
      ? this.moduleBuilder
      : Test.createTestingModule({
          providers: [service],
        });
    return this;
  }

  withMockPrisma() {
    this.moduleBuilder = this.moduleBuilder.overrideProvider(PrismaService, {
      useClass: MockPrismaService,
    });
    return this;
  }

  withMockJwt() {
    this.moduleBuilder = this.moduleBuilder.overrideProvider(JwtService, {
      useClass: MockJwtService,
    });
    return this;
  }

  withMockConfig() {
    this.moduleBuilder = this.moduleBuilder.overrideProvider(ConfigService, {
      useClass: MockConfigService,
    });
    return this;
  }

  withMockProvider(token: any, mockImplementation: any) {
    this.moduleBuilder = this.moduleBuilder.overrideProvider(token, {
      useValue: mockImplementation,
    });
    return this;
  }

  async build(): Promise<TestingModule> {
    return await this.moduleBuilder.compile();
  }
}

// Integration Test Helper
export class IntegrationTestHelper {
  private app: INestApplication;
  private authToken: string;

  constructor(app: INestApplication) {
    this.app = app;
  }

  async setupApp() {
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await this.app.init();
  }

  async authenticate(credentials: { email: string; password: string }) {
    const response = await request(this.app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200);

    this.authToken = response.body.data.accessToken;
    return this.authToken;
  }

  getAuthenticatedRequest(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
  ) {
    const req = request(this.app.getHttpServer())[method](url);
    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }
    return req;
  }

  async cleanupApp() {
    await this.app.close();
  }
}

// Database Test Helper
export class DatabaseTestHelper {
  constructor(private prisma: PrismaService) {}

  async cleanDatabase() {
    // Clean up in reverse order of dependencies
    await this.prisma.attendanceRecord.deleteMany();
    await this.prisma.idCard.deleteMany();
    await this.prisma.student.deleteMany();
    await this.prisma.course.deleteMany();
    await this.prisma.admin.deleteMany();
  }

  async seedTestData() {
    // Create test admin
    const admin = await this.prisma.admin.create({
      data: {
        name: 'Test Admin',
        email: 'test@admin.com',
        password: 'hashedpassword',
        role: 'ADMIN',
      },
    });

    // Create test course
    const course = await this.prisma.course.create({
      data: {
        name: 'Test Course',
        type: 'BCA',
        duration: 3,
        description: 'Test course description',
      },
    });

    // Create test student
    const student = await this.prisma.student.create({
      data: {
        enrollmentNumber: '2024BCA001',
        name: 'Test Student',
        email: 'test@student.com',
        phone: '+1234567890',
        age: 20,
        gender: 'MALE',
        address: 'Test Address',
        admissionYear: 2024,
        passoutYear: 2027,
        courseId: course.id,
        createdBy: admin.id,
      },
    });

    return { admin, course, student };
  }
}

// Assertion Helpers
export class TestAssertions {
  static expectValidApiResponse(response: any) {
    expect(response).toHaveProperty('success');
    expect(response).toHaveProperty('message');
    expect(response).toHaveProperty('statusCode');
    expect(typeof response.success).toBe('boolean');
    expect(typeof response.message).toBe('string');
    expect(typeof response.statusCode).toBe('number');
  }

  static expectValidPaginatedResponse(response: any) {
    TestAssertions.expectValidApiResponse(response);
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('pagination');
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.pagination).toHaveProperty('page');
    expect(response.pagination).toHaveProperty('limit');
    expect(response.pagination).toHaveProperty('total');
    expect(response.pagination).toHaveProperty('totalPages');
    expect(response.pagination).toHaveProperty('hasNext');
    expect(response.pagination).toHaveProperty('hasPrev');
  }

  static expectValidErrorResponse(response: any) {
    expect(response).toHaveProperty('success', false);
    expect(response).toHaveProperty('message');
    expect(response).toHaveProperty('error');
    expect(response).toHaveProperty('statusCode');
    expect(typeof response.message).toBe('string');
    expect(typeof response.error).toBe('string');
    expect(typeof response.statusCode).toBe('number');
  }

  static expectValidStudent(student: any) {
    expect(student).toHaveProperty('id');
    expect(student).toHaveProperty('enrollmentNumber');
    expect(student).toHaveProperty('name');
    expect(student).toHaveProperty('email');
    expect(student).toHaveProperty('phone');
    expect(student).toHaveProperty('age');
    expect(student).toHaveProperty('gender');
    expect(student).toHaveProperty('address');
    expect(student).toHaveProperty('admissionYear');
    expect(student).toHaveProperty('passoutYear');
    expect(student).toHaveProperty('isActive');
    expect(student).toHaveProperty('createdAt');
    expect(student).toHaveProperty('updatedAt');
  }
}
