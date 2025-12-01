import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { graphqlConfig, throttlerConfig } from 'apps/api/src/config';
import { ComplianceModule } from 'apps/api/src/modules/compliance/compliance.module';

@Module({
  imports: [
    GraphQLModule.forRoot(graphqlConfig),
    ThrottlerModule.forRoot(throttlerConfig),
    ComplianceModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
