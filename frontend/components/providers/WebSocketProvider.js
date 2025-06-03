"use client"

import React, { createContext, useContext, useEffect, useRef } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'

const WebSocketContext = createContext(null)

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider')
  }
  return context
}

export const WebSocketProvider = ({ children }) => {
  const websocketData = useWebSocket()
  const lastLogTimeRef = useRef(0)
  const providerMountedRef = useRef(false)
  
  const {
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
    onConnectionChange
  } = websocketData

  // Track provider mounting
  useEffect(() => {
    providerMountedRef.current = true
    console.log('[WebSocketProvider] Provider mounted')
    
    return () => {
      providerMountedRef.current = false
      console.log('[WebSocketProvider] Provider unmounting')
    }
  }, [])

  // Reduced logging - only log significant status changes every 10 seconds max
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && providerMountedRef.current) {
      const now = Date.now()
      const shouldLog = now - lastLogTimeRef.current > 10000 // Only log every 10 seconds
      
      if (shouldLog) {
        console.log('[WebSocketProvider] Status Update:', {
          isConnected,
          connectionStatus,
          hasError: !!connectionError,
          notificationCount: notifications.length,
          ticketUpdateCount: ticketUpdates.length,
          timestamp: new Date().toISOString()
        })
        lastLogTimeRef.current = now
      }
    }
  }, [isConnected, connectionStatus, connectionError, notifications.length, ticketUpdates.length])

  return (
    <WebSocketContext.Provider value={websocketData}>
      {children}
    </WebSocketContext.Provider>
  )
} 