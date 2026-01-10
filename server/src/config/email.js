import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import pico from 'picocolors';

dotenv.config();

let transporter = null;
let is_ethereal = false;

/**
 * Initialize email transporter
 * Falls back to Ethereal test account if SMTP credentials not configured
 */
export async function init_email_transporter() {
  try {
    const smtp_user = process.env.SMTP_USER;
    const smtp_password = process.env.SMTP_PASSWORD;
    const smtp_host = process.env.SMTP_HOST;

    // Check if SMTP is configured
    if (
      !smtp_user ||
      !smtp_password ||
      !smtp_host ||
      smtp_user === 'your-email@gmail.com' ||
      smtp_password === 'your-app-password'
    ) {
      console.log(
        pico.yellow('⚠️  SMTP not configured, creating Ethereal test account...')
      );

      // Create Ethereal test account for development
      const test_account = await nodemailer.createTestAccount();

      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: test_account.user,
          pass: test_account.pass,
        },
      });

      is_ethereal = true;
      console.log(
        pico.bgYellow(
          pico.bold(
            ` 📧 Email using Ethereal test account: ${test_account.user} `
          )
        )
      );
      console.log(
        pico.yellow(`   View sent emails at: https://ethereal.email/messages`)
      );
    } else {
      // Use configured SMTP
      transporter = nodemailer.createTransport({
        host: smtp_host,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtp_user,
          pass: smtp_password,
        },
      });

      is_ethereal = false;
      console.log(pico.bgGreen(pico.bold(' 📧 Email configured with SMTP ')));
    }

    // Verify transporter
    await transporter.verify();
    console.log(pico.green('✅ Email transporter ready'));

    return transporter;
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(
      pico.red('❌ Email transporter initialization failed:'),
      error_message
    );
    throw error;
  }
}

/**
 * Get email transporter
 */
export async function get_transporter() {
  if (!transporter) {
    await init_email_transporter();
  }
  return transporter;
}

/**
 * Send email using Nodemailer
 * @param {Object} options - Email options
 * @returns {Promise<Object>} - Send result with messageId
 */
export async function send_email(options) {
  const {
    to,
    subject,
    text,
    html,
    from_name = process.env.EMAIL_FROM_NAME || 'Wayback Public Library',
    from_address = process.env.EMAIL_FROM_ADDRESS || 'library@wayback.org',
  } = options;

  const mail_options = {
    from: `"${from_name}" <${from_address}>`,
    to,
    subject,
    text,
    html: html || text, // Fallback to text if no HTML
  };

  const transport = await get_transporter();
  const info = await transport.sendMail(mail_options);

  // If using Ethereal, log preview URL
  if (is_ethereal) {
    const preview_url = nodemailer.getTestMessageUrl(info);
    if (preview_url) {
      console.log(pico.cyan(`   Preview URL: ${preview_url}`));
    }
  }

  return info;
}

/**
 * Check if email system is using test account
 */
export function is_using_test_account() {
  return is_ethereal;
}
