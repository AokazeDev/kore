import { AuditLogsService } from 'apps/api/src/modules/identity/audit/audit-logs.service';
import { DatabaseModule } from '@app/database';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditModule {}
