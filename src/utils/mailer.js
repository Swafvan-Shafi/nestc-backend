const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"NestC Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'NestC - Verify Your NITC Email',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #0f4c81; text-align: center;">Welcome to NestC</h2>
        <p>Hello student,</p>
        <p>Thank you for registering with NestC. Use the 6-digit OTP below to verify your email address:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #2E75B6;">${otp}</span>
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p style="color: #666; font-size: 12px; margin-top: 40px;">
          If you didn't request this, you can safely ignore this email.<br>
          NestC — Your Campus, Your Home.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent successfully to ${email}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send OTP to ${email}:`, err.message);
    throw new Error('Could not send verification email. Please check server configuration.');
  }
};

const sendChatNotification = async (email, senderName, messageContent) => {
  const mailOptions = {
    from: `"NestC Marketplace" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `New Message from ${senderName} on NestC`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #0f4c81; text-align: center;">New Marketplace Enquiry</h2>
        <p>Hello,</p>
        <p><strong>${senderName}</strong> has sent you a new message on NestC Marketplace:</p>
        <div style="background: #f4f4f4; padding: 20px; border-left: 4px solid #2E75B6; border-radius: 5px; margin: 20px 0; font-style: italic;">
          "${messageContent}"
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://127.0.0.1:3000/chat" style="background: #2E75B6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">Reply on NestC</a>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 40px;">
          NestC — Your Campus, Your Home.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Chat notification email sent to ${email}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send chat email to ${email}:`, err.message);
    return false;
  }
};

module.exports = { sendOTP, sendChatNotification };
