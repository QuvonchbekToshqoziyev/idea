import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PlansModule } from './plans/plans.module';
import { ProgressUpdatesModule } from './progress-updates/progress-updates.module';
import { AiModule } from './ai/ai.module';
import { SessionsModule } from './sessions/sessions.module';
import { InspirationsModule } from './inspirations/inspirations.module';
import { UsersModule } from './users/users.module';
import { CommentsModule } from './comments/comments.module';
import { MilestonesModule } from './milestones/milestones.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DashboardModule } from './dashboard/dashboard.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    PlansModule,
    ProgressUpdatesModule,
    AiModule,
    SessionsModule,
    InspirationsModule,
    UsersModule,
    CommentsModule,
    MilestonesModule,
    DashboardModule,
    SchedulerModule,
  ],
})
export class AppModule {}
