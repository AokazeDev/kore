import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { LoggerModule } from './logger/logger.module';

@Module({
  providers: [CommonService],
  exports: [CommonService],
  imports: [LoggerModule],
})
export class CommonModule {}
