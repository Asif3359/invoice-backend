/**
 * Email Service Utility
 *
 * Implements email functionality using Nodemailer
 * Supports multiple SMTP providers:
 * - Gmail
 * - Outlook/Hotmail
 * - Custom SMTP servers
 * - Mailtrap (for testing)
 */

const nodemailer = require("nodemailer");

/**
 * Create email transporter based on environment configuration
 */
const createTransporter = () => {
  // Check if email is configured
  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS
  ) {
    console.warn(
      "⚠️ Email not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env"
    );
    return null;
  }

  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  // Add TLS configuration if needed
  if (process.env.EMAIL_TLS_REJECT_UNAUTHORIZED === "false") {
    config.tls = {
      rejectUnauthorized: false,
    };
  }

  return nodemailer.createTransport(config);
};

/**
 * Email verification HTML template
 */
const getVerificationEmailTemplate = (verificationUrl, userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Invoice App</h1>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Verify Your Email Address</h2>
                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                    Hi${userName ? " " + userName : ""},
                  </p>
                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                    Thank you for registering with Invoice App! Please verify your email address by clicking the button below. This will open the Invoice App on your mobile device.
                  </p>
                  
                  <!-- Button -->
                  <table role="presentation" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${verificationUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">📱 Open App & Verify</a>
                      </td>
                    </tr>
                  </table>
                  
                  <div style="margin: 20px 0; padding: 15px; background-color: #e7f3ff; border-left: 4px solid #2196F3; border-radius: 4px;">
                    <p style="margin: 0 0 10px; color: #1565c0; font-size: 14px; line-height: 1.5;">
                      📱 <strong>Mobile App Link:</strong> Tap the button above to open the Invoice App and verify your email automatically.
                    </p>
                    <p style="margin: 10px 0 0; color: #1565c0; font-size: 12px; line-height: 1.5;">
                      <strong>Note:</strong> This button works on mobile devices. If you're viewing this on a web browser, please open this email on your mobile device or copy the link below.
                    </p>
                  </div>
                  
                  <div style="margin: 20px 0; padding: 12px; background-color: #f5f5f5; border-radius: 4px;">
                    <p style="margin: 0 0 8px; color: #666666; font-size: 13px; font-weight: bold;">
                      Alternative: Copy this link
                    </p>
                    <p style="margin: 0; color: #667eea; font-size: 12px; word-break: break-all; font-family: monospace;">
                      ${verificationUrl}
                    </p>
                  </div>
                  
                  <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                    If you didn't create an account with Invoice App, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #999999; font-size: 12px;">
                    © ${new Date().getFullYear()} Invoice App. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Password reset HTML template
 */
const getPasswordResetEmailTemplate = (resetUrl, userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Invoice App</h1>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Reset Your Password</h2>
                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                    Hi${userName ? " " + userName : ""},
                  </p>
                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                    We received a request to reset your password for your Invoice App account. Click the button below to open the app and create a new password.
                  </p>
                  
                  <!-- Button -->
                  <table role="presentation" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">📱 Open App & Reset</a>
                      </td>
                    </tr>
                  </table>
                  
                  <div style="margin: 20px 0; padding: 15px; background-color: #e7f3ff; border-left: 4px solid #2196F3; border-radius: 4px;">
                    <p style="margin: 0 0 10px; color: #1565c0; font-size: 14px; line-height: 1.5;">
                      📱 <strong>Mobile App Link:</strong> Tap the button above to open the Invoice App and reset your password.
                    </p>
                    <p style="margin: 10px 0 0; color: #1565c0; font-size: 12px; line-height: 1.5;">
                      <strong>Note:</strong> This button works on mobile devices. If you're viewing this on a web browser, please open this email on your mobile device or copy the link below.
                    </p>
                  </div>
                  
                  <div style="margin: 20px 0; padding: 12px; background-color: #f5f5f5; border-radius: 4px;">
                    <p style="margin: 0 0 8px; color: #666666; font-size: 13px; font-weight: bold;">
                      Alternative: Copy this link
                    </p>
                    <p style="margin: 0; color: #667eea; font-size: 12px; word-break: break-all; font-family: monospace;">
                      ${resetUrl}
                    </p>
                  </div>
                  
                  <div style="margin: 20px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                    <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                      <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour for your security.
                    </p>
                  </div>
                  
                  <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                    If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #999999; font-size: 12px;">
                    © ${new Date().getFullYear()} Invoice App. All rights reserved.
                  </p>
                  <p style="margin: 10px 0 0; color: #999999; font-size: 12px;">
                    This is an automated message, please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Send verification email
 * @param {String} email - Recipient email
 * @param {String} token - Verification token
 * @param {String} userName - User's name (optional)
 */
const sendVerificationEmail = async (email, token, userName = "") => {
  const transporter = createTransporter();

  // For mobile apps, use deep links instead of web URLs
  // Format: myapp://verify-email?token=xxx
  const appScheme = process.env.APP_SCHEME || "invoiceapp";
  const verificationUrl = `${appScheme}://verify-email?token=${token}`;

  if (!transporter) {
    // Email not configured, just log
    console.log("📧 [DEV MODE] Verification email would be sent to:", email);
    console.log("🔗 Verification Deep Link:", verificationUrl);
    console.log("📱 This link will open your mobile app");
    return { success: true, mode: "development" };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "Invoice App"}" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "Verify Your Email - Invoice App",
      html: getVerificationEmailTemplate(verificationUrl, userName),
      text: `Hi${
        userName ? " " + userName : ""
      },\n\nThank you for registering with Invoice App! Please verify your email address by clicking this link:\n\n${verificationUrl}\n\nThis link will open the Invoice App on your device.\n\nIf you didn't create an account, you can safely ignore this email.`,
    });

    console.log("✅ Verification email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Failed to send verification email:", error.message);
    throw new Error("Failed to send verification email");
  }
};

/**
 * Send password reset email
 * @param {String} email - Recipient email
 * @param {String} token - Reset token
 * @param {String} userName - User's name (optional)
 */
const sendPasswordResetEmail = async (email, token, userName = "") => {
  const transporter = createTransporter();

  // For mobile apps, use deep links instead of web URLs
  // Format: myapp://reset-password?token=xxx
  const appScheme = process.env.APP_SCHEME || "invoiceapp";
  const resetUrl = `${appScheme}://reset-password?token=${token}`;

  if (!transporter) {
    // Email not configured, just log
    console.log("📧 [DEV MODE] Password reset email would be sent to:", email);
    console.log("🔗 Reset Deep Link:", resetUrl);
    console.log("📱 This link will open your mobile app");
    return { success: true, mode: "development" };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "Invoice App"}" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "Reset Your Password - Invoice App",
      html: getPasswordResetEmailTemplate(resetUrl, userName),
      text: `Hi${
        userName ? " " + userName : ""
      },\n\nWe received a request to reset your password. Click this link to reset it:\n\n${resetUrl}\n\nThis link will open the Invoice App on your device and will expire in 1 hour for security.\n\nIf you didn't request this, please ignore this email.`,
    });

    console.log("✅ Password reset email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error.message);
    throw new Error("Failed to send password reset email");
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
