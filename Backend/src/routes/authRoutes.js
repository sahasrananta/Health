import express from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
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

// Email Configuration - Initialize with Gmail SMTP first, then Ethereal fallback
let resend = null;
let transporter = null;
let gmailTransporter = null;

// Create Ethereal test account (free, no signup needed)
// Create Ethereal test account (free, no signup needed)
async function initializeEmailService() {
  console.log('\n🔍 [System Audit] Initializing Communication Services...');
  
  const audit = {
    gmail: { status: '❌ DISABLED', reason: 'Missing credentials' },
    resend: { status: '❌ DISABLED', reason: 'Missing API Key' },
    twilio: { status: '❌ DISABLED', reason: 'Missing SID/Token' },
    ethereal: { status: '🟡 WAITING', reason: 'Fallback only' }
  };

  // 1. GMAIL
  if (config.emailUser && config.emailPass) {
    try {
      gmailTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: config.emailUser, pass: config.emailPass },
        family: 4,
        pool: true
      });
      await gmailTransporter.verify();
      transporter = gmailTransporter;
      audit.gmail = { status: '✅ ENABLED', reason: `Verified for ${config.emailUser}` };
    } catch (error) {
      audit.gmail = { status: '❌ FAILED', reason: error.message };
      gmailTransporter = null;
    }
  }

  // 2. RESEND
  if (config.resendApiKey) {
    resend = new Resend(config.resendApiKey);
    audit.resend = { status: '✅ ENABLED', reason: 'API Key configured' };
  }

  // 3. TWILIO
  if (config.twilioAccountSid && config.twilioAuthToken) {
    audit.twilio = { status: '✅ ENABLED', reason: 'Credentials found' };
    // twilioClient is initialized below in its own logic (keeping compatibility)
  }

  // 4. ETHEREAL (Fallback)
  if (!transporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
        family: 4
      });
      audit.ethereal = { status: '✅ ACTIVE', reason: `Test mode active (${testAccount.user})` };
    } catch (error) {
      audit.ethereal = { status: '❌ FAILED', reason: error.message };
      transporter = null;
    }
  } else {
    audit.ethereal = { status: '💤 STANDBY', reason: 'Gmail is primary' };
  }

  // LOG AUDIT REPORT
  console.log('----------------------------------------------------');
  console.log(' COMMUNICATION SERVICE AUDIT');
  console.log('----------------------------------------------------');
  Object.entries(audit).forEach(([service, info]) => {
    console.log(`${service.toUpperCase().padEnd(10)}: ${info.status.padEnd(12)} | ${info.reason}`);
  });
  console.log('----------------------------------------------------');
  
  if (audit.gmail.status.includes('❌') && audit.resend.status.includes('❌')) {
    console.log('⚠️ [WARNING] No production email services are active. Check Render env vars!');
  }
  console.log('');
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
  const cleanTo = to.trim();
  console.log(`\n[📧 Email OTP] Attempting to send to: "${cleanTo}"`);
  
  const subject = 'Your HealthClo Account Verification Code';
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
      <div style="background: white; border-radius: 8px; padding: 30px; text-align: center;">
        <h2 style="color: #2563eb; margin: 0 0 10px 0; font-size: 24px;">HealthClo Account Verification</h2>
        <p style="color: #64748b; margin: 0 0 30px 0; font-size: 14px;">Your secure verification code is:</p>
        
        <div style="font-size: 48px; font-weight: bold; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; letter-spacing: 8px; margin: 0 0 30px 0; font-family: 'Courier New', monospace;">
          ${otp}
        </div>
        
        <p style="color: #94a3b8; font-size: 13px; margin: 0 0 20px 0;">⏱️ This code expires in 10 minutes</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #64748b; font-size: 12px; margin: 0;">If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  `;

  // HELPER: Timeout promise
  const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Email service timeout')), ms));

  try {
    // PRIMARY: Try Gmail SMTP
    if (gmailTransporter) {
      try {
        console.log(`[📧] Attempting Gmail delivery...`);
        await Promise.race([
          gmailTransporter.sendMail({
            from: `"HealthClo" <${config.emailUser}>`,
            to: cleanTo,
            subject,
            html,
            replyTo: config.emailUser
          }),
          timeout(10000) // 10s timeout
        ]);
        
        console.log(`✅ [Email] Delivered via Gmail to ${cleanTo}`);
        return true;
      } catch (err) {
        console.error(`❌ [Gmail] Delivery Error:`, err.message);
        // Continue to fallback
      }
    }

    // SECONDARY: Try Resend
    if (resend) {
      try {
        console.log(`[📧] Attempting Resend API fallback...`);
        const fromEmail = config.resendVerifiedEmail || 'onboarding@resend.dev';
        const { data, error } = await Promise.race([
          resend.emails.send({
            from: `HealthClo <${fromEmail}>`,
            to: cleanTo,
            subject,
            html,
            replyTo: fromEmail
          }),
          timeout(10000)
        ]);
        
        if (error) {
          console.error(`⚠️ [Resend] API Error:`, error.message || error);
          if (String(error.message).includes('not verified')) {
            console.log(`[💡] Hint: Domain ${fromEmail.split('@')[1]} is not verified in Resend.`);
          }
        } else {
          console.log(`✅ [Email] Delivered via Resend to ${cleanTo}`);
          return true;
        }
      } catch (err) {
        console.error(`❌ [Resend] System Error:`, err.message);
      }
    }

    // TERTIARY: Fallback to Ethereal
    if (transporter && !gmailTransporter) {
      try {
        console.log(`[📧] Attempting Ethereal...`);
        const info = await Promise.race([
          transporter.sendMail({
            from: '"HealthClo Security" <noreply@healthclo.test>',
            to: cleanTo,
            subject,
            html
          }),
          timeout(5000)
        ]);
        console.log(`✅ [Email] Sent via Ethereal to ${cleanTo}`);
        return true;
      } catch (err) {
        console.error(`⚠️ [Ethereal] Error:`, err.message);
      }
    }
  } catch (globalErr) {
    console.error(`❌ [Email Global] Fatal error during delivery:`, globalErr.message);
  }

  console.error(`❌ [Email] Delivery failed for ${cleanTo}`);
  return false;
}


