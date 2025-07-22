import { Module, Global } from '@nestjs/common';
import {
  ConfigModule as NestConfigModule,
  ConfigService,
} from '@nestjs/config';
import { environmentConfig } from '../../common/config/environment.config';
import { performanceConfig } from '../../common/config/performance.config';
import { uploadConfig } from '../../common/config/configuration';
import { EnhancedConfigService } from '../../common/config/config.service';
import { ConfigValidationService } from '../../common/services/config-validation.service';

/**
 * Enhanced Configuration Module
 * Provides comprehensive configuration management with validation and environment-specific settings
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
      ],
      load: [environmentConfig, performanceConfig, uploadConfig],
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
  ],
  providers: [
    EnhancedConfigService,
    ConfigValidationService,
    {
      provide: 'CONFIG_VALIDATION',
      useFactory: (validationService: ConfigValidationService) => {
        return validationService.validateConfiguration();
      },
      inject: [ConfigValidationService],
    },
  ],
  exports: [
    ConfigService,
    EnhancedConfigService,
    ConfigValidationService,
    'CONFIG_VALIDATION',
  ],
})
export class EnhancedConfigModule {
  constructor(private readonly enhancedConfig: EnhancedConfigService) {
    this.logConfigurationSummary();
  }

  private logConfigurationSummary(): void {
    const config = this.enhancedConfig;

    console.log('\n🔧 Configuration Summary');
    console.log('='.repeat(50));
    console.log(`Environment: ${config.environment}`);
    console.log(`Server: ${config.server.host}:${config.server.port}`);
    console.log(`Database: ${config.database.provider}`);
    console.log(`Cache: ${config.cache.provider}`);
    console.log(`File Storage: ${config.fileStorage.provider}`);
    console.log(
      `Features: ${Object.entries(config.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature)
        .join(', ')}`,
    );
    console.log('='.repeat(50));
  }
}
