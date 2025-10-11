import sgMail from "@sendgrid/mail";

/**
 * Initialize SendGrid with API key from environment.
 */
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Send password reset email using SendGrid.
 * @param email - User's email address
 * @param resetLink - Full password reset link with token
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetLink: string
): Promise<void> => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn("⚠️ SENDGRID_API_KEY not set. Email not sent.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #5a67d8; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Restablecer Contraseña</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            
            <p><strong>Haz clic en el botón a continuación para restablecer tu contraseña:</strong></p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Restablecer Contraseña</a>
            </div>
            
            <p><strong>⏰ Importante:</strong> Este enlace expira en <strong>1 hora</strong> por seguridad.</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            
            <p><strong>🛡️ Consejos de seguridad:</strong></p>
            <ul>
              <li>Si no solicitaste este cambio, ignora este correo</li>
              <li>Nunca compartas este enlace con nadie</li>
              <li>El enlace solo funciona una vez</li>
            </ul>
          </div>
          <div class="footer">
            <p>Streamia - Plataforma de Películas</p>
            <p>Enviado el ${new Date().toLocaleString("es-CO")}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || "noreply@streamia.com",
      subject: "Restablecer tu contraseña - Streamia",
      html: htmlContent,
      text: `Restablecer contraseña\n\nHaz clic aquí: ${resetLink}\n\nEste enlace expira en 1 hora.`,
    };

    await sgMail.send(msg);
    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    throw new Error("Failed to send reset email");
  }
};

/**
 * Send welcome email after successful registration.
 * @param email - User's email address
 * @param firstName - User's first name
 */
export const sendWelcomeEmail = async (
  email: string,
  firstName: string
): Promise<void> => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn("⚠️ SENDGRID_API_KEY not set. Welcome email not sent.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a Streamia! 🎬</h1>
          </div>
          <div class="content">
            <p>Hola ${firstName},</p>
            <p>Tu cuenta ha sido creada exitosamente.</p>
            <p>Ahora puedes explorar nuestro catálogo de películas.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.ORIGIN?.split(",")[0]}/movies" class="button">Ver Películas</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || "noreply@streamia.com",
      subject: "¡Bienvenido a Streamia!",
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    // Don't throw - welcome email is non-critical
  }
};