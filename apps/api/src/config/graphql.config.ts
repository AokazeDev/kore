import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';
import { join } from 'path';

/**
 * Configuración de GraphQL
 * Configura el driver Mercurius con soporte para suscripciones y autenticación
 */
export const graphqlConfig: MercuriusDriverConfig = {
  driver: MercuriusDriver,
  graphiql: true,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  sortSchema: true,
};
