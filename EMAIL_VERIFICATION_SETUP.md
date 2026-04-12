# Email Verification System Setup & Troubleshooting

## Current Status
✅ Backend Server Running  
✅ All three email providers configured  
❌ Email Delivery Issues Found

---

## Issues Found & Solutions

### 1. **Gmail (Nodemailer) - Authentication Failed**
**Error:** "Invalid login: 535-5.7.8 Username and Password not accepted"

**Causes:**
- Gmail app password is incorrect or expired
- Two-factor authentication may not be enabled
- Less secure apps access is disabled

**Solution:**
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled
3. Go to: https://myaccount.google.com/apppasswords
4. Select "Mail" and "Windows Computer"
5. Generate a new App Password (16 characters)
6. Update `.env` with the new password:
   ```
   EMAIL_USER=healthclo07@gmail.com
   EMAIL_PASS=<NEW_16_CHAR_APP_PASSWORD>
   ```
7. Restart the server

---

### 2. **Resend API - Limited Trial Mode**
**Error:** "You can only send testing emails to your own email address"

**Info:**
- Current API Key is in trial mode
- Can only send to: 24r21a05a4@mlrit.ac.in
- Requires domain verification for production

**Solution:**
- For development: Add verified email to Resend or wait for team domain setup
- For production: Verify a custom domain at https://resend.com/domains

---

### 3. **Current Fallback Behavior**
Since email providers failed, the system is in **MOCK Mode**:
- ✅ OTP codes are generated correctly
- ❌ Emails are NOT actually sent
- OTP appears in browser console during development
- Perfect for testing the flow!

---

## Testing the System

### Option 1: Development Testing (Current)
```bash
1. OTP is generated and displayed in console
2. Use console OTP to complete registration
3. No actual emails sent (safe for testing)
```

### Option 2: Production Email Sending
```bash
1. Fix Gmail App Password → OTP sent via email
2. OR verify domain in Resend → OTP sent via Resend
3. OR configure Twilio for SMS OTP (already working ✅)
```

---

## Twilio SMS Configuration ✅
✅ **Already Working!**
- Account SID: AC<your_account_sid>
- Auth Token: Configured
- Phone Number: +1<your_number>

SMS OTP will work for phone-based registration/login.

---

## Quick Fix Priority

### High Priority (Recommended)
1. **Fix Gmail** - Most common email provider
2. **Test with real credentials**
3. **Verify end-to-end flow**

### Alternative (If Gmail won't work)
1. Use Resend trial mode (configure source email)
2. Or use SMS via Twilio for all verification

---

## Files to Update
- `.env` - Email credentials
- No code changes needed!

---

## Next Steps
1. Generate new Gmail App Password
2. Update `.env` file
3. Restart backend server
4. Test OTP sending with new credentials
