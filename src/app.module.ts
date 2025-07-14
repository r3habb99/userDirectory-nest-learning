import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { CourseModule } from './modules/course/course.module';
import { StudentModule } from './modules/student/student.module';
import { PrismaService } from './services/prisma/prisma.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

@Module({
  imports: [
    UsersModule, // Keep for backward compatibility
    CourseModule,
    StudentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
