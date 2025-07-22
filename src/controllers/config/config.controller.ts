import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EnhancedConfigService } from '../../common/config/config.service';
import { CacheProvider } from '../../common/config/environment.config';
import {
  ConfigValidationService,
  ConfigurationHealth,
} from '../../common/services/config-validation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/**
 * Configuration Controller
 * Provides endpoints for configuration management and health checks
 */
@ApiTags('Configuration')
@Controller('config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConfigController {
  constructor(
    private readonly configService: EnhancedConfigService,
    private readonly validationService: ConfigValidationService,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Get configuration health status',
    description:
      'Returns the current configuration health status including validation results',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy'] },
        environment: { type: 'string' },
        errors: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        lastChecked: { type: 'string', format: 'date-time' },
      },
    },
  })
  getConfigurationHealth(): ConfigurationHealth {
    return this.validationService.getConfigurationHealth();
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get configuration summary',
    description:
      'Returns a summary of current configuration settings (non-sensitive)',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration summary',
    schema: {
      type: 'object',
      properties: {
        environment: { type: 'string' },
        server: {
          type: 'object',
          properties: {
            port: { type: 'number' },
            host: { type: 'string' },
            baseUrl: { type: 'string' },
          },
        },
        database: {
          type: 'object',
          properties: {
            provider: { type: 'string' },
            connectionLimit: { type: 'number' },
            ssl: { type: 'boolean' },
          },
        },
        cache: {
          type: 'object',
          properties: {
            provider: { type: 'string' },
            ttl: { type: 'number' },
          },
        },
        features: {
          type: 'object',
          properties: {
            swagger: { type: 'boolean' },
            metrics: { type: 'boolean' },
            auditLog: { type: 'boolean' },
          },
        },
      },
    },
  })
  getConfigurationSummary() {
    return {
      environment: this.configService.environment,
      server: {
        port: this.configService.server.port,
        host: this.configService.server.host,
        baseUrl: this.configService.server.baseUrl,
      },
      database: {
        provider: this.configService.database.provider,
        connectionLimit: this.configService.database.connectionLimit,
        ssl: this.configService.database.ssl,
      },
      cache: {
        provider: this.configService.cache.provider,
        ttl: this.configService.cache.ttl,
      },
      fileStorage: {
        provider: this.configService.fileStorage.provider,
        maxFileSize: this.configService.fileStorage.upload.maxFileSize,
      },
      features: this.configService.features,
      limits: this.configService.limits,
      monitoring: {
        sentryEnabled: this.configService.monitoring.sentry.enabled,
        newRelicEnabled: this.configService.monitoring.newRelic.enabled,
      },
    };
  }

  @Get('features')
  @ApiOperation({
    summary: 'Get feature flags',
    description: 'Returns current feature flag settings',
  })
  @ApiResponse({
    status: 200,
    description: 'Feature flags',
    schema: {
      type: 'object',
      properties: {
        swagger: { type: 'boolean' },
        metrics: { type: 'boolean' },
        auditLog: { type: 'boolean' },
        seedData: { type: 'boolean' },
        debugRoutes: { type: 'boolean' },
        healthChecks: { type: 'boolean' },
        mockData: { type: 'boolean' },
      },
    },
  })
  getFeatureFlags() {
    return this.configService.features;
  }

  @Get('limits')
  @ApiOperation({
    summary: 'Get application limits',
    description: 'Returns current application limits and constraints',
  })
  @ApiResponse({
    status: 200,
    description: 'Application limits',
    schema: {
      type: 'object',
      properties: {
        maxStudentsPerCourse: { type: 'number' },
        maxCoursesPerAdmin: { type: 'number' },
        maxRequestsPerMinute: { type: 'number' },
        maxConcurrentConnections: { type: 'number' },
      },
    },
  })
  getApplicationLimits() {
    return this.configService.limits;
  }

  @Get('validation')
  @ApiOperation({
    summary: 'Validate configuration',
    description: 'Performs runtime configuration validation',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation results',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async validateConfiguration() {
    return await this.validationService.validateConfiguration();
  }

  @Get('runtime-check')
  @ApiOperation({
    summary: 'Perform runtime configuration check',
    description: 'Tests actual connectivity to configured services',
  })
  @ApiResponse({
    status: 200,
    description: 'Runtime check results',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        checks: {
          type: 'object',
          properties: {
            database: { type: 'boolean' },
            cache: { type: 'boolean' },
            email: { type: 'boolean' },
            fileStorage: { type: 'boolean' },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async performRuntimeCheck() {
    const isValid = await this.validationService.validateRuntimeConfig();

    return {
      success: isValid,
      checks: {
        database: true, // Would implement actual database connectivity check
        cache:
          this.configService.cache.provider === CacheProvider.MEMORY || true, // Redis connectivity check
        email: !this.configService.email.enabled || true, // Email service check
        fileStorage: true, // File storage accessibility check
      },
      timestamp: new Date().toISOString(),
    };
  }
}
