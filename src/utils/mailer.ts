import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.sendgrid.net",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "apikey",
    pass: process.env.SMTP_PASS,
  },
  
  tls: {
    rejectUnauthorized: true, 
  },
  debug: true,
  logger: true, 
});


transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP configuration error:", error);
  } else {
    console.log("✅ SMTP server ready to send emails");
  }
});

export const sendMail = async (to: string, subject: string, html: string) => {
  try {
    const from = process.env.EMAIL_FROM;
    
    if (!from) {
      throw new Error("EMAIL_FROM is not set in the environment variables");
    }

    const info = await transporter.sendMail({
      from: from,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new Error("The email could not be sent.");
  }
};