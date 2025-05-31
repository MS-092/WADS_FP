"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TicketPlus, MessageCircle, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ChatBox } from "@/components/chatbox"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"

export default function DashboardPage() {
  const [showChat, setShowChat] = useState(false)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    setLoading(true)
    const response = await apiClient.getTickets()
    
    if (response.data) {
      setTickets(response.data)
    } else {
      setError(response.error || "Failed to fetch tickets")
    }
    
    setLoading(false)
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
      case "in-progress":
      case "in_progress":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
      case "resolved":
      case "closed":
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
      case "closed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
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

  // Calculate statistics from actual tickets
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status?.toLowerCase() === 'open').length,
    inProgress: tickets.filter(t => ['in-progress', 'in_progress'].includes(t.status?.toLowerCase())).length,
    resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status?.toLowerCase())).length
  }

  const recentTickets = tickets.slice(0, 4) // Show only first 4 tickets

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back, {user?.first_name || 'User'}!</h2>
          <p className="text-muted-foreground">Here's what's happening with your support tickets today.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/tickets/new">
            <Button>
              <TicketPlus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setShowChat(true)}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Live Chat
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <TicketPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Successfully closed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {/* Recent Tickets */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
            <CardDescription>Your latest support requests</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading tickets...</div>
            ) : error ? (
              <div className="text-center py-4 text-red-600">Error: {error}</div>
            ) : recentTickets.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No tickets yet. Create your first ticket to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                        {getStatusIcon(ticket.status)}
                      </div>
                      <div>
                        <p className="font-medium">{ticket.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(ticket.priority)} variant="secondary">
                        {ticket.priority}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)} variant="secondary">
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Help Resources</CardTitle>
            <CardDescription>Quick access to support materials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">FAQs</p>
                  <p className="text-sm text-muted-foreground">Frequently asked questions</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">User Guide</p>
                  <p className="text-sm text-muted-foreground">Step-by-step guides</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Video Tutorials</p>
                  <p className="text-sm text-muted-foreground">Visual learning resources</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Component */}
      <ChatBox isOpen={showChat} onToggle={() => setShowChat(!showChat)} />
    </div>
  )
}
