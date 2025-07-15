import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/services/prisma/prisma.service';
import { API_CONFIG } from '../src/common/config/api.config';
import * as bcrypt from 'bcryptjs';

// Helper function to get typed HTTP server for supertest
// Note: TypeScript may show warnings about 'any' type, but this is correct for supertest compatibility
const getHttpServer = (app: INestApplication): any => app.getHttpServer();

// Type definitions for API responses
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

interface AdminResponse {
  id: string;
  email: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  password?: string; // Optional for testing password exclusion
}

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  admin: AdminResponse;
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Apply the same configuration as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.setGlobalPrefix(API_CONFIG.PREFIX);
    await app.init();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prismaService.admin.deleteMany();
  });

  describe('/auth/register (POST)', () => {
    const registerDto = {
      email: 'test@admin.com',
      password: 'password123',
      name: 'Test Admin',
      phone: '1234567890',
    };

    it('should register a new admin successfully', () => {
      return request(getHttpServer(app))
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          const body = res.body as ApiResponse<AdminResponse>;
          expect(body.success).toBe(true);
          expect(body.data?.email).toBe(registerDto.email);
          expect(body.data?.name).toBe(registerDto.name);
          expect(body.data?.password).toBeUndefined();
        });
    });

    it('should return 400 if admin already exists', async () => {
      // Create admin first
      const hashedPassword = await bcrypt.hash(registerDto.password, 12);
      await prismaService.admin.create({
        data: {
          ...registerDto,
          password: hashedPassword,
        },
      });

      return request(getHttpServer(app))
        .post('/auth/register')
        .send(registerDto)
        .expect(401)
        .expect((res) => {
          const body = res.body as ApiResponse;
          expect(body.success).toBe(false);
        });
    });

    it('should return 400 for invalid email format', () => {
      return request(getHttpServer(app))
        .post('/auth/register')
        .send({
          ...registerDto,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      return request(getHttpServer(app))
        .post('/auth/register')
        .send({
          email: registerDto.email,
          // missing password, name, phone
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    const adminData = {
      email: 'test@admin.com',
      password: 'password123',
      name: 'Test Admin',
      phone: '1234567890',
    };

    beforeEach(async () => {
      // Create admin for login tests
      const hashedPassword = await bcrypt.hash(adminData.password, 12);
      await prismaService.admin.create({
        data: {
          ...adminData,
          password: hashedPassword,
        },
      });
    });

    it('should login successfully with valid credentials', () => {
      return request(getHttpServer(app))
        .post('/auth/login')
        .send({
          email: adminData.email,
          password: adminData.password,
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as ApiResponse<LoginResponse>;
          expect(body.success).toBe(true);
          expect(body.data?.accessToken).toBeDefined();
          expect(body.data?.tokenType).toBe('Bearer');
          expect(body.data?.admin.email).toBe(adminData.email);
          expect(body.data?.admin.password).toBeUndefined();
        });
    });

    it('should return 401 for invalid email', () => {
      return request(getHttpServer(app))
        .post('/auth/login')
        .send({
          email: 'wrong@email.com',
          password: adminData.password,
        })
        .expect(401)
        .expect((res) => {
          const body = res.body as ApiResponse;
          expect(body.success).toBe(false);
        });
    });

    it('should return 401 for invalid password', () => {
      return request(getHttpServer(app))
        .post('/auth/login')
        .send({
          email: adminData.email,
          password: 'wrong-password',
        })
        .expect(401)
        .expect((res) => {
          const body = res.body as ApiResponse;
          expect(body.success).toBe(false);
        });
    });

    it('should return 401 for inactive admin', async () => {
      // Deactivate admin
      await prismaService.admin.update({
        where: { email: adminData.email },
        data: { isActive: false },
      });

      return request(getHttpServer(app))
        .post('/auth/login')
        .send({
          email: adminData.email,
          password: adminData.password,
        })
        .expect(401);
    });
  });

  describe('/auth/profile (POST)', () => {
    let authToken: string;
    const adminData = {
      email: 'test@admin.com',
      password: 'password123',
      name: 'Test Admin',
      phone: '1234567890',
    };

    beforeEach(async () => {
      // Create admin and get auth token
      const hashedPassword = await bcrypt.hash(adminData.password, 12);
      await prismaService.admin.create({
        data: {
          ...adminData,
          password: hashedPassword,
        },
      });

      const loginResponse = await request(getHttpServer(app))
        .post('/auth/login')
        .send({
          email: adminData.email,
          password: adminData.password,
        });

      const loginBody = loginResponse.body as ApiResponse<LoginResponse>;
      authToken = loginBody.data?.accessToken || '';
    });

    it('should get profile with valid token', () => {
      return request(getHttpServer(app))
        .post('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as ApiResponse<AdminResponse>;
          expect(body.success).toBe(true);
          expect(body.data?.email).toBe(adminData.email);
        });
    });

    it('should return 401 without token', () => {
      return request(getHttpServer(app)).post('/auth/profile').expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(getHttpServer(app))
        .post('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
