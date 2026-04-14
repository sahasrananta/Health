# Gmail SMTP OTP Delivery - Troubleshooting Guide

## Problem: "Code is sent" but email doesn't arrive

The system shows "Verification code sent!" but emails don't actually arrive in the inbox.

---

## Root Causes & Solutions

### Issue 1: Wrong Gmail App Password ⚠️

**Signs:**
- Console shows: `❌ [Gmail] Error: Invalid login`
- Error code: `535` or `BadCredentials`
- Email doesn't appear in inbox

**Solution:**
1. Go to: https://myaccount.google.com/security
2. Click "App passwords" (or scroll down to find it)
3. **IMPORTANT**: You must have **2-Step Verification ENABLED** first!
4. Generate a **new app password** for "Mail" and "Windows Computer"
5. Copy the 16-character password
6. Update `.env` file:
   ```env
   EMAIL_PASS=xxxx xxxx xxxx xxxx
   ```
   (Remove spaces if present in copy)
7. Restart backend: `npm start`

**Verify:**
```bash
# Backend console should show:
✅ Gmail SMTP configured for: healthclo07@gmail.com
```

---

### Issue 2: 2-Step Verification Not Enabled ⚠️

Gmail requires 2FA enabled to use app passwords.

**Fix:**
1. Go to: https://myaccount.google.com/security
2. Look for "2-Step Verification"
3. Click "Get started" or "Turn on"
4. Follow verification steps (phone number needed)
5. Once enabled, generate app password (see Issue 1)

---

### Issue 3: Less Secure Apps Blocked ⚠️

Older Gmail accounts might block SMTP even with app password.

**Fix Option 1: Use Modern Security**
- Ensure 2FA is enabled (see Issue 2)
- Ensure app password is used (see Issue 1)

**Fix Option 2: Use a Different Email Service**
If Gmail doesn't work, configure Resend instead:
1. Go to: https://resend.com
2. Sign up (free)
3. Add your domain (or use default sender: noreply@resend.dev)
4. Get API key from dashboard
5. Update `.env`:
   ```env
   RESEND_API_KEY=re_your_key_here
   ```

---

## Testing Gmail SMTP

### Step 1: Manual Test
Create a file `test-email.js`:
```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'healthclo07@gmail.com',
    pass: 'vpfukaqhiidbamyq'  // Your 16-char app password
  }
});

async function test() {
  try {
    const info = await transporter.sendMail({
      from: '"HealthClo" <healthclo07@gmail.com>',
      to: 'your.email@gmail.com',
      subject: 'Test',
      html: '<h1>If you see this, Gmail SMTP works!</h1>'
    });
    console.log('✅ Email sent! Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit();
}

test();
```

Run: `node test-email.js`

### Step 2: Check Backend Logs
When you request OTP, you should see:
```
[📧 Email OTP] Attempting to send to: "user@gmail.com"
[📧] Attempting Gmail SMTP with healthclo07@gmail.com...
✅ [Email] OTP sent successfully via Gmail to user@gmail.com
[📊] Gmail Status: Delivered | Message ID: <ID>
```

If you see this, **Gmail is working!** Check user's spam/promotions folder.

---

## Gmail App Password Setup (Step-by-Step)

### Part 1: Enable 2-Step Verification
1. Visit: https://myaccount.google.com/
2. Click "Security" on the left
3. Scroll to "2-Step Verification"
4. Click "Get started"
5. Add phone number
6. Verify via SMS or app
7. Mark device as trusted

### Part 2: Generate App Password
1. Go back to: https://myaccount.google.com/security
2. Scroll down to "App passwords"
3. Select: **Mail**
4. Select: **Windows Computer** (or your device)
5. Click "Generate"
6. Copy the 16-character password (format: `abcd efgh ijkl mnop`)
7. Paste into `.env`:
   ```env
   EMAIL_PASS=abcdefghijklmnop
   ```
   (without spaces)

### Part 3: Test
1. Restart backend: `npm start`
2. Go to: http://localhost:4000/register.html
3. Enter your test email
4. Click "Send Verification Code"
5. Check inbox within 10 seconds

---

## Fallback Options

If Gmail doesn't work, the system will automatically try:

### Option 1: Resend API (Recommended)
- Free tier: 100 emails/day
- No app password needed
- Modern email platform

Setup:
1. Visit: https://resend.com
2. Sign up (free)
3. Get API key
4. Update `.env`:
   ```env
   RESEND_API_KEY=re_your_key_here
   RESEND_VERIFIED_EMAIL=your_verified_email@resend.dev
   ```

### Option 2: Ethereal Test Email (Development Only)
- No configuration needed
- Shows email preview links in console
- Perfect for testing without real Gmail account

---

## Quick Checklist

Before testing OTP emails, verify:

- [ ] Gmail account: healthclo07@gmail.com
- [ ] 2-Step Verification: **ENABLED**
- [ ] App Password: **GENERATED** (16 characters)
- [ ] .env updated: `EMAIL_PASS=xxxxxxxxxxxx`
- [ ] Backend restarted: `npm start`
- [ ] Console shows: `✅ Gmail SMTP configured`

---

## Current System Status

```
Email Priority Chain:
1. Gmail SMTP ← Primary (requires app password)
2. Resend API ← Secondary (requires API key)
3. Ethereal Test ← Fallback (always works, dev only)

SMS Priority Chain:
1. Twilio SMS ← Primary (if credentials valid)
2. Mock SMS ← Fallback (logs to console)
```

---

## If Still Not Working

Send these details for debugging:

1. **Backend console output** when OTP is requested
2. **Error message** from `.env` configuration
3. **Screenshot** of Gmail app passwords page (mask the password)
4. **Is 2FA enabled?** (Yes/No)
5. **Did you get 16-char app password?** (Yes/No)

---

## Contact & Support

- GitHub: https://github.com/sahasrananta/Health
- Backend API: http://localhost:4000
- TEST OTP: http://localhost:4000/register.html

---

**Status**: Gmail SMTP is configured and priority fixed. Just set up the app password! ✅
