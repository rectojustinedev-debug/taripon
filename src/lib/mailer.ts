import "dotenv/config";
import nodemailer from "nodemailer";

export type MailRecipient = {
  email: string;
  name?: string;
};

export type SendMailArgs = {
  to: MailRecipient[];
  subject: string;
  text?: string;
  html?: string;
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false, // STARTTLS (Port 587)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Verify the SMTP connection.
 */
export async function verifyMailer() {
  try {
    await transporter.verify();
    console.log("✅ Brevo SMTP connection successful.");
    return true;
  } catch (error) {
    console.error("❌ Brevo SMTP connection failed.");
    console.error(error);
    return false;
  }
}

/**
 * Send an email.
 */
export async function sendMail({ to, subject, text, html }: SendMailArgs) {
  try {
    const info = await transporter.sendMail({
      from: {
        name: process.env.SMTP_FROM_NAME || "Taripon",
        address: process.env.SMTP_FROM_EMAIL!,
      },

      to: to.map((recipient) => ({
        name: recipient.name,
        address: recipient.email,
      })),

      subject,

      text: text ?? html?.replace(/<[^>]*>/g, ""),
      html: html ?? `<pre>${text}</pre>`,
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email sent successfully");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ Failed to send email");
    console.error(error);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return {
      success: false,
      error,
    };
  }
}

export default transporter;
