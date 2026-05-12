require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_SECURE === 'true' || true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  pool: true, // Use pooling for better performance
  maxConnections: 5,
  maxMessages: 100
});
 
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Mailer connection error:', error.message);
  } else {
    console.log('🚀 Mailer is ready (Host: ' + (process.env.EMAIL_HOST || 'Gmail') + ')');
  }
});

const sendOTP = async (email, otp) => {
  console.log(`--- MAILER: Sending OTP to ${email} ---`);
  try {
    const mailOptions = {
      from: `"NestC Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your NestC Verification Code: ${otp}`, // Added OTP to subject to help users see it instantly
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2E75B6; margin: 0; font-size: 28px; font-weight: 800;">NestC</h1>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Campus Marketplace</p>
          </div>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello Student,</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Welcome to NestC! Use the verification code below to complete your registration and start trading on campus.</p>
          
          <div style="background: #f8fbff; padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0; border: 1px dashed #2E75B6;">
            <span style="font-size: 42px; font-weight: 900; letter-spacing: 8px; color: #2E75B6; display: block;">${otp}</span>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center;">This code is valid for <b>10 minutes</b>. Please do not share it with anyone.</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 12px; line-height: 1.5;">
              If you didn't request this code, you can safely ignore this email.<br>
              &copy; ${new Date().getFullYear()} NestC NITC. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent successfully to ${email}`);
    return true;
  } catch (err) {
    console.error(`❌ FAILED TO SEND OTP TO ${email}:`, err.message);
    console.error(`📋 ERROR DETAILS:`, err.code, err.command);
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

    console.log(`📧 Preparing to send mail to ${email} with subject: ${mailOptions.subject}`);
    await transporter.sendMail(mailOptions);
    console.log(`✅ Chat notification email sent successfully to ${email}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send chat email to ${email}:`, err);
    console.error('🔍 Full Error Stack:', err.stack);
    return false;
  }
};

module.exports = { sendOTP, sendChatNotification };