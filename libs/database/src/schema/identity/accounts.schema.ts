import { pgTable, text, timestamp, uuid, index, varchar } from 'drizzle-orm/pg-core';
import { users } from '@app/database/schema';

/**
 * Tabla Account - Información de cuentas de autenticación
 * Providers: Google, Microsoft, Riot Games, Epic Games, Twitch, Discord, etc.
 * Soporta OAuth y autenticación local mediante contraseña hasheada
 */
export const accounts = pgTable(
  'account',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(), // ID del Oauth
    providerId: varchar('provider_id', { length: 50 }).notNull(), // 'google', 'microsoft', etc.
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'), // Contraseña hasheada para autenticación local
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => [
    index('account_user_id_idx').on(table.userId),
    index('account_provider_idx').on(table.providerId, table.accountId),
  ]
);

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
