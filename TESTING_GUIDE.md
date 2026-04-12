# Hospital Management System - Email Verification Testing Guide

## ✅ Current Setup Status
- **Backend Server**: Running on http://localhost:4000
- **Frontend**: Ready at Frontend/
- **Email Providers**: All 3 configured (1 working, 2 in trial)
- **OTP System**: Fully functional in MOCK mode
- **SMS OTP**: Ready for phone-based verification

---

## 🧪 Testing Scenarios

### Scenario 1: Email Registration (MOCK Mode) ✅
**This works right now, no changes needed**

Steps:
1. Open `Frontend/register.html` in browser
2. Click "Email" tab (if not already selected)
3. Fill in all required fields:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john@example.com`
   - DOB: `1990-01-15`
   - Blood Type: `O+`
   - Password: `Test@1234` (strong password)
   - Confirm Password: `Test@1234`
4. Click "Send Verification Code"
5. **Open Browser Console (F12)** and look for:
   ```
   [Trial Mode] Generated OTP: 123456
   ```
6. Enter the 6-digit code in the OTP input fields
7. Click "Register Account"
8. Expected: Success message and redirect to dashboard

---

### Scenario 2: Phone Registration (SMS via Twilio) ✅
**This works with real SMS delivery**

Steps:
1. Open `Frontend/register.html`
2. Click "Phone" tab
3. Fill in details and phone number (e.g., `+14155552671`)
4. Click "Send OTP"
5. **Wait for SMS on the phone** (or check backend logs if number is test)
6. OTP will appear in browser console
7. Enter code and complete registration
8. Success: Account created and verified via SMS

---

### Scenario 3: Email Login (MOCK Mode) ✅
**Test login flow**

Steps:
1. Open `Frontend/login.html`
2. Keep "Email" tab selected
3. Enter email: `john@example.com`
4. Enter password: `Test@1234`
5. Click "Sign In to Dashboard"
6. Expected: Redirect to appropriate dashboard (patient/doctor/admin)

---

### Scenario 4: Fix Gmail & Send Real Emails ⚠️
**If you want real email delivery**

Requirements:
- New Gmail App Password (16 characters)
- 2-Factor Authentication enabled on Gmail

Steps:
1. Go to: https://myaccount.google.com/apppasswords
2. Generate new password for "Mail" on "Windows Computer"
3. Update `Backend/.env`:
   ```
   EMAIL_PASS=<NEW_16_CHAR_PASSWORD>
   ```
4. Restart backend server:
   ```bash
   cd Backend
   npm start
   ```
5. Test OTP sending - emails will now work!

---

## 📊 Backend Email Logs

When OTP is requested, backend shows:
```
[Email] Attempting to send OTP to: "john@example.com"
============================
[OTP Request] Type: register | To: john@example.com
Generated Code: 836294
STATUS: MOCK (Message was NOT sent. Verify credentials)
============================
```

**Status meanings:**
- `Real Email Sent` → Email delivered via Nodemailer/Resend
- `Real SMS Sent` → SMS delivered via Twilio
- `MOCK` → Generated but not sent (test mode)

---

## 🔑 Credentials Currently In Use

### Gmail (Nodemailer) ⚠️ **Needs fixing**
```
Email: healthclo07@gmail.com
Status: Auth failed - needs new app password
```

### Resend API ⚠️ **Trial mode**
```
API Key: re_ZkXCNgt6_...
Status: Can only send to 24r21a05a4@mlrit.ac.in
```

### Twilio SMS ✅ **Working**
```
Account SID: ACd23792f...
Status: Ready to send SMS
Phone: +174053578220
```

---

## 🚀 Quick Start Testing

### Without Gmail Fix (Right Now):
```bash
1. npm start in Backend/
2. Open Frontend/register.html
3. Use mock OTP from console
4. Registration works!
```

### With Gmail Fix:
```bash
1. Get new app password
2. Update Backend/.env
3. Restart backend
4. Real emails now working!
```

---

## 🐛 Troubleshooting

### "OTP not appearing in console"
- Make sure browser console is open (F12)
- Check that NODE_ENV=development in .env
- Look for "[Trial Mode]" message

### "Email never arrives"
- This is expected in MOCK mode
- Check console for OTP instead
- Or provide new Gmail app password to fix

### "SMS not received"  
- Verify phone number format (include country code)
- Check backend logs for Twilio errors
- Verify Twilio account has credits

### "Cannot register with same email twice"
- Use a different email for each test
- Or clear database: delete `data/app.db`

---

## 📋 Test Registration Form Fields

**For Patient:**
- First Name ✓
- Last Name ✓
- Email or Phone ✓
- DOB ✓
- Blood Type ✓
- Password (strong) ✓
- OTP Verification ✓

**For Doctor (Additional Fields):**
- Medical License Number ✓
- Specialization ✓
- Hospital/Clinic Affiliation ✓
- ID Proof Upload ✓

---

## ✨ What's Working Now

✅ OTP Generation  
✅ OTP Countdown Timer  
✅ OTP Expiry Handling  
✅ Resend OTP (after 30s cooldown)  
✅ Registration with OTP verification  
✅ Login with email/password  
✅ Login with phone/OTP  
✅ Doctor verification fields  
✅ Password strength meter  
✅ Toast notifications  
✅ Form validations  
✅ Mobile/Phone OTP via Twilio SMS  

---

## 📞 Support

**For immediate testing:**
- Use MOCK mode with console logs
- Test complete registration/login flow
- Verify all UI works correctly

**For production emails:**
- Fix Gmail: Get new app password
- Or use verified domain in Resend
- Or rely on Twilio SMS

---

**Last Updated:** 2026-04-12  
**System Status:** ✅ READY FOR TESTING
