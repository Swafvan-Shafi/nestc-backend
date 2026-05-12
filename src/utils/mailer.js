require('dotenv').config();
const Brevo = require('@getbrevo/brevo');

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

const FROM_EMAIL = process.env.EMAIL_USER || 'noreply@nestc.in';
const FROM_NAME = 'NestC';

const sendOTP = async (email, otp) => {
  console.log(`--- MAILER: Sending OTP to ${email} ---`);
  try {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.subject = `Your NestC Verification Code: ${otp}`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2E75B6; margin: 0; font-size: 28px; font-weight: 800;">NestC</h1>
          <p style="color: #666; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Campus Marketplace</p>
        </div>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello Student,</p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">Use the verification code below to complete your registration.</p>
        <div style="background: #f8fbff; padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0; border: 1px dashed #2E75B6;">
          <span style="font-size: 42px; font-weight: 900; letter-spacing: 8px; color: #2E75B6; display: block;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">Valid for <b>10 minutes</b>. Do not share it.</p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #999; font-size: 12px;">&copy; ${new Date().getFullYear()} NestC NITC. All rights reserved.</p>
        </div>
      </div>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ OTP sent successfully to ${email}`);
    return true;
  } catch (err) {
    console.error(`❌ FAILED TO SEND OTP TO ${email}:`, err.message);
    return false;
  }
};

const sendChatNotification = async (email, senderName, messageContent, productInfo, chatId) => {
  console.log(`--- MAILER: Sending Chat Notification to ${email} ---`);
  try {
    const productHtml = productInfo ? `
      <div style="margin: 20px 0; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold;">Regarding Product</p>
        <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #1e293b;">${productInfo.title}</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #2E75B6; font-weight: bold;">₹${productInfo.price}</p>
      </div>
    ` : '';

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { name: 'NestC Marketplace', email: FROM_EMAIL };
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.subject = `New Enquiry from ${senderName} - NestC`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; color: #334155;">
        <h2 style="color: #0f4c81; margin-top: 0;">New Message Received</h2>
        <p><strong>${senderName}</strong> sent you a message on NestC Marketplace:</p>
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
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0 20px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">NestC — Your Campus, Your Home.</p>
      </div>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Chat notification sent to ${email}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send chat email to ${email}:`, err.message);
    return false;
  }
};

module.exports = { sendOTP, sendChatNotification };
