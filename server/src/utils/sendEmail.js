const { getTransporter } = require('../config/email');
const config = require('../config/env');

/**
 * Send an email
 * @param {object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} [options.text]
 */
const sendEmail = async ({ to, subject, html, text }) => {
  // In development, log emails instead of sending if credentials not configured
  if (config.env === 'development' && !config.email.user) {
    console.log('\n📧 [DEV] Email would be sent:');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Content: ${text || 'HTML email'}\n`);
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
    text,
  });
};

/**
 * Email templates
 */
const emailTemplates = {
  verifyEmail: (name, otp) => ({
    subject: 'Verify Your Email — LMS Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">LMS Platform</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Learning Without Limits</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 48px;">
                  <h2 style="color:#1e293b;margin:0 0 16px;font-size:22px;">Verify Your Email</h2>
                  <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">
                    Hi ${name},<br><br>
                    Welcome to the LMS Platform! Please use the OTP below to verify your email address.
                  </p>
                  <div style="background:#f1f5ff;border:2px dashed #3b82f6;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
                    <p style="color:#64748b;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Your OTP Code</p>
                    <span style="font-size:36px;font-weight:800;color:#1e40af;letter-spacing:8px;">${otp}</span>
                    <p style="color:#94a3b8;font-size:12px;margin:12px 0 0;">This code expires in <strong>10 minutes</strong></p>
                  </div>
                  <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;">If you didn't create an account, please ignore this email.</p>
                </td>
              </tr>
              <tr>
                <td style="background:#f8fafc;padding:20px 48px;border-top:1px solid #e2e8f0;">
                  <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">© 2024 LMS Platform. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
    text: `Hi ${name}, your OTP is: ${otp}. It expires in 10 minutes.`,
  }),

  resetPassword: (name, otp) => ({
    subject: 'Reset Your Password — LMS Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">LMS Platform</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 48px;">
                  <h2 style="color:#1e293b;margin:0 0 16px;font-size:22px;">Reset Your Password</h2>
                  <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">
                    Hi ${name},<br><br>
                    We received a request to reset your password. Use the OTP below:
                  </p>
                  <div style="background:#fff1f2;border:2px dashed #ef4444;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
                    <p style="color:#64748b;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Reset OTP</p>
                    <span style="font-size:36px;font-weight:800;color:#dc2626;letter-spacing:8px;">${otp}</span>
                    <p style="color:#94a3b8;font-size:12px;margin:12px 0 0;">Expires in <strong>10 minutes</strong></p>
                  </div>
                  <p style="color:#94a3b8;font-size:13px;">If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
                </td>
              </tr>
              <tr>
                <td style="background:#f8fafc;padding:20px 48px;border-top:1px solid #e2e8f0;">
                  <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">© 2024 LMS Platform. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
    text: `Hi ${name}, your password reset OTP is: ${otp}. It expires in 10 minutes.`,
  }),

  welcomeEmail: (name) => ({
    subject: 'Welcome to LMS Platform!',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Welcome to LMS Platform!</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 48px;text-align:center;">
                  <h2 style="color:#1e293b;margin:0 0 16px;font-size:22px;">🎉 You're all set, ${name}!</h2>
                  <p style="color:#64748b;font-size:15px;line-height:1.6;">
                    Your account has been verified. Start exploring our courses and begin your learning journey today!
                  </p>
                  <a href="${config.clientUrl}/courses" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;margin:24px 0;">
                    Explore Courses
                  </a>
                </td>
              </tr>
              <tr>
                <td style="background:#f8fafc;padding:20px 48px;border-top:1px solid #e2e8f0;">
                  <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">© 2024 LMS Platform. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
    text: `Welcome ${name}! Your account is verified. Start learning at ${config.clientUrl}`,
  }),
};

module.exports = { sendEmail, emailTemplates };
