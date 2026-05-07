import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InspirationsModule } from '../inspirations/inspirations.module';

@Module({
  imports: [PrismaModule, InspirationsModule],
  providers: [SessionsService],
  controllers: [SessionsController],
})
export class SessionsModule {}
