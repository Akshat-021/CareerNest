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
    // If not properly configured, log the email content to console and return success
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('example.com')) {
      console.log('=============== MOCK EMAIL SENT ===============');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:\n${text || html}`);
      console.log('================================================');
      return { messageId: 'mock-id-' + Date.now(), mock: true };
    }

    const info = await transporter.sendMail({
      from: `"AI Mentor Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || '',
      html: html || ''
    });

    console.log(`Email successfully sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Nodemailer Error: Failed to send email.', error.message);
    // Silent recovery so registration / action is not blocked during development
    console.log(`[Recovery Fallback] Email intended for ${to} | Subject: ${subject}`);
    return { messageId: 'error-fallback-id-' + Date.now(), mock: true };
  }
};

module.exports = {
  sendMail
};
