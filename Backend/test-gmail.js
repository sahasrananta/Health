import nodemailer from 'nodemailer';

// Test Gmail SMTP credentials
const emailUser = 'healthclo07@gmail.com';
const emailPass = 'vpfukaqhiidbamyq';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  }
});

async function testGmail() {
  try {
    console.log('Testing Gmail SMTP...');
    console.log('Email:', emailUser);
    
    const info = await transporter.sendMail({
      from: `"HealthClo" <${emailUser}>`,
      to: emailUser,  // Send to same email for testing
      subject: 'Gmail SMTP Test',
      html: '<h1>Gmail SMTP is working!</h1><p>OTP Test Code: 123456</p>'
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Full error:', error);
  }
  
  process.exit(0);
}

testGmail();
