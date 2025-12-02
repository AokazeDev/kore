import { envs } from '@app/common/config/envs';
import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor() {
    // Se inicia Resend solo si la API key está configurada
    if (envs.resend.apiKey) {
      this.resend = new Resend(envs.resend.apiKey);
      this.logger.log('Servicio Resend inicializado correctamente.');
    } else {
      this.resend = null;
      this.logger.warn(
        'Clave API de Resend no proporcionada. Los emails se registrarán en la consola en su lugar.'
      );
    }

    // Correo electrónico predeterminado de origen (puede ser sobrescrito)
    this.fromEmail = 'Kore <noreply@kore.app>';
  }

  /**
   * Enviar un email genérico
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      // Si Resend no está configurado, registrar en consola (modo desarrollo)
      if (!this.resend) {
        this.logger.log('📧 [DEV MODE] Email que debería enviarse:');
        this.logger.log(`Para: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
        this.logger.log(`Asunto: ${options.subject}`);
        this.logger.log(`HTML: ${options.html.substring(0, 200)}...`);
        return true;
      }

      // Enviar email vía Resend
      const { data, error } = await this.resend.emails.send({
        from: options.from ?? this.fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        this.logger.error('Error al enviar el email vía Resend', error);
        return false;
      }

      const recipient = Array.isArray(options.to) ? options.to.join(', ') : options.to;
      this.logger.log(`Email enviado exitosamente a ${recipient}. ID: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error('Error al enviar el email', error);
      return false;
    }
  }

  /**
   * Enviar email de verificación
   */
  async sendVerificationEmail(email: string, verificationUrl: string): Promise<boolean> {
    const html = this.getVerificationEmailTemplate(verificationUrl);

    return this.sendEmail({
      to: email,
      subject: 'Verifica tu cuenta de Kore',
      html,
      text: `Verifica tu cuenta haciendo clic en este enlace: ${verificationUrl}`,
    });
  }

  /**
   * Enviar email para restablecer contraseña
   */
  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
    const html = this.getPasswordResetEmailTemplate(resetUrl);

    return this.sendEmail({
      to: email,
      subject: 'Restablece tu contraseña de Kore',
      html,
      text: `Restablece tu contraseña haciendo clic en este enlace: ${resetUrl}. Este enlace expira en 1 hora.`,
    });
  }

  /**
   * Enviar notificación de cambio de contraseña
   */
  async sendPasswordChangedEmail(email: string): Promise<boolean> {
    const html = this.getPasswordChangedEmailTemplate();

    return this.sendEmail({
      to: email,
      subject: 'Tu contraseña ha sido cambiada',
      html,
      text: 'Tu contraseña ha sido cambiada exitosamente. Si no realizaste este cambio, contacta a soporte inmediatamente.',
    });
  }

  /**
   * Enviar email de notificación por "me gusta"
   */
  async sendLikeNotificationEmail(
    recipientEmail: string,
    actorName: string,
    actorUsername: string,
    postPreview: string,
    postUrl: string
  ): Promise<boolean> {
    const html = this.getLikeNotificationTemplate(actorName, actorUsername, postPreview, postUrl);

    return this.sendEmail({
      to: recipientEmail,
      subject: `${actorName} le gustó tu post`,
      html,
      text: `${actorName} (@${actorUsername}) le gustó tu post: "${postPreview}"`,
    });
  }

  /**
   * Enviar email de notificación por reposts
   */
  async sendRepostNotificationEmail(
    recipientEmail: string,
    actorName: string,
    actorUsername: string,
    postPreview: string,
    postUrl: string
  ): Promise<boolean> {
    const html = this.getRepostNotificationTemplate(actorName, actorUsername, postPreview, postUrl);

    return this.sendEmail({
      to: recipientEmail,
      subject: `${actorName} reposteó tu publicación`,
      html,
      text: `${actorName} (@${actorUsername}) reposteó tu publicación: "${postPreview}"`,
    });
  }

  /**
   * Enviar email de notificación por respuestas
   */
  async sendReplyNotificationEmail(
    recipientEmail: string,
    actorName: string,
    actorUsername: string,
    replyContent: string,
    postUrl: string
  ): Promise<boolean> {
    const html = this.getReplyNotificationTemplate(actorName, actorUsername, replyContent, postUrl);

    return this.sendEmail({
      to: recipientEmail,
      subject: `${actorName} respondió a tu post`,
      html,
      text: `${actorName} (@${actorUsername}) respondió a tu post: "${replyContent}"`,
    });
  }

  /**
   * Enviar email de notificación por menciones
   */
  async sendMentionNotificationEmail(
    recipientEmail: string,
    actorName: string,
    actorUsername: string,
    postContent: string,
    postUrl: string
  ): Promise<boolean> {
    const html = this.getMentionNotificationTemplate(
      actorName,
      actorUsername,
      postContent,
      postUrl
    );

    return this.sendEmail({
      to: recipientEmail,
      subject: `${actorName} te mencionó en un post`,
      html,
      text: `${actorName} (@${actorUsername}) te mencionó en un post: "${postContent}"`,
    });
  }

  /**
   * Enviar email de notificación por seguidores
   */
  async sendFollowNotificationEmail(
    recipientEmail: string,
    actorName: string,
    actorUsername: string,
    actorBio: string,
    profileUrl: string
  ): Promise<boolean> {
    const html = this.getFollowNotificationTemplate(actorName, actorUsername, actorBio, profileUrl);

    return this.sendEmail({
      to: recipientEmail,
      subject: `${actorName} te ha seguido`,
      html,
      text: `${actorName} (@${actorUsername}) te ha seguido en Kore`,
    });
  }

  /**
   * Enviar email de notificación por mensajes
   */
  async sendMessageNotificationEmail(
    recipientEmail: string,
    actorName: string,
    actorUsername: string,
    messagePreview: string,
    messagesUrl: string
  ): Promise<boolean> {
    const html = this.getMessageNotificationTemplate(
      actorName,
      actorUsername,
      messagePreview,
      messagesUrl
    );

    return this.sendEmail({
      to: recipientEmail,
      subject: `Nuevo mensaje de ${actorName}`,
      html,
      text: `${actorName} (@${actorUsername}) te ha enviado un mensaje: "${messagePreview}"`,
    });
  }

  /**
   * Enviar email de notificación por citas
   */
  async sendQuoteNotificationEmail(
    recipientEmail: string,
    actorName: string,
    actorUsername: string,
    quoteContent: string,
    postUrl: string
  ): Promise<boolean> {
    const html = this.getQuoteNotificationTemplate(actorName, actorUsername, quoteContent, postUrl);

    return this.sendEmail({
      to: recipientEmail,
      subject: `${actorName} citó tu publicación`,
      html,
      text: `${actorName} (@${actorUsername}) citó tu publicación: "${quoteContent}"`,
    });
  }

  /**
   * Enviar email de actualización del estado de la solicitud de verificación
   */
  async sendVerificationStatusEmail(
    recipientEmail: string,
    status: 'approved' | 'rejected' | 'needs_info',
    reason?: string
  ): Promise<boolean> {
    const html = this.getVerificationStatusTemplate(status, reason);

    const subjects = {
      approved: '¡Tu cuenta ha sido verificada!',
      rejected: 'Actualización sobre tu solicitud de verificación',
      needs_info: 'Información adicional requerida para tu verificación',
    };

    return this.sendEmail({
      to: recipientEmail,
      subject: subjects[status],
      html,
      text: `Tu solicitud de verificación ha sido ${status === 'approved' ? 'aprobada' : status === 'rejected' ? 'rechazada' : 'actualizada'}.`,
    });
  }

  /**
   * Enviar email de confirmación de apelación enviada
   */
  async sendAppealSubmittedEmail(recipientEmail: string, appealId: string): Promise<boolean> {
    const html = this.getAppealSubmittedTemplate(appealId);

    return this.sendEmail({
      to: recipientEmail,
      subject: 'Apelación recibida - Solicitud de verificación',
      html,
      text: `Tu apelación de verificación ha sido recibida y será revisada por nuestro equipo.`,
    });
  }

  /**
   * Enviar email de revisión de apelación
   */
  async sendAppealReviewedEmail(
    recipientEmail: string,
    status: 'approved' | 'rejected',
    reason?: string
  ): Promise<boolean> {
    const html = this.getAppealReviewedTemplate(status, reason);

    return this.sendEmail({
      to: recipientEmail,
      subject:
        status === 'approved'
          ? '¡Tu apelación ha sido aprobada!'
          : 'Actualización sobre tu apelación',
      html,
      text: `Tu apelación ha sido ${status === 'approved' ? 'aprobada' : 'rechazada'}.`,
    });
  }

  /**
   * Plantilla HTML para el email de verificación
   */
  private getVerificationEmailTemplate(verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifica tu cuenta</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido a Kore!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Verifica tu dirección de email</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              Gracias por registrarte en Kore. Para completar tu registro y empezar a usar la plataforma, 
              necesitamos verificar tu dirección de email.
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 14px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Verificar mi cuenta
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Si no creaste una cuenta en Kore, puedes ignorar este correo de forma segura.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kore. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Plantilla HTML para el email de restablecimiento de contraseña
   */
  private getPasswordResetEmailTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Restablece tu contraseña</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔒 Restablece tu contraseña</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">¿Olvidaste tu contraseña?</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta de Kore. 
              Haz clic en el botón de abajo para crear una nueva contraseña.
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); 
                        color: white; 
                        padding: 14px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Restablecer contraseña
              </a>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                ⚠️ <strong>Este enlace expira en 1 hora</strong> por razones de seguridad.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Si no solicitaste un restablecimiento de contraseña, puedes ignorar este correo de forma segura. 
              Tu contraseña no será cambiada.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${resetUrl}" style="color: #f59e0b; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kore. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Plantilla HTML para el email de notificación de cambio de contraseña
   */
  private getPasswordChangedEmailTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contraseña cambiada</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Contraseña actualizada</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Tu contraseña ha sido cambiada</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              Esto es una confirmación de que la contraseña de tu cuenta de Kore ha sido cambiada exitosamente.
            </p>
            
            <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                ✓ Tu cuenta está segura y puedes iniciar sesión con tu nueva contraseña.
              </p>
            </div>
            
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #991b1b; margin: 0; font-size: 14px;">
                <strong>⚠️ ¿No reconoces esta actividad?</strong><br>
                Si no realizaste este cambio, tu cuenta puede estar comprometida. 
                Contacta a nuestro equipo de soporte inmediatamente.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Este es un correo automático de notificación de seguridad. No necesitas responder.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kore. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Plantilla HTML para el email de notificación por "me gusta"
   */
  private getLikeNotificationTemplate(
    actorName: string,
    actorUsername: string,
    postPreview: string,
    postUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nuevo like</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">❤️ Nuevo like</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #4b5563; font-size: 16px;">
              <strong style="color: #1f2937;">${actorName}</strong> 
              <span style="color: #6b7280;">(@${actorUsername})</span> 
              le gustó tu publicación:
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid #ec4899; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #374151; margin: 0; font-size: 14px; font-style: italic;">
                "${postPreview.substring(0, 200)}${postPreview.length > 200 ? '...' : ''}"
              </p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${postUrl}" 
                 style="background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); 
                        color: white; 
                        padding: 14px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Ver publicación
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kore. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Plantilla HTML para el email de notificación por repost
   */
  private getRepostNotificationTemplate(
    actorName: string,
    actorUsername: string,
    postPreview: string,
    postUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nuevo repost</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔁 Nuevo repost</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #4b5563; font-size: 16px;">
              <strong style="color: #1f2937;">${actorName}</strong> 
              <span style="color: #6b7280;">(@${actorUsername})</span> 
              reposteó tu publicación:
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #374151; margin: 0; font-size: 14px; font-style: italic;">
                "${postPreview.substring(0, 200)}${postPreview.length > 200 ? '...' : ''}"
              </p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${postUrl}" 
                 style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                        color: white; 
                        padding: 14px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Ver publicación
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kore. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Plantilla HTML para el email de notificación por respuestas
   */
  private getReplyNotificationTemplate(
    actorName: string,
    actorUsername: string,
    replyContent: string,
    postUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nueva respuesta</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💬 Nueva respuesta</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #4b5563; font-size: 16px;">
              <strong style="color: #1f2937;">${actorName}</strong> 
              <span style="color: #6b7280;">(@${actorUsername})</span> 
              respondió a tu publicación:
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #374151; margin: 0; font-size: 14px;">
                "${replyContent.substring(0, 200)}${replyContent.length > 200 ? '...' : ''}"
              </p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${postUrl}" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                        color: white; 
                        padding: 14px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Ver respuesta
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kore. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Plantilla HTML para el email de notificación por menciones
   */
  private getMentionNotificationTemplate(
    actorName: string,
    actorUsername: string,
    postContent: string,
    postUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nueva mención</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">@️ Nueva mención</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #4b5563; font-size: 16px;">
              <strong style="color: #1f2937;">${actorName}</strong> 
              <span style="color: #6b7280;">(@${actorUsername})</span> 
              te mencionó en una publicación:
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid #8b5cf6; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #374151; margin: 0; font-size: 14px;">
                "${postContent.substring(0, 200)}${postContent.length > 200 ? '...' : ''}"
              </p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${postUrl}" 
                 style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); 
                        color: white; 
                        padding: 14px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Ver publicación
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kore. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Plantilla HTML para el email de notificación por seguidores
   */
  private getFollowNotificationTemplate(
    actorName: string,
    actorUsername: string,
    actorBio: string,
    profileUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nuevo seguidor</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">👤 Nuevo seguidor</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #4b5563; font-size: 16px;">
              <strong style="color: #1f2937;">${actorName}</strong> 
              <span style="color: #6b7280;">(@${actorUsername})</span> 
              ha comenzado a seguirte en Kore.
            </p>
            
            ${
              actorBio
                ? `
            <div style="background: #f9fafb; border-left: 4px solid #06b6d4; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #374151; margin: 0; font-size: 14px; font-style: italic;">
                "${actorBio.substring(0, 150)}${actorBio.length > 150 ? '...' : ''}"
              </p>
            </div>
            `
                : ''
            }
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${profileUrl}" 
                 style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); 
                        color: white; 
                        padding: 14px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Ver perfil
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kore. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Plantilla HTML para el email de notificación por mensajes
   */
  private getMessageNotificationTemplate(
    actorName: string,
    actorUsername: string,
    messagePreview: string,
    messagesUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nuevo mensaje</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✉️ Nuevo mensaje</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #4b5563; font-size: 16px;">
              <strong style="color: #1f2937;">${actorName}</strong> 
              <span style="color: #6b7280;">(@${actorUsername})</span> 
              te ha enviado un mensaje:
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #374151; margin: 0; font-size: 14px;">
                "${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}"
              </p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${messagesUrl}" 
                 style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                        color: white; 
                        padding: 14px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Ver mensaje
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kore. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Plantilla HTML para el email de notificación por citas
   */
  private getQuoteNotificationTemplate(
    actorName: string,
    actorUsername: string,
    quoteContent: string,
    postUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nueva cita</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💭 Nueva cita</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #4b5563; font-size: 16px;">
              <strong style="color: #1f2937;">${actorName}</strong> 
              <span style="color: #6b7280;">(@${actorUsername})</span> 
              citó tu publicación:
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid #14b8a6; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #374151; margin: 0; font-size: 14px;">
                "${quoteContent.substring(0, 200)}${quoteContent.length > 200 ? '...' : ''}"
              </p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${postUrl}" 
                 style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); 
                        color: white; 
                        padding: 14px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Ver publicación
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kore. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Plantilla HTML para el email de notificación del estado de verificación
   */
  private getVerificationStatusTemplate(
    status: 'approved' | 'rejected' | 'needs_info',
    reason?: string
  ): string {
    const statusConfig = {
      approved: {
        color: '#10b981',
        icon: '✅',
        title: '¡Felicitaciones! Tu cuenta ha sido verificada',
        message:
          'Tu solicitud de verificación ha sido aprobada. Ahora cuentas con una insignia verificada en tu perfil.',
      },
      rejected: {
        color: '#ef4444',
        icon: '❌',
        title: 'Actualización sobre tu solicitud de verificación',
        message:
          'Tu solicitud de verificación ha sido revisada pero no ha podido ser aprobada en este momento.',
      },
      needs_info: {
        color: '#f59e0b',
        icon: '⚠️',
        title: 'Información adicional requerida',
        message:
          'Tu solicitud de verificación requiere información adicional. Por favor, revisa los detalles y actualiza tu solicitud.',
      },
    };

    const config = statusConfig[status];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Estado de verificación</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${config.icon} ${config.title}</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #4b5563; font-size: 16px;">
              ${config.message}
            </p>
            
            ${
              reason
                ? `
            <div style="background: #f9fafb; border-left: 4px solid ${config.color}; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #374151; margin: 0; font-size: 14px;">
                <strong>Detalles:</strong><br>
                ${reason}
              </p>
            </div>
            `
                : ''
            }
            
            ${
              status === 'rejected'
                ? `
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Si crees que esto es un error o tienes información adicional para compartir, 
              puedes presentar una apelación desde tu perfil.
            </p>
            `
                : ''
            }
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kore. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Plantilla HTML para el email de confirmación de apelación enviada
   */
  private getAppealSubmittedTemplate(appealId: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Apelación recibida</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📋 Apelación recibida</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Tu apelación está en revisión</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              Hemos recibido tu apelación sobre la decisión de verificación y nuestro equipo la revisará cuidadosamente.
            </p>
            
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #1e40af; margin: 0; font-size: 14px;">
                <strong>ID de apelación:</strong> ${appealId}<br>
                <strong>Tiempo estimado de revisión:</strong> 5-7 días hábiles
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Te notificaremos por email cuando tu apelación haya sido revisada. 
              Gracias por tu paciencia.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kore. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Plantilla HTML para el email de revisión de apelación
   */
  private getAppealReviewedTemplate(status: 'approved' | 'rejected', reason?: string): string {
    const isApproved = status === 'approved';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Apelación revisada</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${isApproved ? '#10b981' : '#ef4444'} 0%, ${isApproved ? '#059669' : '#dc2626'} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${isApproved ? '✅' : '❌'} Apelación revisada</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">
              ${isApproved ? '¡Buenas noticias!' : 'Actualización sobre tu apelación'}
            </h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              ${
                isApproved
                  ? 'Tu apelación ha sido aprobada y tu cuenta ahora está verificada. ¡Felicitaciones!'
                  : 'Hemos revisado cuidadosamente tu apelación, pero no podemos aprobar la verificación en este momento.'
              }
            </p>
            
            ${
              reason
                ? `
            <div style="background: ${isApproved ? '#d1fae5' : '#fee2e2'}; border-left: 4px solid ${isApproved ? '#10b981' : '#ef4444'}; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="color: ${isApproved ? '#065f46' : '#991b1b'}; margin: 0; font-size: 14px;">
                <strong>Detalles:</strong><br>
                ${reason}
              </p>
            </div>
            `
                : ''
            }
            
            ${
              !isApproved
                ? `
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Puedes intentar nuevamente cuando tengas información adicional que respalde tu solicitud de verificación.
            </p>
            `
                : ''
            }
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kore. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }
}
