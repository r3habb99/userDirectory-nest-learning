import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/services/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

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
    app.setGlobalPrefix('api/v1');
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

  describe('/api/v1/auth/register (POST)', () => {
    const registerDto = {
      email: 'test@admin.com',
      password: 'password123',
      name: 'Test Admin',
      phone: '1234567890',
    };

    it('should register a new admin successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.email).toBe(registerDto.email);
          expect(res.body.data.name).toBe(registerDto.name);
          expect(res.body.data.password).toBeUndefined();
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

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });

    it('should return 400 for invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...registerDto,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: registerDto.email,
          // missing password, name, phone
        })
        .expect(400);
    });
  });

  describe('/api/v1/auth/login (POST)', () => {
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
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminData.email,
          password: adminData.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.accessToken).toBeDefined();
          expect(res.body.data.tokenType).toBe('Bearer');
          expect(res.body.data.admin.email).toBe(adminData.email);
          expect(res.body.data.admin.password).toBeUndefined();
        });
    });

    it('should return 401 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@email.com',
          password: adminData.password,
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });

    it('should return 401 for invalid password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminData.email,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });

    it('should return 401 for inactive admin', async () => {
      // Deactivate admin
      await prismaService.admin.update({
        where: { email: adminData.email },
        data: { isActive: false },
      });

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminData.email,
          password: adminData.password,
        })
        .expect(401);
    });
  });

  describe('/api/v1/auth/profile (POST)', () => {
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

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminData.email,
          password: adminData.password,
        });

      authToken = loginResponse.body.data.accessToken;
    });

    it('should get profile with valid token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.email).toBe(adminData.email);
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/profile')
        .expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
