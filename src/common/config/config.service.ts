import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EnvironmentConfig,
  Environment,
  CacheProvider,
  FileStorageProvider,
} from './environment.config';

/**
 * Enhanced Configuration Service
 * Provides type-safe access to all configuration with validation and environment-specific logic
 */
@Injectable()
export class EnhancedConfigService implements OnModuleInit {
  private readonly logger = new Logger(EnhancedConfigService.name);
  private config: EnvironmentConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<EnvironmentConfig>('environment')!;
  }

  onModuleInit() {
    this.validateConfiguration();
    this.logConfigurationSummary();
  }

  /**
   * Environment Information
   */
  get environment(): Environment {
    return this.config.NODE_ENV;
  }

  get isProduction(): boolean {
    return this.environment === Environment.PRODUCTION;
  }

  get isDevelopment(): boolean {
    return this.environment === Environment.DEVELOPMENT;
  }

  get isStaging(): boolean {
    return this.environment === Environment.STAGING;
  }

  get isTest(): boolean {
    return this.environment === Environment.TEST;
  }

  /**
   * Server Configuration
   */
  get server() {
    return {
      port: this.config.PORT,
      host: this.config.HOST,
      baseUrl:
        this.config.BASE_URL ||
        `http://${this.config.HOST}:${this.config.PORT}`,
      frontendUrl: this.config.FRONTEND_URL,
      environment: this.config.NODE_ENV,
    };
  }

  /**
   * Database Configuration
   */
  get database() {
    return {
      url: this.config.DATABASE_URL,
      provider: this.config.DATABASE_PROVIDER,
      connectionLimit: this.config.DB_CONNECTION_LIMIT,
      acquireTimeout: this.config.DB_ACQUIRE_TIMEOUT,
      enableLogging: this.config.DB_ENABLE_LOGGING,
      ssl: this.config.DB_SSL,
      // Connection pool settings based on environment
      poolConfig: this.getDatabasePoolConfig(),
    };
  }

  /**
   * Authentication Configuration
   */
  get auth() {
    return {
      jwt: {
        secret: this.config.JWT_SECRET,
        expiresIn: this.config.JWT_EXPIRES_IN,
        refreshSecret: this.config.JWT_REFRESH_SECRET,
        refreshExpiresIn: this.config.JWT_REFRESH_EXPIRES_IN,
      },
      bcrypt: {
        rounds: this.config.BCRYPT_ROUNDS,
      },
    };
  }

  /**
   * Security Configuration
   */
  get security() {
    return {
      cors: {
        origins: this.config.CORS_ORIGINS,
        credentials: true,
      },
      rateLimit: {
        max: this.config.RATE_LIMIT_MAX,
        windowMs: this.config.RATE_LIMIT_WINDOW_MS,
        // Environment-specific rate limiting
        skipSuccessfulRequests: this.isProduction,
        skipFailedRequests: false,
      },
      helmet: {
        enabled: this.config.HELMET_ENABLED,
        // Environment-specific helmet configuration
        contentSecurityPolicy: this.isProduction,
        crossOriginEmbedderPolicy: this.isProduction,
      },
    };
  }

  /**
   * Cache Configuration
   */
  get cache() {
    return {
      provider: this.config.CACHE_PROVIDER,
      redis: {
        url: this.config.REDIS_URL,
        enabled: this.config.CACHE_PROVIDER === CacheProvider.REDIS,
      },
      memory: {
        enabled: this.config.CACHE_PROVIDER === CacheProvider.MEMORY,
        maxSize: this.config.CACHE_MAX_SIZE,
      },
      ttl: this.config.CACHE_TTL,
      // Environment-specific cache settings
      settings: this.getCacheSettings(),
    };
  }

  /**
   * File Storage Configuration
   */
  get fileStorage() {
    return {
      provider: this.config.FILE_STORAGE_PROVIDER,
      local: {
        enabled:
          this.config.FILE_STORAGE_PROVIDER === FileStorageProvider.LOCAL,
        uploadPath: this.config.UPLOAD_PATH,
      },
      s3: {
        enabled:
          this.config.FILE_STORAGE_PROVIDER === FileStorageProvider.AWS_S3,
        accessKeyId: this.config.AWS_ACCESS_KEY_ID,
        secretAccessKey: this.config.AWS_SECRET_ACCESS_KEY,
        region: this.config.AWS_REGION,
        bucket: this.config.AWS_S3_BUCKET,
      },
      upload: {
        maxFileSize: this.config.UPLOAD_MAX_FILE_SIZE,
        allowedMimeTypes: this.config.UPLOAD_ALLOWED_MIME_TYPES,
        // Environment-specific upload limits
        limits: this.getUploadLimits(),
      },
    };
  }

  /**
   * Logging Configuration
   */
  get logging() {
    return {
      level: this.config.LOG_LEVEL,
      enableFile: this.config.LOG_ENABLE_FILE,
      enableConsole: this.config.LOG_ENABLE_CONSOLE,
      logPath: this.config.LOG_PATH,
      // Environment-specific logging settings
      settings: this.getLoggingSettings(),
    };
  }

  /**
   * Email Configuration
   */
  get email() {
    return {
      enabled: !!(this.config.EMAIL_HOST && this.config.EMAIL_USER),
      host: this.config.EMAIL_HOST,
      port: this.config.EMAIL_PORT,
      secure: this.config.EMAIL_SECURE,
      auth: {
        user: this.config.EMAIL_USER,
        pass: this.config.EMAIL_PASSWORD,
      },
      from: this.config.EMAIL_FROM,
    };
  }

  /**
   * Feature Flags
   */
  get features() {
    return {
      swagger: this.config.ENABLE_SWAGGER && !this.isProduction,
      metrics: this.config.ENABLE_METRICS,
      auditLog: this.config.ENABLE_AUDIT_LOG,
      seedData: this.config.ENABLE_SEED_DATA && !this.isProduction,
      debugRoutes: this.config.ENABLE_DEBUG_ROUTES && this.isDevelopment,
      healthChecks: this.config.ENABLE_HEALTH_CHECKS,
      mockData:
        this.config.ENABLE_MOCK_DATA && (this.isDevelopment || this.isTest),
    };
  }

  /**
   * Application Limits
   */
  get limits() {
    return {
      maxStudentsPerCourse: this.config.MAX_STUDENTS_PER_COURSE,
      maxCoursesPerAdmin: this.config.MAX_COURSES_PER_ADMIN,
      // Environment-specific limits
      ...this.getEnvironmentLimits(),
    };
  }

  /**
   * Monitoring Configuration
   */
  get monitoring() {
    return {
      sentry: {
        enabled: !!this.config.SENTRY_DSN,
        dsn: this.config.SENTRY_DSN,
      },
      newRelic: {
        enabled: !!this.config.NEW_RELIC_LICENSE_KEY,
        licenseKey: this.config.NEW_RELIC_LICENSE_KEY,
      },
    };
  }

  /**
   * Testing Configuration
   */
  get testing() {
    return {
      databaseUrl: this.config.TEST_DATABASE_URL,
      timeout: this.config.TEST_TIMEOUT,
      mockData: this.config.ENABLE_MOCK_DATA,
    };
  }

  /**
   * Get environment-specific database pool configuration
   */
  private getDatabasePoolConfig() {
    const baseConfig = {
      min: 2,
      max: this.config.DB_CONNECTION_LIMIT || 10,
      acquireTimeoutMs: this.config.DB_ACQUIRE_TIMEOUT || 60000,
      idleTimeoutMs: 30000,
    };

    switch (this.environment) {
      case Environment.PRODUCTION:
        return { ...baseConfig, min: 5, max: 20 };
      case Environment.STAGING:
        return { ...baseConfig, min: 3, max: 15 };
      case Environment.TEST:
        return { ...baseConfig, min: 1, max: 5 };
      default:
        return baseConfig;
    }
  }

  /**
   * Get environment-specific cache settings
   */
  private getCacheSettings() {
    switch (this.environment) {
      case Environment.PRODUCTION:
        return {
          defaultTTL: 600, // 10 minutes
          maxSize: 5000,
          checkPeriod: 120, // 2 minutes
        };
      case Environment.STAGING:
        return {
          defaultTTL: 300, // 5 minutes
          maxSize: 2000,
          checkPeriod: 60, // 1 minute
        };
      case Environment.TEST:
        return {
          defaultTTL: 60, // 1 minute
          maxSize: 100,
          checkPeriod: 10, // 10 seconds
        };
      default:
        return {
          defaultTTL: this.config.CACHE_TTL || 300,
          maxSize: this.config.CACHE_MAX_SIZE || 1000,
          checkPeriod: 60,
        };
    }
  }

  /**
   * Get environment-specific upload limits
   */
  private getUploadLimits() {
    const baseLimits = {
      maxFileSize: this.config.UPLOAD_MAX_FILE_SIZE || 10485760, // 10MB
      maxFiles: 10,
    };

    switch (this.environment) {
      case Environment.PRODUCTION:
        return { ...baseLimits, maxFileSize: 5242880 }; // 5MB in production
      case Environment.TEST:
        return { ...baseLimits, maxFileSize: 1048576 }; // 1MB in test
      default:
        return baseLimits;
    }
  }

  /**
   * Get environment-specific logging settings
   */
  private getLoggingSettings() {
    switch (this.environment) {
      case Environment.PRODUCTION:
        return {
          colorize: false,
          timestamp: true,
          json: true,
          maxFiles: 30,
          maxSize: '100m',
        };
      case Environment.STAGING:
        return {
          colorize: false,
          timestamp: true,
          json: true,
          maxFiles: 7,
          maxSize: '50m',
        };
      case Environment.TEST:
        return {
          colorize: false,
          timestamp: false,
          json: false,
          silent: true,
        };
      default:
        return {
          colorize: true,
          timestamp: true,
          json: false,
          prettyPrint: true,
        };
    }
  }

  /**
   * Get environment-specific application limits
   */
  private getEnvironmentLimits() {
    switch (this.environment) {
      case Environment.PRODUCTION:
        return {
          maxRequestsPerMinute: 1000,
          maxConcurrentConnections: 100,
        };
      case Environment.STAGING:
        return {
          maxRequestsPerMinute: 500,
          maxConcurrentConnections: 50,
        };
      case Environment.TEST:
        return {
          maxRequestsPerMinute: 100,
          maxConcurrentConnections: 10,
        };
      default:
        return {
          maxRequestsPerMinute: 200,
          maxConcurrentConnections: 20,
        };
    }
  }

  /**
   * Validate configuration
   */
  private validateConfiguration(): void {
    const requiredConfigs = ['DATABASE_URL', 'JWT_SECRET'];
    const missingConfigs = requiredConfigs.filter(
      (config) => !this.configService.get(config),
    );

    if (missingConfigs.length > 0) {
      throw new Error(
        `Missing required configuration: ${missingConfigs.join(', ')}`,
      );
    }

    this.logger.log('Configuration validation passed');
  }

  /**
   * Log configuration summary
   */
  private logConfigurationSummary(): void {
    this.logger.log(`Application starting in ${this.environment} mode`);
    this.logger.log(
      `Server will run on ${this.server.host}:${this.server.port}`,
    );
    this.logger.log(`Database provider: ${this.database.provider}`);
    this.logger.log(`Cache provider: ${this.cache.provider}`);
    this.logger.log(`File storage provider: ${this.fileStorage.provider}`);
    this.logger.log(
      `Features enabled: ${Object.entries(this.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature)
        .join(', ')}`,
    );
  }

  /**
   * Get configuration for external services
   */
  getExternalServiceConfig(serviceName: string): any {
    const configs = {
      prisma: this.database,
      redis: this.cache.redis,
      s3: this.fileStorage.s3,
      email: this.email,
      sentry: this.monitoring.sentry,
      newRelic: this.monitoring.newRelic,
    };

    return configs[serviceName as keyof typeof configs];
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(featureName: keyof typeof this.features): boolean {
    return Boolean(this.features[featureName]);
  }

  /**
   * Get configuration value with type safety
   */
  get<T = any>(key: keyof EnvironmentConfig): T {
    return this.config[key] as T;
  }
}
