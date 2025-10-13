import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS 
  },
});

export const sendMail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"Soporte" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("❌ Error enviando el correo:", error);
    throw new Error("No se pudo enviar el correo");
  }
};
