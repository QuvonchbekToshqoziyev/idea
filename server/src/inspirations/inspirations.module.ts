import { Module } from '@nestjs/common';
import { InspirationsService } from './inspirations.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InspirationsService],
  exports: [InspirationsService],
})
export class InspirationsModule {}
