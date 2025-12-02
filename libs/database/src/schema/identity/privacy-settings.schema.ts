import { users } from '@app/database/schema/identity/users.schema';
import { pgTable, uuid, boolean, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * Tabla para Ajustes de Privacidad del Usuario
 * Controla la visibilidad y opciones de privacidad para el perfil y contenido del usuario
 */
export const privacySettings = pgTable(
  'privacy_setting',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Visibilidad del perfil
    showEmail: boolean('show_email').notNull().default(false),
    showLocation: boolean('show_location').notNull().default(true),
    showWebsite: boolean('show_website').notNull().default(true),
    showBirthdate: boolean('show_birthdate').notNull().default(false),

    // Visibilidad del contenido
    allowIndexing: boolean('allow_indexing').notNull().default(true), // Permitir motores de búsqueda
    showLikedPosts: boolean('show_liked_posts').notNull().default(true),
    showFollowers: boolean('show_followers').notNull().default(true),
    showFollowing: boolean('show_following').notNull().default(true),

    // Permisos de interacción
    allowDirectMessages: boolean('allow_direct_messages').notNull().default(true),
    allowDirectMessagesFromFollowedOnly: boolean('allow_direct_messages_from_followed_only')
      .notNull()
      .default(false),
    allowTagging: boolean('allow_tagging').notNull().default(true),
    allowTaggingFromFollowedOnly: boolean('allow_tagging_from_followed_only')
      .notNull()
      .default(false),

    // Privacidad de mensajes
    showReadReceipts: boolean('show_read_receipts').notNull().default(true),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => [index('privacy_setting_user_id_idx').on(table.userId)]
);

export type PrivacySetting = typeof privacySettings.$inferSelect;
export type NewPrivacySetting = typeof privacySettings.$inferInsert;
