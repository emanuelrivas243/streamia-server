import sgMail from "@sendgrid/mail";

/**
 * Initialize SendGrid with API key from environment.
 */
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}


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
            <h1>¡Welcome to Streamia! 🎬</h1>
          </div>
          <div class="content">
            <p>Hello ${firstName},</p>
            <p>Your account has been successfully created.</p>
            <p>Now you can explore our movie catalog</p>
            
            <div style="text-align: center;">
              <a href="${process.env.ORIGIN?.split(",")[0]}/movies" class="button">Watch Movies</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || "noreply@streamia.com",
      subject: "¡Welcome to Streamia!",
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
  }
};