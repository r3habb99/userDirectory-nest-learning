import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../services/prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { PerformanceMonitorService } from '../../common/services/performance-monitor.service';
import {
  IntegrationTestHelper,
  DatabaseTestHelper,
  MockDataFactory,
} from '../../common/testing/test-utils';

/**
 * Performance Tests
 * Tests application performance under various load conditions
 */
describe('Performance Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cache: CacheService;
  let performanceMonitor: PerformanceMonitorService;
  let testHelper: IntegrationTestHelper;
  let dbHelper: DatabaseTestHelper;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    cache = moduleFixture.get<CacheService>(CacheService);
    performanceMonitor = moduleFixture.get<PerformanceMonitorService>(PerformanceMonitorService);

    await app.init();

    testHelper = new IntegrationTestHelper(app);
    dbHelper = new DatabaseTestHelper(prisma);
    authToken = await testHelper.getAuthToken();
  });

  beforeEach(async () => {
    await dbHelper.cleanDatabase();
    await cache.clear();
    performanceMonitor.resetMetrics();
  });

  afterAll(async () => {
    await dbHelper.cleanDatabase();
    await testHelper.cleanupApp();
  });

  describe('Response Time Performance', () => {
    it('should respond to health check within 100ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
    });

    it('should respond to student list within 500ms', async () => {
      // Create test data
      const course = await MockDataFactory.createCourse(prisma);
      await MockDataFactory.createMultipleStudents(prisma, 50, course.id);

      const startTime = Date.now();
      
      await testHelper
        .getAuthenticatedRequest('get', '/students')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });

    it('should handle student creation within 300ms', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      const studentDto = MockDataFactory.createStudentDto(course.id);

      const startTime = Date.now();
      
      await testHelper
        .getAuthenticatedRequest('post', '/students')
        .send(studentDto)
        .expect(201);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(300);
    });
  });

  describe('Load Testing', () => {
    it('should handle 50 concurrent student list requests', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      await MockDataFactory.createMultipleStudents(prisma, 100, course.id);

      const promises = Array.from({ length: 50 }, () =>
        testHelper
          .getAuthenticatedRequest('get', '/students?limit=10')
          .expect(200)
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should complete
      expect(results).toHaveLength(50);
      
      // Average response time should be reasonable
      const avgResponseTime = totalTime / 50;
      expect(avgResponseTime).toBeLessThan(1000);
    });

    it('should handle 20 concurrent student creations', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      
      const promises = Array.from({ length: 20 }, (_, index) => {
        const studentDto = MockDataFactory.createStudentDto(course.id);
        studentDto.email = `load-test-${index}@example.com`;
        
        return testHelper
          .getAuthenticatedRequest('post', '/students')
          .send(studentDto)
          .expect(201);
      });

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(20);
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 20 creations
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during repeated operations', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform 100 operations
      for (let i = 0; i < 100; i++) {
        const studentDto = MockDataFactory.createStudentDto(course.id);
        studentDto.email = `memory-test-${i}@example.com`;
        
        await testHelper
          .getAuthenticatedRequest('post', '/students')
          .send(studentDto)
          .expect(201);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncreaseMB).toBeLessThan(50);
    });
  });

  describe('Database Performance', () => {
    it('should handle large dataset queries efficiently', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      await MockDataFactory.createMultipleStudents(prisma, 1000, course.id);

      const startTime = Date.now();
      
      const response = await testHelper
        .getAuthenticatedRequest('get', '/students?limit=100')
        .expect(200);
      
      const queryTime = Date.now() - startTime;

      expect(response.body.data).toHaveLength(100);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle complex search queries efficiently', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      await MockDataFactory.createMultipleStudents(prisma, 500, course.id);

      const startTime = Date.now();
      
      await testHelper
        .getAuthenticatedRequest('get', '/students/search?q=test')
        .expect(200);
      
      const searchTime = Date.now() - startTime;
      expect(searchTime).toBeLessThan(800); // Search should be fast
    });
  });

  describe('Cache Performance', () => {
    it('should improve response times with caching', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      await MockDataFactory.createMultipleStudents(prisma, 100, course.id);

      // First request (cache miss)
      const startTime1 = Date.now();
      await testHelper
        .getAuthenticatedRequest('get', '/students/statistics')
        .expect(200);
      const firstRequestTime = Date.now() - startTime1;

      // Second request (cache hit)
      const startTime2 = Date.now();
      await testHelper
        .getAuthenticatedRequest('get', '/students/statistics')
        .expect(200);
      const secondRequestTime = Date.now() - startTime2;

      // Cached request should be significantly faster
      expect(secondRequestTime).toBeLessThan(firstRequestTime * 0.5);
    });

    it('should handle cache eviction gracefully', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      
      // Fill cache with many entries
      for (let i = 0; i < 100; i++) {
        await cache.set(`test-key-${i}`, { data: `test-data-${i}` });
      }

      // Verify cache is working
      const cachedValue = await cache.get('test-key-50');
      expect(cachedValue).toBeDefined();

      // Performance should remain stable even with cache pressure
      const startTime = Date.now();
      await testHelper
        .getAuthenticatedRequest('get', '/students')
        .expect(200);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(500);
    });
  });

  describe('File Upload Performance', () => {
    it('should handle file uploads efficiently', async () => {
      // Create a test file buffer (1MB)
      const fileBuffer = Buffer.alloc(1024 * 1024, 'test data');
      
      const startTime = Date.now();
      
      await testHelper
        .getAuthenticatedRequest('post', '/upload/profile')
        .attach('file', fileBuffer, 'test-image.jpg')
        .expect(201);
      
      const uploadTime = Date.now() - startTime;
      expect(uploadTime).toBeLessThan(2000); // 2 seconds for 1MB file
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics accurately', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      
      // Perform several operations
      for (let i = 0; i < 10; i++) {
        const studentDto = MockDataFactory.createStudentDto(course.id);
        studentDto.email = `metrics-test-${i}@example.com`;
        
        await testHelper
          .getAuthenticatedRequest('post', '/students')
          .send(studentDto)
          .expect(201);
      }

      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.requests.total).toBeGreaterThan(0);
      expect(metrics.requests.successful).toBeGreaterThan(0);
      expect(metrics.requests.averageResponseTime).toBeGreaterThan(0);
      expect(metrics.database.queries).toBeGreaterThan(0);
    });

    it('should generate performance summary', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      const studentDto = MockDataFactory.createStudentDto(course.id);
      
      await testHelper
        .getAuthenticatedRequest('post', '/students')
        .send(studentDto)
        .expect(201);

      const summary = performanceMonitor.getPerformanceSummary();
      
      expect(summary).toHaveProperty('health');
      expect(summary).toHaveProperty('alerts');
      expect(summary).toHaveProperty('recommendations');
      expect(summary).toHaveProperty('summary');
      expect(summary.health).toBeGreaterThan(0);
      expect(summary.health).toBeLessThanOrEqual(100);
    });
  });

  describe('Stress Testing', () => {
    it('should maintain stability under high load', async () => {
      const course = await MockDataFactory.createCourse(prisma);
      const errors: any[] = [];
      const responseTimes: number[] = [];

      // Perform 200 operations rapidly
      const promises = Array.from({ length: 200 }, async (_, index) => {
        try {
          const startTime = Date.now();
          
          if (index % 4 === 0) {
            // 25% reads
            await testHelper
              .getAuthenticatedRequest('get', '/students?limit=5')
              .expect(200);
          } else {
            // 75% writes
            const studentDto = MockDataFactory.createStudentDto(course.id);
            studentDto.email = `stress-test-${index}@example.com`;
            
            await testHelper
              .getAuthenticatedRequest('post', '/students')
              .send(studentDto)
              .expect(201);
          }
          
          responseTimes.push(Date.now() - startTime);
        } catch (error) {
          errors.push(error);
        }
      });

      await Promise.all(promises);

      // Error rate should be low
      const errorRate = (errors.length / 200) * 100;
      expect(errorRate).toBeLessThan(5); // Less than 5% error rate

      // Average response time should be reasonable
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      expect(avgResponseTime).toBeLessThan(2000); // Less than 2 seconds average
    });
  });
});
