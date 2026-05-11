require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOTP = async (email, otp) => {
  console.log(`--- MAILER: Sending OTP to ${email} ---`);
  try {
    const mailOptions = {
      from: `"NestC Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'NestC - Verify Your NITC Email',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
          <h2 style="color: #0f4c81; text-align: center;">Welcome to NestC</h2>
          <p>Hello student,</p>
          <p>Use the 6-digit OTP below to verify your email address:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #2E75B6;">${otp}</span>
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p style="color: #666; font-size: 12px; margin-top: 40px;">
            If you didn't request this, you can safely ignore this email.<br>
            NestC — Your Campus, Your Home.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent successfully to ${email}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send OTP to ${email}:`, err);
    return false;
  }
};

const sendChatNotification = async (email, senderName, messageContent, productInfo, chatId) => {
  console.log(`--- MAILER: Sending Chat Notification to ${email} ---`);
  try {
    const productHtml = productInfo ? `
      <div style="margin: 20px 0; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Regarding Product</p>
        <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #1e293b;">${productInfo.title}</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #2E75B6; font-weight: bold;">₹${productInfo.price}</p>
      </div>
    ` : '';

    const mailOptions = {
      from: `"NestC Marketplace" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `New Enquiry from ${senderName} - NestC`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; color: #334155;">
          <h2 style="color: #0f4c81; margin-top: 0;">New Message Received</h2>
          <p>Hi there,</p>
          <p><strong>${senderName}</strong> has sent you a new message on NestC Marketplace:</p>
          
          ${productHtml}

          <div style="background: #f1f5f9; padding: 20px; border-left: 4px solid #2E75B6; border-radius: 4px; margin: 20px 0; font-style: italic;">
            "${messageContent}"
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/chat?chatId=${chatId}" 
               style="background: #2E75B6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Open Chat to Reply
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0 20px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">NestC — Your Campus, Your Home.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Chat notification email sent to ${email}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send chat email to ${email}:`, err);
    return false;
  }
};

module.exports = { sendOTP, sendChatNotification };