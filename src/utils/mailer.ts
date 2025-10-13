import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.sendgrid.net",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // STARTTLS en puerto 587
  auth: {
    user: process.env.SMTP_USER || "apikey",
    pass: process.env.SMTP_PASS,
  },
  // Agregar estas opciones para mejor compatibilidad
  tls: {
    rejectUnauthorized: true, // Solo para desarrollo, en producción considera dejarlo en true
  },
  debug: true, // Ver logs detallados
  logger: true, // Habilitar logging
});

// Verificar conexión al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Error en configuración SMTP:", error);
  } else {
    console.log("✅ Servidor SMTP listo para enviar correos");
  }
});

export const sendMail = async (to: string, subject: string, html: string) => {
  try {
    const from = process.env.EMAIL_FROM;
    
    if (!from) {
      throw new Error("EMAIL_FROM no está configurado en las variables de entorno");
    }

    const info = await transporter.sendMail({
      from: from,
      to,
      subject,
      html,
    });

    console.log("✅ Correo enviado:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    throw new Error("No se pudo enviar el correo");
  }
};