import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../config/environment.config';
import { EnhancedConfigService } from '../config/config.service';

/**
 * Configuration Validation Service
 * Validates configuration at startup and provides runtime validation
 */
@Injectable()
export class ConfigValidationService implements OnModuleInit {
  private readonly logger = new Logger(ConfigValidationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly enhancedConfig: EnhancedConfigService,
  ) {}

  async onModuleInit() {
    await this.validateConfiguration();
    this.logValidationResults();
  }

  /**
   * Comprehensive configuration validation
   */
  async validateConfiguration(): Promise<ValidationResult> {
    const results: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    };

    // Core validations
    this.validateEnvironment(results);
    this.validateDatabase(results);
    this.validateSecurity(results);
    this.validateServices(results);
    this.validatePerformance(results);
    this.validateProduction(results);

    // Set overall validity
    results.isValid = results.errors.length === 0;

    if (!results.isValid) {
      throw new Error(`Configuration validation failed: ${results.errors.join(', ')}`);
    }

    return results;
  }

  /**
   * Validate environment configuration
   */
  private validateEnvironment(results: ValidationResult): void {
    const env = this.enhancedConfig.environment;

    // Check if environment is valid
    if (!Object.values(Environment).includes(env)) {
      results.errors.push(`Invalid NODE_ENV: ${env}`);
    }

    // Environment-specific validations
    if (env === Environment.PRODUCTION) {
      this.validateProductionEnvironment(results);
    }

    if (env === Environment.DEVELOPMENT) {
      this.validateDevelopmentEnvironment(results);
    }
  }

  /**
   * Validate database configuration
   */
  private validateDatabase(results: ValidationResult): void {
    const dbConfig = this.enhancedConfig.database;

    // Check database URL
    if (!dbConfig.url) {
      results.errors.push('DATABASE_URL is required');
      return;
    }

    // Validate database URL format
    try {
      const url = new URL(dbConfig.url);
      
      if (!['mysql:', 'postgresql:'].includes(url.protocol)) {
        results.errors.push('Unsupported database protocol');
      }

      if (!url.hostname) {
        results.errors.push('Database hostname is required');
      }

      if (!url.pathname || url.pathname === '/') {
        results.errors.push('Database name is required');
      }
    } catch (error) {
      results.errors.push('Invalid DATABASE_URL format');
    }

    // Production-specific database validations
    if (this.enhancedConfig.isProduction) {
      if (!dbConfig.ssl && !dbConfig.url.includes('ssl=true')) {
        results.warnings.push('SSL is not enabled for database connection in production');
      }

      if (dbConfig.connectionLimit && dbConfig.connectionLimit < 10) {
        results.warnings.push('Database connection limit is low for production');
      }
    }

    // Connection pool validation
    if (dbConfig.connectionLimit && dbConfig.connectionLimit > 50) {
      results.warnings.push('Database connection limit is very high, consider reducing');
    }
  }

  /**
   * Validate security configuration
   */
  private validateSecurity(results: ValidationResult): void {
    const authConfig = this.enhancedConfig.auth;
    const securityConfig = this.enhancedConfig.security;

    // JWT Secret validation
    if (!authConfig.jwt.secret) {
      results.errors.push('JWT_SECRET is required');
    } else {
      if (authConfig.jwt.secret.length < 32) {
        results.errors.push('JWT_SECRET must be at least 32 characters long');
      }

      if (authConfig.jwt.secret === 'your-secret-key' || 
          authConfig.jwt.secret.includes('change') ||
          authConfig.jwt.secret.includes('default')) {
        results.errors.push('JWT_SECRET must be changed from default value');
      }
    }

    // CORS validation
    if (this.enhancedConfig.isProduction) {
      if (securityConfig.cors.origins.includes('*')) {
        results.errors.push('CORS origins must be explicitly set in production (no wildcards)');
      }

      const hasInsecureOrigins = securityConfig.cors.origins.some(origin => 
        origin.startsWith('http://') && !origin.includes('localhost')
      );
      
      if (hasInsecureOrigins) {
        results.warnings.push('HTTP origins detected in production, consider using HTTPS');
      }
    }

    // Rate limiting validation
    if (securityConfig.rateLimit.max > 1000) {
      results.warnings.push('Rate limit is very high, consider reducing for better security');
    }

    // bcrypt rounds validation
    if (authConfig.bcrypt.rounds < 10) {
      results.warnings.push('bcrypt rounds is low, consider increasing for better security');
    }

    if (authConfig.bcrypt.rounds > 15) {
      results.warnings.push('bcrypt rounds is very high, may impact performance');
    }
  }

  /**
   * Validate external services configuration
   */
  private validateServices(results: ValidationResult): void {
    const cacheConfig = this.enhancedConfig.cache;
    const fileConfig = this.enhancedConfig.fileStorage;
    const emailConfig = this.enhancedConfig.email;

    // Cache validation
    if (cacheConfig.provider === 'redis' && !cacheConfig.redis.url) {
      results.errors.push('REDIS_URL is required when using Redis cache provider');
    }

    // File storage validation
    if (fileConfig.provider === 's3') {
      const s3Config = fileConfig.s3;
      const requiredS3Fields = ['accessKeyId', 'secretAccessKey', 'region', 'bucket'];
      const missingS3Fields = requiredS3Fields.filter(field => !s3Config[field]);
      
      if (missingS3Fields.length > 0) {
        results.errors.push(`Missing S3 configuration: ${missingS3Fields.join(', ')}`);
      }
    }

    // Email validation
    if (emailConfig.enabled) {
      if (!emailConfig.host || !emailConfig.auth.user || !emailConfig.auth.pass) {
        results.warnings.push('Email configuration is incomplete');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailConfig.from && !emailRegex.test(emailConfig.from)) {
        results.warnings.push('Invalid email format in EMAIL_FROM');
      }
    }
  }

  /**
   * Validate performance configuration
   */
  private validatePerformance(results: ValidationResult): void {
    const fileConfig = this.enhancedConfig.fileStorage;
    const cacheConfig = this.enhancedConfig.cache;

    // File upload size validation
    const maxSize = fileConfig.upload.maxFileSize;
    if (maxSize > 50 * 1024 * 1024) { // 50MB
      results.warnings.push('Maximum file upload size is very large');
    }

    // Cache TTL validation
    if (cacheConfig.ttl > 3600) { // 1 hour
      results.warnings.push('Cache TTL is very long, consider reducing');
    }

    if (cacheConfig.ttl < 60) { // 1 minute
      results.warnings.push('Cache TTL is very short, may impact performance');
    }
  }

  /**
   * Production-specific validations
   */
  private validateProduction(results: ValidationResult): void {
    if (!this.enhancedConfig.isProduction) return;

    const features = this.enhancedConfig.features;
    const server = this.enhancedConfig.server;

    // Feature flags validation
    if (features.swagger) {
      results.warnings.push('Swagger is enabled in production');
    }

    if (features.debugRoutes) {
      results.errors.push('Debug routes must be disabled in production');
    }

    if (features.seedData) {
      results.warnings.push('Seed data is enabled in production');
    }

    // Server configuration validation
    if (server.baseUrl && server.baseUrl.startsWith('http://')) {
      results.warnings.push('Base URL uses HTTP in production, consider HTTPS');
    }

    if (server.frontendUrl && server.frontendUrl.startsWith('http://')) {
      results.warnings.push('Frontend URL uses HTTP in production, consider HTTPS');
    }

    // Security headers validation
    const securityConfig = this.enhancedConfig.security;
    if (!securityConfig.helmet.enabled) {
      results.warnings.push('Security headers (Helmet) are disabled in production');
    }
  }

  /**
   * Development-specific validations
   */
  private validateDevelopmentEnvironment(results: ValidationResult): void {
    const features = this.enhancedConfig.features;

    if (!features.swagger) {
      results.recommendations.push('Consider enabling Swagger in development');
    }

    if (!features.debugRoutes) {
      results.recommendations.push('Consider enabling debug routes in development');
    }
  }

  /**
   * Production environment validations
   */
  private validateProductionEnvironment(results: ValidationResult): void {
    const monitoring = this.enhancedConfig.monitoring;
    const logging = this.enhancedConfig.logging;

    // Monitoring validation
    if (!monitoring.sentry.enabled && !monitoring.newRelic.enabled) {
      results.recommendations.push('Consider enabling error monitoring (Sentry/New Relic) in production');
    }

    // Logging validation
    if (logging.level === 'debug' || logging.level === 'verbose') {
      results.warnings.push('Log level is very verbose for production');
    }

    if (!logging.enableFile) {
      results.warnings.push('File logging is disabled in production');
    }
  }

  /**
   * Runtime configuration validation
   */
  async validateRuntimeConfig(): Promise<boolean> {
    try {
      // Test database connection
      // This would be implemented with actual database connection test
      
      // Test cache connection if Redis
      if (this.enhancedConfig.cache.provider === 'redis') {
        // Test Redis connection
      }

      // Test email service if configured
      if (this.enhancedConfig.email.enabled) {
        // Test email service connection
      }

      return true;
    } catch (error) {
      this.logger.error('Runtime configuration validation failed', error);
      return false;
    }
  }

  /**
   * Get configuration health status
   */
  getConfigurationHealth(): ConfigurationHealth {
    const validation = this.validateConfiguration();
    
    return {
      status: validation.isValid ? 'healthy' : 'unhealthy',
      environment: this.enhancedConfig.environment,
      errors: validation.errors,
      warnings: validation.warnings,
      recommendations: validation.recommendations,
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * Log validation results
   */
  private logValidationResults(): void {
    this.logger.log('Configuration validation completed successfully');
    this.logger.log(`Environment: ${this.enhancedConfig.environment}`);
    this.logger.log(`Database: ${this.enhancedConfig.database.provider}`);
    this.logger.log(`Cache: ${this.enhancedConfig.cache.provider}`);
    this.logger.log(`File Storage: ${this.enhancedConfig.fileStorage.provider}`);
  }
}

// Interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface ConfigurationHealth {
  status: 'healthy' | 'unhealthy';
  environment: Environment;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  lastChecked: string;
}
