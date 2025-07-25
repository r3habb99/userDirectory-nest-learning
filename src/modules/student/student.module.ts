import { Module } from '@nestjs/common';
import { StudentService } from '../../services/student/student.service';
import { StudentController } from '../../controllers/student/student.controller';
import { EnrollmentService } from '../../services/enrollment/enrollment.service';
import { PrismaService } from '../../services/prisma/prisma.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [StudentController],
  providers: [StudentService, EnrollmentService, PrismaService],
  exports: [StudentService],
})
export class StudentModule {}
