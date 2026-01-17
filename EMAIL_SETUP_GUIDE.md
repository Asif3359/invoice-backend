# Email Setup Guide (Mobile App)

## ✅ Email Functionality Implemented

The Invoice App backend now has full email functionality for your **mobile app** (Expo/React Native):
- ✅ **Email Verification** - Send verification emails when users register
- ✅ **Password Reset** - Send password reset links with deep links
- ✅ **Professional HTML Templates** - Beautiful, responsive email designs
- ✅ **Mobile Deep Links** - Opens your mobile app directly from email
- ✅ **Development Mode** - Works without email config (logs to console)
- ✅ **Production Ready** - Supports multiple SMTP providers

📱 **Note:** Emails contain deep links (e.g., `invoiceapp://verify-email?token=xxx`) that open your mobile app, not web URLs.

---

## 📦 Installation

Nodemailer has been installed:
```bash
npm install nodemailer
```

---

## 🔧 Configuration

### Step 1: Add Email Variables to `.env`

Add these variables to your `.env` file:

```env
# ============================================
# EMAIL CONFIGURATION
# ============================================

# SMTP Server Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Sender Information
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Invoice App

# Mobile App Scheme (must match app.json scheme)
APP_SCHEME=invoiceapp

# Optional: TLS Configuration
EMAIL_TLS_REJECT_UNAUTHORIZED=false
```

---

