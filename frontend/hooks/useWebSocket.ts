"use client"

import { useEffect, useRef, useState } from 'react';
import { getCurrentUserFromStorage, isAuthenticated } from '@/lib/api';

interface Message {
  id: string;
  message: string;
  sender_id: string;
  sender_name: string;
  timestamp: string;
  ticket_id: string;
}

interface WebSocketHookReturn {
  messages: Message[];
  sendMessage: (message: string, ticketId: string) => void;
  isConnected: boolean;
  connectionError: string | null;
}

export function useWebSocket(): WebSocketHookReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (!isAuthenticated()) {
      setConnectionError('Not authenticated');
      return;
    }

    const user = getCurrentUserFromStorage();
    if (!user) {
      setConnectionError('User not found');
      return;
    }

    const token = localStorage.getItem('access_token');
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    
    try {
      ws.current = new WebSocket(`${wsUrl}/api/v1/ws?token=${token}`);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            setMessages(prev => [...prev, data.data]);
          } else if (data.type === 'notification') {
            // Handle notifications if needed
            console.log('Notification received:', data.data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds unless it was a manual close
        if (event.code !== 1000) {
          reconnectTimeout.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to connect');
    }
  };

  const disconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect');
      ws.current = null;
    }
    
    setIsConnected(false);
  };

  const sendMessage = (message: string, ticketId: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    const user = getCurrentUserFromStorage();
    if (!user) {
      console.error('User not found');
      return;
    }

    const messageData = {
      type: 'send_message',
      data: {
        message,
        ticket_id: ticketId,
        sender_id: user.id,
        sender_name: `${user.first_name} ${user.last_name}`,
      }
    };

    try {
      ws.current.send(JSON.stringify(messageData));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  useEffect(() => {
    // Connect when component mounts and user is authenticated
    if (isAuthenticated()) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  // Reconnect when authentication status changes
  useEffect(() => {
    if (isAuthenticated() && !isConnected) {
      connect();
    } else if (!isAuthenticated() && isConnected) {
      disconnect();
    }
  }, [isAuthenticated(), isConnected]);

  return {
    messages,
    sendMessage,
    isConnected,
    connectionError,
  };
} 