import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  varchar,
  index,
  integer,
} from 'drizzle-orm/pg-core';

/**
 * Tabla User - Información core del usuario
 * Este esquema sigue las convenciones de Better Auth para una integración sin problemas
 */
export const users = pgTable(
  'user',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    username: varchar('username', { length: 50 }).notNull().unique(),
    bio: text('bio'),
    website: varchar('website', { length: 255 }),
    location: varchar('location', { length: 100 }),
    role: varchar('role', { length: 20 }).notNull().default('user'), // 'user' | 'admin' | 'moderator'
    followersCount: integer('followers_count').notNull().default(0),
    followingCount: integer('following_count').notNull().default(0),
    postsCount: integer('posts_count').notNull().default(0),
    isPrivate: boolean('is_private').notNull().default(false),
    isVerified: boolean('is_verified').notNull().default(false), // Cuenta verificada
    verificationType: varchar('verification_type', { length: 20 }), // 'personal' | 'organizational' | null
    isBanned: boolean('is_banned').notNull().default(false),
    bannedAt: timestamp('banned_at'),
    bannedReason: text('banned_reason'),
    lastActiveAt: timestamp('last_active_at'), // Rastrea la última actividad para analytics
    countryCode: varchar('country_code', { length: 2 }), // ISO 3166-1 alpha-2 para geolocalización
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => [
    index('user_email_idx').on(table.email),
    index('user_username_idx').on(table.username),
    index('user_created_at_idx').on(table.createdAt),
    index('user_last_active_at_idx').on(table.lastActiveAt),
    index('user_country_code_idx').on(table.countryCode),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
