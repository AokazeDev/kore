import { Module } from '@nestjs/common';
import { GdprModule } from 'apps/api/src/modules/compliance/gdpr/gdpr.module';

@Module({
  imports: [GdprModule],
  exports: [GdprModule],
})
export class ComplianceModule {}
