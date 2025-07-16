# Testing Guide

This document provides comprehensive guidance for testing the College Student Directory application.

## Testing Strategy

Our testing strategy follows the testing pyramid approach:

1. **Unit Tests** (70%) - Fast, isolated tests for individual components
2. **Integration Tests** (20%) - Tests for component interactions
3. **End-to-End Tests** (10%) - Full workflow tests

## Test Types

### 1. Unit Tests
- **Location**: `src/**/*.spec.ts`
- **Purpose**: Test individual functions, classes, and components in isolation
- **Tools**: Jest, TypeScript
- **Coverage Target**: 80%

### 2. Integration Tests
- **Location**: `src/test/integration/*.spec.ts`
- **Purpose**: Test interactions between components, services, and database
- **Tools**: Jest, Supertest, Test Database

### 3. End-to-End Tests
- **Location**: `src/test/e2e/*.e2e-spec.ts`
- **Purpose**: Test complete user workflows from start to finish
- **Tools**: Jest, Supertest, Test Database

### 4. Performance Tests
- **Location**: `src/test/performance/*.spec.ts`
- **Purpose**: Test application performance under various load conditions
- **Tools**: Jest, Custom performance utilities

### 5. Security Tests
- **Location**: `src/test/security/*.spec.ts`
- **Purpose**: Test security measures and vulnerability protections
- **Tools**: Jest, Security testing utilities

## Running Tests

### All Tests
```bash
npm test                    # Run all tests
npm run test:all           # Run all test types sequentially
npm run test:ci            # Run tests in CI mode
```

### Specific Test Types
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only
npm run test:performance  # Performance tests only
npm run test:security     # Security tests only
```

### Development
```bash
npm run test:watch        # Watch mode for development
npm run test:debug        # Debug mode
npm run test:coverage     # Generate coverage report
```

## Test Configuration

### Jest Configuration
- **Config File**: `jest.config.js`
- **Setup File**: `src/test/setup.ts`
- **Global Setup**: `src/test/global-setup.ts`
- **Global Teardown**: `src/test/global-teardown.ts`

### Environment Variables
```bash
NODE_ENV=test
DATABASE_URL=mysql://test:test@localhost:3306/test_db
JWT_SECRET=test-jwt-secret
```

## Writing Tests

### Unit Test Example
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { StudentService } from './student.service';
import { MockPrismaService } from '../../common/testing/test-utils';

describe('StudentService', () => {
  let service: StudentService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        { provide: PrismaService, useClass: MockPrismaService },
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
    prisma = module.get<MockPrismaService>(PrismaService);
  });

  it('should create a student', async () => {
    const studentDto = { name: 'John Doe', email: 'john@test.com' };
    const mockStudent = { id: '1', ...studentDto };
    
    prisma.student.create.mockResolvedValue(mockStudent);
    
    const result = await service.create(studentDto);
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockStudent);
  });
});
```

### Integration Test Example
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('Student Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should create a student', async () => {
    const studentDto = {
      name: 'John Doe',
      email: 'john@test.com',
      // ... other fields
    };

    const response = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', 'Bearer valid-token')
      .send(studentDto)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(studentDto.name);
  });
});
```

## Test Utilities

### MockDataFactory
Creates realistic test data:
```typescript
import { MockDataFactory } from '../../common/testing/test-utils';

// Create test student
const student = await MockDataFactory.createStudent(prisma, courseId);

// Create multiple students
const students = await MockDataFactory.createMultipleStudents(prisma, 10, courseId);

// Create test course
const course = await MockDataFactory.createCourse(prisma);
```

### TestAssertions
Common test assertions:
```typescript
import { TestAssertions } from '../../common/testing/test-utils';

// Validate API response structure
TestAssertions.expectValidApiResponse(response.body);

// Validate error response
TestAssertions.expectValidErrorResponse(response.body);

// Validate paginated response
TestAssertions.expectValidPaginatedResponse(response.body);
```

### IntegrationTestHelper
Simplifies integration testing:
```typescript
import { IntegrationTestHelper } from '../../common/testing/test-utils';

