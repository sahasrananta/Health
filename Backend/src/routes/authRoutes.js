import express from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { config } from '../config.js';
import { getDb } from '../db.js';
import { registerSchema, loginSchema } from '../validation.js';
import { requireAuth, signToken } from '../auth.js';

export const authRoutes = express.Router();

const otpStore = new Map();
const OTP_EXPIRY_MS = 10 * 60 * 1000;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.emailUser,
    pass: config.emailPass
  }
});

async function sendRealEmail(to, otp) {
  if (!config.emailUser || !config.emailPass) {
    console.warn('EMAIL_USER or EMAIL_PASS not set. Falling back to console log.');
    return false;
  }
  
  try {
    await transporter.sendMail({
      from: `"HealthClo Security" <${config.emailUser}>`,
      to,
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
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
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
  if (storedOtp.otp !== String(otp)) {
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
  const { email, phone } = req.body;
  const identifier = email || phone;
  if (!identifier) return res.status(400).json({ error: 'Email or phone required' });
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(identifier, { otp, expires: Date.now() + OTP_EXPIRY_MS });
  
  let sent = false;
  if (email) {
    sent = await sendRealEmail(email, otp);
  }

  console.log(`\n============================`);
  console.log(`[OTP] To: ${identifier}`);
  console.log(`Code: ${otp}`);
  if (sent) console.log(`STATUS: Sent via Email successfully.`);
  else console.log(`STATUS: Local console only (Email settings missing or failed).`);
  console.log(`============================\n`);
  
  res.json({ message: 'OTP sent successfully' });
});

authRoutes.post('/verify-otp', (req, res) => {
  const { email, phone, otp } = req.body;
  const identifier = email || phone;
  
  if (!identifier || !otp) return res.status(400).json({ error: 'Identifier and OTP required' });
  
  const record = otpStore.get(identifier);
  if (!record) return res.status(400).json({ error: 'No OTP requested for this identifier' });
  if (Date.now() > record.expires) {
    otpStore.delete(identifier);
    return res.status(400).json({ error: 'OTP expired' });
  }
  if (record.otp !== String(otp)) return res.status(400).json({ error: 'Invalid OTP' });
  
  res.json({ message: 'OTP verified successfully' });
});

