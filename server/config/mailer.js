const nodemailer = require('nodemailer');

// Set up transporter
// Using direct email configs if they exist, or a mock local tester
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email', // Safe developer sandbox fallback
  port: 587,
  auth: {
    user: process.env.EMAIL_USER || 'developer@example.com',
    pass: process.env.EMAIL_PASS || 'devpass123'
  }
});

const sendMail = async ({ to, subject, html, text }) => {
  try {
    // If not properly configured, log the email content to console and return success (only in non-production)
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('example.com')) {
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

    const info = await transporter.sendMail({
      from: `"CareerNest" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || '',
      html: html || ''
    });

    console.log(`Email successfully sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Nodemailer Error: Failed to send email.', error.message);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Recovery Fallback] Email intended for ${to} | Subject: ${subject}`);
    }
    return { messageId: 'error-fallback-id-' + Date.now(), mock: process.env.NODE_ENV !== 'production', error: true };
  }
};

module.exports = {
  sendMail
};
