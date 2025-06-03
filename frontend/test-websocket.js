#!/usr/bin/env node
/**
 * Simple WebSocket test script to debug connection issues
 * Run with: node test-websocket.js
 */

const WebSocket = require('ws')

const WS_URL = 'ws://localhost:8000'

// Mock token - you should replace this with a real JWT token from your login
const MOCK_TOKEN = 'your_jwt_token_here'

async function testWebSocketConnection() {
  console.log('🔧 Testing WebSocket Connection')
  console.log('=' * 40)
  
  try {
    // Test 1: Basic connection to WebSocket endpoint
    console.log('\n1. Testing WebSocket Endpoint...')
    const wsUrl = `${WS_URL}/ws/connect?token=${encodeURIComponent(MOCK_TOKEN)}`
    console.log(`   Connecting to: ${wsUrl.replace(/token=[^&]+/, 'token=***')}`)
    
    const ws = new WebSocket(wsUrl)
    
    ws.on('open', () => {
      console.log('   ✅ WebSocket connection opened')
    })
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        console.log('   📨 Message received:', message.type)
        
        if (message.type === 'connection_established') {
          console.log('   ✅ Connection established successfully')
          
          // Send a ping to test bidirectional communication
          console.log('   📤 Sending ping...')
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
        } else if (message.type === 'pong') {
          console.log('   ✅ Pong received - bidirectional communication working')
          
          // Close connection after successful test
          setTimeout(() => {
            ws.close()
          }, 1000)
        } else if (message.type === 'error') {
          console.log('   ❌ Server error:', message.data)
        }
      } catch (error) {
        console.log('   ❌ Failed to parse message:', data.toString())
      }
    })
    
    ws.on('error', (error) => {
      console.log('   ❌ WebSocket error:', error.message)
    })
    
    ws.on('close', (code, reason) => {
      console.log(`   🔌 WebSocket closed: ${code} - ${reason}`)
      
      if (code === 1008) {
        console.log('   💡 Code 1008 indicates authentication failure')
        console.log('   💡 Make sure to replace MOCK_TOKEN with a valid JWT token')
      }
      
      process.exit(0)
    })
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (ws.readyState !== WebSocket.CLOSED) {
        console.log('   ⏰ Test timeout - closing connection')
        ws.close()
      }
    }, 10000)
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`)
    process.exit(1)
  }
}

// Instructions for getting a real token
console.log('📋 Instructions:')
console.log('1. Login to the frontend application')
console.log('2. Open browser DevTools > Application > Local Storage')
console.log('3. Copy the value of "auth_token"')
console.log('4. Replace MOCK_TOKEN in this script with the real token')
console.log('5. Run this script again')
console.log()

if (MOCK_TOKEN === 'your_jwt_token_here') {
  console.log('⚠️  Using mock token - authentication will fail')
  console.log('   This test will help identify connection vs. authentication issues')
  console.log()
}

testWebSocketConnection() 