import { Module } from '@nestjs/common';
import { ProgressUpdatesService } from './progress-updates.service';
import { ProgressUpdatesController } from './progress-updates.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [ProgressUpdatesService],
  controllers: [ProgressUpdatesController],
})
export class ProgressUpdatesModule {}
