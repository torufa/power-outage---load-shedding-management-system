import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

interface ISendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

let transporter: any = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  try {
    if (config.email.user && config.email.user !== 'gridpulse.alerts@ethereal.email') {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });
    } else {
      // Create Ethereal test account with timeout for instant response
      const testAccountPromise = nodemailer.createTestAccount();
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
      const testAccount = await Promise.race([testAccountPromise, timeoutPromise]);

      if (testAccount) {
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }
    }
  } catch (error) {
    console.warn('Mail transporter init notice:', error);
  }

  return transporter;
};

export const sendEmail = async ({ to, subject, html }: ISendEmailOptions) => {
  try {
    const activeTransporter = await getTransporter();
    if (!activeTransporter) {
      console.log(`📧 [EMAIL MOCK] To: ${to} | Subject: ${subject}`);
      return { messageId: 'mock-mail-id', preview: null };
    }

    const info = await activeTransporter.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Email sent to ${to}. Preview URL: ${previewUrl}`);
    }
    return { messageId: info.messageId, preview: previewUrl };
  } catch (error) {
    console.error('Failed to dispatch email:', error);
    // Return gracefully so user registration is not blocked if mail server is unreachable
    return { messageId: 'fallback-mail-id', preview: null };
  }
};
