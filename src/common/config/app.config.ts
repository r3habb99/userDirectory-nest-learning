import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Application Configuration Service
 * Centralized configuration management with type safety and validation
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  // Database Configuration
  get database() {
    return {
      url: this.configService.get<string>('DATABASE_URL'),
      connectionLimit: this.configService.get<number>(
        'DB_CONNECTION_LIMIT',
        10,
      ),
      acquireTimeout: this.configService.get<number>(
        'DB_ACQUIRE_TIMEOUT',
        60000,
      ),
      timeout: this.configService.get<number>('DB_TIMEOUT', 60000),
      enableLogging: this.configService.get<boolean>(
        'DB_ENABLE_LOGGING',
        false,
      ),
    };
  }

  // JWT Configuration
  get jwt() {
    return {
      secret: this.configService.get<string>('JWT_SECRET', 'your-secret-key'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
      refreshSecret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      refreshExpiresIn: this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
        '7d',
      ),
    };
  }

  // Server Configuration
  get server() {
    return {
      port: this.configService.get<number>('PORT', 3000),
      host: this.configService.get<string>('HOST', '0.0.0.0'),
      nodeEnv: this.configService.get<string>('NODE_ENV', 'development'),
      frontendUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3001',
      ),
    };
  }

  // Upload Configuration
  get upload() {
    return {
      maxFileSize: this.configService.get<number>(
        'UPLOAD_MAX_FILE_SIZE',
        10 * 1024 * 1024,
      ), // 10MB
      allowedMimeTypes: this.configService
        .get<string>(
          'UPLOAD_ALLOWED_MIME_TYPES',
          'image/jpeg,image/png,image/webp',
        )
        .split(','),
      uploadPath: this.configService.get<string>('UPLOAD_PATH', './uploads'),
      baseUrl: this.configService.get<string>(
        'BASE_URL',
        'http://localhost:3000',
      ),
    };
  }

  // Security Configuration
  get security() {
    return {
      bcryptRounds: this.configService.get<number>('BCRYPT_ROUNDS', 12),
      rateLimitWindowMs: this.configService.get<number>(
        'RATE_LIMIT_WINDOW_MS',
        15 * 60 * 1000,
      ), // 15 minutes
      rateLimitMax: this.configService.get<number>('RATE_LIMIT_MAX', 100),
      corsOrigins: this.configService
        .get<string>('CORS_ORIGINS', '*')
        .split(','),
    };
  }

  // Cache Configuration
  get cache() {
    return {
      ttl: this.configService.get<number>('CACHE_TTL', 300), // 5 minutes
      max: this.configService.get<number>('CACHE_MAX', 100),
      redisUrl: this.configService.get<string>('REDIS_URL'),
    };
  }

  // Logging Configuration
  get logging() {
    return {
      level: this.configService.get<string>('LOG_LEVEL', 'info'),
      enableFileLogging: this.configService.get<boolean>(
        'LOG_ENABLE_FILE',
        false,
      ),
      logPath: this.configService.get<string>('LOG_PATH', './logs'),
    };
  }

  // Email Configuration (for future notifications)
  get email() {
    return {
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT', 587),
      secure: this.configService.get<boolean>('EMAIL_SECURE', false),
      user: this.configService.get<string>('EMAIL_USER'),
      password: this.configService.get<string>('EMAIL_PASSWORD'),
      from: this.configService.get<string>('EMAIL_FROM', 'noreply@college.edu'),
    };
  }

  // Application Features
  get features() {
    return {
      enableSwagger: this.configService.get<boolean>('ENABLE_SWAGGER', true),
      enableMetrics: this.configService.get<boolean>('ENABLE_METRICS', false),
      enableAuditLog: this.configService.get<boolean>('ENABLE_AUDIT_LOG', true),
      maxStudentsPerCourse: this.configService.get<number>(
        'MAX_STUDENTS_PER_COURSE',
        300,
      ),
    };
  }

  // Validation
  get isProduction(): boolean {
    return this.server.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.server.nodeEnv === 'development';
  }

  get isTest(): boolean {
    return this.server.nodeEnv === 'test';
  }

  /**
   * Validate required configuration
   */
  validateConfig(): void {
    const requiredConfigs = ['DATABASE_URL', 'JWT_SECRET'];

    const missingConfigs = requiredConfigs.filter(
      (config) => !this.configService.get(config),
    );

    if (missingConfigs.length > 0) {
      throw new Error(
        `Missing required configuration: ${missingConfigs.join(', ')}`,
      );
    }

    // Validate JWT secret in production
    if (this.isProduction && this.jwt.secret === 'your-secret-key') {
      throw new Error('JWT_SECRET must be set to a secure value in production');
    }
  }
}
