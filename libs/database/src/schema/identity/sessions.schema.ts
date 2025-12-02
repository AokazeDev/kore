import { users } from '@app/database/schema';
import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

/**
 * Tabla de sesiones de usuario
 * Almacena las sesiones activas con su expiración y metadatos asociados.
 */
export const sessions = pgTable(
  'session',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => [
    index('session_user_id_idx').on(table.userId),
    index('session_token_idx').on(table.token),
    index('session_expires_at_idx').on(table.expiresAt),
  ]
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
