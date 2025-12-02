import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';

@Module({
  providers: [CommonService],
  exports: [CommonService],
  imports: [LoggerModule, AuthModule, EmailModule],
})
export class CommonModule {}
