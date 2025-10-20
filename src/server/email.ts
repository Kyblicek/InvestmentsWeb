import nodemailer from 'nodemailer';
import { env, isEmailConfigured } from './env';
import { logger } from './logger';

let transporter: nodemailer.Transporter | undefined;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: Number(env.SMTP_PORT) === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASSWORD,
          }
        : undefined,
  });
}

export async function sendEmail(options: { to: string; subject: string; html: string; text: string }) {
  if (!transporter || !env.EMAIL_FROM) {
    logger.warn('Email transport not configured. Skipping email send.');
    return false;
  }

  const recipient =
    env.SMTP_TEST_RECIPIENT && env.SMTP_TEST_RECIPIENT.length > 0 ? env.SMTP_TEST_RECIPIENT : options.to;

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: recipient,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    logger.info('Email sent', { to: recipient, subject: options.subject });
    return true;
  } catch (error) {
    logger.error('Failed to send email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to: recipient,
      subject: options.subject,
    });
    return false;
  }
}
