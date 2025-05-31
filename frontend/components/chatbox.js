"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MessageCircle,
  Send,
  Paperclip,
  X,
  Minimize2,
  Maximize2,
  Phone,
  Video,
  MoreVertical,
  User,
  Shield,
  Wifi,
  WifiOff,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/useWebSocket"
import { apiClient } from "@/lib/api"

export function ChatBox({ isAdmin = false, ticketId = null, isOpen = false, onToggle }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [currentTicketId, setCurrentTicketId] = useState(ticketId || "general")
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  
  const { user } = useAuth()
  const { messages: wsMessages, sendMessage, isConnected, connectionError } = useWebSocket()

  // Load chat messages when component opens or ticket changes
  useEffect(() => {
    if (isOpen && currentTicketId && currentTicketId !== "general") {
      loadChatMessages()
    }
  }, [isOpen, currentTicketId])

  // Handle new WebSocket messages
  useEffect(() => {
    if (wsMessages.length > 0) {
      const latestMessage = wsMessages[wsMessages.length - 1]
      // Only add message if it's for the current ticket
      if (latestMessage.ticket_id === currentTicketId) {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => msg.id === latestMessage.id)
          if (!exists) {
            return [...prev, {
              id: latestMessage.id,
              text: latestMessage.message,
              sender: latestMessage.sender_id === user?.id ? (isAdmin ? "admin" : "user") : (isAdmin ? "user" : "admin"),
              senderName: latestMessage.sender_name,
              timestamp: new Date(latestMessage.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              avatar: "/placeholder.svg?height=32&width=32",
            }]
          }
          return prev
        })
      }
    }
  }, [wsMessages, currentTicketId, user?.id, isAdmin])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatMessages = async () => {
    if (!currentTicketId || currentTicketId === "general") return
    
    try {
      const response = await apiClient.getChatMessages(currentTicketId)
      if (response.data) {
        const formattedMessages = response.data.map(msg => ({
          id: msg.id,
          text: msg.message,
          sender: msg.sender_id === user?.id ? (isAdmin ? "admin" : "user") : (isAdmin ? "user" : "admin"),
          senderName: msg.sender_name,
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          avatar: "/placeholder.svg?height=32&width=32",
        }))
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error("Failed to load chat messages:", error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = () => {
    if (newMessage.trim() && isConnected) {
      // Send via WebSocket if connected
      sendMessage(newMessage.trim(), currentTicketId)
      setNewMessage("")
    } else if (newMessage.trim() && !isConnected) {
      // Fallback to API if WebSocket is not connected
      handleApiSendMessage()
    }
  }

  const handleApiSendMessage = async () => {
    if (!newMessage.trim()) return
    
    try {
      const response = await apiClient.sendChatMessage(currentTicketId, newMessage.trim())
      if (response.data) {
        const message = {
          id: response.data.id,
          text: newMessage.trim(),
          sender: isAdmin ? "admin" : "user",
          senderName: user ? `${user.first_name} ${user.last_name}` : "You",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          avatar: "/placeholder.svg?height=32&width=32",
        }
        setMessages(prev => [...prev, message])
        setNewMessage("")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        const response = await apiClient.uploadFile(file, currentTicketId)
        if (response.data) {
          const message = {
            id: Date.now().toString(),
            text: `📎 ${file.name}`,
            sender: isAdmin ? "admin" : "user",
            senderName: user ? `${user.first_name} ${user.last_name}` : "You",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            avatar: "/placeholder.svg?height=32&width=32",
            isFile: true,
          }
          setMessages(prev => [...prev, message])
        }
      } catch (error) {
        console.error("Failed to upload file:", error)
      }
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={onToggle} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50" size="icon">
        <MessageCircle className="h-6 w-6" />
        {!isConnected && <WifiOff className="absolute -top-1 -right-1 h-4 w-4 text-red-500" />}
      </Button>
    )
  }

  return (
    <Card
      className={`fixed bottom-6 right-6 w-96 shadow-xl z-50 transition-all duration-300 ${
        isMinimized ? "h-16" : "h-[600px]"
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between p-4 bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>{isAdmin ? <User className="h-4 w-4" /> : <Shield className="h-4 w-4" />}</AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}></div>
          </div>
          <div>
            <CardTitle className="text-sm font-medium">
              {isAdmin ? "Customer Support" : "Help Desk Support"}
            </CardTitle>
            <p className="text-xs opacity-90 flex items-center gap-1">
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? "Connected" : "Disconnected"}
              {isTyping && " • Typing..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20">
            <Phone className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20">
            <Video className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Ticket</DropdownMenuItem>
              <DropdownMenuItem>Chat History</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={onToggle}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[540px]">
          {/* Connection Status */}
          {connectionError && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-950 border-b">
              <p className="text-xs text-red-600 dark:text-red-400">
                Connection error: {connectionError}
              </p>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Start a conversation...</p>
                  <p className="text-xs mt-1">We're here to help!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.sender === (isAdmin ? "admin" : "user") ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.sender !== (isAdmin ? "admin" : "user") && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={message.avatar} />
                        <AvatarFallback className="text-xs">
                          {message.senderName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        message.sender === (isAdmin ? "admin" : "user")
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === (isAdmin ? "admin" : "user")
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {message.timestamp}
                      </p>
                    </div>
                    {message.sender === (isAdmin ? "admin" : "user") && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={message.avatar} />
                        <AvatarFallback className="text-xs">
                          {user ? `${user.first_name[0]}${user.last_name[0]}` : "You"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isConnected ? "Type a message..." : "Connecting..."}
                className="flex-1"
                disabled={!user}
              />
              <Button size="icon" className="h-8 w-8" onClick={handleSendMessage} disabled={!newMessage.trim() || !user}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
          </div>
        </CardContent>
      )}
    </Card>
  )
} 