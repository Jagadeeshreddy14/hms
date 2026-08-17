const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER;
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, ''); // strip any spaces

  if (user && pass) {
    return nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL on port 465 is most reliable on Render/Cloud hosts
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return null;
};

exports.sendOtpEmail = async (to, otp, purpose = 'registration') => {
  const fromName = process.env.SMTP_FROM_NAME || 'Sri Srinivasa Boys Hostel';
  const title = purpose === 'password_reset' ? 'Password Reset Code' : 'Email Verification Code';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #059669, #0d9488); padding: 30px 20px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
          .content { padding: 30px 25px; text-align: center; }
          .otp-box { background: #ecfdf5; border: 2px dashed #059669; border-radius: 12px; padding: 18px; margin: 25px 0; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #065f46; font-family: monospace; }
          .note { font-size: 13px; color: #64748b; line-height: 1.6; }
          .footer { background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${fromName}</h1>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">${title}</h2>
            <p style="font-size: 14px; color: #475569;">Use the one-time password below to complete your verification:</p>
            <div class="otp-box">${otp}</div>
            <p class="note">This OTP is valid for <strong>10 minutes</strong>. If you did not request this verification, please ignore this email.</p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} ${fromName}. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. Prioritize Resend API (HTTP REST - 100% reliable on Cloud/Render, zero port/firewall issues)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`🚀 [RESEND API] Sending OTP email to recipient domain: ${to.split('@')[1] || 'domain'}`);
      const resend = new Resend(process.env.RESEND_API_KEY);
      const resendFrom = process.env.RESEND_FROM || `${fromName} <onboarding@resend.dev>`;

      const response = await resend.emails.send({
        from: resendFrom,
        to: [to],
        subject: `Your Verification Code: ${otp} - ${fromName}`,
        html: htmlContent,
      });

      if (response.error) {
        console.error(`❌ Resend API Error:`, response.error.message);
        throw new Error(response.error.message);
      }

      console.log(`✓ [RESEND API] OTP email successfully sent via HTTPS. ID: ${response.data?.id}`);
      return { success: true, messageId: response.data?.id };
    } catch (resendErr) {
      console.warn(`⚠️ Resend API failed (${resendErr.message}), falling back to SMTP...`);
    }
  }

  // 2. Fallback to Nodemailer SMTP (Gmail / Custom SMTP)
  const transporter = createTransporter();
  if (transporter) {
    try {
      console.log(`📧 [SMTP] Dispatching OTP email to recipient domain: ${to.split('@')[1] || 'domain'}`);
      const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject: `Your Verification Code: ${otp} - ${fromName}`,
        text: `Your ${fromName} verification code is ${otp}. It expires in 10 minutes.`,
        html: htmlContent,
      });
      console.log(`✓ [SMTP] OTP email accepted by server. MessageID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ SMTP Provider Error:`, err.message);
      return { success: false, error: err.message };
    }
  }

  console.warn(`⚠️ [EMAIL NOT CONFIGURED] Neither RESEND_API_KEY nor SMTP credentials found.`);
  return { success: false, error: 'Email service is not configured on the server' };
};
