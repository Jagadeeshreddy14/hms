const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

exports.sendOtpEmail = async (to, otp, purpose = 'registration') => {
  const transporter = createTransporter();
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
            <h1>Smart Hostel Management</h1>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">${title}</h2>
            <p style="font-size: 14px; color: #475569;">Use the one-time password below to complete your verification:</p>
            <div class="otp-box">${otp}</div>
            <p class="note">This OTP is valid for <strong>10 minutes</strong>. If you did not request this verification, please ignore this email.</p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Smart Hostel Management System. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  if (transporter) {
    try {
      const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
      const info = await transporter.sendMail({
        from: `"Smart Hostel" <${fromEmail}>`,
        to,
        subject: `Your Verification Code: ${otp} - Smart Hostel`,
        text: `Your Smart Hostel verification code is ${otp}. It expires in 10 minutes.`,
        html: htmlContent,
      });
      console.log(`📧 OTP email sent to ${to}: MessageID ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ SMTP Email Error:`, err.message);
      console.log(`ℹ️ [DEV/FALLBACK OTP for ${to}]: ${otp}`);
      return { success: false, error: err.message, devOtp: otp };
    }
  } else {
    console.log(`ℹ️ [SMTP NOT CONFIGURED] Generated OTP for ${to}: ${otp}`);
    return { success: true, isDev: true, devOtp: otp };
  }
};
