import express from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import twilio from 'twilio';
import { z } from 'zod';
import { config } from '../config.js';
import { getDb } from '../db.js';
import { registerSchema, loginSchema } from '../validation.js';
import { requireAuth, signToken } from '../auth.js';

export const authRoutes = express.Router();

const otpStore = new Map();
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const otpAttempts = new Map(); // Track resend attempts
const OTP_RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds between resends
const MAX_RESEND_ATTEMPTS = 5; // Max resends per session

// Email Configuration
let resend = null;
if (config.resendApiKey) {
  resend = new Resend(config.resendApiKey);
  console.log('✅ Resend Email API configured');
} else {
  console.log('ℹ️ Resend not configured. Real emails will fail. (Render blocks SMTP)');
}

// Twilio SMS Configuration
let twilioClient = null;
if (config.twilioAccountSid && config.twilioAuthToken && config.twilioAccountSid.startsWith('AC')) {
  try {
    twilioClient = twilio(config.twilioAccountSid, config.twilioAuthToken);
    console.log('✅ Twilio SMS configured and ready');
  } catch (error) {
    console.warn('⚠️ Twilio configuration error:', error.message);
  }
} else {
  console.log('ℹ️ Twilio not configured. SMS OTP will use mock mode (logs to console)');
}

async function sendRealEmail(to, otp) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set. Cannot send HTTP email.');
    return false;
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: `HealthClo Security <onboarding@resend.dev>`,
      to: [to],
      subject: 'Verify your HealthClo Account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Welcome to HealthClo!</h2>
          <p>Please use the verification code below to complete your registration:</p>
          <div style="font-size: 32px; font-weight: bold; background: #f0f7ff; padding: 20px; text-align: center; border-radius: 8px; color: #1e40af; letter-spacing: 5px;">
            ${otp}
          </div>
          <p style="margin-top: 20px; color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    });
    
    if (error) {
      console.error('--- RESEND ERROR ---');
      console.error(error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('--- RESEND THROW CATCH ---');
    console.error(error.message);
    return false;
  }
}