async function sendSMS(to, otp) {
  const phoneNumber = to.trim();
  console.log(`\n[📱 SMS OTP] Attempting to send to: "${phoneNumber}"`);
  
  if (!twilioClient) {
    console.log(`⚠️ [SMS] Twilio client not initialized. Using MOCK mode.`);
    console.log(`[📱 MOCK] SMS Code for ${phoneNumber}: ${otp}`);
    console.log(`[💡] To enable real SMS: Add valid TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to .env`);
    return false;
  }

  if (!config.twilioPhoneNumber) {
    console.log(`⚠️ [SMS] Twilio phone number not configured. Using MOCK mode.`);
    console.log(`[📱 MOCK] SMS Code for ${phoneNumber}: ${otp}`);
    console.log(`[💡] Set TWILIO_PHONE_NUMBER in .env file`);
    return false;
  }
  
  try {
    // Ensure 'to' number has a plus sign for Twilio
    const formattedTo = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    console.log(`[📱] Attempting Twilio SMS delivery...`);
    const message = await twilioClient.messages.create({
      body: `HealthClo: Your verification code is ${otp}. Valid for 10 minutes. Do not share this code.`,
      from: config.twilioPhoneNumber,
      to: formattedTo
    });
    
    console.log(`✅ [SMS] OTP sent successfully via Twilio`);
    console.log(`[📊] Message SID: ${message.sid}`);
    console.log(`[📊] Status: ${message.status}`);
    return true;
  } catch (error) {
    console.error(`❌ [SMS] Twilio delivery failed`);
    console.error(`[Error Code] ${error.code || 'UNKNOWN'}`);
    console.error(`[Error Message] ${error.message}`);
    
    if (error.message.includes('21614') || error.message.includes('21211')) {
      console.log(`[💡] The 'from' number is not valid. Buy a real Twilio number at https://www.twilio.com/console/phone-numbers`);
    }
    if (error.message.includes('20003')) {
      console.log(`[💡] Account not authorized. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN`);
    }
    console.log(`[📱 FALLBACK] SMS Code logged above: ${otp}`);
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
  const { phone, type } = req.body;
  const email = req.body.email ? req.body.email.trim() : null;
  const identifier = email || phone;
  if (!identifier) return res.status(400).json({ error: 'Email or phone required' });
  
  const db = getDb();
  
  // Validation based on type
  if (type === 'login' || type === 'reset') {
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
  const isRealEmailActive = !!resend || !!transporter;

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

// ============================================================
//  DELETE ACCOUNT (with password verification)
// ============================================================
authRoutes.delete('/delete-account', requireAuth, (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const db = getDb();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Delete user and all associated data (cascading)
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Account deleted successfully. All associated data has been removed.' });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ============================================================
//  CHANGE PASSWORD
// ============================================================
authRoutes.post('/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const db = getDb();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ============================================================
//  OLD DELETE PROFILE (deprecated, kept for compatibility)
// ============================================================
authRoutes.delete('/profile', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Account deleted successfully. All associated data has been purged.' });
  } catch (error) {
    console.error('Delete Profile Error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Export initialization function
export { initializeEmailService };