const testHelper = new IntegrationTestHelper(app);
const authToken = await testHelper.getAuthToken();

// Make authenticated requests
const response = await testHelper
  .getAuthenticatedRequest('get', '/students')
  .expect(200);
```

## Database Testing

### Test Database Setup
1. Use separate test database
2. Clean database before each test
3. Seed with minimal required data

### Database Helper
```typescript
import { DatabaseTestHelper } from '../../common/testing/test-utils';

const dbHelper = new DatabaseTestHelper(prisma);

beforeEach(async () => {
  await dbHelper.cleanDatabase();
  const testData = await dbHelper.seedTestData();
});
```

## Performance Testing

### Response Time Tests
```typescript
it('should respond within 500ms', async () => {
  const startTime = Date.now();
  
  await request(app.getHttpServer())
    .get('/students')
    .expect(200);
  
  const responseTime = Date.now() - startTime;
  expect(responseTime).toBeLessThan(500);
});
```

### Load Testing
```typescript
it('should handle 50 concurrent requests', async () => {
  const promises = Array.from({ length: 50 }, () =>
    request(app.getHttpServer()).get('/students').expect(200)
  );

  const results = await Promise.all(promises);
  expect(results).toHaveLength(50);
});
```

## Security Testing

### Authentication Tests
```typescript
it('should reject unauthenticated requests', async () => {
  await request(app.getHttpServer())
    .get('/students')
    .expect(401);
});
```

### Input Validation Tests
```typescript
it('should prevent SQL injection', async () => {
  const maliciousInput = "'; DROP TABLE students; --";
  
  await request(app.getHttpServer())
    .post('/students')
    .send({ name: maliciousInput })
    .set('Authorization', 'Bearer valid-token')
    .expect(201); // Should succeed but sanitize input
});
```

## Coverage Requirements

### Minimum Coverage Thresholds
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Coverage Reports
- **HTML Report**: `coverage/lcov-report/index.html`
- **LCOV Report**: `coverage/lcov.info`
- **JSON Report**: `coverage/coverage-final.json`

## CI/CD Integration

### GitHub Actions
- Runs on every push and pull request
- Tests against multiple Node.js versions
- Includes security and lint checks
- Generates coverage reports
- Uploads artifacts

### Test Pipeline
1. **Setup** - Install dependencies, setup database
2. **Lint** - ESLint, Prettier, TypeScript checks
3. **Security** - Audit dependencies, security tests
4. **Test** - Unit, integration, e2e, performance tests
5. **Coverage** - Generate and upload coverage reports
6. **Build** - Build application
7. **Deploy** - Deploy if all tests pass

## Best Practices

### Test Organization
1. Group related tests in describe blocks
2. Use descriptive test names
3. Follow AAA pattern (Arrange, Act, Assert)
4. Keep tests independent and isolated

### Test Data
1. Use factories for creating test data
2. Clean up after each test
3. Use realistic but minimal data
4. Avoid hardcoded values

### Mocking
1. Mock external dependencies
2. Use dependency injection for testability
3. Mock at the boundary of your system
4. Verify mock interactions when necessary

### Performance
1. Keep tests fast
2. Use parallel execution when possible
3. Clean up resources properly
4. Monitor test execution time

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Ensure test database is running
docker run -d --name test-mysql -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 mysql:8.0

# Check connection
mysql -h127.0.0.1 -P3306 -uroot -proot -e "SHOW DATABASES;"
```

#### Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or in package.json scripts
"test": "NODE_OPTIONS='--max-old-space-size=4096' jest"
```

#### Timeout Issues
```bash
# Increase Jest timeout
jest.setTimeout(30000);

# Or in jest.config.js
module.exports = {
  testTimeout: 30000,
};
```

### Debug Mode
```bash
# Run tests in debug mode
npm run test:debug

# Debug specific test
npm run test:debug -- --testNamePattern="should create student"
```

## Continuous Improvement

### Metrics to Monitor
- Test execution time
- Coverage trends
- Flaky test detection
- Test maintenance overhead

### Regular Tasks
- Review and update test coverage
- Refactor slow or flaky tests
- Update test data and mocks
- Review security test scenarios
