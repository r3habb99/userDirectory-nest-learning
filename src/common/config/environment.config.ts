import { registerAs } from '@nestjs/config';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsUrl,
  IsEmail,
  validateSync,
  IsArray,
} from 'class-validator';
import { plainToClass, Transform } from 'class-transformer';

/**
 * Enhanced Environment Configuration Management
 * Provides comprehensive environment-specific configuration with validation
 */

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export enum CacheProvider {
  MEMORY = 'memory',
  REDIS = 'redis',
}

export enum DatabaseProvider {
  MYSQL = 'mysql',
  POSTGRESQL = 'postgresql',
}

export enum FileStorageProvider {
  LOCAL = 'local',
  AWS_S3 = 's3',
  GOOGLE_CLOUD = 'gcs',
  AZURE_BLOB = 'azure',
}

/**
 * Environment-specific configuration class with validation
 */
export class EnvironmentConfig {
  @IsEnum(Environment)
  @Transform(({ value }: { value: string }) => value || Environment.DEVELOPMENT)
  NODE_ENV: Environment = Environment.DEVELOPMENT;

  @IsNumber()
  @Transform(({ value }: { value: string }) => parseInt(value, 10) || 3000)
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  HOST?: string = '0.0.0.0';

  @IsUrl({ require_tld: false })
  @IsOptional()
  BASE_URL?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  FRONTEND_URL?: string;

  // Database Configuration
  @IsString()
  DATABASE_URL: string;

  @IsEnum(DatabaseProvider)
  @IsOptional()
  @Transform(({ value }: { value: string }) => value || DatabaseProvider.MYSQL)
  DATABASE_PROVIDER?: DatabaseProvider = DatabaseProvider.MYSQL;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10) || 10)
  DB_CONNECTION_LIMIT?: number = 10;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10) || 60000)
  DB_ACQUIRE_TIMEOUT?: number = 60000;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  DB_ENABLE_LOGGING?: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  DB_SSL?: boolean = false;

  // Authentication Configuration
  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN?: string = '24h';

  @IsString()
  @IsOptional()
  JWT_REFRESH_SECRET?: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN?: string = '7d';

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10) || 12)
  BCRYPT_ROUNDS?: number = 12;

  // Security Configuration
  @IsArray()
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? value.split(',').map((s: string) => s.trim()) : ['*'],
  )
  CORS_ORIGINS?: string[] = ['*'];

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10) || 100)
  RATE_LIMIT_MAX?: number = 100;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10) || 900000)
  RATE_LIMIT_WINDOW_MS?: number = 900000;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  HELMET_ENABLED?: boolean = true;

  // Cache Configuration
  @IsEnum(CacheProvider)
  @IsOptional()
  @Transform(({ value }: { value: string }) => value || CacheProvider.MEMORY)
  CACHE_PROVIDER?: CacheProvider = CacheProvider.MEMORY;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10) || 300)
  CACHE_TTL?: number = 300;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10) || 1000)
  CACHE_MAX_SIZE?: number = 1000;

  // File Storage Configuration
  @IsEnum(FileStorageProvider)
  @IsOptional()
  @Transform(
    ({ value }: { value: string }) => value || FileStorageProvider.LOCAL,
  )
  FILE_STORAGE_PROVIDER?: FileStorageProvider = FileStorageProvider.LOCAL;

  @IsString()
  @IsOptional()
  UPLOAD_PATH?: string = './uploads';

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10) || 10485760)
  UPLOAD_MAX_FILE_SIZE?: number = 10485760; // 10MB

  @IsArray()
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value
      ? value.split(',').map((s: string) => s.trim())
      : ['image/jpeg', 'image/png', 'image/webp'],
  )
  UPLOAD_ALLOWED_MIME_TYPES?: string[] = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  // AWS S3 Configuration (if using S3)
  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  AWS_REGION?: string;

  @IsString()
  @IsOptional()
  AWS_S3_BUCKET?: string;

  // Logging Configuration
  @IsEnum(LogLevel)
  @IsOptional()
  @Transform(({ value }: { value: string }) => value || LogLevel.INFO)
  LOG_LEVEL?: LogLevel = LogLevel.INFO;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  LOG_ENABLE_FILE?: boolean = false;

  @IsString()
  @IsOptional()
  LOG_PATH?: string = './logs';

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  LOG_ENABLE_CONSOLE?: boolean = true;

  // Email Configuration
  @IsString()
  @IsOptional()
  EMAIL_HOST?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10) || 587)
  EMAIL_PORT?: number = 587;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  EMAIL_SECURE?: boolean = false;

  @IsString()
  @IsOptional()
  EMAIL_USER?: string;

  @IsString()
  @IsOptional()
  EMAIL_PASSWORD?: string;

  @IsEmail()
  @IsOptional()
  EMAIL_FROM?: string = 'noreply@college.edu';

  // Feature Flags
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value !== 'false')
  ENABLE_SWAGGER?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  ENABLE_METRICS?: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value !== 'false')
  ENABLE_AUDIT_LOG?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  ENABLE_SEED_DATA?: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  ENABLE_DEBUG_ROUTES?: boolean = false;

  // Application Limits
  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10) || 300)
  MAX_STUDENTS_PER_COURSE?: number = 300;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10) || 1000)
  MAX_COURSES_PER_ADMIN?: number = 1000;

  // Monitoring Configuration
  @IsString()
  @IsOptional()
  SENTRY_DSN?: string;

  @IsString()
  @IsOptional()
  NEW_RELIC_LICENSE_KEY?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  ENABLE_HEALTH_CHECKS?: boolean = true;

  // Development/Testing Configuration
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  ENABLE_MOCK_DATA?: boolean = false;

  @IsString()
  @IsOptional()
  TEST_DATABASE_URL?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10) || 30000)
  TEST_TIMEOUT?: number = 30000;
}

