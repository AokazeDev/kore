import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';
import { join } from 'path';

/**
 * Interfaz para solicitudes autenticadas en GraphQL
 */
interface AuthenticatedRequest {
  headers?: Record<string, string | string[]>;
  user?: {
    id: string;
    email: string;
    name: string;
    [key: string]: unknown;
  } | null;
  session?: unknown;
}

/**
 * Configuración de GraphQL
 * Configura el driver Mercurius con soporte para suscripciones y autenticación
 */
export const graphqlConfig: MercuriusDriverConfig = {
  driver: MercuriusDriver,
  graphiql: true,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  sortSchema: true,
  subscription: {
    context: (_connection, request: unknown) => {
      const authenticatedRequest = request as AuthenticatedRequest;

      return {
        req: authenticatedRequest,
        user: authenticatedRequest.user ?? null,
      };
    },
  },
};
