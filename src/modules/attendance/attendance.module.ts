import { Module } from '@nestjs/common';
import { AttendanceService } from '../../services/attendance/attendance.service';
import { AttendanceController } from '../../controllers/attendance/attendance.controller';
import { PrismaService } from '../../services/prisma/prisma.service';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService, PrismaService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
