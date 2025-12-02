import { pgTable, text, timestamp, uuid, varchar, index, jsonb } from 'drizzle-orm/pg-core';
import { users } from '@app/database/schema';

/**
 * Tabla de auditoría de logs - Registra acciones importantes de los usuarios para seguridad y cumplimiento
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: varchar('action', { length: 100 }).notNull(), // 'account_deleted', 'password_changed', etc.
    entityType: varchar('entity_type', { length: 50 }), // 'user', 'post', 'message', etc.
    entityId: uuid('entity_id'), // ID del objeto afectado
    ipAddress: text('ip_address'), // IP desde donde se realizó la acción
    userAgent: text('user_agent'), // Agente de usuario del navegador/cliente
    metadata: jsonb('metadata'), // Informacion adicional relevante
    reason: text('reason'), // Razón opcional proporcionada por el usuario
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  table => [
    index('audit_logs_user_id_idx').on(table.userId),
    index('audit_logs_action_idx').on(table.action),
    index('audit_logs_created_at_idx').on(table.createdAt),
    index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  ]
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
