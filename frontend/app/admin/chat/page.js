"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Search, Phone, Video, MoreHorizontal, Clock, CheckCircle, Users, UserPlus } from "lucide-react"

export default function AdminChatPage() {
  const [selectedChat, setSelectedChat] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("active")

  const getFilteredChats = () => {
    let chats = adminChatSessions

    if (activeTab === "active") {
      chats = chats.filter((chat) => chat.status !== "closed")
    } else if (activeTab === "waiting") {
      chats = chats.filter((chat) => chat.assignedAgent === null)
    } else if (activeTab === "assigned") {
      chats = chats.filter((chat) => chat.assignedAgent === "Sarah Tech")
    }

    return chats.filter(
      (chat) =>
        chat.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || chat.ticketId.includes(searchQuery),
    )
  }

  const filteredChats = getFilteredChats()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Chat Management</h2>
          <p className="text-muted-foreground">Monitor and manage all customer chat sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {adminChatSessions.filter((c) => c.status === "active").length} Active
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {adminChatSessions.filter((c) => c.assignedAgent === null).length} Waiting
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active Chats</TabsTrigger>
          <TabsTrigger value="waiting">Waiting Assignment</TabsTrigger>
          <TabsTrigger value="assigned">My Chats</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
          {/* Chat List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Chat Sessions
              </CardTitle>
              <CardDescription>
                {activeTab === "active" && "All active conversations"}
                {activeTab === "waiting" && "Chats waiting for assignment"}
                {activeTab === "assigned" && "Your assigned chats"}
                {activeTab === "closed" && "Recently closed chats"}
              </CardDescription>
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
                              chat.customerStatus === "online"
                                ? "bg-green-500"
                                : chat.customerStatus === "away"
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
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                              {chat.assignedAgent ? `Assigned to ${chat.assignedAgent}` : "Unassigned"}
                            </span>
                            {chat.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
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
              <AdminChatWindow chat={selectedChat} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a chat to start managing</h3>
                  <p className="text-muted-foreground">Choose a conversation from the list to view and respond</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </Tabs>
    </div>
  )
}

function AdminChatWindow({ chat }) {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState(adminMockMessages)

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: "admin",
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

  const handleAssignToMe = () => {
    // In a real app, this would make an API call
    console.log("Assigning chat to current admin")
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
                      chat.customerStatus === "online"
                        ? "bg-green-500"
                        : chat.customerStatus === "away"
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                    }`}
                  ></div>
                  {chat.customerStatus}
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!chat.assignedAgent && (
              <Button variant="outline" size="sm" onClick={handleAssignToMe}>
                <UserPlus className="h-4 w-4 mr-1" />
                Assign to Me
              </Button>
            )}
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
        {chat.assignedAgent && (
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="secondary" className="text-xs">
              Assigned to {chat.assignedAgent}
            </Badge>
            <span className="text-xs text-muted-foreground">Response time: {chat.avgResponseTime}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-[500px]">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.sender === "admin" ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={message.sender === "admin" ? "/placeholder.svg?height=32&width=32" : chat.avatar} />
                  <AvatarFallback>
                    {message.sender === "admin"
                      ? "ST"
                      : chat.customerName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`flex flex-col max-w-[70%] ${message.sender === "admin" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {message.sender === "admin" ? "Sarah Tech (You)" : chat.customerName}
                    </span>
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      message.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {message.text}
                  </div>
                  {message.sender === "admin" && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="text-xs text-muted-foreground">
                        {message.status === "sent" && <Clock className="h-3 w-3" />}
                        {message.status === "delivered" && <CheckCircle className="h-3 w-3" />}
                        {message.status === "read" && <CheckCircle className="h-3 w-3 text-blue-500" />}
                      </div>
                    </div>
                  )}
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
              placeholder="Type your response..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </div>
      </CardContent>
    </>
  )
}

// Mock data for admin chat sessions
const adminChatSessions = [
  {
    id: "1",
    customerName: "John Doe",
    ticketId: "1001",
    avatar: "/placeholder.svg?height=40&width=40",
    customerStatus: "online",
    priority: "High",
    lastMessage: "I'm still having trouble with the login issue...",
    lastMessageTime: "2m ago",
    unreadCount: 2,
    assignedAgent: "Sarah Tech",
    avgResponseTime: "2m",
    status: "active",
  },
  {
    id: "2",
    customerName: "Sarah Williams",
    ticketId: "1004",
    avatar: "/placeholder.svg?height=40&width=40",
    customerStatus: "away",
    priority: "Medium",
    lastMessage: "The app crashes when I try to upload...",
    lastMessageTime: "15m ago",
    unreadCount: 0,
    assignedAgent: null,
    avgResponseTime: null,
    status: "active",
  },
  {
    id: "3",
    customerName: "Michael Brown",
    ticketId: "1005",
    avatar: "/placeholder.svg?height=40&width=40",
    customerStatus: "offline",
    priority: "Low",
    lastMessage: "Thank you for your help!",
    lastMessageTime: "1h ago",
    unreadCount: 0,
    assignedAgent: "Mike Support",
    avgResponseTime: "5m",
    status: "closed",
  },
  {
    id: "4",
    customerName: "Emily Davis",
    ticketId: "1006",
    avatar: "/placeholder.svg?height=40&width=40",
    customerStatus: "online",
    priority: "High",
    lastMessage: "I need help with password reset",
    lastMessageTime: "5m ago",
    unreadCount: 1,
    assignedAgent: null,
    avgResponseTime: null,
    status: "active",
  },
]

const adminMockMessages = [
  {
    id: "1",
    text: "Hi, I'm having trouble logging into my account. The password reset isn't working.",
    sender: "customer",
    timestamp: "2:30 PM",
    status: "read",
  },
  {
    id: "2",
    text: "Hello John! I'm Sarah from the technical support team. I'm here to help you with your login issue. Let me check your account status first.",
    sender: "admin",
    timestamp: "2:31 PM",
    status: "read",
  },
  {
    id: "3",
    text: "I can see your account is active. Can you tell me what error message you're seeing when you try to reset your password?",
    sender: "admin",
    timestamp: "2:32 PM",
    status: "read",
  },
  {
    id: "4",
    text: "It says 'Invalid email address' but I'm using the same email I always use: john.doe@email.com",
    sender: "customer",
    timestamp: "2:33 PM",
    status: "delivered",
  },
  {
    id: "5",
    text: "I see the issue. There seems to be a temporary problem with our password reset system. Let me manually reset your password for you.",
    sender: "admin",
    timestamp: "2:35 PM",
    status: "sent",
  },
]
