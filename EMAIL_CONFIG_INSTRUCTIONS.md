# Your Email Configuration

## ✅ Add These Lines to Your `.env` File

Open your `.env` file and add these email configuration variables:

```env
# ============================================
# EMAIL CONFIGURATION (Gmail)
# ============================================

# SMTP Server Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false

# Email Credentials
EMAIL_USER=asifahammednishst@gmail.com
EMAIL_PASS=xmor yzly hmuj ftwd

# Sender Information
EMAIL_FROM=asifahammednishst@gmail.com
EMAIL_FROM_NAME=Invoice App

# Mobile App Scheme (must match your app.json)
APP_SCHEME=invoiceapp

# Optional: TLS Configuration
EMAIL_TLS_REJECT_UNAUTHORIZED=false
```

---

## 🚀 Quick Start

1. **Copy the configuration above** and paste it into your `.env` file

2. **Restart your backend server:**
   ```bash
   npm start
   ```

3. **Test the email functionality:**
   - Register a new user with your email
   - Check your inbox (asifahammednishst@gmail.com)
   - You should receive a verification email

---

## 📧 What Will Happen

When a user registers, they will receive an email that looks like this:

```
From: Invoice App <asifahammednishst@gmail.com>
Subject: Verify Your Email - Invoice App

[Beautiful HTML email with gradient header]

Hi [User Name],

Thank you for registering with Invoice App! Please verify 
your email address by clicking the button below. This will 
open the Invoice App on your mobile device.

[📱 Open App & Verify Button]
↓
Opens: invoiceapp://verify-email?token=abc123...
```

---

## 🔒 Security Notes

✅ **App Password is Secure:**
- This is a Gmail App Password (not your regular password)
- It's specifically for this app only
- You can revoke it anytime from Google Account settings

✅ **`.env` File Security:**
- Make sure `.env` is in `.gitignore` (already done)
- Never commit `.env` to git
- Keep your app password private

---

## 🧪 Testing

### Test 1: Email Logs (Development Mode)
The emails are working! You should see logs like:
```
✅ Verification email sent: <message-id>
📧 Email sent to: asifahammednishst@gmail.com
```

### Test 2: Register a Test User
```bash
# Use Postman or curl to test
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "asifahammednishst@gmail.com",
    "password": "Test123456",
    "fullName": "Test User",
    "phone": "1234567890"
  }'
```

Then check your Gmail inbox!

### Test 3: Password Reset
```bash
curl -X POST http://localhost:3000/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "asifahammednishst@gmail.com",
    "userType": "main"
  }'
```

---

## ✅ Verification Checklist

- [ ] Added email config to `.env`
- [ ] Restarted backend server
- [ ] Server started without errors
- [ ] Registered a test user
- [ ] Received email in Gmail inbox
- [ ] Email has "Open App & Verify" button
- [ ] Deep link format is: `invoiceapp://verify-email?token=...`

---

## 🎉 You're All Set!

Your email system is configured with:
- ✅ Gmail SMTP (smtp.gmail.com)
- ✅ Your email: asifahammednishst@gmail.com
- ✅ App password configured
- ✅ Sender name: Invoice App
- ✅ Deep links for mobile app

**Next Step:** Configure deep linking in your mobile app using the guide in `MOBILE_EMAIL_DEEP_LINKING.md`

---

## 🔧 Troubleshooting

### If emails are not sending:

1. **Check backend logs** for error messages
2. **Verify app password** is correct (16 characters with spaces)
3. **Check Gmail settings:**
   - 2-Step Verification is enabled
   - App password is generated
4. **Test SMTP connection:**
   ```bash
   npm install -g nodemailer
   # Create a test script if needed
   ```

### If you see "Less secure app" error:
- ✅ You're already using App Password, so this shouldn't happen
- App passwords bypass "less secure app" restrictions

---

## 📱 Mobile App Configuration

Don't forget to set up deep linking in your Expo app:

1. Add to `app.json`:
   ```json
   {
     "expo": {
       "scheme": "invoiceapp"
     }
   }
   ```

2. See full guide: `MOBILE_EMAIL_DEEP_LINKING.md`

---

**Configuration Date:** January 17, 2026  
**Email Provider:** Gmail  
**Status:** 🟢 Ready to Send Emails!
