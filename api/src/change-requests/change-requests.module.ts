import { Module } from '@nestjs/common';
import { ChangeRequestsService } from './change-requests.service';
import { ChangeRequestsController } from './change-requests.controller';
import { ScheduleModule } from '../scheduling/schedule.module';

@Module({
  imports: [ScheduleModule],
  providers: [ChangeRequestsService],
  controllers: [ChangeRequestsController],
  exports: [ChangeRequestsService],
})
export class ChangeRequestsModule {}
