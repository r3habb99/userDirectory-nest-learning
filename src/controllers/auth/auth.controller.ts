import {
  Controller,
  Post,
  Get,
  Body,
  ValidationPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '../../services/auth/auth.service';
import { LoginDto } from '../../dto/auth/login.dto';
import { RegisterAdminDto } from '../../dto/auth/register-admin.dto';
import { ChangePasswordDto } from '../../dto/auth/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { ApiResponse, AuthenticatedRequest } from '../../common/interfaces';
import {
  LoginResponseDto,
  ApiResponseDto,
  ErrorResponseDto,
} from '../../dto/common/api-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login' })
  @SwaggerResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @SwaggerResponse({
    status: 401,
    description: 'Invalid credentials',
    type: ErrorResponseDto,
  })
  async login(@Body(ValidationPipe) loginDto: LoginDto): Promise<ApiResponse> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new admin' })
  @SwaggerResponse({
    status: 201,
    description: 'Admin registered successfully',
    type: ApiResponseDto,
  })
  @SwaggerResponse({
    status: 400,
    description: 'Admin with this email already exists',
    type: ErrorResponseDto,
  })
  async register(
    @Body(ValidationPipe) registerDto: RegisterAdminDto,
  ): Promise<ApiResponse> {
    return this.authService.registerAdmin(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('change-password')
  @ApiOperation({ summary: 'Change admin password' })
  @SwaggerResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @SwaggerResponse({
    status: 401,
    description: 'Current password is incorrect',
  })
  async changePassword(
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse> {
    const adminId: string = req.user.id;
    return this.authService.changePassword(
      adminId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get admin profile' })
  @SwaggerResponse({
    status: 200,
    description: 'Profile retrieved successfully',
  })
  getProfile(@Request() req: AuthenticatedRequest): ApiResponse {
    return {
      success: true,
      data: req.user,
      message: 'Profile retrieved successfully',
      statusCode: 200,
    };
  }
}
