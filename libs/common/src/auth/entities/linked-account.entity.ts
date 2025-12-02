import { Field, ObjectType, ID } from '@nestjs/graphql';

/**
 * Modelo para cuentas OAuth vinculadas
 * Representa un proveedor OAuth vinculado a la cuenta de un usuario
 */
@ObjectType({ description: 'Cuenta OAuth vinculada a un usuario' })
export class LinkedAccount {
  @Field(() => ID, { description: 'Identificador único de la cuenta' })
  id!: string;

  @Field(() => String, { description: 'Provider OAuth (google, microsoft, twitch, kick, etc.)' })
  providerId!: string;

  @Field(() => String, { description: 'ID de la cuenta del OAuth provider' })
  accountId!: string;

  @Field(() => Date, { description: 'Fecha en que se vinculó la cuenta' })
  createdAt!: Date;
}
