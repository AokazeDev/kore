import { ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * Configuración de Rate Limit
 * Configura el Rate Limit de la API para prevenir abusos
 */
export const throttlerConfig: ThrottlerModuleOptions = [
  {
    ttl: 60000, // 1 minuto
    limit: 100, // 100 solicitudes por minuto
  },
];
