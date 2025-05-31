"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Search, Phone, Video, MoreHorizontal, Clock, CheckCircle, Users, UserPlus, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminChatPage() {
  const [chatRooms, setChatRooms] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("active")

  useEffect(() => {
    loadChatRooms()
  }, [])

  const loadChatRooms = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getChatRooms()
      if (response.data) {
        setChatRooms(response.data)
      } else {
        setError(response.error || "Failed to load chat rooms")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getFilteredChats = () => {
    let chats = chatRooms

    if (activeTab === "active") {
      chats = chats.filter((chat) => chat.is_active !== false)
    } else if (activeTab === "waiting") {
      chats = chats.filter((chat) => chat.type === "support" && chat.is_active !== false)
    } else if (activeTab === "assigned") {
      // This would need to be filtered based on current user assignment
      // For now, we'll show all active chats
      chats = chats.filter((chat) => chat.is_active !== false)
    } else if (activeTab === "closed") {
      chats = chats.filter((chat) => chat.is_active === false)
    }

    return chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (chat.ticket_id && chat.ticket_id.toString().includes(searchQuery))
    )
  }

  const filteredChats = getFilteredChats()

  const getRelativeTime = (dateString) => {
    if (!dateString) return ""
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

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
            {chatRooms.filter((c) => c.is_active !== false).length} Active
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {chatRooms.filter((c) => c.type === "support" && c.is_active !== false).length} Support
          </Badge>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active Chats</TabsTrigger>
          <TabsTrigger value="waiting">Support Requests</TabsTrigger>
          <TabsTrigger value="assigned">All Rooms</TabsTrigger>
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
                {activeTab === "waiting" && "Support requests"}
                {activeTab === "assigned" && "All chat rooms"}
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
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading chats...</span>
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="text-center p-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No chat sessions</h3>
                    <p className="text-muted-foreground">
                      {chatRooms.length === 0 
                        ? "No chat sessions have been created yet." 
                        : "No chats match your current filters."
                      }
                    </p>
                  </div>
                ) : (
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
                              <AvatarFallback>
                                {chat.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                              chat.is_active ? "bg-green-500" : "bg-gray-400"
                            }`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-sm truncate">{chat.name}</h4>
                              <span className="text-xs text-muted-foreground">
                                {getRelativeTime(chat.last_message_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              {chat.ticket_id && (
                                <Badge variant="outline" className="text-xs">
                                  #{chat.ticket_id}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {chat.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {chat.last_message_preview || "No messages yet"}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground">
                                {chat.participant_count || 0} participants
                              </span>
                              {chat.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {chat.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (chat?.id) {
      loadMessages()
    }
  }, [chat?.id])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getRoomMessages(chat.id.toString())
      if (response.data) {
        setMessages(response.data)
      } else {
        setError(response.error || "Failed to load messages")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const response = await apiClient.sendRoomMessage(chat.id.toString(), newMessage.trim())
      
      if (response.data) {
        setMessages(prev => [...prev, response.data])
        setNewMessage("")
      } else {
        setError(response.error || "Failed to send message")
      }
    } catch (err) {
      setError("Failed to send message")
    } finally {
      setSending(false)
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

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getCurrentUserId = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          return user.id
        } catch {
          return null
        }
      }
    }
    return null
  }

  return (
    <>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {chat.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{chat.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                {chat.ticket_id && <span>Ticket #{chat.ticket_id}</span>}
                <Badge variant="secondary" className="text-xs">
                  {chat.type}
                </Badge>
                <span className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${chat.is_active ? "bg-green-500" : "bg-gray-400"}`}></div>
                  {chat.is_active ? "Active" : "Inactive"}
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAssignToMe}>
              <UserPlus className="h-4 w-4 mr-1" />
              Manage
            </Button>
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
        <div className="flex items-center gap-2 pt-2">
          <Badge variant="secondary" className="text-xs">
            {chat.participant_count || 0} participants
          </Badge>
          <span className="text-xs text-muted-foreground">
            Created: {new Date(chat.created_at || Date.now()).toLocaleDateString()}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-[500px]">
        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center p-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p className="text-muted-foreground">This chat room doesn't have any messages yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.user?.id === getCurrentUserId() ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>
                      {message.user ? 
                        (message.user.first_name?.[0] || "") + (message.user.last_name?.[0] || "") :
                        "?"
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col max-w-[70%] ${message.user?.id === getCurrentUserId() ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {message.user ? 
                          `${message.user.first_name} ${message.user.last_name}` :
                          "Unknown User"
                        }
                        {message.user?.id === getCurrentUserId() && " (You)"}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatTime(message.created_at)}</span>
                    </div>
                    <div className={`rounded-lg px-3 py-2 text-sm ${
                      message.user?.id === getCurrentUserId() ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      {message.content}
                    </div>
                    {message.user?.id === getCurrentUserId() && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              className="flex-1"
              disabled={sending}
            />
            <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </div>
        </div>
      </CardContent>
    </>
  )
}
