import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * Entrada para desvincular un proveedor OAuth de la cuenta del usuario
 */
@InputType()
export class UnlinkProviderInput {
  @Field(() => String, { description: 'ID de la cuenta a desvincular' })
  @IsNotEmpty({ message: 'El ID de la cuenta es obligatorio' })
  @IsUUID('4', { message: 'El ID de la cuenta debe ser válido' })
  accountId!: string;
}
