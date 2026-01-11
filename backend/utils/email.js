import { Resend } from 'resend';

let resendClient = null;

/**
 * @fileoverview
 * Email helpers (Resend).
 */

/**
 * Lazily initializes and returns the shared Resend client.
 *
 * If `RESEND_API_KEY` is not configured, returns null and email sending is disabled.
 *
 * @returns {Resend|null}
 */

export function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY not set. Emails will not be sent.');
      return null;
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Sends a password reset email containing a reset link.
 *
 * @param {{ to: string, token: string, appUrl?: string }} params
 * @returns {Promise<{ sent: boolean, id?: string, reason?: string, error?: any }>} Result.
 */
export async function sendPasswordResetEmail({ to, token, appUrl }) {
  const resend = getResendClient();
  if (!resend) return { sent: false, reason: 'missing_api_key' };

  const baseUrl = appUrl || process.env.APP_URL || 'http://localhost:5173';
  const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const subject = 'RobEurope: Restablecer contraseña';
  const html = `
    <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;padding:16px">
      <h2>Restablece tu contraseña</h2>
      <p>Has solicitado restablecer tu contraseña. Pulsa el botón para continuar. Este enlace caduca en 15 minutos.</p>
      <p>
        <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">Restablecer contraseña</a>
      </p>
      <p>Si no solicitaste este cambio, ignora este correo.</p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'RobEurope <noreply@mail.samuelponce.es>',
      to,
      subject,
      html,
    });
    if (error) {
      console.error('Resend email error:', error);
      return { sent: false, reason: 'api_error', error };
    }
    return { sent: true, id: data?.id };
  } catch (e) {
    console.error('Resend exception:', e);
    return { sent: false, reason: 'exception', error: e.message };
  }
}

/**
 * Sends a password reset email containing a one-time code.
 *
 * @param {{ to: string, code: string }} params
 * @returns {Promise<{ sent: boolean, id?: string, reason?: string, error?: any }>} Result.
 */
export async function sendPasswordResetCodeEmail({ to, code }) {
  const resend = getResendClient();
  if (!resend) return { sent: false, reason: 'missing_api_key' };

  const subject = 'RobEurope: Reset your password';
  const html = `
    <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;padding:16px">
      <h2>Reset your password</h2>
      <p>Use the following one-time code to reset your password. This code expires in 15 minutes.</p>
      <div style="margin:16px 0;padding:12px 16px;border-radius:8px;background:#F1F5F9;color:#0F172A;font-size:20px;letter-spacing:0.2em;text-align:center">
        <strong>${code}</strong>
      </div>
      <p>If you didn’t request this, you can ignore this email.</p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'RobEurope <no_reply@mail.samuelponce.es>',
      to,
      subject,
      html,
    });
    if (error) {
      console.error('Resend email error:', error);
      return { sent: false, reason: 'api_error', error };
    }
    return { sent: true, id: data?.id };
  } catch (e) {
    console.error('Resend exception:', e);
    return { sent: false, reason: 'exception', error: e.message };
  }
}
