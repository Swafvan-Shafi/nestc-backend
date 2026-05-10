const { TransactionalEmailsApi, SendSmtpEmail } = require('@getbrevo/brevo');
require('dotenv').config();

let apiInstance = new TransactionalEmailsApi();
let apiKey = apiInstance.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const sendOTP = async (email, otp) => {
  const sendSmtpEmail = new SendSmtpEmail();

  sendSmtpEmail.subject = 'NestC - Verify Your NITC Email';
  sendSmtpEmail.to = [{ email }];
  sendSmtpEmail.sender = { name: 'NestC Support', email: 'nestnitc@gmail.com' };
  sendSmtpEmail.htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
      <h2 style="color: #0f4c81; text-align: center;">Welcome to NestC</h2>
      <p>Hello student,</p>
      <p>Thank you for registering with NestC. Use the 6-digit OTP below to verify your email address:</p>
      <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #2E75B6;">${otp}</span>
      </div>
      <p>This code will expire in 5 minutes.</p>
      <p style="color: #666; font-size: 12px; margin-top: 40px;">
        If you didn't request this, you can safely ignore this email.<br>
        NestC — Your Campus, Your Home.
      </p>
    </div>
  `;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ OTP sent successfully to ${email}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send OTP to ${email}:`, err.message);
    throw new Error('Could not send verification email. Please check server configuration.');
  }
};

const sendChatNotification = async (email, senderName, messageContent) => {
  const sendSmtpEmail = new SendSmtpEmail();

  sendSmtpEmail.subject = `New Message from ${senderName} on NestC`;
  sendSmtpEmail.to = [{ email }];
  sendSmtpEmail.sender = { name: 'NestC Marketplace', email: 'nestnitc@gmail.com' };
  sendSmtpEmail.htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
      <h2 style="color: #0f4c81; text-align: center;">New Marketplace Enquiry</h2>
      <p>Hello,</p>
      <p><strong>${senderName}</strong> has sent you a new message on NestC Marketplace:</p>
      <div style="background: #f4f4f4; padding: 20px; border-left: 4px solid #2E75B6; border-radius: 5px; margin: 20px 0; font-style: italic;">
        "${messageContent}"
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 40px;">
        NestC — Your Campus, Your Home.
      </p>
    </div>
  `;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Chat notification email sent to ${email}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send chat email to ${email}:`, err.message);
    return false;
  }
};

module.exports = { sendOTP, sendChatNotification };