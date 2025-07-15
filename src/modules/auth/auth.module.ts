import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../../services/auth/auth.service';
import { AuthController } from '../../controllers/auth/auth.controller';
import { AdminService } from '../../services/admin/admin.service';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { PrismaService } from '../../services/prisma/prisma.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminService, JwtStrategy, PrismaService],
  exports: [AuthService, AdminService],
})
export class AuthModule {}
