import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

// Enhanced Configuration Module
import { EnhancedConfigModule } from './modules/config/config.module';
import { EnhancedConfigService } from './common/config/config.service';

// Controllers and Services
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Modules
import { SharedModule } from './modules/shared/shared.module';
import { CourseModule } from './modules/course/course.module';
import { StudentModule } from './modules/student/student.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { IdCardModule } from './modules/id-card/id-card.module';
import { UploadModule } from './modules/upload/upload.module';

// Guards and Filters
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RateLimitGuard } from './common/guards/rate-limit.guard';

@Module({
  imports: [
    // Enhanced Configuration Module
    EnhancedConfigModule,

    // JWT configuration with dynamic config
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: EnhancedConfigService) => ({
        secret: configService.auth.jwt.secret,
        signOptions: { expiresIn: configService.auth.jwt.expiresIn },
      }),
      inject: [EnhancedConfigService],
    }),

    // Shared module (contains common services)
    SharedModule,

    // Feature modules
    AuthModule,
    AdminModule,
    AttendanceModule,
    IdCardModule,
    UploadModule,
    CourseModule,
    StudentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
