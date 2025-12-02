import { EmailService } from '@app/common/email';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
