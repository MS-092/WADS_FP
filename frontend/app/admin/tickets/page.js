"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Loader2, AlertCircle } from "lucide-react"
import { adminAPI } from "@/lib/api"

export default function AdminTicketsPage() {
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false
  })

  // Fetch tickets from API
  const fetchTickets = async (page = 1, filters = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        page,
        per_page: pagination.per_page,
        ...filters
      }

      const response = await adminAPI.getAllTickets(params)
      
      if (response && response.tickets) {
        setTickets(response.tickets)
        setPagination({
          page: response.page,
          per_page: response.per_page,
          total: response.total,
          pages: response.pages,
          has_next: response.has_next,
          has_prev: response.has_prev
        })
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      setError(error.message || 'Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }

  // Fetch tickets on component mount
  useEffect(() => {
    fetchTickets()
  }, [])

  // Filter tickets client-side for now (we can optimize this by passing filters to API later)
  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = selectedStatus === "all" || ticket.status?.toLowerCase().replace(" ", "_") === selectedStatus
    const matchesPriority = selectedPriority === "all" || ticket.priority?.toLowerCase() === selectedPriority
    const matchesSearch =
      searchQuery === "" ||
      ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.created_by?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.created_by?.username?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesPriority && matchesSearch
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
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

  const getAssignedAgent = (ticket) => {
    if (ticket.assigned_to) {
      return ticket.assigned_to.full_name || ticket.assigned_to.username
    }
    return "Unassigned"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading tickets...</span>
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
          <Button variant="outline" onClick={() => fetchTickets()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Tickets</h2>
          <p className="text-muted-foreground">
            Manage and assign support tickets ({pagination.total} total)
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter tickets by status, priority, or search by title or user</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 md:max-w-sm">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tickets or users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:max-w-md">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
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
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Ticket Management</CardTitle>
          <CardDescription>A list of all support tickets in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No tickets found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket._id || ticket.id}>
                    <TableCell className="font-medium">#{(ticket._id || ticket.id)?.slice(-6) || 'N/A'}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {ticket.created_by?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ticket.created_by?.username || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {ticket.title || 'No title'}
                    </TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(ticket.status)}`}
                      >
                        {formatStatus(ticket.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(ticket.priority)}`}
                      >
                        {formatPriority(ticket.priority)}
                      </div>
                    </TableCell>
                    <TableCell>{getAssignedAgent(ticket)}</TableCell>
                    <TableCell>{formatDate(ticket.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/tickets/${ticket._id || ticket.id}`}>
                        <Button variant="ghost" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination info */}
          {filteredTickets.length > 0 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min((pagination.page - 1) * pagination.per_page + 1, pagination.total)} to{" "}
                {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} tickets
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTickets(pagination.page - 1)}
                  disabled={!pagination.has_prev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTickets(pagination.page + 1)}
                  disabled={!pagination.has_next}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case "open":
      return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
    case "in_progress":
    case "in-progress":
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

function getPriorityColor(priority) {
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
