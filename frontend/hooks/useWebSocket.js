/**
 * WebSocket hook for real-time notifications and updates
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [notifications, setNotifications] = useState([])
  const [ticketUpdates, setTicketUpdates] = useState([])
  const [connectionError, setConnectionError] = useState(null)
  
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const heartbeatIntervalRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000
  const isManuallyDisconnectedRef = useRef(false)

  // Event handlers
  const eventHandlers = useRef({
    onNotification: [],
    onTicketUpdate: [],
    onNewTicket: [],
    onConnectionChange: [],
  })

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  }, [])

  const logWebSocketEvent = useCallback((event, data = {}) => {
    console.log(`[WebSocket] ${event}:`, {
      timestamp: new Date().toISOString(),
      connectionStatus,
      isConnected,
      ...data
    })
  }, [connectionStatus, isConnected])

  const validateToken = useCallback((token) => {
    if (!token) {
      return { valid: false, reason: 'No token provided' }
    }
    
    // Check if token has proper JWT format (3 segments)
    const segments = token.split('.')
    if (segments.length !== 3) {
      return { valid: false, reason: `Invalid JWT format: expected 3 segments, got ${segments.length}` }
    }
    
    try {
      // Basic token validation - check if it's properly encoded
      const payload = JSON.parse(atob(segments[1]))
      if (!payload.sub) {
        return { valid: false, reason: 'No user ID in token' }
      }
      
      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return { valid: false, reason: 'Token expired' }
      }
      
      return { valid: true }
    } catch (e) {
      return { valid: false, reason: 'Token decode error' }
    }
  }, [])

  const connect = useCallback(() => {
    const token = getAuthToken()
    if (!token) {
      logWebSocketEvent('Connect Failed', { reason: 'No auth token found' })
      setConnectionError('No authentication token found')
      setConnectionStatus('error')
      return
    }

    // Validate token before attempting connection
    const tokenValidation = validateToken(token)
    if (!tokenValidation.valid) {
      logWebSocketEvent('Connect Failed', { reason: tokenValidation.reason })
      setConnectionError(`Authentication error: ${tokenValidation.reason}`)
      setConnectionStatus('error')
      return
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      logWebSocketEvent('Connect Skipped', { reason: 'Already connected' })
      return
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      logWebSocketEvent('Connect Skipped', { reason: 'Already connecting' })
      return
    }

    try {
      setConnectionStatus('connecting')
      setConnectionError(null)
      isManuallyDisconnectedRef.current = false
      
      const wsUrl = `${WS_BASE_URL}/ws/connect?token=${encodeURIComponent(token)}`
      logWebSocketEvent('Connecting', { url: wsUrl.replace(/token=[^&]+/, 'token=***') })
      
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        logWebSocketEvent('WebSocket Opened')
        // Note: Don't set connected status here, wait for connection_established message
      }
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          logWebSocketEvent('Message Received', { type: message.type })
          
          if (message.type === 'connection_established') {
            logWebSocketEvent('Connection Established')
            setIsConnected(true)
            setConnectionStatus('connected')
            setConnectionError(null)
            reconnectAttemptsRef.current = 0
            
            // Start heartbeat
            heartbeatIntervalRef.current = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                logWebSocketEvent('Ping Sent')
                ws.send(JSON.stringify({
                  type: 'ping',
                  timestamp: Date.now()
                }))
              }
            }, 30000) // Send ping every 30 seconds
            
            // Notify handlers
            eventHandlers.current.onConnectionChange.forEach(handler => 
              handler({ connected: true, status: 'connected' })
            )
          } else if (message.type === 'error') {
            logWebSocketEvent('Server Error', message.data)
            setConnectionError(`Server error: ${message.data.message}`)
            setConnectionStatus('error')
            
            // Don't reconnect on authentication errors
            if (message.data.code === 401) {
              isManuallyDisconnectedRef.current = true
              logWebSocketEvent('Authentication Failed - Not Reconnecting')
            }
          } else {
            handleMessage(message)
          }
        } catch (error) {
          logWebSocketEvent('Message Parse Error', { error: error.message })
        }
      }
      
      ws.onerror = (error) => {
        logWebSocketEvent('WebSocket Error', { error })
        setConnectionError('WebSocket connection error')
        setConnectionStatus('error')
        
        // Notify handlers
        eventHandlers.current.onConnectionChange.forEach(handler => 
          handler({ connected: false, status: 'error' })
        )
      }
      
      ws.onclose = (event) => {
        logWebSocketEvent('WebSocket Closed', { 
          code: event.code, 
          reason: event.reason,
          wasClean: event.wasClean 
        })
        
        setIsConnected(false)
        
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }
        
        // Don't reconnect if manually disconnected or authentication failed
        if (!isManuallyDisconnectedRef.current && event.code !== 1008) {
          attemptReconnect()
        } else {
          setConnectionStatus('disconnected')
          // Notify handlers
          eventHandlers.current.onConnectionChange.forEach(handler => 
            handler({ connected: false, status: 'disconnected' })
          )
        }
      }
      
      wsRef.current = ws
      
    } catch (error) {
      logWebSocketEvent('Connect Error', { error: error.message })
      setConnectionError(`Connection failed: ${error.message}`)
      setConnectionStatus('error')
      
      // Notify handlers
      eventHandlers.current.onConnectionChange.forEach(handler => 
        handler({ connected: false, status: 'error' })
      )
    }
  }, [getAuthToken, validateToken, logWebSocketEvent])

  const attemptReconnect = useCallback(() => {
    if (isManuallyDisconnectedRef.current) return
    
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      logWebSocketEvent('Max Reconnect Attempts Reached')
      setConnectionStatus('failed')
      setConnectionError('Max reconnection attempts reached')
      
      // Notify handlers
      eventHandlers.current.onConnectionChange.forEach(handler => 
        handler({ connected: false, status: 'failed' })
      )
      return
    }
    
    reconnectAttemptsRef.current += 1
    setConnectionStatus('reconnecting')
    
    logWebSocketEvent('Reconnecting', { 
      attempt: reconnectAttemptsRef.current, 
      maxAttempts: maxReconnectAttempts 
    })
    
    // Notify handlers
    eventHandlers.current.onConnectionChange.forEach(handler => 
      handler({ connected: false, status: 'reconnecting' })
    )
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect()
    }, reconnectDelay * reconnectAttemptsRef.current) // Exponential backoff
  }, [connect, logWebSocketEvent])

  const handleMessage = useCallback((message) => {
    logWebSocketEvent('Handling Message', { type: message.type, hasData: !!message.data })
    
    switch (message.type) {
      case 'notification':
        const notification = message.data
        logWebSocketEvent('Notification Received', { 
          id: notification._id, 
          title: notification.title,
          type: notification.notification_type 
        })
        
        setNotifications(prev => {
          // Avoid duplicates
          const exists = prev.some(n => n._id === notification._id)
          if (!exists) {
            return [notification, ...prev]
          }
          return prev
        })
        
        // Show toast notification
        toast(notification.title, {
          description: notification.message,
          action: notification.data?.ticket_id ? {
            label: 'View Ticket',
            onClick: () => {
              // Navigate to ticket
              if (typeof window !== 'undefined') {
                window.location.href = `/dashboard/tickets/${notification.data.ticket_id}`
              }
            }
          } : undefined
        })
        
        // Notify handlers
        eventHandlers.current.onNotification.forEach(handler => {
          try {
            handler(notification)
          } catch (error) {
            logWebSocketEvent('Notification Handler Error', { error: error.message })
          }
        })
        break
        
      case 'ticket_update':
        const ticketUpdate = message.data
        logWebSocketEvent('Ticket Update Received', { 
          ticketId: ticketUpdate.ticket_id || ticketUpdate._id,
          status: ticketUpdate.status 
        })
        
        setTicketUpdates(prev => {
          const exists = prev.some(t => 
            (t.ticket_id || t._id) === (ticketUpdate.ticket_id || ticketUpdate._id)
          )
          if (!exists) {
            return [ticketUpdate, ...prev.slice(0, 19)] // Keep max 20 items
          }
          return prev
        })
        
        // Notify handlers
        eventHandlers.current.onTicketUpdate.forEach(handler => {
          try {
            handler(ticketUpdate)
          } catch (error) {
            logWebSocketEvent('Ticket Update Handler Error', { error: error.message })
          }
        })
        break
        
      case 'new_ticket':
        const newTicket = message.data
        logWebSocketEvent('New Ticket Received', { 
          ticketId: newTicket._id,
          title: newTicket.title 
        })
        
        // Show toast for new tickets (admin/agent only)
        toast('New Ticket Created', {
          description: `${newTicket.title} - Priority: ${newTicket.priority}`,
          action: {
            label: 'View Ticket',
            onClick: () => {
              if (typeof window !== 'undefined') {
                window.location.href = `/admin/tickets/${newTicket._id}`
              }
            }
          }
        })
        
        // Notify handlers
        eventHandlers.current.onNewTicket.forEach(handler => {
          try {
            handler(newTicket)
          } catch (error) {
            logWebSocketEvent('New Ticket Handler Error', { error: error.message })
          }
        })
        break
        
      case 'notification_read_confirmed':
        logWebSocketEvent('Notification Read Confirmed', { 
          notificationId: message.data?.notification_id 
        })
        // Update notification state
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === message.data.notification_id 
              ? { ...notif, is_read: true }
              : notif
          )
        )
        break
        
      case 'pong':
        logWebSocketEvent('Pong Received', { timestamp: message.timestamp })
        break
        
      default:
        logWebSocketEvent('Unknown Message Type', { type: message.type })
    }
  }, [logWebSocketEvent])

  const disconnect = useCallback(() => {
    logWebSocketEvent('Manual Disconnect')
    isManuallyDisconnectedRef.current = true
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
      wsRef.current = null
    }
    
    setIsConnected(false)
    setConnectionStatus('disconnected')
    setConnectionError(null)
  }, [logWebSocketEvent])

  const forceReconnect = useCallback(() => {
    logWebSocketEvent('Force Reconnect')
    disconnect()
    setTimeout(() => {
      isManuallyDisconnectedRef.current = false
      reconnectAttemptsRef.current = 0
      connect()
    }, 1000)
  }, [connect, disconnect, logWebSocketEvent])

  const markNotificationAsRead = useCallback((notificationId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      logWebSocketEvent('Marking Notification Read', { notificationId })
      wsRef.current.send(JSON.stringify({
        type: 'mark_notification_read',
        notification_id: notificationId
      }))
    } else {
      logWebSocketEvent('Mark Read Failed', { 
        reason: 'WebSocket not connected',
        readyState: wsRef.current?.readyState 
      })
    }
  }, [logWebSocketEvent])

  // Event subscription methods
  const onNotification = useCallback((handler) => {
    logWebSocketEvent('Notification Handler Added')
    eventHandlers.current.onNotification.push(handler)
    return () => {
      logWebSocketEvent('Notification Handler Removed')
      eventHandlers.current.onNotification = eventHandlers.current.onNotification.filter(h => h !== handler)
    }
  }, [logWebSocketEvent])

  const onTicketUpdate = useCallback((handler) => {
    logWebSocketEvent('Ticket Update Handler Added')
    eventHandlers.current.onTicketUpdate.push(handler)
    return () => {
      logWebSocketEvent('Ticket Update Handler Removed')
      eventHandlers.current.onTicketUpdate = eventHandlers.current.onTicketUpdate.filter(h => h !== handler)
    }
  }, [logWebSocketEvent])

  const onNewTicket = useCallback((handler) => {
    logWebSocketEvent('New Ticket Handler Added')
    eventHandlers.current.onNewTicket.push(handler)
    return () => {
      logWebSocketEvent('New Ticket Handler Removed')
      eventHandlers.current.onNewTicket = eventHandlers.current.onNewTicket.filter(h => h !== handler)
    }
  }, [logWebSocketEvent])

  const onConnectionChange = useCallback((handler) => {
    logWebSocketEvent('Connection Change Handler Added')
    eventHandlers.current.onConnectionChange.push(handler)
    return () => {
      logWebSocketEvent('Connection Change Handler Removed')
      eventHandlers.current.onConnectionChange = eventHandlers.current.onConnectionChange.filter(h => h !== handler)
    }
  }, [logWebSocketEvent])

  // Auto-connect on mount
  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      logWebSocketEvent('Auto-connecting on mount')
      connect()
    } else {
      logWebSocketEvent('No token found on mount')
    }
    
    return () => {
      logWebSocketEvent('Cleanup on unmount')
      disconnect()
    }
  }, [connect, disconnect, getAuthToken, logWebSocketEvent])

  // Reconnect when token changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          logWebSocketEvent('Token changed - reconnecting')
          // Token added/changed - reconnect
          disconnect()
          setTimeout(connect, 1000)
        } else {
          logWebSocketEvent('Token removed - disconnecting')
          // Token removed - disconnect
          disconnect()
        }
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }
  }, [connect, disconnect, logWebSocketEvent])

  // Debug info for development
  const getDebugInfo = useCallback(() => {
    return {
      isConnected,
      connectionStatus,
      connectionError,
      reconnectAttempts: reconnectAttemptsRef.current,
      maxReconnectAttempts,
      wsUrl: `${WS_BASE_URL}/ws/connect`,
      readyState: wsRef.current?.readyState,
      hasToken: !!getAuthToken(),
      notificationCount: notifications.length,
      ticketUpdateCount: ticketUpdates.length,
      eventHandlerCounts: {
        onNotification: eventHandlers.current.onNotification.length,
        onTicketUpdate: eventHandlers.current.onTicketUpdate.length,
        onNewTicket: eventHandlers.current.onNewTicket.length,
        onConnectionChange: eventHandlers.current.onConnectionChange.length,
      }
    }
  }, [isConnected, connectionStatus, connectionError, getAuthToken, notifications.length, ticketUpdates.length])

  return {
    isConnected,
    connectionStatus,
    connectionError,
    notifications,
    ticketUpdates,
    connect,
    disconnect,
    forceReconnect,
    markNotificationAsRead,
    onNotification,
    onTicketUpdate,
    onNewTicket,
    onConnectionChange,
    getDebugInfo
  }
} 