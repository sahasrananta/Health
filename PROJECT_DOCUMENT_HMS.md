# MediCare Hospital Management System - Project Documentation

This document provides a comprehensive overview of the MediCare Hospital Management System (HMS), including its build process, file architecture, API integration, and security mechanisms.

## 1. Build & Execution Process

The project is divided into a **Backend** (Node.js/Express) and a **Frontend** (Static HTML/JS/CSS).

### Prerequisites
- Node.js (v18+)
- npm

### Backend Setup
1. Navigate to the `Backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env` (see Environment Configuration section).
4. Start the server:
   - **Development**: `npm run dev` (uses nodemon for auto-reload)
   - **Production**: `npm start`

### Frontend Setup
The frontend consists of static files and does not require a complex build step. It can be served using any static web server or by the backend itself if configured.
Access the app by opening `Frontend/index.html` in a browser (or via the backend URL if proxied).

---

## 2. File Architecture

### Core Structure
```text
Hospital-Management-System/
├── Backend/                 # Server-side logic
│   ├── data/                # SQLite database storage
│   ├── src/                 # Source code
│   │   ├── routes/          # API Route definitions
│   │   ├── auth.js          # Authentication middleware & Token logic
│   │   ├── db.js            # Database connection (Better-SQLite3)
│   │   ├── config.js        # Environment configuration loader
│   │   └── index.js         # Entry point
│   ├── .env                 # Environment variables
│   └── package.json         # Dependencies & Scripts
├── Frontend/                # Client-side interface
│   ├── css/                 # Stylesheets
│   ├── js/                  # Client-side logic (auth.js, etc.)
│   ├── index.html           # Landing page
│   ├── login.html           # Authentication page
│   └── register.html        # Registration page
```

### Key Components
- **`Backend/src/index.js`**: Re-orders middleware and initializes the Express server.
- **`Backend/src/db.js`**: Manages the SQLite database using `better-sqlite3`.
- **`Frontend/js/auth.js`**: Central hub for frontend authentication, handling logins, registrations, and OTP UI logic.

---

## 3. API Integration

The Frontend communicates with the Backend via a RESTful API.

### Authentication Endpoints
- **`POST /api/auth/register`**: Register a new user (Patient or Doctor).
- **`POST /api/auth/login`**: Authenticate using Email/Password.
- **`POST /api/auth/login-otp`**: Authenticate using Phone/OTP.
- **`POST /api/auth/send-otp`**: Generate and send a 6-digit OTP to Email or Phone.
- **`POST /api/auth/verify-otp`**: Validate an OTP without completing registration/login.

### Integration Flow
1. **Frontend Request**: `Frontend/js/auth.js` uses `fetch()` to call backend endpoints.
2. **Backend Processing**: Routes in `Backend/src/routes/authRoutes.js` process the data, interacting with `db.js`.
3. **Response**: Backend returns JSON data with success/error messages and JWT tokens.

---

## 4. OTP Verification Mechanism

The system uses a robust OTP (One-Time Password) system for both Email and Phone verification.

### How it Works
1. **Request**: User enters Email/Phone on the frontend and clicks "Send OTP".
2. **Generation**: Backend generates a random 6-digit code.
3. **Storage**: The code is stored in-memory (`otpStore` Map) with an expiry timestamp (10 minutes).
4. **Delivery**:
   - **Email**: Sent via **Nodemailer (Gmail)** or **Resend API**.
   - **SMS**: Sent via **Twilio**.
   - **Trial Mode**: In development mode without credentials, the OTP is returned in the API response for testing.
5. **Verification**: When the user submits the code, the backend checks it against the `otpStore`.

### Environment Configuration (.env)
To enable real OTP delivery, ensure these variables are set:
- `EMAIL_USER` & `EMAIL_PASS`: For Gmail SMTP.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`: For SMS.

---

## 5. Security Features
- **JWT Authentication**: Secured routes require a JSON Web Token.
- **Bcrypt Hashing**: Passwords are never stored in plain text.
- **CORS Protection**: Access control for frontend-backend communication.
- **Rate Limiting**: OTP resends are cooldown-protected (30s) and capped (5 attempts).
