#!/usr/bin/env node
/**
 * Simple WebSocket test script to debug connection issues
 * Run this from the frontend directory with: node test-websocket-simple.js
 */

// You'll need to get a real JWT token from your browser's localStorage
// After logging in, open browser console and run: localStorage.getItem('auth_token')
const JWT_TOKEN = process.env.JWT_TOKEN || 'your_jwt_token_here'

const WS_URL = 'ws://localhost:8000'

async function testWebSocketConnection() {
  console.log('🔧 Testing WebSocket Connection')
  console.log('=' * 50)
  console.log(`📡 Connecting to: ${WS_URL}/ws/connect`)
  console.log(`🔑 Token: ${JWT_TOKEN ? JWT_TOKEN.substring(0, 20) + '...' : 'NOT PROVIDED'}`)
  console.log('')

  if (!JWT_TOKEN || JWT_TOKEN === 'your_jwt_token_here') {
    console.log('❌ Please provide a valid JWT token')
    console.log('   1. Log into your application')
    console.log('   2. Open browser console')
    console.log('   3. Run: localStorage.getItem("auth_token")')
    console.log('   4. Copy the token and run: JWT_TOKEN=your_token node test-websocket-simple.js')
    process.exit(1)
  }

  try {
    // Import WebSocket for Node.js
    let WebSocket
    try {
      WebSocket = (await import('ws')).default
    } catch (e) {
      console.log('❌ WebSocket library not found. Install with: npm install ws')
      process.exit(1)
    }

    const wsUrl = `${WS_URL}/ws/connect?token=${encodeURIComponent(JWT_TOKEN)}`
    console.log('🔌 Opening WebSocket connection...')
    
    const ws = new WebSocket(wsUrl)
    
    // Set connection timeout
    const connectionTimeout = setTimeout(() => {
      console.log('⏰ Connection timeout (10 seconds)')
      ws.close()
      process.exit(1)
    }, 10000)

    ws.on('open', () => {
      clearTimeout(connectionTimeout)
      console.log('✅ WebSocket connection opened')
      console.log('   Waiting for connection_established message...')
    })

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        console.log(`📨 Message received: ${message.type}`)
        
        if (message.type === 'connection_established') {
          console.log('🎉 Connection established successfully!')
          console.log('   User:', message.data?.username)
          console.log('   Role:', message.data?.role)
          
          // Send ping test
          console.log('📤 Sending ping...')
          ws.send(JSON.stringify({ 
            type: 'ping', 
            timestamp: Date.now() 
          }))
        } else if (message.type === 'pong') {
          console.log('🏓 Pong received - bidirectional communication working!')
          
          // Close connection gracefully
          setTimeout(() => {
            console.log('✅ Test completed successfully')
            ws.close()
          }, 1000)
        } else if (message.type === 'error') {
          console.log('❌ Server error:', message.data)
          ws.close()
        } else {
          console.log('📄 Other message:', message)
        }
      } catch (error) {
        console.log('❌ Failed to parse message:', data.toString())
      }
    })

    ws.on('error', (error) => {
      clearTimeout(connectionTimeout)
      console.log('❌ WebSocket error:', error.message)
      console.log('   This usually means:')
      console.log('   - Backend server is not running')
      console.log('   - Invalid token')
      console.log('   - Network connectivity issues')
    })

    ws.on('close', (code, reason) => {
      clearTimeout(connectionTimeout)
      console.log(`🔌 WebSocket closed`)
      console.log(`   Code: ${code}`)
      console.log(`   Reason: ${reason.toString()}`)
      
      if (code === 1008) {
        console.log('   This usually indicates authentication failure')
      } else if (code === 1011) {
        console.log('   This indicates a server error')
      }
    })

  } catch (error) {
    console.log('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted by user')
  process.exit(0)
})

testWebSocketConnection() 