"use client"

import { useState } from "react"
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

export default function AdminTicketManagePage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id

  const [ticket, setTicket] = useState(mockTicket)
  const [isEditing, setIsEditing] = useState(false)
  const [newResponse, setNewResponse] = useState("")
  const [internalNote, setInternalNote] = useState("")

  const handleStatusChange = (newStatus) => {
    setTicket((prev) => ({ ...prev, status: newStatus }))
  }

  const handlePriorityChange = (newPriority) => {
    setTicket((prev) => ({ ...prev, priority: newPriority }))
  }

  const handleAssigneeChange = (newAssignee) => {
    setTicket((prev) => ({ ...prev, assignedTo: newAssignee }))
  }

  const handleSendResponse = () => {
    if (newResponse.trim()) {
      const response = {
        id: Date.now().toString(),
        author: "Sarah Tech",
        role: "Support Agent",
        content: newResponse,
        timestamp: new Date().toLocaleString(),
        type: "response",
      }
      setTicket((prev) => ({
        ...prev,
        responses: [...prev.responses, response],
      }))
      setNewResponse("")
    }
  }

  const handleAddInternalNote = () => {
    if (internalNote.trim()) {
      const note = {
        id: Date.now().toString(),
        author: "Sarah Tech",
        role: "Support Agent",
        content: internalNote,
        timestamp: new Date().toLocaleString(),
        type: "internal",
      }
      setTicket((prev) => ({
        ...prev,
        responses: [...prev.responses, note],
      }))
      setInternalNote("")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
      case "In Progress":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
      case "Resolved":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
      case "Closed":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
      case "Medium":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
      case "Low":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    }
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
                    <Select value={ticket.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-1 ${getStatusColor(ticket.status)}`}
                    >
                      {ticket.status}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  {isEditing ? (
                    <Select value={ticket.priority} onValueChange={handlePriorityChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-1 ${getPriorityColor(ticket.priority)}`}
                    >
                      {ticket.priority}
                    </div>
                  )}
                </div>
              </div>
              {isEditing && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => setIsEditing(false)}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Responses and Communication */}
          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
              <CardDescription>All responses and internal notes for this ticket</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="responses">
                <TabsList>
                  <TabsTrigger value="responses">Customer Responses</TabsTrigger>
                  <TabsTrigger value="internal">Internal Notes</TabsTrigger>
                </TabsList>
                <TabsContent value="responses" className="space-y-4">
                  <div className="space-y-4">
                    {ticket.responses
                      .filter((r) => r.type === "response")
                      .map((response) => (
                        <div key={response.id} className="flex gap-4 p-4 border rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg?height=40&width=40" />
                            <AvatarFallback>
                              {response.author
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{response.author}</span>
                              <Badge variant="outline" className="text-xs">
                                {response.role}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{response.timestamp}</span>
                            </div>
                            <p className="text-sm">{response.content}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <Label>Send Response to Customer</Label>
                    <Textarea
                      placeholder="Type your response to the customer..."
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button onClick={handleSendResponse}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Response
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="internal" className="space-y-4">
                  <div className="space-y-4">
                    {ticket.responses
                      .filter((r) => r.type === "internal")
                      .map((note) => (
                        <div key={note.id} className="flex gap-4 p-4 border rounded-lg bg-muted/50">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg?height=40&width=40" />
                            <AvatarFallback>
                              {note.author
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{note.author}</span>
                              <Badge variant="secondary" className="text-xs">
                                Internal Note
                              </Badge>
                              <span className="text-sm text-muted-foreground">{note.timestamp}</span>
                            </div>
                            <p className="text-sm">{note.content}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <Label>Add Internal Note</Label>
                    <Textarea
                      placeholder="Add an internal note (not visible to customer)..."
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button variant="outline" onClick={handleAddInternalNote}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Internal Note
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
                    {ticket.customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{ticket.customer.name}</h3>
                  <p className="text-sm text-muted-foreground">{ticket.customer.email}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{ticket.customer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{ticket.customer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Customer since {ticket.customer.joinDate}</span>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium">Previous Tickets</Label>
                <p className="text-sm text-muted-foreground mt-1">{ticket.customer.previousTickets} tickets</p>
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Assigned Agent</Label>
                <Select value={ticket.assignedTo || ""} onValueChange={handleAssigneeChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="Sarah Tech">Sarah Tech</SelectItem>
                    <SelectItem value="Mike Support">Mike Support</SelectItem>
                    <SelectItem value="Lisa Finance">Lisa Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={ticket.category}
                  onValueChange={(value) => setTicket((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Billing">Billing</SelectItem>
                    <SelectItem value="Account">Account</SelectItem>
                    <SelectItem value="Feature Request">Feature Request</SelectItem>
                  </SelectContent>
                </Select>
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
                <p className="text-sm text-muted-foreground mt-1">{ticket.created}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm text-muted-foreground mt-1">{ticket.lastUpdated}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Response Time</Label>
                <p className="text-sm text-muted-foreground mt-1">{ticket.responseTime}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Resolution Time</Label>
                <p className="text-sm text-muted-foreground mt-1">{ticket.resolutionTime || "Pending"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Call Customer
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Escalate Ticket
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Mock ticket data
const mockTicket = {
  id: "1001",
  title: "Login Issue - Unable to Access Account",
  description:
    "Customer is unable to login to their account after password reset. They receive an 'Invalid credentials' error message even with the correct password.",
  status: "In Progress",
  priority: "High",
  category: "Technical",
  assignedTo: "Sarah Tech",
  created: "Apr 23, 2023 at 2:30 PM",
  lastUpdated: "Apr 24, 2023 at 10:15 AM",
  responseTime: "2 hours",
  resolutionTime: null,
  customer: {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    joinDate: "Jan 2023",
    previousTickets: 3,
  },
  responses: [
    {
      id: "1",
      author: "John Doe",
      role: "Customer",
      content:
        "Hi, I'm having trouble logging into my account. I reset my password yesterday but it's still not working. Can you please help?",
      timestamp: "Apr 23, 2023 at 2:30 PM",
      type: "response",
    },
    {
      id: "2",
      author: "Sarah Tech",
      role: "Support Agent",
      content:
        "Hello John, I'm sorry to hear about the login issue. I've checked your account and can see the password reset was successful. Let me investigate further and get back to you shortly.",
      timestamp: "Apr 23, 2023 at 4:45 PM",
      type: "response",
    },
    {
      id: "3",
      author: "Sarah Tech",
      role: "Support Agent",
      content:
        "Customer account shows recent password reset. Need to check if there are any browser cache issues or if the new password is being entered correctly.",
      timestamp: "Apr 23, 2023 at 4:50 PM",
      type: "internal",
    },
  ],
} 