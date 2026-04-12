# 🚀 Hospital Management System - Quick Reference

## ⚡ Quick Start (1 minute)

```bash
# Terminal 1: Start Backend
cd Backend
npm install    # (only if first time)
npm start

# Open Browser
Frontend/register.html
Frontend/login.html

# Check Console (F12) for OTP
```

---

## 📝 Common Tasks

### Test Email Registration
```bash
# Prerequisites: Backend running

# Steps:
1. Open Frontend/register.html
2. Fill form (use any email)
3. Click "Send Verification Code"
4. Check console (F12) for OTP
5. Enter 6-digit code
6. Click Register
✅ Done!
```

### Test Phone Registration
```bash
# Prerequisites: Backend running

# Steps:
1. Open Frontend/register.html
2. Switch to "Phone" tab
3. Enter phone: +14155552671
4. Click "Send OTP"
5. SMS will arrive on phone
6. Enter code + Register
✅ Done!
```

### Test Login
```bash
# Prerequisites: Account already created

# With Email:
1. Open Frontend/login.html
2. Enter email & password
3. Click "Sign In"
4. Redirected to dashboard
✅ Done!

# With Phone:
1. Open Frontend/login.html
2. Switch to "Phone" tab
3. Enter phone number
4. Click "Send OTP"
5. SMS arrives
6. Enter code + Login
✅ Done!
```

### Get New Gmail App Password
```
1. Go: https://myaccount.google.com/apppasswords
2. Select Mail + Windows Computer
3. Google generates 16-char password
4. Copy it
5. Update Backend/.env line 30
6. Restart backend
✅ Real emails now working!
```

### Deploy to Render
```bash
1. Push code to GitHub
2. Go: https://render.com
3. Click "New +" → Web Service
4. Connect GitHub repo
5. Build: npm install (auto)
6. Start: npm start (auto)
7. Environment: Add .env variables
8. Deploy
✅ Live in 2 minutes!
```

### Monitor Backend Server
```bash
# Check if running:
curl http://localhost:4000

# View logs:
# (Already showing in terminal)

# Test OTP endpoint:
curl -X POST http://localhost:4000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","type":"register"}'
```

---

## 🔑 Important Endpoints

| Route | Purpose | Test |
|-------|---------|------|
| POST /api/auth/send-otp | Send OTP code | curl POST email |
| POST /api/auth/verify-otp | Verify code | curl POST otp |
| POST /api/auth/register | Create account | Browser form |
| POST /api/auth/login | User login | Browser form |
| POST /api/auth/login-otp | Phone login | Browser form |
| GET /api/auth/me | Get user info | curl +token |

---

## 📁 Files to Know

```
Backend/.env                    ← Credentials (Gmail, Resend, Twilio)
Backend/src/routes/authRoutes.js ← OTP logic here
Frontend/register.html          ← Registration page
Frontend/login.html             ← Login page
Frontend/js/auth.js             ← Frontend JS
```

---

## 🧪 Test Credentials (Development)

```
Email: test@example.com
Password: Test@1234 (strong)
Phone: +14155552671
```

---

## ⚙️ Environment Variables

```bash
# Email
EMAIL_USER=healthclo07@gmail.com
EMAIL_PASS=your-16-char-app-password

# SMS
TWILIO_ACCOUNT_SID=ACd23792f...
TWILIO_AUTH_TOKEN=10b68c5ae...
TWILIO_PHONE_NUMBER=+174053578220

# General
JWT_SECRET=any_random_string
NODE_ENV=development
DATABASE_PATH=./data/app.db
CORS_ORIGIN=*
```

---

## 🆘 Troubleshooting

### OTP not in console?
```bash
# Solution 1: Check NODE_ENV
# In Backend/.env: NODE_ENV=development

# Solution 2: Reopen console (F12)

# Solution 3: Restart backend
cd Backend && npm start
```

### Email not received?
```bash
# Expected in MOCK mode
# To fix:
1. Provide new Gmail app password
2. Or use SMS (Twilio already works)
3. Or verify domain in Resend
```

### Port 4000 already in use?
```bash
# Find process:
netstat -ano | findstr :4000

# Kill it:
taskkill /PID <PID> /F

# Or use different port in .env:
PORT=4001
```

### Database error?
```bash
# Delete and recreate:
rm Backend/data/app.db
npm start  # Creates new DB

# On Windows:
del Backend\data\app.db
npm start
```

---

## 📊 OTP Flow Summary

```
User clicks "Send OTP"
    ↓
Backend generates: 123456
    ↓
Try Email → Try SMS → Show Console
    ↓
User sees: Counting timer (10 minutes)
    ↓
User enters: 6-digit code
    ↓
Backend validates: ✅ Correct
    ↓
User can proceed: Register/Login
```

---

## 🎯 What Each Provider Does

### Email (Nodemailer - Gmail)
- Sends OTP via email
- Status: ⚠️ Needs app password
- Fix time: 2 min

### SMS (Twilio)
- Sends OTP via SMS
- Status: ✅ Ready now
- No setup needed

### Email (Resend - Alternative)
- Alternative email service
- Status: 🟡 Trial mode (limited)
- Upgrade: Verify domain

---

## ✅ Verification Checklist

- [ ] Backend running: `npm start`
- [ ] Port 4000 accessible
- [ ] Frontend pages load
- [ ] OTP generates in console
- [ ] Timer counts down
- [ ] Registration form submits
- [ ] Login works
- [ ] Redirect to dashboard

---

## 🚀 One-Liner Commands

```bash
# Start everything
cd Backend && npm start

# Test API
curl http://localhost:4000

# Kill process on port 4000 (Windows)
netstat -ano | findstr :4000 | findstr LISTEN

# Clear screen
clear

# View .env
cat Backend\.env
```

---

## 📞 Support Files

- **Setup Help**: EMAIL_VERIFICATION_SETUP.md
- **Test Steps**: TESTING_GUIDE.md
- **API Docs**: API_DOCUMENTATION.md
- **Deploy Now**: DEPLOYMENT_GUIDE.md
- **Full Summary**: PROJECT_COMPLETION_SUMMARY.md

---

## 🎓 Learning Resources

- JWT Tokens: https://jwt.io
- Gmail App Passwords: https://support.google.com/accounts/answer/185833
- Twilio OTP: https://www.twilio.com/docs/verify
- Node.js: https://nodejs.org/docs

---

**Status:** ✅ System Ready  
**Last Updated:** April 12, 2026  
**Version:** 1.0.0
