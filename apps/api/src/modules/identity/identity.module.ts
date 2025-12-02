import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';

/**
 * Modulo Identity
 */
@Module({
  imports: [UsersModule, AuditModule],
  exports: [UsersModule],
})
export class IdentityModule {}
