import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '@app/database';
import {
  accounts,
  blocks,
  mutes,
  sessions,
  users,
  type Block,
  type Mute,
} from '@app/database/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { MuteDuration } from 'apps/api/src/modules/moderation/users/inputs/block-mute.input';
import {
  DeleteAccountInput,
  UpdateProfileInput,
} from 'apps/api/src/modules/identity/users/dto/update-user.input';
import { AuditLogsService } from 'apps/api/src/modules/identity/audit/audit-logs.service';

/**
 * Servicio para la gestión de usuarios
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async findById(id: string): Promise<typeof users.$inferSelect | undefined> {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user;
  }

  async findByEmail(email: string): Promise<typeof users.$inferSelect | undefined> {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user;
  }

  async findByUsername(username: string): Promise<typeof users.$inferSelect | undefined> {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return user;
  }

  /**
   * Bloquear a un usuario
   */
  async blockUser(blockerId: string, blockedId: string): Promise<Block> {
    // Comprueba si el bloqueo ya existe
    const existing = await this.databaseService.db
      .select()
      .from(blocks)
      .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)))
      .limit(1);

    if (existing[0]) {
      return existing[0];
    }

    const result = await this.databaseService.db
      .insert(blocks)
      .values({ blockerId, blockedId })
      .returning();

    return result[0];
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    const result = await this.databaseService.db
      .delete(blocks)
      .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)))
      .returning();

    return result.length > 0;
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.databaseService.db
      .select()
      .from(blocks)
      .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)))
      .limit(1);

    return block.length > 0;
  }

  async muteUser(muterId: string, mutedId: string, duration?: MuteDuration): Promise<Mute> {
    // Comprueba si el muteo ya existe
    const existing = await this.databaseService.db
      .select()
      .from(mutes)
      .where(and(eq(mutes.muterId, muterId), eq(mutes.mutedId, mutedId)))
      .limit(1);

    if (existing[0]) {
      return existing[0];
    }

    const expiresAt = duration ? this.calculateMuteExpiration(duration) : null;

    const result = await this.databaseService.db
      .insert(mutes)
      .values({
        muterId,
        mutedId,
        muteDuration: duration ?? 'permanent',
        expiresAt,
      })
      .returning();

    return result[0];
  }

  async unmuteUser(muterId: string, mutedId: string): Promise<boolean> {
    const result = await this.databaseService.db
      .delete(mutes)
      .where(and(eq(mutes.muterId, muterId), eq(mutes.mutedId, mutedId)))
      .returning();

    return result.length > 0;
  }

  async isMuted(muterId: string, mutedId: string): Promise<boolean> {
    const mute = await this.databaseService.db
      .select()
      .from(mutes)
      .where(and(eq(mutes.muterId, muterId), eq(mutes.mutedId, mutedId)))
      .limit(1);

    // Comprueba si el muteo existe y si no ha expirado
    if (!mute[0]) return false;
    if (!mute[0].expiresAt) return true; // Muteo permanente
    return mute[0].expiresAt > new Date();
  }

  /**
   * Obtener lista de usuarios bloqueados
   */
  async getBlockedUsers(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<(typeof users.$inferSelect)[]> {
    const blockedIds = await this.databaseService.db
      .select({ blockedId: blocks.blockedId })
      .from(blocks)
      .where(eq(blocks.blockerId, userId))
      .orderBy(desc(blocks.createdAt))
      .limit(limit)
      .offset(offset);

    if (blockedIds.length === 0) {
      return [];
    }

    const ids = blockedIds.map(b => b.blockedId);

    return this.databaseService.db.select().from(users).where(inArray(users.id, ids));
  }

  /**
   * Obtener lista de usuarios silenciados
   */
  async getMutedUsers(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<(typeof users.$inferSelect)[]> {
    const mutedIds = await this.databaseService.db
      .select({ mutedId: mutes.mutedId })
      .from(mutes)
      .where(eq(mutes.muterId, userId))
      .orderBy(desc(mutes.createdAt))
      .limit(limit)
      .offset(offset);

    if (mutedIds.length === 0) {
      return [];
    }

    const ids = mutedIds.map(m => m.mutedId);

    // Obtener usuarios y filtrar los expirados en memoria
    const allUsers = await this.databaseService.db
      .select()
      .from(users)
      .where(inArray(users.id, ids));

    // Verificar cuáles están activamente silenciados
    const activelyMuted = [] as (typeof users.$inferSelect)[];
    for (const user of allUsers) {
      const isMuted = await this.isMuted(userId, user.id);
      if (isMuted) {
        activelyMuted.push(user);
      }
    }

    return activelyMuted;
  }

  private calculateMuteExpiration(duration: MuteDuration): Date {
    const now = new Date();
    switch (duration) {
      case MuteDuration.HOURS_24:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case MuteDuration.DAYS_7:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case MuteDuration.DAYS_30:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default:
        return now; // No expira (permanente)
    }
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<typeof users.$inferSelect> {
    // Si se está actualizando el username, verificar que no exista
    if (input.username) {
      const existingUser = await this.findByUsername(input.username);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('El username ya está en uso');
      }
    }

    const [updatedUser] = await this.databaseService.db
      .update(users)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return updatedUser;
  }

  /**
   * Verifica si un usuario puede cambiar su contraseña.
   * Better Auth maneja el cambio real de contraseña
   * POST /api/auth/change-password { currentPassword, newPassword }
   */
  async changePassword(userId: string): Promise<boolean> {
    // Verificar que el usuario exista
    const user = await this.findById(userId);
    if (!user || !user.email) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Buscar la cuenta de email/password del usuario
    const [account] = await this.databaseService.db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.providerId, 'credential')))
      .limit(1);

    if (!account || !account.password) {
      throw new UnauthorizedException(
        'No puedes cambiar la contraseña. Tu cuenta usa autenticación OAuth'
      );
    }
    return true;
  }

  /**
   * Elimina la cuenta de un usuario y toda su información asociada.
   * Better Auth maneja la verificación de contraseña y re-autenticación.
   */
  async deleteAccount(userId: string, input: DeleteAccountInput): Promise<boolean> {
    // Obtener el usuario
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Log de eliminación en audit logs
    await this.auditLogsService.log({
      userId,
      action: AuditLogsService.ACTIONS.ACCOUNT_DELETED,
      entityType: 'user',
      entityId: userId,
      reason: input.reason,
      metadata: {
        deletedAt: new Date().toISOString(),
        hasPassword: !!input.password,
      },
    });

    // Eliminar todas las sesiones del usuario
    await this.databaseService.db.delete(sessions).where(eq(sessions.userId, userId));

    // Eliminar todas las cuentas OAuth del usuario
    await this.databaseService.db.delete(accounts).where(eq(accounts.userId, userId));

    // Eliminar el usuario (esto eliminará en cascada posts, likes, reposts,
    // notificaciones, follows, blocks, mutes, bookmarks, etc.)
    await this.databaseService.db.delete(users).where(eq(users.id, userId));

    return true;
  }
}
