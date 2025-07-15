import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from '../../dto/auth/login.dto';
import { RegisterAdminDto } from '../../dto/auth/register-admin.dto';
import { ResponseUtils } from '../../common/utils/response.utils';
import { ApiResponse } from '../../common/interfaces/api-response.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Admin login
   */
  async login(loginDto: LoginDto): Promise<ApiResponse> {
    try {
      const { email, password } = loginDto;

      // Find admin by email
      const admin = await this.prisma.admin.findUnique({
        where: { email },
      });

      if (!admin) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if admin is active
      if (!admin.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      const payload = {
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        name: admin.name,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      // Remove password from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...adminData } = admin;

      return ResponseUtils.success(
        {
          admin: adminData,
          accessToken,
          tokenType: 'Bearer',
        },
        'Login successful',
      );
    } catch (error) {
      this.logger.error(
        `Login failed for email: ${loginDto.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Register new admin (for initial setup or admin creation)
   */
  async registerAdmin(registerDto: RegisterAdminDto): Promise<ApiResponse> {
    try {
      const { email, password, name, phone } = registerDto;

      // Check if admin already exists
      const existingAdmin = await this.prisma.admin.findUnique({
        where: { email },
      });

      if (existingAdmin) {
        throw new UnauthorizedException('Admin with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create admin
      const admin = await this.prisma.admin.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
        },
      });

      // Remove password from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password2, ...adminData } = admin;

      return ResponseUtils.success(adminData, 'Admin registered successfully');
    } catch (error) {
      this.logger.error(
        `Admin registration failed for email: ${registerDto.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Validate admin by ID (used by JWT strategy)
   */
  async validateAdmin(adminId: string): Promise<{
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    try {
      const admin = await this.prisma.admin.findUnique({
        where: { id: adminId, isActive: true },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!admin) {
        throw new UnauthorizedException('Admin not found or inactive');
      }

      return admin;
    } catch (error) {
      this.logger.error(
        `Admin validation failed for ID: ${adminId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Change admin password
   */
  async changePassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<ApiResponse> {
    try {
      // Find admin
      const admin = await this.prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!admin) {
        throw new UnauthorizedException('Admin not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        admin.password,
      );
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await this.prisma.admin.update({
        where: { id: adminId },
        data: { password: hashedNewPassword },
      });

      return ResponseUtils.success(null, 'Password changed successfully');
    } catch (error) {
      this.logger.error(
        `Password change failed for admin ID: ${adminId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
