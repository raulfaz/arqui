// healthcheck.js
const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  timeout: 2000,
  headers: {
    'User-Agent': 'Docker-Health-Check'
  }
};

const request = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      console.log('Health check response:', response.message);
      
      if (res.statusCode === 200) {
        console.log('✅ Health check passed');
        process.exit(0);
      } else {
        console.log('❌ Health check failed - Invalid status code');
        process.exit(1);
      }
    } catch (error) {
      console.log('❌ Health check failed - Invalid JSON response');
      process.exit(1);
    }
  });
});

request.on('error', (err) => {
  console.log('❌ Health check error:', err.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.log('❌ Health check timeout');
  request.destroy();
  process.exit(1);
});

request.setTimeout(2000);
request.end();