async function sendSMS(to, otp) {
  if (!twilioClient || !config.twilioPhoneNumber) {
    console.warn(`[OTP] Twilio not configured. MOCK SMS generated for ${to}: ${otp}`);
    return false;
  }
  
  try {
    // Ensure 'to' number has a plus sign for Twilio
    const formattedTo = to.startsWith('+') ? to : `+${to}`;
    
    const message = await twilioClient.messages.create({
      body: `HealthClo: Your secure verification code is ${otp}. Valid for 10 minutes.`,
      from: config.twilioPhoneNumber,
      to: formattedTo
    });
    
    console.log(`✅ [OTP] SMS sent successfully. SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('❌ [OTP] Twilio SMS Transmission Failed');
    console.error(`- Error Code: ${error.code || 'Unknown'}`);
    console.error(`- Message: ${error.message}`);
    return false;
  }
}

authRoutes.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const {
    role, email, phone, password, firstName, lastName, dob, bloodType,
    specialization, licenseNumber, hospitalAffiliation, otp
  } = parsed.data;

  const db = getDb();

  if (email) {
    const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(email);
    if (exists) return res.status(409).json({ error: 'Email already registered' });
  }
  if (phone) {
    const exists = db.prepare('SELECT 1 FROM users WHERE phone = ?').get(phone);
    if (exists) return res.status(409).json({ error: 'Phone already registered' });
  }

  // Verify OTP
  const identifier = email || phone;
  if (!identifier) return res.status(400).json({ error: 'Email or phone required' });
  const storedOtp = otpStore.get(identifier);
  
  if (!storedOtp) return res.status(400).json({ error: 'OTP validation failed: No OTP requested for this email/phone' });
  if (Date.now() > storedOtp.expires) {
    otpStore.delete(identifier);
    return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
  }
  if (storedOtp.otp !== String(otp).trim()) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }
  
  // Clean up OTP after successful use
  otpStore.delete(identifier);

  const id = randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();
  const isVerified = role === 'doctor' ? 0 : 1;

  db.prepare(`
    INSERT INTO users
    (id, role, email, phone, password_hash, first_name, last_name, dob, blood_type,
     specialization, license_number, hospital_affiliation, is_verified, created_at)
    VALUES
    (@id, @role, @email, @phone, @passwordHash, @firstName, @lastName, @dob, @bloodType,
     @specialization, @licenseNumber, @hospitalAffiliation, @isVerified, @createdAt)
  `).run({
    id,
    role,
    email: email || null,
    phone: phone || null,
    passwordHash,
    firstName,
    lastName,
    dob: dob || null,
    bloodType: bloodType || null,
    specialization: specialization || null,
    licenseNumber: licenseNumber || null,
    hospitalAffiliation: hospitalAffiliation || null,
    isVerified,
    createdAt: now
  });

  const user = db.prepare('SELECT id, role, email, phone, first_name, last_name, is_verified, created_at FROM users WHERE id = ?')
    .get(id);
  const token = signToken(user);

  return res.status(201).json({ user, token });
});

authRoutes.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const { email, phone, password } = parsed.data;
  const db = getDb();

  const user = email
    ? db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    : db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const safeUser = {
    id: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
    first_name: user.first_name,
    last_name: user.last_name,
    is_verified: user.is_verified,
    created_at: user.created_at
  };

  const token = signToken(safeUser);
  return res.json({ user: safeUser, token });
});

// OTP-based login (phone)
authRoutes.post('/login-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

  const record = otpStore.get(phone);
  if (!record) return res.status(400).json({ error: 'No OTP found for this phone. Please request one first.' });
  if (Date.now() > record.expires) {
    otpStore.delete(phone);
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }
  if (record.otp !== String(otp).trim()) return res.status(400).json({ error: 'Invalid OTP' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user) return res.status(404).json({ error: 'No account found with this phone number. Please register first.' });

  otpStore.delete(phone);

  const safeUser = {
    id: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
    first_name: user.first_name,
    last_name: user.last_name,
    is_verified: user.is_verified,
    created_at: user.created_at
  };

  const token = signToken(safeUser);
  return res.json({ user: safeUser, token });
});

authRoutes.get('/me', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, role, email, phone, first_name, last_name, dob, blood_type, is_verified, created_at FROM users WHERE id = ?').get(req.user.id);
  return res.json({ user });
});

authRoutes.put('/profile', requireAuth, (req, res) => {
  const { firstName, lastName, dob, bloodType, email, phone } = req.body;
  const db = getDb();
  
  if (email && email !== req.user.email) {
    const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(email);
    if (exists) return res.status(409).json({ error: 'Email already in use' });
  }

  db.prepare(`
    UPDATE users 
    SET first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        dob = COALESCE(?, dob),
        blood_type = COALESCE(?, blood_type),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone)
    WHERE id = ?
  `).run(
    firstName || null, lastName || null, dob || null, bloodType || null, email || null, phone || null, req.user.id
  );

  const updatedUser = db.prepare('SELECT id, role, email, phone, first_name, last_name, dob, blood_type, is_verified, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ message: 'Profile updated successfully', user: updatedUser });
});

authRoutes.post('/send-otp', async (req, res) => {
  const { email, phone, type } = req.body;
  const identifier = email || phone;
  if (!identifier) return res.status(400).json({ error: 'Email or phone required' });
  
  const db = getDb();
  
  // Validation based on type (login or register)
  if (type === 'login') {
    const user = email 
      ? db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)
      : db.prepare('SELECT 1 FROM users WHERE phone = ?').get(phone);
    if (!user) return res.status(404).json({ error: 'No account found with this ' + (email ? 'email' : 'phone number') });
  } else if (type === 'register') {
    const exists = email
      ? db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)
      : db.prepare('SELECT 1 FROM users WHERE phone = ?').get(phone);
    if (exists) return res.status(409).json({ error: (email ? 'Email' : 'Phone number') + ' is already registered' });
  }

  // Rate limiting: Check if already requested
  const lastAttempt = otpAttempts.get(identifier);
  if (lastAttempt) {
    const timeSinceLastAttempt = Date.now() - lastAttempt.lastTime;
    if (timeSinceLastAttempt < OTP_RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - timeSinceLastAttempt) / 1000);
      return res.status(429).json({ 
        error: `Please wait ${waitSeconds}s before requesting another OTP` 
      });
    }
    if (lastAttempt.count >= MAX_RESEND_ATTEMPTS) {
      return res.status(429).json({ 
        error: 'Too many OTP requests. Please try again later.' 
      });
    }
  }
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;
  otpStore.set(identifier, { otp, expires: expiresAt, createdAt: Date.now() });
  
  // Track resend attempts
  otpAttempts.set(identifier, {
    count: (lastAttempt?.count || 0) + 1,
    lastTime: Date.now()
  });
  
  let sent = false;
  let errorMsg = null;
  if (email) {
    sent = await sendRealEmail(email, otp);
    if (!sent) errorMsg = 'Failed to deliver email verification code.';
  } else if (phone) {
    sent = await sendSMS(phone, otp);
    if (!sent) errorMsg = 'Failed to deliver SMS verification code.';
  }

  console.log(`\n============================`);
  console.log(`[OTP Request] Type: ${type || 'general'} | To: ${identifier}`);
  console.log(`Generated Code: ${otp}`);
  if (sent) {
    console.log(`STATUS: SUCCESS (${email ? 'Real Email Sent' : 'Real SMS Sent'})`);
  } else {
    console.log(`STATUS: MOCK (Message was NOT sent. Verify credentials)`);
  }
  console.log(`============================\n`);
  
  // Respond to client
  const response = { message: 'Verification code sent!' };
  
  // Disable Trial Mode hints if real credentials (Twilio or Email) are configured
  const isRealSmsActive = !!twilioClient;
  const isRealEmailActive = !!resend;

  if (config.nodeEnv === 'development' && !isRealSmsActive && !isRealEmailActive) {
    response.otp = otp;
    response.isTrial = true;
    console.log(`[OTP] TEST MODE: Generated code ${otp} for ${identifier}`);
  } else {
    console.log(`[OTP] Production Mode: Secure code generated for ${identifier}`);
  }

  if (!sent && (email || phone) && config.nodeEnv !== 'development') {
    return res.status(500).json({ error: errorMsg });
  }

  res.json(response);
});

authRoutes.post('/verify-otp', (req, res) => {
  const { email, phone, otp } = req.body;
  const identifier = email || phone;

  if (!identifier || !otp) return res.status(400).json({ error: 'Identifier and OTP required' });

  const record = otpStore.get(identifier);
  if (!record) return res.status(400).json({ error: 'No OTP requested for this identifier' });
  if (Date.now() > record.expires) {
    otpStore.delete(identifier);
    otpAttempts.delete(identifier);
    return res.status(400).json({ error: 'OTP expired' });
  }
  if (record.otp !== String(otp).trim()) return res.status(400).json({ error: 'Invalid OTP' });

  res.json({ message: 'OTP verified successfully' });
});

// Check OTP status (remaining time)
authRoutes.post('/check-otp-status', (req, res) => {
  const { email, phone } = req.body;
  const identifier = email || phone;

  if (!identifier) return res.status(400).json({ error: 'Email or phone required' });

  const record = otpStore.get(identifier);
  if (!record) {
    return res.json({ 
      status: 'not-requested',
      message: 'No OTP has been requested for this identifier'
    });
  }

  const now = Date.now();
  const remaining = Math.max(0, Math.ceil((record.expires - now) / 1000));

  if (remaining <= 0) {
    otpStore.delete(identifier);
    return res.json({ 
      status: 'expired',
      message: 'OTP has expired',
      remaining: 0
    });
  }

  return res.json({ 
    status: 'active',
    message: 'OTP is valid',
    remaining,
    expiresIn: record.expires
  });
});

