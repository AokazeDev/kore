import { Resolver } from '@nestjs/graphql';
import { GdprService } from 'apps/api/src/modules/compliance/gdpr/gdpr.service';

/**
 * Resolver para GDPR.
 * Maneja solicitudes de exportación de datos y eliminación de datos
 */
@Resolver()
export class GdprResolver {
  constructor(private readonly gdprService: GdprService) {}
}
