import { Module } from '@nestjs/common';
import { InsurersService } from './insurers.service';
import { InsurersController } from './insurers.controller';

@Module({
  providers: [InsurersService],
  controllers: [InsurersController],
  exports: [InsurersService],
})
export class InsurersModule {}
