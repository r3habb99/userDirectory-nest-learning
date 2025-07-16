# Developer Guide

This guide provides comprehensive information for developers working on the College Student Directory API.

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Database      │
│   (React/Vue)   │◄──►│   (NestJS)      │◄──►│   (MySQL)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   File Storage  │
                       │   (Local/Cloud) │
                       └─────────────────┘
```

### Application Layers

1. **Presentation Layer** (Controllers)
   - HTTP request handling
   - Input validation
   - Response formatting
   - API documentation

2. **Business Logic Layer** (Services)
   - Core business rules
   - Data processing
   - External integrations
   - Caching logic

3. **Data Access Layer** (Prisma)
   - Database operations
   - Query optimization
   - Transaction management
   - Connection pooling

4. **Infrastructure Layer** (Common)
   - Authentication & authorization
   - Logging & monitoring
   - Error handling
   - Utilities & helpers

## 📁 Project Structure

```
src/
├── common/                 # Shared components
│   ├── base/              # Base classes
│   ├── config/            # Configuration files
│   ├── decorators/        # Custom decorators
│   ├── dto/               # Common DTOs
│   ├── exceptions/        # Custom exceptions
│   ├── filters/           # Exception filters
│   ├── guards/            # Authentication guards
│   ├── interfaces/        # TypeScript interfaces
│   ├── middleware/        # Custom middleware
│   ├── pipes/             # Validation pipes
│   ├── services/          # Shared services
│   ├── testing/           # Test utilities
│   ├── types/             # Type definitions
│   └── utils/             # Utility functions
├── controllers/           # API controllers
│   ├── admin/             # Admin management
│   ├── attendance/        # Attendance tracking
│   ├── auth/              # Authentication
│   ├── course/            # Course management
│   ├── performance/       # Performance monitoring
│   ├── student/           # Student management
│   └── upload/            # File uploads
├── dto/                   # Data transfer objects
│   ├── admin/             # Admin DTOs
│   ├── attendance/        # Attendance DTOs
│   ├── auth/              # Auth DTOs
│   ├── course/            # Course DTOs
│   ├── student/           # Student DTOs
│   └── upload/            # Upload DTOs
├── modules/               # Feature modules
│   ├── performance/       # Performance module
│   └── upload/            # Upload module
├── services/              # Business logic services
│   ├── admin/             # Admin services
│   ├── attendance/        # Attendance services
│   ├── auth/              # Auth services
│   ├── course/            # Course services
│   ├── enrollment/        # Enrollment services
│   ├── prisma/            # Database service
│   ├── student/           # Student services
│   └── upload/            # Upload services
├── test/                  # Test files
│   ├── e2e/               # End-to-end tests
│   ├── integration/       # Integration tests
│   ├── performance/       # Performance tests
│   └── security/          # Security tests
├── app.module.ts          # Root module
└── main.ts                # Application entry point
```

## 🔧 Development Setup

### Prerequisites

1. **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
2. **MySQL 8.0+**: Install locally or use Docker
3. **Git**: Version control
4. **VS Code**: Recommended IDE with extensions

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "prisma.prisma",
    "ms-vscode.vscode-jest",
    "humao.rest-client",
    "ms-vscode.vscode-json"
  ]
}
```

### Environment Configuration

Create `.env` file with required variables:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/college_directory"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# Server
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3001"

# File Upload
UPLOAD_MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Performance
ENABLE_METRICS=true
CACHE_TTL=300
```

### Database Setup

1. **Create Database**:
   ```sql
   CREATE DATABASE college_directory;
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Push Schema**:
   ```bash
   npx prisma db push
   ```

4. **Seed Data** (optional):
   ```bash
   npm run seed
   ```

## 🛠️ Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Start development server
npm run start:dev

# Make changes and test
npm run test:unit

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### 2. Code Quality Checks

```bash
# Lint code
npm run lint
npm run lint:fix

# Format code
npm run format
npm run format:check

# Type checking
npm run type-check

# Run all tests
npm run test:all
```

### 3. Database Changes

```bash
# Modify schema in schema.prisma
# Generate migration
npx prisma migrate dev --name add_new_field

# Generate client
npx prisma generate

# View database
npx prisma studio
```

## 📝 Coding Standards

### TypeScript Guidelines

1. **Strict Mode**: Always use strict TypeScript
2. **Type Safety**: Avoid `any`, use proper types
3. **Interfaces**: Define interfaces for all data structures
4. **Enums**: Use enums for constants
5. **Generics**: Use generics for reusable components

### NestJS Best Practices

