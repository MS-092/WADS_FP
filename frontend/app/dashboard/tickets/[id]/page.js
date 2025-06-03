"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  Send,
  Paperclip,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  Tag,
  Loader2,
} from "lucide-react"
import { ticketAPI, chatAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function UserTicketViewPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id
  const { user } = useAuth()

  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (ticketId) {
      fetchTicketData()
    }
  }, [ticketId])

  const fetchTicketData = async () => {
    try {
      setLoading(true)
      setError("")

      // Fetch ticket details and messages in parallel
      const [ticketResponse, messagesResponse] = await Promise.all([
        ticketAPI.getTicket(ticketId),
        chatAPI.getMessages(ticketId)
      ])

      if (ticketResponse) {
        setTicket(ticketResponse)
      }

      if (messagesResponse && messagesResponse.messages) {
        setMessages(messagesResponse.messages)
      }
    } catch (error) {
      console.error('Error fetching ticket data:', error)
      setError(error.message || 'Failed to load ticket')
      toast.error('Failed to load ticket details')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return

    try {
      setSendingMessage(true)
      
      const response = await chatAPI.sendMessage(ticketId, newMessage.trim())
      
      if (response) {
        // Add the new message to the messages list
        setMessages(prev => [...prev, response])
        setNewMessage("")
        toast.success('Message sent successfully')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
      case "in-progress":
      case "in_progress":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
      case "resolved":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
      case "closed":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
      case "medium":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
      case "low":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return <Clock className="h-4 w-4" />
      case "in-progress":
      case "in_progress":
        return <MessageSquare className="h-4 w-4" />
      case "resolved":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleString()
    } catch (error) {
      return "Invalid date"
    }
  }

  const formatMessageAuthor = (message) => {
    // Check if message is from current user for styling purposes
    const isCurrentUser = message.sender?.id === user?.id || message.sender?._id === user?.id || String(message.sender?.id) === String(user?.id)
    
    // Always use the actual sender's information from the message
    const senderName = message.sender?.full_name || message.sender?.username || "Unknown User"
    const senderRole = message.sender?.role || "user"
    
    // Format role display
    let roleDisplay = "Customer"
    if (senderRole === "admin") {
      roleDisplay = "Admin"
    } else if (senderRole === "agent") {
      roleDisplay = "Agent"
    } else if (senderRole === "customer") {
      roleDisplay = "Customer"
    }
    
    return {
      name: senderName,
      role: roleDisplay,
      isCustomer: isCurrentUser && user?.role === "customer"
    }
  }

  const generateTimeline = (ticket) => {
    if (!ticket) return []
    
    const timeline = []
    
    if (ticket.created_at) {
      timeline.push({
        action: "Ticket created",
        timestamp: formatDate(ticket.created_at)
      })
    }
    
    if (ticket.assigned_to) {
      timeline.push({
        action: `Assigned to ${ticket.assigned_to.full_name || ticket.assigned_to.username}`,
        timestamp: formatDate(ticket.updated_at)
      })
    }
    
    if (messages.length > 0) {
      timeline.push({
        action: "First response received",
        timestamp: formatDate(messages[0]?.created_at)
      })
    }
    
    if (ticket.status !== "open") {
      timeline.push({
        action: `Status updated to ${ticket.status.replace("_", " ")}`,
        timestamp: formatDate(ticket.updated_at)
      })
    }
    
    return timeline
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading ticket details...</p>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error || "Ticket not found"}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
      </div>
    )
  }

  const timeline = generateTimeline(ticket)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Tickets
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Order #{ticket._id?.slice(-6) || ticket.id}</h1>
          <p className="text-muted-foreground">View order details and communicate with our fragrance specialists</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{ticket.title}</CardTitle>
                  <CardDescription className="mt-2">{ticket.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(ticket.status)}`}
                  >
                    {getStatusIcon(ticket.status)}
                    <span className="ml-1 capitalize">{ticket.status?.replace("_", " ")}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                  <div
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-1 ${getPriorityColor(ticket.priority)}`}
                  >
                    {ticket.priority}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <p className="text-sm font-medium mt-1">{ticket.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <p className="text-sm mt-1">{formatDate(ticket.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                  <p className="text-sm mt-1">{formatDate(ticket.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation
              </CardTitle>
              <CardDescription>
                {ticket.assigned_to 
                  ? `Assigned to ${ticket.assigned_to.full_name || ticket.assigned_to.username}` 
                  : "Waiting for assignment"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const authorInfo = formatMessageAuthor(message)
                    return (
                      <div 
                        key={message._id || message.id} 
                        className={`flex gap-4 p-4 border rounded-lg ${
                          authorInfo.isCustomer 
                            ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800" 
                            : authorInfo.role === "Admin" 
                              ? "bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800"
                              : "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                        }`}
                      >
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={message.sender?.avatar_url || "/placeholder.svg?height=40&width=40"} />
                          <AvatarFallback className={
                            authorInfo.isCustomer 
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                              : authorInfo.role === "Admin"
                                ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400" 
                                : "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                          }>
                            {authorInfo.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">{authorInfo.name}</span>
                            <Badge 
                              variant={
                                authorInfo.isCustomer 
                                  ? "default" 
                                  : authorInfo.role === "Admin" 
                                    ? "destructive" 
                                    : "secondary"
                              } 
                              className="text-xs"
                            >
                              {authorInfo.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{formatDate(message.created_at)}</span>
                          </div>
                          <div className="text-sm leading-relaxed">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <Separator className="my-6" />

              {/* Message Input */}
              <div className="space-y-4">
                <Label>Send a message to our fragrance experts</Label>
                <Textarea
                  placeholder="Describe your fragrance inquiry or order concern..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[100px]"
                  disabled={sendingMessage || ticket.status === "closed"}
                />
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" disabled={ticket.status === "closed"}>
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach File
                  </Button>
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim() || sendingMessage || ticket.status === "closed"}
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Message
                  </Button>
                </div>
                {ticket.status === "closed" && (
                  <p className="text-sm text-muted-foreground">This order inquiry is closed and no longer accepts new messages.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Support Agent */}
          {ticket.assigned_to && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Your Fragrance Specialist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={ticket.assigned_to.avatar_url || "/placeholder.svg?height=48&width=48"} />
                    <AvatarFallback>
                      {ticket.assigned_to.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "SA"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{ticket.assigned_to.full_name || ticket.assigned_to.username}</h3>
                    <p className="text-sm text-muted-foreground">
                      {ticket.assigned_to.role === "admin" ? "Senior Fragrance Consultant" : "Fragrance Support Specialist"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground">Available</span>
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Department: <span className="font-medium">{ticket.assigned_to.department || "Fragrance Support"}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ticket Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Ticket ID</Label>
                <p className="text-sm font-mono mt-1">#{ticket._id?.slice(-6) || ticket.id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                <p className="text-sm mt-1">{ticket.category}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Priority Level</Label>
                <div
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-1 ${getPriorityColor(ticket.priority)}`}
                >
                  {ticket.priority}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <div
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-1 ${getStatusColor(ticket.status)}`}
                >
                  {getStatusIcon(ticket.status)}
                  <span className="ml-1 capitalize">{ticket.status?.replace("_", " ")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No timeline events available.</p>
                ) : (
                  timeline.map((event, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        {index < timeline.length - 1 && <div className="w-px h-8 bg-border mt-2"></div>}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">{event.action}</p>
                        <p className="text-xs text-muted-foreground">{event.timestamp}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 