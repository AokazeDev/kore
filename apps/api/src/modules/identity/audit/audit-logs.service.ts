import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@app/database';
import { auditLogs, AuditLog } from '@app/database/schema';
import { desc, eq, and, gte } from 'drizzle-orm';

export interface CreateAuditLogInput {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  reason?: string;
}

/**
 * Servicio para gestionar los audit logs.
 * Sigue y registra acciones importantes de los usuarios para seguridad y cumplimiento
 */
@Injectable()
export class AuditLogsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Crear una nueva entrada de log de auditoría
   */
  async log(input: CreateAuditLogInput): Promise<AuditLog> {
    const [log] = await this.db.db
      .insert(auditLogs)
      .values({
        userId: input.userId,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ?? null,
        reason: input.reason ?? null,
      })
      .returning();

    return log;
  }

  /**
   * Obtener logs de auditoría para un usuario específico
   */
  async getByUserId(userId: string, limit = 50, offset = 0): Promise<AuditLog[]> {
    return this.db.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Obtener logs de auditoría por tipo de acción
   */
  async getByAction(action: string, limit = 50, offset = 0): Promise<AuditLog[]> {
    return this.db.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, action))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Obtener logs de auditoría para una entidad específica
   */
  async getByEntity(
    entityType: string,
    entityId: string,
    limit = 50,
    offset = 0
  ): Promise<AuditLog[]> {
    return this.db.db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Obtener logs de auditoría recientes (últimas 24 horas)
   */
  async getRecent(limit = 100): Promise<AuditLog[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.db.db
      .select()
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, oneDayAgo))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  /**
   * Obtener log de auditoría por ID
   */
  async getById(id: string): Promise<AuditLog | undefined> {
    const [log] = await this.db.db.select().from(auditLogs).where(eq(auditLogs.id, id)).limit(1);

    return log;
  }

  /**
   * Acciones comunes de logs de auditoría como constantes
   */
  static readonly ACTIONS = {
    // Acciones de la cuenta
    ACCOUNT_CREATED: 'account_created',
    ACCOUNT_DELETED: 'account_deleted',
    ACCOUNT_SUSPENDED: 'account_suspended',
    ACCOUNT_UNSUSPENDED: 'account_unsuspended',
    ACCOUNT_BANNED: 'account_banned',
    ACCOUNT_UNBANNED: 'account_unbanned',
    ACCOUNT_VERIFIED: 'account_verified',

    // Acciones de autenticación
    PASSWORD_CHANGED: 'password_changed',
    EMAIL_CHANGED: 'email_changed',
    TWO_FACTOR_ENABLED: 'two_factor_enabled',
    TWO_FACTOR_DISABLED: 'two_factor_disabled',

    // Acciones de seguridad
    SESSION_REVOKED: 'session_revoked',
    ALL_SESSIONS_REVOKED: 'all_sessions_revoked',
    OAUTH_ACCOUNT_LINKED: 'oauth_account_linked',
    OAUTH_ACCOUNT_UNLINKED: 'oauth_account_unlinked',

    // Acciones de privacidad
    PRIVACY_SETTINGS_UPDATED: 'privacy_settings_updated',
    NOTIFICATION_SETTINGS_UPDATED: 'notification_settings_updated',

    // Acciones de contenido
    POST_CREATED: 'post_created',
    POST_DELETED: 'post_deleted',
    POST_REPORTED: 'post_reported',

    // Acciones de moderación
    USER_BLOCKED: 'user_blocked',
    USER_UNBLOCKED: 'user_unblocked',
    USER_MUTED: 'user_muted',
    USER_UNMUTED: 'user_unmuted',
    REPORT_SUBMITTED: 'report_submitted',

    // Acciones de exportación de datos
    DATA_EXPORT_REQUESTED: 'data_export_requested',
    DATA_EXPORT_DOWNLOADED: 'data_export_downloaded',
  } as const;
}
