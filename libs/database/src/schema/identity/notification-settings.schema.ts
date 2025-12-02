import { pgTable, uuid, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

/**
 * Tabla de Configuración de Notificaciones
 * Controla qué tipos de notificaciones el usuario desea recibir
 */
export const notificationSettings = pgTable(
  'notification_setting',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Notificaciones push (en la aplicación)
    pushEnabled: boolean('push_enabled').notNull().default(true),
    pushLikes: boolean('push_likes').notNull().default(true),
    pushReposts: boolean('push_reposts').notNull().default(true),
    pushReplies: boolean('push_replies').notNull().default(true),
    pushMentions: boolean('push_mentions').notNull().default(true),
    pushFollows: boolean('push_follows').notNull().default(true),
    pushMessages: boolean('push_messages').notNull().default(true),

    // Filtros de notificación (control de spam)
    muteNonFollowers: boolean('mute_non_followers').notNull().default(false),
    muteNewAccounts: boolean('mute_new_accounts').notNull().default(false),
    muteUnverified: boolean('mute_unverified').notNull().default(false),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => [index('notification_setting_user_id_idx').on(table.userId)]
);

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type NewNotificationSetting = typeof notificationSettings.$inferInsert;
