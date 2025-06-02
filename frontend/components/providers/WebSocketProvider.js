"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { toast } from 'sonner'

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
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  
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
    onConnectionChange,
    getDebugInfo
  } = websocketData

  // Show connection status changes
  useEffect(() => {
    const unsubscribe = onConnectionChange(({ connected, status }) => {
      console.log('[WebSocketProvider] Connection status changed:', { connected, status })
      
      if (status === 'connected') {
        toast.success('WebSocket Connected', {
          description: 'Real-time updates are now active',
          duration: 3000,
        })
      } else if (status === 'reconnecting') {
        toast.loading('Reconnecting...', {
          description: 'Attempting to restore real-time connection',
          duration: 5000,
        })
      } else if (status === 'error') {
        toast.error('Connection Failed', {
          description: connectionError || 'Could not establish real-time connection',
          action: {
            label: 'Retry',
            onClick: forceReconnect
          },
          duration: 10000,
        })
      }
    })
    
    return unsubscribe
  }, [onConnectionChange, connectionError, forceReconnect])

  // Debug mode toggle (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleKeyPress = (e) => {
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyW') {
          setShowDebugInfo(prev => !prev)
          console.log('[WebSocket Debug]', getDebugInfo())
        }
      }
      
      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }
  }, [getDebugInfo])

  // Log connection status for debugging
  useEffect(() => {
    console.log('[WebSocketProvider] Status Update:', {
      isConnected,
      connectionStatus,
      connectionError,
      notificationCount: notifications.length,
      ticketUpdateCount: ticketUpdates.length
    })
  }, [isConnected, connectionStatus, connectionError, notifications.length, ticketUpdates.length])

  return (
    <WebSocketContext.Provider value={websocketData}>
      {children}
      
      {/* Debug Info Panel (Development Only) */}
      {showDebugInfo && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg max-w-sm z-50 text-xs">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">WebSocket Debug</h3>
            <button 
              onClick={() => setShowDebugInfo(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`font-mono ${
                isConnected ? 'text-green-400' : 'text-red-400'
              }`}>
                {connectionStatus}
              </span>
            </div>
            
            {connectionError && (
              <div className="text-red-400 text-xs break-words">
                Error: {connectionError}
              </div>
            )}
            
            <div className="flex justify-between">
              <span>Notifications:</span>
              <span className="font-mono text-blue-400">{notifications.length}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Ticket Updates:</span>
              <span className="font-mono text-yellow-400">{ticketUpdates.length}</span>
            </div>
            
            <div className="pt-2 space-y-1">
              <button
                onClick={forceReconnect}
                className="w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
              >
                Force Reconnect
              </button>
              
              <button
                onClick={() => console.log('[WebSocket Debug] Full Info:', getDebugInfo())}
                className="w-full bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
              >
                Log Full Debug Info
              </button>
            </div>
          </div>
        </div>
      )}
    </WebSocketContext.Provider>
  )
} 