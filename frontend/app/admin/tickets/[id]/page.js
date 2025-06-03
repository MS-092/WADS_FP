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
import { Loader2, AlertCircle } from "lucide-react"
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
} from "lucide-react"
import { adminAPI, chatAPI, usersAPI } from "@/lib/api"

export default function AdminTicketManagePage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [newResponse, setNewResponse] = useState("")
  const [internalNote, setInternalNote] = useState("")
  const [agents, setAgents] = useState([])
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  // Fetch ticket data
  const fetchTicket = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminAPI.getTicket(ticketId)
      setTicket(response)
    } catch (error) {
      console.error('Error fetching ticket:', error)
      setError(error.message || 'Failed to fetch ticket')
    } finally {
      setLoading(false)
    }
  }

  // Fetch available agents
  const fetchAgents = async () => {
    try {
      const response = await usersAPI.getAgents()
      setAgents(response || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
      // Set empty array on error so the component doesn't break
      setAgents([])
    }
  }

  // Fetch chat messages for the ticket
  const fetchMessages = async () => {
    try {
      setMessagesLoading(true)
      const response = await chatAPI.getMessages(ticketId)
      setMessages(response.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    if (ticketId) {
      fetchTicket()
      fetchAgents()
      fetchMessages()
    }
  }, [ticketId])

  const handleStatusChange = async (newStatus) => {
    try {
      setSaving(true)
      // Map display values to backend values
      const statusMap = {
        "Open": "open",
        "In Progress": "in_progress",
        "Pending": "pending", 
        "Resolved": "resolved",
        "Closed": "closed",
        "Cancelled": "cancelled"
      }
      
      const backendStatus = statusMap[newStatus] || newStatus.toLowerCase()
      
      const updatedTicket = await adminAPI.updateTicket(ticketId, { 
        status: backendStatus 
      })
      setTicket(updatedTicket)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const handlePriorityChange = async (newPriority) => {
    try {
      setSaving(true)
      // Map display values to backend values  
      const priorityMap = {
        "Low": "low",
        "Medium": "medium", 
        "High": "high",
        "Urgent": "urgent"
      }
      
      const backendPriority = priorityMap[newPriority] || newPriority.toLowerCase()
      
      const updatedTicket = await adminAPI.updateTicket(ticketId, { 
        priority: backendPriority 
      })
      setTicket(updatedTicket)
    } catch (error) {
      console.error('Error updating priority:', error)
      alert('Failed to update priority')
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryChange = async (newCategory) => {
    try {
      setSaving(true)
      // Map display values to backend values
      const categoryMap = {
        "Allergic Reactions": "technical",
        "Order & Billing": "billing", 
        "General Questions": "general",
        "Fragrance Recommendations": "feature_request",
        "Website Issues": "bug_report",
        "Defective/Faulty Products": "account"
      }
      
      const backendCategory = categoryMap[newCategory] || newCategory.toLowerCase()
      
      const updatedTicket = await adminAPI.updateTicket(ticketId, { 
        category: backendCategory 
      })
      setTicket(updatedTicket)
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  const handleAssigneeChange = async (newAssigneeId) => {
    try {
      setSaving(true)
      if (newAssigneeId === "unassigned") {
        // Handle unassigning
        const updatedTicket = await adminAPI.updateTicket(ticketId, { 
          assigned_to: null 
        })
        setTicket(updatedTicket)
      } else {
        // Assign to agent
        await adminAPI.assignTicket(ticketId, newAssigneeId)
        const updatedTicket = await adminAPI.getTicket(ticketId)
        setTicket(updatedTicket)
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      alert('Failed to update assignment')
    } finally {
      setSaving(false)
    }
  }

  const handleSendResponse = async () => {
    if (!newResponse.trim()) return

    try {
      setSaving(true)
      await chatAPI.sendMessage(ticketId, newResponse)
      setNewResponse("")
      // Refresh messages
      await fetchMessages()
    } catch (error) {
      console.error('Error sending response:', error)
      alert('Failed to send response')
    } finally {
      setSaving(false)
    }
  }

  const handleAddInternalNote = async () => {
    if (!internalNote.trim()) return

    try {
      setSaving(true)
      // For now, send as a regular message with a special marker
      // You might want to implement a separate internal notes system
      await chatAPI.sendMessage(ticketId, `[INTERNAL NOTE] ${internalNote}`)
      setInternalNote("")
      // Refresh messages
      await fetchMessages()
    } catch (error) {
      console.error('Error adding internal note:', error)
      alert('Failed to add internal note')
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
      case "in_progress":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
      case "pending":
        return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400"
      case "resolved":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
      case "closed":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      case "cancelled":
        return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
      case "high":
        return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400"
      case "medium":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
      case "low":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const formatStatus = (status) => {
    if (!status) return 'Unknown'
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
  }

  const formatPriority = (priority) => {
    if (!priority) return 'Normal'
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const formatCustomerSince = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      })
    } catch {
      return dateString
    }
  }

  const getAssignedAgent = () => {
    if (ticket?.assigned_to) {
      return ticket.assigned_to.full_name || ticket.assigned_to.username
    }
    return "Unassigned"
  }

  // Filter messages into different categories
  const customerMessages = messages.filter(msg => 
    msg.sender?.role === 'customer'
  )

  const adminResponses = messages.filter(msg => 
    (msg.sender?.role === 'admin' || msg.sender?.role === 'agent') &&
    !msg.content?.startsWith('[INTERNAL NOTE]')
  )

  const internalNotes = messages.filter(msg => 
    msg.content?.startsWith('[INTERNAL NOTE]')
  )

  // Combine customer messages and admin responses for conversation view
  const conversationMessages = [...customerMessages, ...adminResponses]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading ticket...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="h-6 w-6" />
          <span>Error: {error}</span>
          <Button variant="outline" onClick={fetchTicket}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Ticket not found</h2>
          <p className="text-muted-foreground">The ticket you're looking for doesn't exist.</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Tickets
      </Button>
      
      <div>
        <h1 className="text-2xl font-bold">Order #{ticket._id?.slice(-6) || ticketId}</h1>
        <p className="text-muted-foreground">Manage and respond to customer order inquiry</p>
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
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  {isEditing ? (
                    <Select value={formatStatus(ticket.status)} onValueChange={handleStatusChange} disabled={saving}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                    <Select value={formatPriority(ticket.priority)} onValueChange={handlePriorityChange} disabled={saving}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
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
                  <Button size="sm" onClick={() => setIsEditing(false)} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Responses and Communication */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Communication</CardTitle>
              <CardDescription>All customer responses and internal notes for this order inquiry</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="conversation">
                <TabsList>
                  <TabsTrigger value="conversation">Conversation</TabsTrigger>
                  <TabsTrigger value="internal">Internal Notes</TabsTrigger>
                </TabsList>
                <TabsContent value="conversation" className="space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading messages...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conversationMessages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No conversation yet.</p>
                      ) : (
                        conversationMessages.map((response) => (
                          <div key={response._id || response.id} className="flex gap-4 p-4 border rounded-lg">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={response.sender?.avatar_url} />
                              <AvatarFallback>
                                {response.sender?.full_name || response.sender?.username || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">
                                  {response.sender?.full_name || response.sender?.username || 'Customer'}
                                </span>
                                <Badge variant={response.sender?.role === 'customer' ? "outline" : "default"} className="text-xs">
                                  {response.sender?.role === 'admin' ? 'Admin' : response.sender?.role === 'agent' ? 'Agent' : 'Customer'}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(response.created_at)}
                                </span>
                              </div>
                              <p className="text-sm">{response.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  <Separator />
                  <div className="space-y-4">
                    <Label>Send Response to Customer</Label>
                    <Textarea
                      placeholder="Type your response about their fragrance inquiry or order..."
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      className="min-h-[100px]"
                      disabled={saving}
                    />
                    <Button onClick={handleSendResponse} disabled={saving || !newResponse.trim()}>
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      {saving ? 'Sending...' : 'Send Response'}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="internal" className="space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading notes...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {internalNotes.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No internal notes yet.</p>
                      ) : (
                        internalNotes.map((note) => (
                          <div key={note._id || note.id} className="flex gap-4 p-4 border rounded-lg bg-muted/50">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={note.sender?.avatar_url} />
                              <AvatarFallback>
                                {note.sender?.full_name || note.sender?.username || 'A'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">
                                  {note.sender?.full_name || note.sender?.username || 'Agent'}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  Internal Note
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(note.created_at)}
                                </span>
                              </div>
                              <p className="text-sm">
                                {note.content?.replace('[INTERNAL NOTE] ', '') || note.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  <Separator />
                  <div className="space-y-4">
                    <Label>Add Internal Note</Label>
                    <Textarea
                      placeholder="Add an internal note about this order or customer (not visible to customer)..."
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      className="min-h-[100px]"
                      disabled={saving}
                    />
                    <Button variant="outline" onClick={handleAddInternalNote} disabled={saving || !internalNote.trim()}>
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                      {saving ? 'Adding...' : 'Add Internal Note'}
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
                  <AvatarImage src={ticket.created_by?.avatar_url} />
                  <AvatarFallback>
                    {ticket.created_by?.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{ticket.created_by?.full_name || 'Unknown Customer'}</h3>
                  <p className="text-sm text-muted-foreground">{ticket.created_by?.username}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{ticket.created_by?.username || 'N/A'}</span>
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
                <p className="text-sm text-muted-foreground mt-1">{formatDate(ticket.created_at)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm text-muted-foreground mt-1">{formatDate(ticket.updated_at)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Resolution Time</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {ticket.resolved_at ? formatDate(ticket.resolved_at) : "Pending"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 