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
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { apiClient } from "@/lib/api"
import { formatDateOnly } from "@/lib/time-utils"

export default function UserTicketViewPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id

  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (ticketId) {
      loadTicketData()
    }
  }, [ticketId])

  const loadTicketData = async () => {
    try {
      setLoading(true)
      setError("")
      
      // Load ticket details and comments in parallel
      const [ticketResponse, commentsResponse] = await Promise.all([
        apiClient.getTicket(ticketId),
        apiClient.getTicketComments(ticketId)
      ])
      
      if (ticketResponse.data) {
        setTicket(ticketResponse.data)
      } else {
        setError(ticketResponse.error || "Failed to load ticket")
      }
      
      if (commentsResponse.data) {
        setComments(commentsResponse.data)
      } else {
        setError(commentsResponse.error || "Failed to load comments")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Error loading ticket data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      setSending(true)
      const response = await apiClient.createComment(ticketId, {
        content: newMessage.trim(),
        is_internal: false
      })

      if (response.data) {
        setComments(prev => [...prev, response.data])
        setNewMessage("")
        // Reload ticket to get updated status if needed
        await loadTicketData()
      } else {
        setError(response.error || "Failed to send message")
      }
    } catch (err) {
      setError("Failed to send message")
      console.error("Error sending message:", err)
    } finally {
      setSending(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
      case "in_progress":
      case "in-progress":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
      case "resolved":
      case "closed":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
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
      case "in_progress":
      case "in-progress":
        return <MessageSquare className="h-4 w-4" />
      case "resolved":
      case "closed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const formatUserName = (user) => {
    if (!user) return "Unknown User"
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.email?.split('@')[0] || "Unknown User"
  }

  const getInitials = (name) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"
  }

  const formatTimeline = (ticket) => {
    const events = []
    
    if (ticket.created_at) {
      events.push({
        action: "Ticket created",
        timestamp: formatDateOnly(ticket.created_at)
      })
    }
    
    if (ticket.assigned_agent) {
      events.push({
        action: `Assigned to ${formatUserName(ticket.assigned_agent)}`,
        timestamp: formatDateOnly(ticket.updated_at)
      })
    }
    
    if (comments.length > 0) {
      const firstAgentComment = comments.find(c => !c.is_internal && c.user?.role !== 'CUSTOMER')
      if (firstAgentComment) {
        events.push({
          action: "First response received",
          timestamp: formatDateOnly(firstAgentComment.created_at)
        })
      }
    }
    
    if (ticket.status && ticket.status !== 'open') {
      events.push({
        action: `Status updated to ${ticket.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        timestamp: formatDateOnly(ticket.updated_at)
      })
    }
    
    return events
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading ticket...</span>
      </div>
    )
  }

  if (error && !ticket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Tickets
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Tickets
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Ticket not found</p>
        </div>
      </div>
    )
  }

  const timeline = formatTimeline(ticket)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Tickets
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Ticket #{ticketId}</h1>
          <p className="text-muted-foreground">View ticket details and communicate with support</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
                    {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <p className="text-sm font-medium mt-1">{ticket.category || "General"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <p className="text-sm mt-1">{formatDateOnly(ticket.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                  <p className="text-sm mt-1">{formatDateOnly(ticket.updated_at)}</p>
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
                {ticket.assigned_agent ? `Assigned to ${formatUserName(ticket.assigned_agent)}` : "Waiting for assignment"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages yet. Start the conversation below.
                  </div>
                ) : (
                  comments
                    .filter(comment => !comment.is_internal)
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    .map((comment) => {
                      const isCustomer = comment.user?.role === 'CUSTOMER'
                      const userName = formatUserName(comment.user)
                      
                      return (
                        <div key={comment.id} className={`flex gap-4 ${isCustomer ? "flex-row-reverse" : ""}`}>
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src="/placeholder.svg?height=40&width=40" />
                            <AvatarFallback>
                              {getInitials(userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 max-w-[80%] ${isCustomer ? "text-right" : ""}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm">{userName}</span>
                              <Badge variant={isCustomer ? "default" : "secondary"} className="text-xs">
                                {isCustomer ? "Customer" : "Support Agent"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{formatDateOnly(comment.created_at)}</span>
                            </div>
                            <div
                              className={`p-3 rounded-lg text-sm ${
                                isCustomer ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                              }`}
                            >
                              {comment.content}
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
                <Label>Send a message to support</Label>
                <Textarea
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[100px]"
                  disabled={sending}
                />
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" disabled>
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach File
                  </Button>
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim() || sending}>
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Support Agent */}
          {ticket.assigned_agent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Your Support Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg?height=48&width=48" />
                    <AvatarFallback>{getInitials(formatUserName(ticket.assigned_agent))}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{formatUserName(ticket.assigned_agent)}</h3>
                    <p className="text-sm text-muted-foreground">Technical Support</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground">Available</span>
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Average response time: <span className="font-medium">2 hours</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Customer satisfaction: <span className="font-medium">98%</span>
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
                Ticket Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Ticket ID</Label>
                <p className="text-sm font-mono mt-1">#{ticket.id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                <p className="text-sm mt-1">{ticket.category || "General"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Priority Level</Label>
                <div
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-1 ${getPriorityColor(ticket.priority)}`}
                >
                  {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Expected Response</Label>
                <p className="text-sm mt-1">
                  {ticket.priority === 'high' ? 'Within 4 hours' : 
                   ticket.priority === 'medium' ? 'Within 1 day' : 'Within 2 days'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          {timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((event, index) => (
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
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Related Help Articles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <a href="#" className="block text-sm text-primary hover:underline">
                  How to reset your password
                </a>
                <a href="#" className="block text-sm text-primary hover:underline">
                  Troubleshooting login issues
                </a>
                <a href="#" className="block text-sm text-primary hover:underline">
                  Account security best practices
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 