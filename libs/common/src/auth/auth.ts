import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import * as schema from '@app/database/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { envs } from '@app/common/config/envs';
import { EmailService } from '@app/common/email';
import { admin, bearer, twoFactor } from 'better-auth/plugins';
import { notificationSettings, privacySettings } from '@app/database/schema';

/**
 * Crea y configura la instancia de Better Auth para la autenticación y gestión de usuarios.
 * @param pool - Pool de conexiones de PostgreSQL.
 * @returns Instancia configurada de Better Auth.
 */
export function createAuth(pool: Pool) {
  const db = drizzle(pool, { schema });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
    }),
    basePath: '/api/auth',
    baseURL: envs.auth.url,
    secret: envs.auth.secret,

    // Origenes confiables para CORS
    trustedOrigins: ['http://localhost:3000', 'http://localhost:3001', envs.auth.url],

    // Autenticación por correo electrónico y contraseña
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: envs.nodeEnv === 'production',
      sendResetPassword: async ({
        user,
        url,
      }: {
        user: { email: string; id: string };
        url: string;
      }) => {
        // Esto será manejado por EmailService
        // Better Auth genera tokens seguros automáticamente
        const emailService = new EmailService();

        try {
          await emailService.sendPasswordResetEmail(user.email, url);
        } catch (error) {
          console.error('Error al enviar el correo de restablecimiento de contraseña:', error);
          throw error instanceof Error
            ? error
            : new Error('Error al enviar el correo de restablecimiento de contraseña');
        }
      },
      sendVerificationEmail: async ({
        user,
        url,
      }: {
        user: { email: string; id: string };
        url: string;
      }) => {
        // Manejar la verificación de email
        const emailService = new EmailService();

        try {
          await emailService.sendVerificationEmail(user.email, url);
        } catch (error) {
          console.error('Error al enviar el correo de verificación:', error);
          throw error instanceof Error
            ? error
            : new Error('Error al enviar el correo de verificación');
        }
      },
    },

    // Social providers
    socialProviders: {
      google:
        envs.auth.google.clientId && envs.auth.google.clientSecret
          ? {
              clientId: envs.auth.google.clientId,
              clientSecret: envs.auth.google.clientSecret,
            }
          : undefined,
      microsoft:
        envs.auth.microsoft.clientId && envs.auth.microsoft.clientSecret
          ? {
              clientId: envs.auth.microsoft.clientId,
              clientSecret: envs.auth.microsoft.clientSecret,
            }
          : undefined,
      twitch:
        envs.auth.twitch?.clientId && envs.auth.twitch?.clientSecret
          ? {
              clientId: envs.auth.twitch.clientId,
              clientSecret: envs.auth.twitch.clientSecret,
            }
          : undefined,
      kick:
        envs.auth.kick?.clientId && envs.auth.kick?.clientSecret
          ? {
              clientId: envs.auth.kick.clientId,
              clientSecret: envs.auth.kick.clientSecret,
            }
          : undefined,
    },

    // Nombre de la aplicación
    appName: 'Kore',

    // Plugins
    plugins: [
      bearer(), // Soporte de token Bearer para acceso a la API
      admin(),
      twoFactor({
        // Saltar la verificación si el 2FA se habilita durante el inicio de sesión
        skipVerificationOnEnable: false,
        // Nombre del emisor mostrado en las aplicaciones autenticadoras
        issuer: 'Kore',
      }),
    ],

    // Configuración de la sesión
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 días
      updateAge: 60 * 60 * 24, // Actualizar sesión cada 24 horas
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // Cache de cookies por 5 minutos
      },
    },

    // Configuración del usuario
    user: {
      additionalFields: {
        username: {
          type: 'string',
          required: false,
        },
        bio: {
          type: 'string',
          required: false,
        },
        website: {
          type: 'string',
          required: false,
        },
        location: {
          type: 'string',
          required: false,
        },
        isPrivate: {
          type: 'boolean',
          required: false,
          defaultValue: false,
        },
        isVerified: {
          type: 'boolean',
          required: false,
          defaultValue: false,
        },
      },
    },

    // Crear configuraciones predeterminadas cuando se crea un usuario
    databaseHooks: {
      user: {
        create: {
          after: async user => {
            try {
              // Crear configuraciones predeterminadas de privacidad
              await db.insert(privacySettings).values({
                userId: user.id,
              });

              // Crear configuraciones predeterminadas de notificaciones
              await db.insert(notificationSettings).values({
                userId: user.id,
              });

              console.log(`Configuraciones predeterminadas creadas para el usuario ${user.id}`);
            } catch (error) {
              console.error(
                `Error al crear configuraciones predeterminadas para el usuario ${user.id}:`,
                error
              );
            }
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
