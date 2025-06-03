"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, UserPlus, Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { adminAPI } from "@/lib/api"
import { useWebSocketContext } from "@/components/providers/WebSocketProvider"
import { toast } from "sonner"

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
    total: 0,
    pages: 0
  })

  // Get WebSocket context for real-time updates
  const { 
    onNotification,
    onTicketUpdate,
    onNewTicket,
    isConnected,
    connectionStatus,
    connectionError,
    getDebugInfo
  } = useWebSocketContext()

  // Debug WebSocket connection
  useEffect(() => {
    console.log('🔍 Admin Tickets Page - WebSocket Status:', {
      isConnected,
      connectionStatus,
      connectionError,
      debugInfo: getDebugInfo ? getDebugInfo() : 'No debug info available'
    })
  }, [isConnected, connectionStatus, connectionError])

  const fetchTickets = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setRefreshing(!showLoading)

    try {
      const params = {
        page: pagination.page,
        per_page: pagination.per_page
      }

      // Add filters
      if (selectedStatus !== "all") params.status = selectedStatus
      if (selectedPriority !== "all") params.priority = selectedPriority
      if (searchQuery.trim()) params.search = searchQuery.trim()

      console.log('🎫 Fetching tickets with params:', params)
      const response = await adminAPI.getAllTickets(params)
      
      if (response && response.tickets) {
        setTickets(response.tickets)
        setPagination(prev => ({
          ...prev,
          total: response.total || 0,
          pages: response.pages || 1
        }))
        console.log('✅ Tickets fetched successfully:', response.tickets.length)
      } else {
        console.warn('⚠️ No tickets in response:', response)
        setTickets([])
      }
    } catch (error) {
      console.error('❌ Error fetching tickets:', error)
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchTickets()
  }, [pagination.page, selectedStatus, selectedPriority])

  // Listen for real-time updates
  useEffect(() => {
    const unsubscribeNotifications = onNotification((notification) => {
      console.log('🔔 Admin received notification:', notification)
      // Refresh tickets when ticket-related notifications are received
      if (notification.notification_type === 'ticket_created' || 
          notification.notification_type === 'ticket_assigned' ||
          notification.notification_type === 'ticket_status_changed') {
        console.log('🔄 Refreshing tickets due to notification')
        fetchTickets(false)
      }
    })

    const unsubscribeTicketUpdates = onTicketUpdate((ticketUpdate) => {
      console.log('🎫 Admin received ticket update:', ticketUpdate)
      // Refresh tickets when ticket updates are received
      fetchTickets(false)
    })

    const unsubscribeNewTickets = onNewTicket((newTicket) => {
      console.log('🆕 Admin received new ticket alert:', newTicket)
      // Refresh tickets when new tickets are created
      fetchTickets(false)
      toast.success('New ticket created', {
        description: `"${newTicket.title}" by ${newTicket.created_by?.name || 'Unknown User'}`
      })
    })

    return () => {
      unsubscribeNotifications()
      unsubscribeTicketUpdates()
      unsubscribeNewTickets()
    }
  }, [onNotification, onTicketUpdate, onNewTicket])

  // Filter tickets based on selected filters (client-side backup filtering)
  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = selectedStatus === "all" || 
      ticket.status?.toLowerCase().replace(" ", "-") === selectedStatus ||
      ticket.status?.toLowerCase() === selectedStatus
    const matchesPriority = selectedPriority === "all" || 
      ticket.priority?.toLowerCase() === selectedPriority
    const matchesSearch = searchQuery === "" ||
      ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.created_by?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.created_by?.email?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesPriority && matchesSearch
  })

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchTickets()
  }

  const handleRefresh = () => {
    fetchTickets(false)
  }

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open": return "bg-blue-100 text-blue-800"
      case "in-progress": return "bg-yellow-100 text-yellow-800"
      case "resolved": return "bg-green-100 text-green-800"
      case "closed": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityBadgeColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high": return "bg-red-100 text-red-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "low": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Tickets</h2>
          <p className="text-muted-foreground">Manage and track all support tickets</p>
        </div>
        <div className="flex items-center gap-2">
          {/* WebSocket Status Indicator */}
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="h-4 w-4" />
                <span>Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <WifiOff className="h-4 w-4" />
                <span>Offline</span>
              </div>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/admin/tickets/create">
              <UserPlus className="h-4 w-4 mr-2" />
              Create Ticket
            </Link>
          </Button>
        </div>
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm">🔧 Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div>WebSocket Status: <span className="font-mono">{connectionStatus}</span></div>
            <div>Connected: <span className="font-mono">{isConnected ? 'Yes' : 'No'}</span></div>
            {connectionError && (
              <div>Error: <span className="font-mono text-red-600">{connectionError}</span></div>
            )}
            <div>Tickets Loaded: <span className="font-mono">{tickets.length}</span></div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter tickets by status, priority, or search terms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tickets, users, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>
            {loading ? "Loading tickets..." : `Showing ${filteredTickets.length} of ${pagination.total} tickets`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading tickets...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tickets found matching your criteria
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket._id}>
                    <TableCell className="font-mono text-sm">
                      {ticket._id?.slice(-8) || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/admin/tickets/${ticket._id}`}
                        className="font-medium hover:underline"
                      >
                        {ticket.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      {ticket.created_by?.full_name || ticket.created_by?.username || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/tickets/${ticket._id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
