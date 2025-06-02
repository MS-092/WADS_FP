"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Search, Phone, Video, MoreHorizontal, Clock, CheckCircle } from "lucide-react"

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredChats = chatSessions.filter(
    (chat) =>
      chat.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || chat.ticketId.includes(searchQuery),
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Live Chat</h2>
        <p className="text-muted-foreground">Communicate with support agents in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Chat List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Active Chats
            </CardTitle>
            <CardDescription>Your ongoing conversations</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="p-2">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                      selectedChat?.id === chat.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={chat.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {chat.customerName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            chat.status === "online"
                              ? "bg-green-500"
                              : chat.status === "away"
                                ? "bg-yellow-500"
                                : "bg-gray-400"
                          }`}
                        ></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">{chat.customerName}</h4>
                          <span className="text-xs text-muted-foreground">{chat.lastMessageTime}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            #{chat.ticketId}
                          </Badge>
                          <Badge
                            variant={
                              chat.priority === "High"
                                ? "destructive"
                                : chat.priority === "Medium"
                                  ? "default"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {chat.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                        {chat.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            {chat.unreadCount} new
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2">
          {selectedChat ? (
            <ChatWindow chat={selectedChat} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a chat to start messaging</h3>
                <p className="text-muted-foreground">Choose a conversation from the list to view messages</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function ChatWindow({ chat }) {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState(mockMessages)

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: "user",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "sent",
      }
      setMessages((prev) => [...prev, message])
      setNewMessage("")
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={chat.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {chat.customerName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{chat.customerName}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>Ticket #{chat.ticketId}</span>
                <Badge
                  variant={
                    chat.priority === "High" ? "destructive" : chat.priority === "Medium" ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {chat.priority}
                </Badge>
                <span className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      chat.status === "online"
                        ? "bg-green-500"
                        : chat.status === "away"
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                    }`}
                  ></div>
                  {chat.status}
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-[500px]">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={message.sender === "user" ? "/placeholder.svg?height=32&width=32" : chat.avatar} />
                  <AvatarFallback>
                    {message.sender === "user"
                      ? "You"
                      : chat.customerName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col max-w-[70%] ${message.sender === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {message.text}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                    {message.sender === "user" && (
                      <div className="text-xs text-muted-foreground">
                        {message.status === "sent" && <Clock className="h-3 w-3" />}
                        {message.status === "delivered" && <CheckCircle className="h-3 w-3" />}
                        {message.status === "read" && <CheckCircle className="h-3 w-3 text-blue-500" />}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </div>
      </CardContent>
    </>
  )
}

// Mock data
const chatSessions = [
  {
    id: "1",
    customerName: "John Doe",
    ticketId: "1001",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "online",
    priority: "High",
    lastMessage: "I'm still having trouble with the login issue...",
    lastMessageTime: "2m ago",
    unreadCount: 2,
  },
  {
    id: "2",
    customerName: "Sarah Williams",
    ticketId: "1004",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "away",
    priority: "Medium",
    lastMessage: "The app crashes when I try to upload...",
    lastMessageTime: "15m ago",
    unreadCount: 0,
  },
  {
    id: "3",
    customerName: "Michael Brown",
    ticketId: "1005",
    avatar: "/placeholder.svg?height=40&width=40",
    
    priority: "Low",
    lastMessage: "Thank you for your help!",
    lastMessageTime: "1h ago",
    unreadCount: 0,
  },
]

const mockMessages = [
  {
    id: "1",
    text: "Hi, I'm having trouble logging into my account. The password reset isn't working.",
    sender: "customer",
    timestamp: "2:30 PM",
    status: "read",
  },
  {
    id: "2",
    text: "Hello! I'm here to help you with your login issue. Let me check your account status first.",
    sender: "user",
    timestamp: "2:31 PM",
    status: "read",
  },
  {
    id: "3",
    text: "I can see your account is active. Can you tell me what error message you're seeing when you try to reset your password?",
    sender: "user",
    timestamp: "2:32 PM",
    status: "read",
  },
  {
    id: "4",
    text: "It says 'Invalid email address' but I'm using the same email I always use.",
    sender: "customer",
    timestamp: "2:33 PM",
    status: "delivered",
  },
]
