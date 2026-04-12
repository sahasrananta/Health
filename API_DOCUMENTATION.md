# Email Verification API Documentation

## 🔗 API Endpoints

### 1. **Send OTP** 
**POST** `/api/auth/send-otp`

Request:
```json
{
  "email": "user@example.com",
  "type": "register"  // or "login"
}
```

Or for phone:
```json
{
  "phone": "+14155552671",
  "type": "register"
}
```

Response (Success):
```json
{
  "message": "Verification code sent!",
  "otp": "123456",           // Only in development/mock mode
  "isTrial": true            // Indicates mock mode
}
```

Response (Error):
```json
{
  "error": "Email already registered"
}
```

---

### 2. **Verify OTP**
**POST** `/api/auth/verify-otp`

Request:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Or for phone:
```json
{
  "phone": "+14155552671",
  "otp": "123456"
}
```

Response (Success):
```json
{
  "message": "OTP verified successfully"
}
```

Response (Error):
```json
{
  "error": "Invalid OTP"
}
```

---

### 3. **Check OTP Status**
**POST** `/api/auth/check-otp-status`

Request:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "status": "pending",
  "remainingTime": 480,        // seconds
  "expiresAt": "2024-04-12T12:35:00Z",
  "attempts": 2
}
```

---

### 4. **Register with Verified OTP**
**POST** `/api/auth/register`

Request:
```json
{
  "role": "patient",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "dob": "1990-01-15",
  "bloodType": "O+",
  "password": "Test@1234",
  "otp": "123456"
}
```

For Doctor:
```json
{
  "role": "doctor",
  "email": "doctor@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "dob": "1985-05-20",
  "bloodType": "A+",
  "password": "Test@1234",
  "specialization": "Cardiology",
  "licenseNumber": "ML-12345",
  "hospitalAffiliation": "City Hospital",
  "otp": "123456"
}
```

Response (Success):
```json
{
  "user": {
    "id": "uuid-here",
    "role": "patient",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_verified": 1,
    "created_at": "2024-04-12T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 5. **Login**
**POST** `/api/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "Test@1234"
}
```

Or phone:
```json
{
  "phone": "+14155552671",
  "password": "Test@1234"
}
```

Response:
```json
{
  "user": { /* user object */ },
  "token": "jwt-token-here"
}
```

---

### 6. **Login with OTP (Phone)**
**POST** `/api/auth/login-otp`

Request:
```json
{
  "phone": "+14155552671",
  "otp": "123456"
}
```

Response:
```json
{
  "user": { /* user object */ },
  "token": "jwt-token-here"
}
```

---

## 🔐 OTP System Features

### Security:
- 6-digit OTP with 10-minute expiry
- Rate limiting: Max 5 resend attempts
- 30-second cooldown between resends
- In-memory OTP storage (cleared on server restart)

### Fallback Behavior:
- **Real Emails**: Nodemailer or Resend (when configured)
- **Real SMS**: Twilio (when configured)
- **Mock Mode**: Console display for development

---

## 📝 Error Codes

| Error | Meaning | Fix |
|-------|---------|-----|
| `Email already registered` | User exists | Use different email |
| `Phone already registered` | User exists | Use different phone |
| `No OTP requested` | Forgot to send OTP | Call send-otp first |
| `OTP expired` | Too slow | Request new OTP |
| `Invalid OTP` | Wrong code | Check console/SMS |
| `No account found` | Login without registration | Register first |

---

## 🧪 Test Cases

### Case 1: Happy Path (Registration)
```
1. POST /send-otp with email
2. Get OTP from response/console
3. POST /verify-otp with correct OTP
4. POST /register with verified OTP
5. ✅ New user created
```

### Case 2: Wrong OTP
```
1. POST /send-otp
2. POST /verify-otp with wrong OTP
3. ❌ Error: Invalid OTP
4. Can retry until expiry
```

### Case 3: OTP Expiry
```
1. POST /send-otp
2. Wait 10+ minutes
3. POST /verify-otp
4. ❌ Error: OTP expired
5. Must request new OTP
```

### Case 4: Phone SMS OTP
```
1. POST /send-otp with phone and type=register
2. ✅ SMS sent to phone
3. User enters OTP from SMS
4. Continue registration
```

---

## 📊 Environment Variables Required

```
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=16-char-app-password

# Resend API (Optional)
RESEND_API_KEY=re_your_key

# Twilio SMS (Optional)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=auth_token
TWILIO_PHONE_NUMBER=+1...

# General
JWT_SECRET=your_secret
NODE_ENV=development|production
DATABASE_PATH=./data/app.db
```

---

## 🚀 Deployment Notes

### Local Development:
- NODE_ENV=development
- MOCK mode shows OTP in responses
- Perfect for testing without real emails

### Production:
- NODE_ENV=production
- Real email credentials required
- No OTP in responses (security)
- Monitor email delivery in Resend/Gmail dashboard

---

**API Version:** 1.0  
**Last Updated:** 2024-04-12
