import { pgTable, timestamp, uuid, index, varchar } from 'drizzle-orm/pg-core';
import { users } from '@app/database/schema';
import { relations } from 'drizzle-orm';

/**
 * Tabla de bloqueos entre usuarios
 * Registra qué usuarios han bloqueado a otros usuarios para moderación y control de interacciones.
 */
export const blocks = pgTable(
  'block',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    blockerId: uuid('blocker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blockedId: uuid('blocked_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: uuid('created_at').notNull().defaultRandom(),
  },
  table => [
    index('block_blocker_blocked_idx').on(table.blockerId, table.blockedId),
    index('block_blocker_id_idx').on(table.blockerId),
    index('block_blocked_id_idx').on(table.blockedId),
  ]
);

/**
 * Tabla de silenciamientos entre usuarios
 * Registra qué usuarios han silenciado a otros usuarios para moderación y control de interacciones.
 */
export const mutes = pgTable(
  'mute',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    muterId: uuid('muter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mutedId: uuid('muted_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    muteDuration: varchar('mute_duration', { length: 20 }), // 'permanent' | '24h' | '7d' | '30d'
    expiresAt: timestamp('expires_at'), // Para silencios temporales
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  table => [
    index('mute_muter_muted_idx').on(table.muterId, table.mutedId),
    index('mute_muter_id_idx').on(table.muterId),
    index('mute_muted_id_idx').on(table.mutedId),
  ]
);

export const blocksRelations = relations(blocks, ({ one }) => ({
  blocker: one(users, {
    fields: [blocks.blockerId],
    references: [users.id],
    relationName: 'blocker',
  }),
  blocked: one(users, {
    fields: [blocks.blockedId],
    references: [users.id],
    relationName: 'blocked',
  }),
}));

export const mutesRelations = relations(mutes, ({ one }) => ({
  muter: one(users, {
    fields: [mutes.muterId],
    references: [users.id],
    relationName: 'muter',
  }),
  muted: one(users, {
    fields: [mutes.mutedId],
    references: [users.id],
    relationName: 'muted',
  }),
}));

export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
export type Mute = typeof mutes.$inferSelect;
export type NewMute = typeof mutes.$inferInsert;
