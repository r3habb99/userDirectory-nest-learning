import { registerAs } from '@nestjs/config';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  validateSync,
} from 'class-validator';
import { plainToClass, Transform } from 'class-transformer';

/**
 * Configuration Management System
 * Provides type-safe configuration with validation
 */

class DatabaseConfig {
  @IsString()
  url: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  connectionLimit?: number = 10;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  acquireTimeout?: number = 60000;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  timeout?: number = 60000;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  enableLogging?: boolean = false;
}

class JwtConfig {
  @IsString()
  secret: string;

  @IsString()
  @IsOptional()
  expiresIn?: string = '24h';

  @IsString()
  @IsOptional()
  refreshSecret?: string;

  @IsString()
  @IsOptional()
  refreshExpiresIn?: string = '7d';
}

class ServerConfig {
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  port: number = 3000;

  @IsString()
  @IsOptional()
  host?: string = '0.0.0.0';

  @IsString()
  @IsOptional()
  nodeEnv?: string = 'development';

  @IsString()
  @IsOptional()
  frontendUrl?: string = 'http://localhost:3001';
}

class SecurityConfig {
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  bcryptRounds?: number = 12;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  rateLimitWindowMs?: number = 15 * 60 * 1000; // 15 minutes

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  rateLimitMax?: number = 100;

  @IsString()
  @IsOptional()
  corsOrigins?: string = '*';
}

class CacheConfig {
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  ttl?: number = 300; // 5 minutes

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  max?: number = 100;

  @IsString()
  @IsOptional()
  redisUrl?: string;
}

class LoggingConfig {
  @IsString()
  @IsOptional()
  level?: string = 'info';

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  enableFileLogging?: boolean = false;

  @IsString()
  @IsOptional()
  logPath?: string = './logs';
}

class EmailConfig {
  @IsString()
  @IsOptional()
  host?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  port?: number = 587;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  secure?: boolean = false;

  @IsString()
  @IsOptional()
  user?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  from?: string = 'noreply@college.edu';
}

class UploadConfig {
  @IsString()
  @IsOptional()
  uploadPath?: string = './uploads';

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  maxFileSize?: number = 5 * 1024 * 1024; // 5MB

  @IsString()
  @IsOptional()
  allowedImageTypes?: string = 'image/jpeg,image/png,image/webp';

  @IsString()
  @IsOptional()
  allowedDocumentTypes?: string =
    'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}

class FeaturesConfig {
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  enableSwagger?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  enableMetrics?: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  enableAuditLog?: boolean = true;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  maxStudentsPerCourse?: number = 300;
}

export class AppConfiguration {
  database: DatabaseConfig;
  jwt: JwtConfig;
  server: ServerConfig;
  security: SecurityConfig;
  cache: CacheConfig;
  logging: LoggingConfig;
  email: EmailConfig;
  upload: UploadConfig;
  features: FeaturesConfig;
}

function validateConfig(config: Record<string, unknown>): AppConfiguration {
  const validatedConfig = plainToClass(AppConfiguration, {
    database: {
      url: config.DATABASE_URL,
      connectionLimit: config.DB_CONNECTION_LIMIT,
      acquireTimeout: config.DB_ACQUIRE_TIMEOUT,
      timeout: config.DB_TIMEOUT,
      enableLogging: config.DB_ENABLE_LOGGING,
    },
    jwt: {
      secret: config.JWT_SECRET,
      expiresIn: config.JWT_EXPIRES_IN,
      refreshSecret: config.JWT_REFRESH_SECRET,
      refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
    },
    server: {
      port: config.PORT,
      host: config.HOST,
      nodeEnv: config.NODE_ENV,
      frontendUrl: config.FRONTEND_URL,
    },
    security: {
      bcryptRounds: config.BCRYPT_ROUNDS,
      rateLimitWindowMs: config.RATE_LIMIT_WINDOW_MS,
      rateLimitMax: config.RATE_LIMIT_MAX,
      corsOrigins: config.CORS_ORIGINS,
    },
    cache: {
      ttl: config.CACHE_TTL,
      max: config.CACHE_MAX,
      redisUrl: config.REDIS_URL,
    },
    logging: {
      level: config.LOG_LEVEL,
      enableFileLogging: config.LOG_ENABLE_FILE,
      logPath: config.LOG_PATH,
    },
    email: {
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: config.EMAIL_SECURE,
      user: config.EMAIL_USER,
      password: config.EMAIL_PASSWORD,
      from: config.EMAIL_FROM,
    },
    upload: {
      uploadPath: config.UPLOAD_PATH,
      maxFileSize: config.MAX_FILE_SIZE,
      allowedImageTypes: config.ALLOWED_IMAGE_TYPES,
      allowedDocumentTypes: config.ALLOWED_DOCUMENT_TYPES,
    },
    features: {
      enableSwagger: config.ENABLE_SWAGGER,
      enableMetrics: config.ENABLE_METRICS,
      enableAuditLog: config.ENABLE_AUDIT_LOG,
      maxStudentsPerCourse: config.MAX_STUDENTS_PER_COURSE,
    },
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed: ${errors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('; ')}`,
    );
  }

  return validatedConfig;
}

// Configuration exports for NestJS
export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000', 10),
  timeout: parseInt(process.env.DB_TIMEOUT || '60000', 10),
  enableLogging: process.env.DB_ENABLE_LOGGING === 'true',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));

export const serverConfig = registerAs('server', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
}));

export const securityConfig = registerAs('security', () => ({
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  corsOrigins: process.env.CORS_ORIGINS || '*',
}));

export const cacheConfig = registerAs('cache', () => ({
  ttl: parseInt(process.env.CACHE_TTL || '300', 10),
  max: parseInt(process.env.CACHE_MAX || '100', 10),
  redisUrl: process.env.REDIS_URL,
}));

export const loggingConfig = registerAs('logging', () => ({
  level: process.env.LOG_LEVEL || 'info',
  enableFileLogging: process.env.LOG_ENABLE_FILE === 'true',
  logPath: process.env.LOG_PATH || './logs',
}));

export const emailConfig = registerAs('email', () => ({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD,
  from: process.env.EMAIL_FROM || 'noreply@college.edu',
}));

export const uploadConfig = registerAs('upload', () => ({
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  allowedImageTypes:
    process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp',
  allowedDocumentTypes:
    process.env.ALLOWED_DOCUMENT_TYPES ||
    'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}));

export const featuresConfig = registerAs('features', () => ({
  enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
  enableMetrics: process.env.ENABLE_METRICS === 'true',
  enableAuditLog: process.env.ENABLE_AUDIT_LOG !== 'false',
  maxStudentsPerCourse: parseInt(
    process.env.MAX_STUDENTS_PER_COURSE || '300',
    10,
  ),
}));

export default validateConfig;
