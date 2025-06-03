"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Clock, MessageSquare, Plus, Search, Loader2, Wifi, WifiOff } from "lucide-react"
import { ticketAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useWebSocketContext } from "@/components/providers/WebSocketProvider"
import { toast } from "sonner"

export default function TicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const fetchingRef = useRef(false)
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  
  // Get WebSocket context for real-time updates
  const { 
    onTicketUpdate,
    onNotification,
    isConnected
  } = useWebSocketContext()

  useEffect(() => {
    // Only fetch tickets when authentication is loaded and user is authenticated
    if (!authLoading && isAuthenticated) {
      // Small delay to avoid React Strict Mode double-execution in development
      const timer = setTimeout(() => {
        fetchTickets()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [statusFilter, priorityFilter, authLoading, isAuthenticated])

  // Listen for real-time ticket updates
  useEffect(() => {
    const unsubscribeTicketUpdates = onTicketUpdate((ticketUpdate) => {
      // Update ticket in the list if it exists
      setTickets(prev => prev.map(ticket => 
        ticket._id === ticketUpdate.id || ticket.id === ticketUpdate.id
          ? { ...ticket, ...ticketUpdate, _id: ticketUpdate.id }
          : ticket
      ))
      
      // Show toast notification
      toast.info('Ticket Updated', {
        description: `Ticket "${ticketUpdate.subject}" has been updated`
      })
    })

    const unsubscribeNotifications = onNotification((notification) => {
      // Refresh tickets if notification is ticket-related
      if (notification.data?.ticket_id) {
        fetchTickets()
      }
    })

    return () => {
      unsubscribeTicketUpdates()
      unsubscribeNotifications()
    }
  }, [onTicketUpdate, onNotification])

  const fetchTickets = async () => {
    if (fetchingRef.current) return
    
    fetchingRef.current = true
    setLoading(true)
    setError("")

    try {
      const filters = {}
      if (statusFilter !== "all") filters.status = statusFilter
      if (priorityFilter !== "all") filters.priority = priorityFilter
      if (searchQuery.trim()) filters.search = searchQuery.trim()

      const response = await ticketAPI.getTickets(filters)
      
      if (response && response.tickets) {
        setTickets(response.tickets)
      } else {
        console.warn('No tickets in response:', response)
        setTickets([])
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      setError(error.message || 'Failed to fetch tickets')
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  const handleSearch = () => {
    fetchTickets()
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return <MessageSquare className="h-3 w-3" />
      case "in-progress":
      case "in_progress":
        return <Clock className="h-3 w-3" />
      case "resolved":
      case "closed":
        return <CheckCircle className="h-3 w-3" />
      default:
        return <MessageSquare className="h-3 w-3" />
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
      case "pending":
        return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400"
      case "cancelled":
        return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
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
          <p className="text-muted-foreground">Please log in to view your tickets.</p>
          <Link href="/login">
            <Button className="mt-4">Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            My Order Inquiries
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-600" title="Live updates enabled" />
            ) : (
              <WifiOff className="h-5 w-5 text-gray-400" title="Live updates disabled" />
            )}
          </h2>
          <p className="text-muted-foreground">
            Track and manage your fragrance order inquiries and product questions
            {isConnected && (
              <span className="ml-2 text-green-600">• Live updates enabled</span>
            )}
          </p>
        </div>
        <Link href="/dashboard/tickets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Inquiry
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Inquiries</CardTitle>
          <CardDescription>Search and filter your fragrance order inquiries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <Input
                placeholder="Search inquiries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 md:max-w-md">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Order Inquiries</CardTitle>
          <CardDescription>
            {tickets.length} inquir{tickets.length !== 1 ? 'ies' : 'y'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-md">
              <p className="text-red-800">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchTickets}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}
          
          {loading && tickets.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading inquiries...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No inquiries found.</p>
              <Link href="/dashboard/tickets/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first inquiry
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket._id || ticket.id}>
                    <TableCell className="font-medium">#{(ticket._id || ticket.id)?.slice(-6)}</TableCell>
                    <TableCell>{ticket.subject || ticket.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`rounded-full p-1 ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                        </div>
                        <span className="capitalize">{ticket.status?.replace("-", " ")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(ticket.priority)}`}
                      >
                        {ticket.priority}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(ticket.created_at || ticket.created)}</TableCell>
                    <TableCell>{formatDate(ticket.updated_at || ticket.updated)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/tickets/${ticket._id || ticket.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
