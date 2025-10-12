import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER || "emanuel.rivas@correounivalle.edu.co",
    pass: process.env.EMAIL_PASS || "eqfyougybpsrvcal", // App Password si usas Gmail
  },
});

export const sendMail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"Soporte" <${process.env.EMAIL_USER || "emanuel.rivas@correounivalle.edu.co"}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("❌ Error enviando el correo:", error);
    throw new Error("No se pudo enviar el correo");
  }
};
