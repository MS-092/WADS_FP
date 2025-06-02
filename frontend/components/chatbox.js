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
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ChatBox({ isAdmin = false, ticketId = null, isOpen = false, onToggle }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Mock data - in real app, this would come from WebSocket/API
  useEffect(() => {
    if (isOpen) {
      const mockMessages = isAdmin ? adminChatMessages : userChatMessages
      setMessages(mockMessages)

      // Mock online users
      setOnlineUsers(
        isAdmin
          ? [{ id: "user1", name: "John Doe", avatar: "/placeholder.svg?height=32&width=32" }]
          : [
              {
                id: "admin1",
                name: "Sarah Tech",
                avatar: "/placeholder.svg?height=32&width=32",
                role: "Support Agent",
              },
            ],
      )

      // Simulate typing indicator
      const typingTimer = setTimeout(() => {
        setIsTyping(true)
        setTimeout(() => setIsTyping(false), 3000)
      }, 2000)

      return () => clearTimeout(typingTimer)
    }
  }, [isOpen, isAdmin])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: isAdmin ? "admin" : "user",
        senderName: isAdmin ? "Sarah Tech" : "John Doe",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        avatar: "/placeholder.svg?height=32&width=32",
      }

      setMessages((prev) => [...prev, message])
      setNewMessage("")

      // Simulate response after 2 seconds
      setTimeout(() => {
        const response = {
          id: (Date.now() + 1).toString(),
          text: isAdmin
            ? "Thank you for the information. I'll look into this right away."
            : "I've checked your account and found the issue. Let me fix that for you.",
          sender: isAdmin ? "user" : "admin",
          senderName: isAdmin ? "John Doe" : "Sarah Tech",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          avatar: "/placeholder.svg?height=32&width=32",
        }
        setMessages((prev) => [...prev, response])
      }, 2000)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const message = {
        id: Date.now().toString(),
        text: `📎 ${file.name}`,
        sender: isAdmin ? "admin" : "user",
        senderName: isAdmin ? "Sarah Tech" : "John Doe",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        avatar: "/placeholder.svg?height=32&width=32",
        isFile: true,
      }
      setMessages((prev) => [...prev, message])
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={onToggle} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50" size="icon">
        <MessageCircle className="h-6 w-6" />
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
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <CardTitle className="text-sm font-medium">{isAdmin ? "Customer Support" : "Help Desk Support"}</CardTitle>
            <p className="text-xs opacity-90">
              {onlineUsers.length} online • {isTyping ? "Typing..." : "Active now"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Phone className="h-4 w-4 mr-2" />
                Voice Call
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Video className="h-4 w-4 mr-2" />
                Video Call
              </DropdownMenuItem>
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(600px-80px)]">
          {/* Chat Header Info */}
          <div className="p-3 border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {ticketId ? `Ticket #${ticketId}` : "General Support"}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {isAdmin ? "Admin View" : "Customer"}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {onlineUsers.map((user) => (
                  <Avatar key={user.id} className="h-6 w-6">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    (message.sender === "admin" && isAdmin) || (message.sender === "user" && !isAdmin)
                      ? "flex-row-reverse"
                      : ""
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">
                      {message.senderName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex flex-col max-w-[70%] ${
                      (message.sender === "admin" && isAdmin) || (message.sender === "user" && !isAdmin)
                        ? "items-end"
                        : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">{message.senderName}</span>
                      <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                    </div>
                    <div
                      className={`rounded-lg px-3 py-2 text-sm ${
                        (message.sender === "admin" && isAdmin) || (message.sender === "user" && !isAdmin)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      } ${message.isFile ? "bg-blue-50 border border-blue-200" : ""}`}
                    >
                      {message.text}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback className="text-xs">{isAdmin ? "JD" : "ST"}</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="sm" className="flex-shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Mock chat messages for users
const userChatMessages = [
  {
    id: "1",
    text: "Hi, I'm having trouble logging into my account. It says my password is incorrect but I'm sure it's right.",
    sender: "user",
    senderName: "John Doe",
    timestamp: "2:30 PM",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "2",
    text: "Hello John! I'm Sarah from the technical support team. I'd be happy to help you with your login issue. Let me check your account status first.",
    sender: "admin",
    senderName: "Sarah Tech",
    timestamp: "2:31 PM",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "3",
    text: "I can see your account is active. Have you tried resetting your password recently?",
    sender: "admin",
    senderName: "Sarah Tech",
    timestamp: "2:32 PM",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "4",
    text: "No, I haven't tried that yet. Should I do that now?",
    sender: "user",
    senderName: "John Doe",
    timestamp: "2:33 PM",
    avatar: "/placeholder.svg?height=32&width=32",
  },
]

// Mock chat messages for admins
const adminChatMessages = [
  {
    id: "1",
    text: "Hello, I need help with my billing. I was charged twice for this month's subscription.",
    sender: "user",
    senderName: "John Doe",
    timestamp: "1:15 PM",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "2",
    text: "Hi John! I'm sorry to hear about the billing issue. Let me look into your account right away.",
    sender: "admin",
    senderName: "Sarah Tech",
    timestamp: "1:16 PM",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "3",
    text: "I can see the duplicate charge on your account. I'll process a refund for the extra charge immediately.",
    sender: "admin",
    senderName: "Sarah Tech",
    timestamp: "1:18 PM",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "4",
    text: "Thank you so much! How long will it take for the refund to appear?",
    sender: "user",
    senderName: "John Doe",
    timestamp: "1:19 PM",
    avatar: "/placeholder.svg?height=32&width=32",
  },
]
