"use client"

import { useState, useEffect } from 'react'
import { useWebSocketContext } from '@/components/providers/WebSocketProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, RefreshCw, Bug, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

export function WebSocketDebug() {
  const [isVisible, setIsVisible] = useState(false)
  const [logs, setLogs] = useState([])
  const {
    isConnected,
    connectionStatus,
    connectionError,
    notifications,
    ticketUpdates,
    forceReconnect,
    getDebugInfo,
    onConnectionChange,
    onNotification,
    onTicketUpdate,
    onNewTicket
  } = useWebSocketContext()

  // Capture WebSocket events for debugging
  useEffect(() => {
    const addLog = (type, message, data = {}) => {
      const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type,
        message,
        data
      }
      setLogs(prev => [logEntry, ...prev.slice(0, 49)]) // Keep last 50 logs
    }

    const unsubscribeConnection = onConnectionChange(({ connected, status }) => {
      addLog('connection', `Connection ${connected ? 'established' : 'lost'}`, { status })
    })

    const unsubscribeNotification = onNotification((notification) => {
      addLog('notification', `Notification received: ${notification.title}`, { 
        id: notification._id,
        type: notification.notification_type 
      })
    })

    const unsubscribeTicketUpdate = onTicketUpdate((update) => {
      addLog('ticket_update', `Ticket updated: ${update.subject}`, { 
        id: update.id,
        status: update.status 
      })
    })

    const unsubscribeNewTicket = onNewTicket((ticket) => {
      addLog('new_ticket', `New ticket: ${ticket.subject}`, { id: ticket.id })
    })

    return () => {
      unsubscribeConnection()
      unsubscribeNotification()
      unsubscribeTicketUpdate()
      unsubscribeNewTicket()
    }
  }, [onConnectionChange, onNotification, onTicketUpdate, onNewTicket])

  const getStatusIcon = () => {
    if (isConnected) return <Wifi className="h-4 w-4 text-green-500" />
    if (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') {
      return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
    }
    return <WifiOff className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = () => {
    const variant = isConnected ? 'default' : 
                   connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'secondary' : 
                   'destructive'
    
    return <Badge variant={variant}>{connectionStatus}</Badge>
  }

  const testConnection = async () => {
    const logs = []
    logs.push('Starting WebSocket connection test...')
    
    // Check if we have a token
    const token = localStorage.getItem('token')
    if (!token) {
      logs.push('❌ No authentication token found')
      return logs
    }
    logs.push('✅ Authentication token found')
    
    // Test WebSocket URL
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    logs.push(`📡 WebSocket URL: ${wsUrl}`)
    
    // Test if backend is reachable
    try {
      const response = await fetch(`${wsUrl.replace('ws://', 'http://')}/api/health`)
      if (response.ok) {
        logs.push('✅ Backend server is reachable')
      } else {
        logs.push(`❌ Backend server responded with status: ${response.status}`)
      }
    } catch (error) {
      logs.push(`❌ Cannot reach backend server: ${error.message}`)
    }
    
    return logs
  }

  const runDiagnostics = async () => {
    const diagnostics = await testConnection()
    const debugInfo = getDebugInfo()
    
    console.group('🔍 WebSocket Diagnostics')
    console.log('Connection Test Results:')
    diagnostics.forEach(log => console.log(log))
    console.log('\nDebug Info:', debugInfo)
    console.log('\nRecent Logs:', logs.slice(0, 10))
    console.groupEnd()
    
    alert('Diagnostics logged to console. Check the browser developer tools.')
  }

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-50"
      >
        <Bug className="h-4 w-4 mr-2" />
        WebSocket Debug
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 left-4 w-96 max-h-96 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getStatusIcon()}
            WebSocket Debug
          </CardTitle>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            {getStatusBadge()}
          </div>
          
          {connectionError && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {connectionError}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Notifications: {notifications.length}</div>
            <div>Ticket Updates: {ticketUpdates.length}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={forceReconnect} size="sm" variant="outline">
            <RefreshCw className="h-3 w-3 mr-1" />
            Reconnect
          </Button>
          <Button onClick={runDiagnostics} size="sm" variant="outline">
            <Bug className="h-3 w-3 mr-1" />
            Diagnose
          </Button>
        </div>

        {/* Recent Logs */}
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Recent Events:</h4>
          <div className="max-h-32 overflow-y-auto text-xs space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500">No events yet...</div>
            ) : (
              logs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 p-1 rounded bg-gray-50"
                >
                  {log.type === 'connection' ? (
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : log.type === 'notification' ? (
                    <AlertTriangle className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Clock className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-600">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-xs font-medium truncate">
                      {log.message}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 