import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleExceptionsController } from './schedule-exceptions.controller';

@Module({
  providers: [ScheduleService],
  controllers: [ScheduleController, ScheduleExceptionsController],
  exports: [ScheduleService],
})
export class ScheduleModule {}
