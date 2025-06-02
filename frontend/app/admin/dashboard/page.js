"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart3, CheckCircle, Clock, MessageSquare, Users, Loader2, AlertCircle } from "lucide-react"
import { adminAPI } from "@/lib/api"

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentTickets, setRecentTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch system statistics and recent tickets in parallel
      const [systemStats, ticketsResponse] = await Promise.all([
        adminAPI.getSystemStats(),
        adminAPI.getAllTickets({ page: 1, per_page: 5 }) // Get recent tickets
      ])

      setStats(systemStats)
      if (ticketsResponse && ticketsResponse.tickets) {
        setRecentTickets(ticketsResponse.tickets)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError(error.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

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
          <span>Loading dashboard...</span>
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
          <Button variant="outline" onClick={fetchDashboardData}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">Overview of all support activities and metrics</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tickets?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.recent_activity?.new_tickets_24h || 0} new in last 24h
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tickets?.open || 0}</div>
            <p className="text-xs text-muted-foreground">
              {((stats?.tickets?.open / (stats?.tickets?.total || 1)) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tickets?.resolved || 0}</div>
            <p className="text-xs text-muted-foreground">
              {((stats?.tickets?.resolved / (stats?.tickets?.total || 1)) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.recent_activity?.new_users_24h || 0} new in last 24h
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Latest support tickets across all users</CardDescription>
            </div>
            <Link href="/admin/tickets">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
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
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No recent tickets
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTickets.map((ticket) => (
                    <TableRow key={ticket._id}>
                      <TableCell className="font-medium">#{ticket._id?.slice(-6) || 'N/A'}</TableCell>
                      <TableCell>
                        {ticket.created_by?.full_name || 'Unknown User'}
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
                      <TableCell>{formatDate(ticket.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>User Statistics</CardTitle>
            <CardDescription>User distribution and activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Active Users</p>
                  <p className="text-sm text-muted-foreground">Currently active</p>
                </div>
                <div className="font-bold">{stats?.users?.active || 0}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Customers</p>
                  <p className="text-sm text-muted-foreground">Regular users</p>
                </div>
                <div className="font-bold">{stats?.users?.customers || 0}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Support Agents</p>
                  <p className="text-sm text-muted-foreground">Help desk team</p>
                </div>
                <div className="font-bold">{stats?.users?.agents || 0}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Administrators</p>
                  <p className="text-sm text-muted-foreground">System admins</p>
                </div>
                <div className="font-bold">{stats?.users?.admins || 0}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Messages</p>
                  <p className="text-sm text-muted-foreground">All conversations</p>
                </div>
                <div className="font-bold">{stats?.messages?.total || 0}</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/admin/users">
              <Button className="w-full">
                <Users className="mr-2 h-4 w-4" />
                View User Management
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
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
