import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';

/**
 * Modulo Identity
 */
@Module({
  imports: [UsersModule],
  exports: [UsersModule],
})
export class IdentityModule {}