## 📧 Email Provider Setup

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Step Verification**
   - Go to [Google Account Settings](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Create App Password**
   - Visit [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Copy the generated 16-character password

3. **Configure `.env`**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=yourname@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx  # Your app password
   EMAIL_FROM=yourname@gmail.com
   EMAIL_FROM_NAME=Invoice App
   ```

### Option 2: Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=yourname@outlook.com
EMAIL_PASS=your-password
EMAIL_FROM=yourname@outlook.com
EMAIL_FROM_NAME=Invoice App
```

### Option 3: Mailtrap (Testing)

Perfect for development testing without sending real emails:

1. **Sign up** at [Mailtrap.io](https://mailtrap.io/)
2. **Get credentials** from your inbox
3. **Configure `.env`**
   ```env
   EMAIL_HOST=smtp.mailtrap.io
   EMAIL_PORT=2525
   EMAIL_SECURE=false
   EMAIL_USER=your-mailtrap-username
   EMAIL_PASS=your-mailtrap-password
   EMAIL_FROM=noreply@invoiceapp.com
   EMAIL_FROM_NAME=Invoice App
   ```

### Option 4: SendGrid (Production)

1. **Sign up** at [SendGrid](https://sendgrid.com/)
2. **Create API Key**
3. **Configure `.env`**
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASS=SG.your-api-key-here
   EMAIL_FROM=verified@yourdomain.com
   EMAIL_FROM_NAME=Invoice App
   ```

### Option 5: Custom SMTP Server

```env
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Invoice App
```

---

## 🎨 Email Templates

### Verification Email Features
- ✅ Professional gradient header
- ✅ Clear call-to-action button
- ✅ Fallback text link
- ✅ Responsive design
- ✅ Plain text alternative

### Password Reset Email Features
- ✅ Security warning about 1-hour expiration
- ✅ Professional design
- ✅ Clear instructions
- ✅ Fallback text link
- ✅ Plain text alternative

---

## 🚀 Usage

### Email Verification (Automatic)

When a user registers, a verification email is automatically sent:

```javascript
// Happens automatically in authController.js
const user = await User.register({ email, password, fullName });
// ✅ Verification email sent automatically
```

**Email contains:**
- Deep link: `invoiceapp://verify-email?token={token}`
- Opens your mobile app directly
- Valid until manually verified
- Beautiful HTML template

### Password Reset (Automatic)

When a user requests password reset:

```javascript
// POST /auth/request-password-reset
{
  "email": "user@example.com",
  "userType": "main"  // or "sub"
}
// ✅ Reset email sent automatically
```

**Email contains:**
- Deep link: `invoiceapp://reset-password?token={token}`
- Opens your mobile app directly
- Valid for 1 hour
- Security warnings

---

## 🧪 Testing

### Development Mode (No Email Config)

If email is not configured, the system logs to console:

```bash
📧 [DEV MODE] Verification email would be sent to: user@example.com
🔗 Verification Deep Link: invoiceapp://verify-email?token=abc123...
📱 This link will open your mobile app
```

This allows development without email setup!

### Test with Mailtrap

1. Configure Mailtrap credentials
2. Register a new user
3. Check Mailtrap inbox
4. Click the verification link

### Test with Real Email

1. Configure Gmail/Outlook
2. Register with your email
3. Check your inbox
4. Verify email works

---

## 🔍 Verification Flow

```
User Registers
    ↓
Backend creates user
    ↓
Generate verification token
    ↓
Send verification email
    ↓
User taps link in email
    ↓
Mobile app opens
    ↓
App extracts token and calls API
    ↓
GET /auth/verify-email/:token
    ↓
Email verified ✅
```

---

## 🔐 Password Reset Flow

```
User requests reset
    ↓
POST /auth/request-password-reset
    ↓
Backend finds user
    ↓
Generate reset token (1 hour expiry)
    ↓
Send reset email
    ↓
User taps link in email
    ↓
Mobile app opens to reset screen
    ↓
User enters new password
    ↓
POST /auth/reset-password
    ↓
Password updated ✅
    ↓
All sessions deleted (security)
```

---

## 📊 Email Service API

### `sendVerificationEmail(email, token, userName)`

```javascript
const { sendVerificationEmail } = require('./utils/emailService');

await sendVerificationEmail(
  'user@example.com',
  'verification-token-here',
  'John Doe'  // optional
);
```

**Returns:**
```javascript
{
  success: true,
  messageId: '<unique-message-id>',
  mode: 'development' // if no email config
}
```

### `sendPasswordResetEmail(email, token, userName)`

```javascript
const { sendPasswordResetEmail } = require('./utils/emailService');

await sendPasswordResetEmail(
  'user@example.com',
  'reset-token-here',
  'John Doe'  // optional
);
```

**Returns:**
```javascript
{
  success: true,
  messageId: '<unique-message-id>',
  mode: 'development' // if no email config
}
```

---

## 🛠️ Troubleshooting

### Issue: Emails not sending

**Check:**
1. ✅ Email credentials are correct in `.env`
2. ✅ SMTP host and port are correct
3. ✅ App password generated (for Gmail)
4. ✅ 2-Step verification enabled (for Gmail)
5. ✅ Check server console for error logs

### Issue: Gmail "Less secure app access" error

**Solution:** Use App Passwords instead of regular password
1. Enable 2-Step Verification
2. Generate App Password
3. Use app password in `.env`

### Issue: Emails going to spam

**Solutions:**
- Use a verified domain email
- Configure SPF/DKIM records
- Use professional email service (SendGrid, AWS SES)
- Test with Mailtrap first

### Issue: Port 587 blocked

**Try:**
- Port 465 with `EMAIL_SECURE=true`
- Port 2525 (alternative)
- Check firewall settings

### Issue: Connection timeout

**Try:**
```env
EMAIL_TLS_REJECT_UNAUTHORIZED=false
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Use environment variables for credentials
- Use app passwords (Gmail)
- Set token expiration times
- Delete sessions after password reset
- Log email failures without exposing user info
- Use HTTPS for frontend links in production

### ❌ DON'T:
- Commit `.env` file to git
- Use plain passwords in code
- Reveal if email exists in password reset
- Use short expiration times (bad UX)
- Send sensitive data in email body

---

## 📈 Production Recommendations

### For Production Use:

1. **Use Professional Email Service**
   - SendGrid (99¢/month, 40k emails)
   - AWS SES ($0.10 per 1,000 emails)
   - Mailgun (free 5k emails/month)
   - Postmark (100 emails/month free)

2. **Configure Custom Domain**
   ```env
   EMAIL_FROM=noreply@yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

3. **Set Up SPF/DKIM**
   - Improves deliverability
   - Reduces spam classification
   - Increases trust

4. **Monitor Email Delivery**
   - Track bounce rates
   - Monitor spam complaints
   - Log delivery failures

5. **Add Email Queue** (Optional)
   - Use Bull/BullMQ for queue
   - Retry failed emails
   - Handle high volume

---

## 📝 Environment Variables Summary

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_HOST` | Yes | - | SMTP server hostname |
| `EMAIL_PORT` | No | 587 | SMTP port (587, 465, 2525) |
| `EMAIL_SECURE` | No | false | Use SSL/TLS (true for port 465) |
| `EMAIL_USER` | Yes | - | SMTP username |
| `EMAIL_PASS` | Yes | - | SMTP password/app password |
| `EMAIL_FROM` | No | EMAIL_USER | Sender email address |
| `EMAIL_FROM_NAME` | No | Invoice App | Sender name |
| `APP_SCHEME` | No | invoiceapp | App scheme for deep links |
| `EMAIL_TLS_REJECT_UNAUTHORIZED` | No | true | TLS verification |

---

## 🎯 Quick Start Checklist

- [ ] Install nodemailer (`npm install nodemailer`)
- [ ] Choose email provider (Gmail, Outlook, Mailtrap, etc.)
- [ ] Get SMTP credentials
- [ ] Add credentials to `.env`
- [ ] Set `APP_SCHEME` in `.env` (must match your app.json)
- [ ] Restart backend server
- [ ] Configure deep linking in mobile app (see MOBILE_EMAIL_DEEP_LINKING.md)
- [ ] Test registration → Check email
- [ ] Test password reset → Check email
- [ ] Verify links work correctly
- [ ] ✅ Email system ready!

---

## 📚 Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Mailtrap Guide](https://mailtrap.io/blog/nodemailer-gmail/)
- [SendGrid Node.js Guide](https://docs.sendgrid.com/for-developers/sending-email/nodejs-code-example)
- [Email Testing Best Practices](https://mailtrap.io/blog/email-testing/)

---

## 🎉 Success!

Your Invoice App now has professional email functionality! Users will receive:
- 📧 Beautiful verification emails when they register
- 🔐 Secure password reset emails when needed
- 📱 Deep links that open your mobile app directly
- ✨ Professional branding with responsive design
- 🚀 Production-ready email system

**Next Step:** See **MOBILE_EMAIL_DEEP_LINKING.md** for mobile app configuration!

**Email implementation date:** January 17, 2026  
**Status:** 🟢 **Production Ready (Mobile)**
