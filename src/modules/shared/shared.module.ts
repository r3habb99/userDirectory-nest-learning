import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from '../../services/prisma/prisma.service';
import { ValidationService } from '../../common/services/validation.service';
import { SanitizationService } from '../../common/services/sanitization.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { HealthService } from '../../common/services/health.service';
import { AppConfigService } from '../../common/config/app.config';

// Custom validation constraints
import {
  RecordExistsConstraint,
  IsUniqueConstraint,
  ValidAcademicYearConstraint,
  IsStrongPasswordConstraint,
  ValidEnrollmentNumberConstraint,
  SafeFilenameConstraint,
  IsCUIDConstraint,
} from '../../common/decorators/validation.decorators';

/**
 * Shared Module
 * Contains common services, utilities, and providers that are used across the application
 * This module is marked as @Global() so it's available everywhere without explicit imports
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),
  ],
  providers: [
    // Core services
    PrismaService,
    AppConfigService,

    // Utility services
    ValidationService,
    SanitizationService,
    AuditLogService,
    HealthService,

    // Custom validation constraints
    RecordExistsConstraint,
    IsUniqueConstraint,
    ValidAcademicYearConstraint,
    IsStrongPasswordConstraint,
    ValidEnrollmentNumberConstraint,
    SafeFilenameConstraint,
    IsCUIDConstraint,
  ],
  exports: [
    // Export services for use in other modules
    PrismaService,
    AppConfigService,
    ValidationService,
    SanitizationService,
    AuditLogService,
    HealthService,

    // Export validation constraints
    RecordExistsConstraint,
    IsUniqueConstraint,
    ValidAcademicYearConstraint,
    IsStrongPasswordConstraint,
    ValidEnrollmentNumberConstraint,
    SafeFilenameConstraint,
    IsCUIDConstraint,
  ],
})
export class SharedModule {
  constructor(private readonly configService: ConfigService) {
    // Validate required configuration on module initialization
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

    const missingVars = requiredEnvVars.filter(
      (varName) => !this.configService.get(varName),
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`,
      );
    }

    // Validate JWT secret in production
    if (
      this.configService.get('NODE_ENV') === 'production' &&
      this.configService.get('JWT_SECRET') === 'your-secret-key'
    ) {
      throw new Error('JWT_SECRET must be set to a secure value in production');
    }
  }
}
