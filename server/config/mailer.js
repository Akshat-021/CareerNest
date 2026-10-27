const nodemailer = require('nodemailer');

/**
 * Creates or retrieves the nodemailer transporter based on environment configuration.
 * Automatically configures Gmail service when using @gmail.com addresses.
 */
const createTransporter = () => {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');

  // Explicit service override (e.g. EMAIL_SERVICE=gmail)
  if (process.env.EMAIL_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: { user, pass }
    });
  }

  // Automatic Gmail detection
  if (user.endsWith('@gmail.com') || user.endsWith('@googlemail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }

  // Custom SMTP host/port configuration
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true' || Number(process.env.EMAIL_PORT) === 465,
      auth: { user, pass }
    });
  }

  // Safe developer sandbox fallback
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: user || 'developer@example.com',
      pass: pass || 'devpass123'
    }
  });
};

const sendMail = async ({ to, subject, html, text }) => {
  try {
    const user = (process.env.EMAIL_USER || '').trim();

    // If not properly configured, log the email content to console and return success (only in non-production)
    if (!user || user.includes('example.com')) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('=============== MOCK EMAIL SENT ===============');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body:\n${text || html}`);
        console.log('================================================');
      } else {
        const maskedTo = to ? to.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'unknown';
        console.warn(`[Production Notice] SMTP (EMAIL_USER) is not configured. Email to ${maskedTo} was not dispatched.`);
      }
      return { messageId: 'mock-id-' + Date.now(), mock: process.env.NODE_ENV !== 'production' };
    }

    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"CareerNest" <${user}>`,
      to,
      subject,
      text: text || '',
      html: html || ''
    });

    console.log(`Email successfully sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Nodemailer Error: Failed to send email.', error.message);
    if (error.code === 'EAUTH') {
      console.error(
        '[SMTP Authentication Failed] For Gmail, ensure 2-Step Verification is enabled and you are using a 16-character Google App Password (not your primary account password).'
      );
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Recovery Fallback] Email intended for ${to} | Subject: ${subject}`);
    }
    return { messageId: 'error-fallback-id-' + Date.now(), mock: process.env.NODE_ENV !== 'production', error: true };
  }
};

module.exports = {
  sendMail,
  createTransporter
};
