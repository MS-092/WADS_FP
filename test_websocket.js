// Test WebSocket connection with JWT token
const WebSocket = require('ws');

// Use the token from the logs
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDg2ODAyMDksInN1YiI6IjEiLCJ0eXBlIjoiYWNjZXNzIn0.KCsvNZawAlK5l93BncqFTfsfs5y5W2UyEWfpH48hEEE";

const wsUrl = `ws://localhost:8000/api/v1/ws?token=${token}`;

console.log('🔗 Attempting to connect to:', wsUrl);
console.log('🔑 Using token:', token.substring(0, 50) + '...');

const ws = new WebSocket(wsUrl);

let connected = false;

ws.on('open', function open() {
  console.log('✅ WebSocket connected successfully!');
  connected = true;
});

ws.on('message', function message(data) {
  console.log('📨 Received:', data.toString());
});

ws.on('error', function error(err) {
  console.log('❌ WebSocket error:', err.message);
  console.log('❌ Error details:', err);
});

ws.on('close', function close(code, reason) {
  console.log(`🔴 WebSocket closed: code=${code}, reason=${reason || 'No reason provided'}`);
  if (!connected) {
    console.log('❌ Connection failed - never opened');
  }
});

// Keep the script running for 10 seconds
console.log('⏳ Waiting for connection...');
setTimeout(() => {
  if (connected) {
    console.log('✅ Connection successful, closing...');
  } else {
    console.log('❌ Connection failed, timing out...');
  }
  ws.close();
}, 10000); 