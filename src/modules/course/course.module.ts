import { Module } from '@nestjs/common';
import { CourseService } from '../../services/course/course.service';
import { CourseController } from '../../controllers/course/course.controller';
import { PrismaService } from '../../services/prisma/prisma.service';

@Module({
  controllers: [CourseController],
  providers: [CourseService, PrismaService],
  exports: [CourseService],
})
export class CourseModule {}
