"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, UserPlus, Loader2, AlertCircle, MoreHorizontal, MessageCircle } from "lucide-react"
import { adminAPI, ticketAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creatingChatFor, setCreatingChatFor] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false
  })

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin'

  // Fetch users from API
  const fetchUsers = async (page = 1, filters = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        page,
        per_page: pagination.per_page,
        ...filters
      }

      // Add role filter if selected
      if (selectedRole !== "all") {
        params.role = selectedRole
      }
      
      // Add status filter if selected
      if (selectedStatus !== "all") {
        params.status = selectedStatus
      }

      // Add search filter if provided
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      const response = await adminAPI.getAllUsers(params)
      console.log('Raw API Response:', response)
      
      if (Array.isArray(response)) {
        // If response is just an array (no pagination), handle it
        console.log('Array response, users:', response)
        response.forEach((user, index) => {
          console.log(`User ${index}:`, {
            id: user.id || user._id,
            email: user.email,
            full_name: user.full_name,
            username: user.username,
            role: user.role,
            status: user.status
          })
        })
        setUsers(response)
        setPagination(prev => ({
          ...prev,
          total: response.length,
          pages: 1,
          has_next: false,
          has_prev: false
        }))
      } else if (response && response.users) {
        // If response has pagination structure
        console.log('Pagination response, users:', response.users)
        response.users.forEach((user, index) => {
          console.log(`User ${index}:`, {
            id: user.id || user._id,
            email: user.email,
            full_name: user.full_name,
            username: user.username,
            role: user.role,
            status: user.status
          })
        })
        setUsers(response.users)
        setPagination({
          page: response.page,
          per_page: response.per_page,
          total: response.total,
          pages: response.pages,
          has_next: response.has_next,
          has_prev: response.has_prev
        })
      } else if (response) {
        // If response is the users array directly
        console.log('Direct response, users:', response)
        setUsers(response)
        setPagination(prev => ({
          ...prev,
          total: response.length,
          pages: 1,
          has_next: false,
          has_prev: false
        }))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError(error.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  // Fetch users on component mount and when filters change
  useEffect(() => {
    fetchUsers()
  }, [selectedRole, selectedStatus])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== "") {
        fetchUsers()
      } else {
        fetchUsers()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Filter users client-side as backup
  const filteredUsers = users.filter((user) => {
    const matchesRole = selectedRole === "all" || user.role?.toLowerCase() === selectedRole
    const matchesStatus = selectedStatus === "all" || user.status?.toLowerCase() === selectedStatus
    const matchesSearch =
      searchQuery === "" ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesRole && matchesStatus && matchesSearch
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

  const formatRole = (role) => {
    if (!role) return 'Unknown'
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  const formatStatus = (status) => {
    if (!status) return 'Unknown'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  // Handle chat with user
  const handleChatWithUser = async (userId, userInfo) => {
    try {
      setCreatingChatFor(userId)
      
      // Create a support ticket for direct communication
      const ticketData = {
        subject: `Direct Chat with ${userInfo.full_name || userInfo.username}`,
        description: `This ticket was created for direct communication between admin and user ${userInfo.full_name || userInfo.username}.`,
        priority: "medium",
        category: "general"
      }
      
      // Create the ticket using admin API (since we need to create it on behalf of the user)
      const newTicket = await adminAPI.createTicket({
        ...ticketData,
        created_by: userId // Set the user as the ticket creator
      })
      
      if (newTicket && newTicket.id) {
        // Navigate to the admin ticket view page for this conversation
        router.push(`/admin/tickets/${newTicket.id}`)
      }
      
    } catch (error) {
      console.error('Error starting chat with user:', error)
      alert('Failed to start chat. Please try again.')
    } finally {
      setCreatingChatFor(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading users...</span>
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
          <Button variant="outline" onClick={() => fetchUsers()}>
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
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage users and their access levels ({pagination.total} total)
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter users by role, status, or search by name or email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 md:max-w-sm">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:max-w-md">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Support Agent</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A list of all users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id || user._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.full_name || user.username || 'Unknown User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{user.username}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email || 'No email'}</TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleColor(user.role)}`}
                      >
                        {formatRole(user.role)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(user.status)}`}
                      >
                        {formatStatus(user.status)}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination info */}
          {filteredUsers.length > 0 && pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min((pagination.page - 1) * pagination.per_page + 1, pagination.total)} to{" "}
                {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} users
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={!pagination.has_prev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(pagination.page + 1)}
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

function getRoleColor(role) {
  switch (role?.toLowerCase()) {
    case "admin":
      return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400"
    case "agent":
      return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
    case "customer":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
  }
}

function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
    case "inactive":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    case "suspended":
      return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
    case "pending":
      return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
  }
}
