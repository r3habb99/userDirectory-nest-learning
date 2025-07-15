import { Module } from '@nestjs/common';
import { IdCardService } from '../../services/id-card/id-card.service';
import { IdCardController } from '../../controllers/id-card/id-card.controller';
import { PrismaService } from '../../services/prisma/prisma.service';

@Module({
  controllers: [IdCardController],
  providers: [IdCardService, PrismaService],
  exports: [IdCardService],
})
export class IdCardModule {}
