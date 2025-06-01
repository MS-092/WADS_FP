"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Clock,
  User,
  MessageSquare,
  Send,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Edit,
  Save,
  X,
  Loader2,
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { formatDateOnly } from "@/lib/time-utils"

export default function AdminTicketManagePage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id

  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [newResponse, setNewResponse] = useState("")
  const [internalNote, setInternalNote] = useState("")

  useEffect(() => {
    loadTicketData()
  }, [ticketId])

  const loadTicketData = async () => {
    try {
      setLoading(true)
      setError("")
      
      const [ticketResponse, commentsResponse] = await Promise.all([
        apiClient.getTicket(ticketId),
        apiClient.getTicketComments(ticketId, true)
      ])

      if (ticketResponse.error) {
        setError(ticketResponse.error)
        return
      }

      if (commentsResponse.error) {
        setError(commentsResponse.error)
        return
      }

      setTicket(ticketResponse.data)
      setComments(commentsResponse.data || [])
    } catch (err) {
      setError("Failed to load ticket data")
      console.error("Error loading ticket:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true)
      const response = await apiClient.updateTicket(ticketId, { status: newStatus.toLowerCase() })
      
      if (response.error) {
        setError(response.error)
        return
      }

      setTicket(prev => ({ ...prev, status: newStatus.toLowerCase() }))
    } catch (err) {
      setError("Failed to update ticket status")
      console.error("Error updating status:", err)
    } finally {
      setUpdating(false)
    }
  }

  const handlePriorityChange = async (newPriority) => {
    try {
      setUpdating(true)
      const response = await apiClient.updateTicket(ticketId, { priority: newPriority.toLowerCase() })
      
      if (response.error) {
        setError(response.error)
        return
      }

      setTicket(prev => ({ ...prev, priority: newPriority.toLowerCase() }))
    } catch (err) {
      setError("Failed to update ticket priority")
      console.error("Error updating priority:", err)
    } finally {
      setUpdating(false)
    }
  }

  const handleSendResponse = async () => {
    if (!newResponse.trim()) return

    try {
      setUpdating(true)
      const response = await apiClient.addComment(ticketId, {
        content: newResponse,
        is_internal: false
      })
      
      if (response.error) {
        setError(response.error)
        return
      }

      // Refresh comments to get the new one
      await loadTicketData()
      setNewResponse("")
    } catch (err) {
      setError("Failed to send response")
      console.error("Error sending response:", err)
    } finally {
      setUpdating(false)
    }
  }

  const handleAddInternalNote = async () => {
    if (!internalNote.trim()) return

    try {
      setUpdating(true)
      const response = await apiClient.addComment(ticketId, {
        content: internalNote,
        is_internal: true
      })
      
      if (response.error) {
        setError(response.error)
        return
      }

      // Refresh comments to get the new one
      await loadTicketData()
      setInternalNote("")
    } catch (err) {
      setError("Failed to add internal note")
      console.error("Error adding internal note:", err)
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
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
      case "critical":
        return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
      case "medium":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
      case "low":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const formatStatus = (status) => {
    return status?.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()) || "Unknown"
  }

  const formatPriority = (priority) => {
    return priority?.charAt(0).toUpperCase() + priority?.slice(1) || "Unknown"
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
            Back to Tickets
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
            Back to Tickets
          </Button>
        </div>
        <div className="text-center p-8">
          <div className="text-muted-foreground">Ticket not found.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Ticket #{ticketId}</h1>
          <p className="text-muted-foreground">Manage and respond to customer ticket</p>
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
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)} disabled={updating}>
                  {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  {isEditing ? (
                    <Select value={ticket.status} onValueChange={handleStatusChange} disabled={updating}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-1 ${getStatusColor(ticket.status)}`}
                    >
                      {formatStatus(ticket.status)}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  {isEditing ? (
                    <Select value={ticket.priority} onValueChange={handlePriorityChange} disabled={updating}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-1 ${getPriorityColor(ticket.priority)}`}
                    >
                      {formatPriority(ticket.priority)}
                    </div>
                  )}
                </div>
              </div>
              {isEditing && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => setIsEditing(false)} disabled={updating}>
                    {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {updating ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={updating}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Communication History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Communication History
              </CardTitle>
              <CardDescription>Messages and responses for this ticket</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">All Messages</TabsTrigger>
                  <TabsTrigger value="customer">Customer Messages</TabsTrigger>
                  <TabsTrigger value="internal">Internal Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {comments
                      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                      .map((comment) => (
                        <div key={comment.id} className="flex gap-4 p-4 border rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg?height=40&width=40" />
                            <AvatarFallback>
                              {comment.user?.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{comment.user?.full_name || "Unknown User"}</span>
                              <Badge variant={comment.is_internal ? "secondary" : "default"} className="text-xs">
                                {comment.is_internal ? "Internal Note" : "Response"}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDateOnly(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    {comments.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No comments yet
                      </div>
                    )}
                  </div>

                  {/* Add Response */}
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <Label className="text-sm font-medium">Add Response</Label>
                      <Textarea
                        placeholder="Type your response to the customer..."
                        value={newResponse}
                        onChange={(e) => setNewResponse(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                      <Button 
                        className="mt-2" 
                        onClick={handleSendResponse} 
                        disabled={!newResponse.trim() || updating}
                      >
                        {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        {updating ? "Sending..." : "Send Response"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="customer" className="space-y-4">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {comments
                      .filter((comment) => !comment.is_internal)
                      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                      .map((comment) => (
                        <div key={comment.id} className="flex gap-4 p-4 border rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg?height=40&width=40" />
                            <AvatarFallback>
                              {comment.user?.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{comment.user?.full_name || "Unknown User"}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatDateOnly(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="internal" className="space-y-4">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {comments
                      .filter((comment) => comment.is_internal)
                      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                      .map((comment) => (
                        <div key={comment.id} className="flex gap-4 p-4 border rounded-lg bg-muted/50">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg?height=40&width=40" />
                            <AvatarFallback>
                              {comment.user?.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{comment.user?.full_name || "Unknown User"}</span>
                              <Badge variant="secondary" className="text-xs">
                                Internal Note
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDateOnly(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium">Add Internal Note</Label>
                    <Textarea
                      placeholder="Add an internal note (only visible to agents)..."
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                    <Button 
                      className="mt-2" 
                      variant="outline" 
                      onClick={handleAddInternalNote}
                      disabled={!internalNote.trim() || updating}
                    >
                      {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                      {updating ? "Adding..." : "Add Internal Note"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/placeholder.svg?height=48&width=48" />
                  <AvatarFallback>
                    {ticket.user?.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{ticket.user?.full_name || "Unknown User"}</h3>
                  <p className="text-sm text-muted-foreground">{ticket.user?.email || "No email"}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{ticket.user?.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Customer since {formatDateOnly(ticket.user?.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Ticket Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-muted-foreground mt-1">{formatDateOnly(ticket.created_at)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm text-muted-foreground mt-1">{formatDateOnly(ticket.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => handleStatusChange(ticket.status === "resolved" ? "open" : "resolved")}
                disabled={updating}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {ticket.status === "resolved" ? "Reopen Ticket" : "Mark as Resolved"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => handleStatusChange("closed")}
                disabled={updating || ticket.status === "closed"}
              >
                <X className="h-4 w-4 mr-2" />
                Close Ticket
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 