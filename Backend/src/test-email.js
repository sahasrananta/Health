import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const config = {
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  resendApiKey: process.env.RESEND_API_KEY,
  resendVerifiedEmail: process.env.RESEND_VERIFIED_EMAIL
};

async function testGmail() {
  if (!config.emailUser || !config.emailPass) {
    console.log('🔴 Gmail credentials not found in .env');
    return;
  }
  console.log(`\n--- Testing Gmail SMTP (${config.emailUser}) ---`);
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: config.emailUser,
      pass: config.emailPass
    },
    family: 4 // Force IPv4
  });

  try {
    await transporter.verify();
    console.log('✅ Gmail SMTP is valid and ready!');
    
    // Attempt a test send
    const info = await transporter.sendMail({
      from: `"HealthClo Test" <${config.emailUser}>`,
      to: config.emailUser, // Send to self
      subject: 'HealthClo SMTP Test',
      text: 'If you see this, your Gmail SMTP configuration is working!'
    });
    console.log('✅ Test email sent to yourself successfully!');
  } catch (error) {
    console.error('❌ Gmail SMTP Test Failed:', error.message);
    if (error.message.includes('535')) {
      console.log('💡 Hint: Check your App Password. You must use a 16-character App Password, not your regular password.');
    }
  }
}

async function testResend() {
  if (!config.resendApiKey) {
    console.log('\n🔴 Resend API Key not found in .env');
    return;
  }
  console.log(`\n--- Testing Resend API ---`);
  const resend = new Resend(config.resendApiKey);
  const fromEmail = config.resendVerifiedEmail || 'onboarding@resend.dev';

  try {
    const { data, error } = await resend.emails.send({
      from: `HealthClo <${fromEmail}>`,
      to: fromEmail, // Send to verified email
      subject: 'HealthClo Resend Test',
      text: 'If you see this, your Resend configuration is working!'
    });

    if (error) {
      console.error('❌ Resend API Test Failed:', error);
    } else {
      console.log('✅ Resend API is working! Test email sent successfully.');
    }
  } catch (error) {
    console.error('❌ Resend API Exception:', error.message);
  }
}

(async () => {
  console.log('🚀 Starting Email Service Diagnostics...');
  await testGmail();
  await testResend();
  console.log('\nDiagnostics Complete.');
})();
