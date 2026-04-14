import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const nodeEnv = process.env.NODE_ENV || 'development';

// Validate required environment variables
function validateEnv() {
  const isProd = nodeEnv === 'production';
  const requiredInProd = ['JWT_SECRET', 'DATABASE_PATH'];
  
  for (const key of requiredInProd) {
    if (isProd && !process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

validateEnv();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || (nodeEnv === 'development' ? 'dev_only_change_me' : undefined),
  databasePath: process.env.DATABASE_PATH || './data/app.db',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  nodeEnv,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  resendApiKey: process.env.RESEND_API_KEY,
  resendVerifiedEmail: process.env.RESEND_VERIFIED_EMAIL || '24r21a05a4@mlrit.ac.in',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
  adminPassword: process.env.ADMIN_PASSWORD
};