1. **Dependency Injection**: Use constructor injection
2. **Modules**: Organize code into feature modules
3. **Guards**: Use guards for authentication/authorization
4. **Pipes**: Use pipes for validation and transformation
5. **Interceptors**: Use interceptors for cross-cutting concerns

### Code Organization

1. **Single Responsibility**: One responsibility per class/function
2. **DRY Principle**: Don't repeat yourself
3. **SOLID Principles**: Follow SOLID design principles
4. **Clean Code**: Write self-documenting code
5. **Error Handling**: Proper error handling and logging

### Naming Conventions

```typescript
// Classes: PascalCase
class StudentService {}

// Interfaces: PascalCase with 'I' prefix (optional)
interface IStudentRepository {}

// Methods/Variables: camelCase
const studentCount = 10;
function getStudentById() {}

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 1024 * 1024;

// Files: kebab-case
student.service.ts
student.controller.spec.ts
```

## 🧪 Testing Guidelines

### Test Structure

```typescript
describe('StudentService', () => {
  let service: StudentService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    // Setup test module
  });

  describe('create', () => {
    it('should create a student successfully', async () => {
      // Arrange
      const studentDto = { /* test data */ };
      
      // Act
      const result = await service.create(studentDto);
      
      // Assert
      expect(result.success).toBe(true);
    });

    it('should throw error for invalid data', async () => {
      // Test error cases
    });
  });
});
```

### Test Data Management

```typescript
// Use factories for test data
const student = MockDataFactory.createStudent();
const course = MockDataFactory.createCourse();

// Clean up after tests
afterEach(async () => {
  await dbHelper.cleanDatabase();
});
```

### Mocking Guidelines

```typescript
// Mock external dependencies
const mockPrismaService = {
  student: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

// Use dependency injection for mocks
providers: [
  StudentService,
  { provide: PrismaService, useValue: mockPrismaService },
]
```

## 🔍 Debugging

### VS Code Debug Configuration

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "program": "${workspaceFolder}/src/main.ts",
  "outFiles": ["${workspaceFolder}/dist/**/*.js"],
  "runtimeArgs": ["-r", "ts-node/register"],
  "env": {
    "NODE_ENV": "development"
  }
}
```

### Logging

```typescript
import { Logger } from '@nestjs/common';

export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  async create(dto: CreateStudentDto) {
    this.logger.log(`Creating student: ${dto.email}`);
    
    try {
      // Business logic
      this.logger.debug('Student created successfully');
    } catch (error) {
      this.logger.error('Failed to create student', error.stack);
      throw error;
    }
  }
}
```

### Performance Monitoring

```typescript
// Use performance decorators
@ApiOperation({ summary: 'Create student' })
@ApiStandardResponses()
async create(@Body() dto: CreateStudentDto) {
  const startTime = Date.now();
  
  try {
    const result = await this.studentService.create(dto);
    const duration = Date.now() - startTime;
    
    this.logger.debug(`Student creation took ${duration}ms`);
    return result;
  } catch (error) {
    this.logger.error('Student creation failed', error);
    throw error;
  }
}
```

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Logging configured

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY prisma ./prisma

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### Environment-Specific Configurations

```typescript
// config/database.config.ts
export const getDatabaseConfig = () => {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'production':
      return {
        url: process.env.DATABASE_URL,
        ssl: true,
        pool: { min: 5, max: 20 },
      };
    case 'test':
      return {
        url: process.env.TEST_DATABASE_URL,
        ssl: false,
        pool: { min: 1, max: 5 },
      };
    default:
      return {
        url: process.env.DATABASE_URL,
        ssl: false,
        pool: { min: 2, max: 10 },
      };
  }
};
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify database server is running
   - Check network connectivity

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Validate token format

3. **File Upload Problems**
   - Check file size limits
   - Verify upload directory permissions
   - Validate file types

4. **Performance Issues**
   - Enable query logging
   - Check database indexes
   - Monitor memory usage
   - Review cache configuration

### Debug Commands

```bash
# Check database connection
npx prisma db pull

# Validate schema
npx prisma validate

# Reset database
npx prisma migrate reset

# Check dependencies
npm audit

# Analyze bundle size
npm run build:analyze
```

## 📚 Additional Resources

- **[NestJS Documentation](https://docs.nestjs.com/)**
- **[Prisma Documentation](https://www.prisma.io/docs/)**
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)**
- **[Jest Testing Framework](https://jestjs.io/docs/getting-started)**
- **[MySQL Documentation](https://dev.mysql.com/doc/)**
