import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
  IsUrl,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Input para actualizar perfil de usuario
 */
@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true, description: 'Nombre del usuario' })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto válido' })
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  name?: string;

  @Field({
    nullable: true,
    description: 'Username único (sin espacios, solo letras, números, guiones y guiones bajos)',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value
  )
  @IsString({ message: 'El username debe ser un texto válido' })
  @MinLength(3, { message: 'El username debe tener al menos 3 caracteres' })
  @MaxLength(30, { message: 'El username no puede tener más de 30 caracteres' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'El username solo puede contener letras, números, guiones y guiones bajos',
  })
  username?: string;

  @Field({ nullable: true, description: 'Biografía del usuario' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'La biografía debe ser un texto válido' })
  @MaxLength(160, { message: 'La biografía no puede tener más de 160 caracteres' })
  bio?: string;

  @Field({ nullable: true, description: 'Sitio web del usuario' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsUrl({}, { message: 'Debe ser una URL válida (ej: https://ejemplo.com)' })
  @MaxLength(200, { message: 'La URL no puede tener más de 200 caracteres' })
  website?: string;

  @Field({ nullable: true, description: 'Ubicación del usuario' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'La ubicación debe ser un texto válido' })
  @MaxLength(100, { message: 'La ubicación no puede tener más de 100 caracteres' })
  location?: string;

  @Field({ nullable: true, description: 'URL de la foto de perfil' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsUrl({}, { message: 'Debe ser una URL válida para el avatar' })
  avatarUrl?: string;

  @Field({ nullable: true, description: 'URL del banner/portada' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsUrl({}, { message: 'Debe ser una URL válida para el banner' })
  bannerUrl?: string;

  @Field({ nullable: true, description: 'Cuenta privada (requiere aprobación para seguir)' })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

@InputType()
export class UpdateUserInput {
  @Field(() => Int)
  id: number;
}

/**
 * Input para cambiar contraseña
 */
@InputType()
export class ChangePasswordInput {
  @Field({ description: 'Contraseña actual' })
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @Field({ description: 'Nueva contraseña' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword: string;
}

/**
 * Input para eliminar cuenta
 */
@InputType()
export class DeleteAccountInput {
  @Field({ description: 'Contraseña para confirmar eliminación' })
  @IsString()
  @MinLength(8)
  password: string;

  @Field({ description: 'Razón de eliminación (opcional)' })
  @IsString()
  @MaxLength(500)
  reason?: string;
}