/**
 * Validate and create environment configuration
 */
export function validateEnvironmentConfig(): EnvironmentConfig {
  const config = plainToClass(EnvironmentConfig, process.env, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(config, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => Object.values(error.constraints || {}).join(', '))
      .join('; ');

    throw new Error(
      `Environment configuration validation failed: ${errorMessages}`,
    );
  }

  // Additional custom validations
  validateCustomRules(config);

  return config;
}

/**
 * Custom validation rules
 */
function validateCustomRules(config: EnvironmentConfig): void {
  // Production-specific validations
  if (config.NODE_ENV === Environment.PRODUCTION) {
    if (!config.JWT_SECRET || config.JWT_SECRET === 'your-secret-key') {
      throw new Error('JWT_SECRET must be set to a secure value in production');
    }

    if (config.JWT_SECRET.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters long in production',
      );
    }

    if (!config.DATABASE_URL.includes('ssl=true') && !config.DB_SSL) {
      console.warn(
        'Warning: SSL is not enabled for database connection in production',
      );
    }

    if (config.CORS_ORIGINS?.includes('*')) {
      throw new Error(
        'CORS origins must be explicitly set in production (no wildcards)',
      );
    }

    if (config.ENABLE_DEBUG_ROUTES) {
      throw new Error('Debug routes must be disabled in production');
    }

    if (config.ENABLE_SWAGGER && config.NODE_ENV === Environment.PRODUCTION) {
      console.warn('Warning: Swagger is enabled in production');
    }
  }

  // Cache provider validations
  if (config.CACHE_PROVIDER === CacheProvider.REDIS && !config.REDIS_URL) {
    throw new Error('REDIS_URL is required when using Redis cache provider');
  }

  // File storage validations
  if (config.FILE_STORAGE_PROVIDER === FileStorageProvider.AWS_S3) {
    const requiredS3Vars = [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION',
      'AWS_S3_BUCKET',
    ];
    const missingS3Vars = requiredS3Vars.filter(
      (varName) => !config[varName as keyof EnvironmentConfig],
    );

    if (missingS3Vars.length > 0) {
      throw new Error(
        `Missing required S3 configuration: ${missingS3Vars.join(', ')}`,
      );
    }
  }

  // Email configuration validation
  if (config.EMAIL_HOST && (!config.EMAIL_USER || !config.EMAIL_PASSWORD)) {
    console.warn(
      'Warning: Email host is configured but credentials are missing',
    );
  }
}

/**
 * Environment-specific configuration factory
 */
export const environmentConfig = registerAs('environment', () => {
  return validateEnvironmentConfig();
});

/**
 * Get environment-specific defaults
 */
export function getEnvironmentDefaults(
  env: Environment,
): Partial<EnvironmentConfig> {
  const defaults: Record<Environment, Partial<EnvironmentConfig>> = {
    [Environment.DEVELOPMENT]: {
      LOG_LEVEL: LogLevel.DEBUG,
      ENABLE_SWAGGER: true,
      ENABLE_DEBUG_ROUTES: true,
      ENABLE_SEED_DATA: true,
      DB_ENABLE_LOGGING: true,
      HELMET_ENABLED: false,
    },
    [Environment.STAGING]: {
      LOG_LEVEL: LogLevel.INFO,
      ENABLE_SWAGGER: true,
      ENABLE_DEBUG_ROUTES: false,
      ENABLE_SEED_DATA: false,
      DB_ENABLE_LOGGING: false,
      HELMET_ENABLED: true,
    },
    [Environment.PRODUCTION]: {
      LOG_LEVEL: LogLevel.WARN,
      ENABLE_SWAGGER: false,
      ENABLE_DEBUG_ROUTES: false,
      ENABLE_SEED_DATA: false,
      DB_ENABLE_LOGGING: false,
      HELMET_ENABLED: true,
      DB_SSL: true,
    },
    [Environment.TEST]: {
      LOG_LEVEL: LogLevel.ERROR,
      ENABLE_SWAGGER: false,
      ENABLE_DEBUG_ROUTES: false,
      ENABLE_SEED_DATA: true,
      DB_ENABLE_LOGGING: false,
      HELMET_ENABLED: false,
      CACHE_PROVIDER: CacheProvider.MEMORY,
    },
  };

  return defaults[env] || {};
}
