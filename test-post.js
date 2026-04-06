const https = require('https');

const data = JSON.stringify({
  email: 'healthclo07@gmail.com',
  type: 'register'
});

const options = {
  hostname: 'medicare-hms.onrender.com',
  port: 443,
  path: '/api/auth/send-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => console.log(body));
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
