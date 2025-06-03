"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, MessageSquare, Plus, Loader2 } from "lucide-react"
import { ticketAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function Dashboard() {
  const [recentTickets, setRecentTickets] = useState([])
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    avgResponse: "N/A"
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDashboardData()
    }
  }, [authLoading, isAuthenticated])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError("")

    try {
      // Fetch recent tickets (limit to 4 for the dashboard)
      const ticketsResponse = await ticketAPI.getTickets({ limit: 4, sort: '-created_at' })
      
      if (ticketsResponse && ticketsResponse.tickets) {
        // Debug: Log the actual timestamp format
        console.log('Raw ticket data:', ticketsResponse.tickets[0])
        if (ticketsResponse.tickets[0]?.created_at) {
          console.log('Raw created_at:', ticketsResponse.tickets[0].created_at)
          console.log('Type of created_at:', typeof ticketsResponse.tickets[0].created_at)
        }
        
        setRecentTickets(ticketsResponse.tickets)
        
        // Calculate stats from the tickets
        const allTickets = ticketsResponse.tickets
        const totalTickets = allTickets.length
        const openTickets = allTickets.filter(ticket => 
          ticket.status?.toLowerCase() === 'open' || ticket.status?.toLowerCase() === 'in-progress'
        ).length
        const resolvedTickets = allTickets.filter(ticket => 
          ticket.status?.toLowerCase() === 'resolved' || ticket.status?.toLowerCase() === 'closed'
        ).length

        setTicketStats({
          total: totalTickets,
          open: openTickets,
          resolved: resolvedTickets,
          avgResponse: "4h" // This would ideally come from the API
        })
      } else {
        setRecentTickets([])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError(error.message || 'Failed to fetch dashboard data')
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    
    // Debug: Log what we're trying to format
    console.log('Formatting date:', dateString, 'Type:', typeof dateString)
    
    try {
      let date
      
      // Handle different timestamp formats
      if (typeof dateString === 'string') {
        // If it's a string, it might be ISO format or other formats
        date = new Date(dateString)
      } else if (typeof dateString === 'number') {
        // If it's a number, it might be a Unix timestamp
        date = new Date(dateString * 1000) // Convert seconds to milliseconds
      } else if (dateString instanceof Date) {
        // If it's already a Date object
        date = dateString
      } else {
        // Try to convert whatever it is to a string first
        date = new Date(String(dateString))
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date after parsing:', dateString)
        return 'Invalid date'
      }
      
      // Debug: Log the parsed date in different formats
      console.log('Parsed date:', date)
      console.log('UTC string:', date.toISOString())
      console.log('Local string:', date.toString())
      
      // Detect user's timezone from browser
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      console.log('User timezone:', userTimezone)
      
      // Format the date in user's detected timezone
      const options = {
        timeZone: userTimezone, // Explicitly use detected timezone
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true // Use 12-hour format with AM/PM
      }
      
      const formatted = date.toLocaleString(undefined, options)
      console.log('Formatted result:', formatted)
      
      return formatted
    } catch (error) {
      console.error('Error formatting date:', error, 'Input was:', dateString)
      return 'Invalid date'
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view your dashboard.</p>
          <Link href="/login">
            <Button className="mt-4">Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your support tickets.</p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.first_name || user?.email || 'User'}!
            </h2>
            <p className="text-muted-foreground">Here's an overview of your support tickets</p>
          </div>
          <Link href="/dashboard/tickets/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </Link>
        </div>
        
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
              <Button 
                variant="outline" 
                onClick={fetchDashboardData}
                className="mt-2"
                disabled={loading}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : ticketStats.total}
              </div>
              <p className="text-xs text-muted-foreground">Your submitted tickets</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : ticketStats.open}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : ticketStats.resolved}
              </div>
              <p className="text-xs text-muted-foreground">Completed tickets</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Response</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : ticketStats.avgResponse}
              </div>
              <p className="text-xs text-muted-foreground">Average response time</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-7">
            <CardHeader>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Your latest support tickets</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading tickets...</span>
                </div>
              ) : recentTickets.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tickets found</p>
                  <p className="text-sm text-muted-foreground">Create your first support ticket to get started</p>
                  <Link href="/dashboard/tickets/new">
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Ticket
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTickets.map((ticket) => (
                    <div key={ticket._id || ticket.id} className="flex items-center gap-4 rounded-lg border p-3">
                      <div className={`rounded-full p-1 ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {ticket.subject || ticket.title || 'Untitled Ticket'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {ticket.description || 'No description provided'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created: {formatDate(ticket.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`rounded-full px-2 py-1 text-xs ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority || 'Medium'}
                        </div>
                        <Link href={`/dashboard/tickets/${ticket._id || ticket.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link href="/dashboard/tickets">
                <Button variant="outline">View all tickets</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status) {
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
    case "pending":
      return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400"
    case "cancelled":
      return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
  }
}

function getPriorityColor(priority) {
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

function getStatusIcon(status) {
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
      return <MessageSquare className="h-4 w-4" />
  }
}
