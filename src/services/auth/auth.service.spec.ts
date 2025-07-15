import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from '../../dto/auth/login.dto';
import { RegisterAdminDto } from '../../dto/auth/register-admin.dto';
import { LoginResponseData, AdminData } from '../../common/interfaces';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    admin: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'admin@test.com',
      password: 'password123',
    };

    const mockAdmin = {
      id: '1',
      email: 'admin@test.com',
      password: '$2a$12$hashed_password',
      name: 'Test Admin',
      phone: '1234567890',
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should login successfully with valid credentials', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.login(loginDto);

      expect(result.success).toBe(true);
      expect((result.data as LoginResponseData).accessToken).toBe('jwt-token');
      expect((result.data as LoginResponseData).admin.email).toBe(
        mockAdmin.email,
      );
      expect((result.data as LoginResponseData).admin.password).toBeUndefined();
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive admin', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue({
        ...mockAdmin,
        isActive: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('registerAdmin', () => {
    const registerDto: RegisterAdminDto = {
      email: 'newadmin@test.com',
      password: 'password123',
      name: 'New Admin',
      phone: '1234567890',
    };

    it('should register admin successfully', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password' as never);
      mockPrismaService.admin.create.mockResolvedValue({
        id: '1',
        ...registerDto,
        password: 'hashed_password',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.registerAdmin(registerDto);

      expect(result.success).toBe(true);
      expect((result.data as AdminData).email).toBe(registerDto.email);
      expect((result.data as AdminData).password).toBeUndefined();
    });

    it('should throw UnauthorizedException if admin already exists', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue({
        id: '1',
        email: registerDto.email,
      });

      await expect(service.registerAdmin(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateAdmin', () => {
    const adminId = '1';
    const mockAdmin = {
      id: adminId,
      email: 'admin@test.com',
      name: 'Test Admin',
      phone: '1234567890',
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate admin successfully', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);

      const result = await service.validateAdmin(adminId);

      expect(result).toEqual(mockAdmin);
    });

    it('should throw UnauthorizedException for non-existent admin', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(null);

      await expect(service.validateAdmin(adminId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('changePassword', () => {
    const adminId = '1';
    const currentPassword = 'old_password';
    const newPassword = 'new_password';
    const mockAdmin = {
      id: adminId,
      password: '$2a$12$hashed_old_password',
    };

    it('should change password successfully', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('hashed_new_password' as never);
      mockPrismaService.admin.update.mockResolvedValue({});

      const result = await service.changePassword(
        adminId,
        currentPassword,
        newPassword,
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password changed successfully');
    });

    it('should throw UnauthorizedException for invalid current password', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.changePassword(adminId, currentPassword, newPassword),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
