import { Module } from '@nestjs/common';
import { GdprService } from './gdpr.service';
import { GdprResolver } from 'apps/api/src/modules/compliance/gdpr/gdpr.resolver';

@Module({
  imports: [],
  providers: [GdprResolver, GdprService],
  exports: [GdprService],
})
export class GdprModule {}
