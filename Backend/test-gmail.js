import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "healthclo07@gmail.com",
    pass: "qeqxtmorugffouxm" // your app password (no spaces)
  }
});

async function testGmail() {
  try {
    console.log('Testing Gmail SMTP...');

    // Verify connection first
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const info = await transporter.sendMail({
      from: `"HealthClo" <healthclo07@gmail.com>`,
      to: "healthclo07@gmail.com",
      subject: 'Gmail SMTP Test',
      html: '<h1>Working!</h1><p>OTP: 123456</p>'
    });

    console.log('✅ Email sent!');
    console.log(info);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testGmail();