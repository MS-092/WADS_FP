"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  AlertTriangle, 
  User, 
  Bell, 
  Loader2, 
  Plus,
  Filter,
  BarChart3,
  Trash2,
  Settings
} from "lucide-react"
import Link from "next/link"
import { notificationAPI } from "@/lib/api"
import { useWebSocketContext } from "@/components/providers/WebSocketProvider"
import { toast } from "sonner"

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [systemStats, setSystemStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showStatsDialog, setShowStatsDialog] = useState(false)
  const [showCleanupDialog, setShowCleanupDialog] = useState(false)
  
  // Filters
  const [filters, setFilters] = useState({
    user_id: '',
    notification_type: '',
    priority: '',
    unread_only: false,
    days_back: ''
  })
  
  // System notification form
  const [systemNotification, setSystemNotification] = useState({
    title: '',
    message: '',
    priority: 'high',
    target_roles: ['admin', 'agent']
  })
  
  // Get WebSocket context for real-time updates
  const { 
    onNotification,
    onTicketUpdate,
    onNewTicket,
    markNotificationAsRead: wsMarkAsRead,
    isConnected
  } = useWebSocketContext()

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      
      // Build params based on filters
      const params = { per_page: 100 }
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '') {
          params[key] = filters[key]
        }
      })
      
      const response = await notificationAPI.getAllNotificationsAdmin(params)
      
      if (response && response.notifications) {
        setNotifications(response.notifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  // Fetch system stats
  const fetchSystemStats = async () => {
    try {
      const response = await notificationAPI.getSystemStats()
      setSystemStats(response)
    } catch (error) {
      console.error('Error fetching system stats:', error)
      toast.error('Failed to load system statistics')
    }
  }

  // Fetch notifications on component mount and filter changes
  useEffect(() => {
    fetchNotifications()
  }, [filters])

  // Fetch system stats on mount
  useEffect(() => {
    fetchSystemStats()
  }, [])

  // Listen for real-time notifications and updates
  useEffect(() => {
    const unsubscribeNotifications = onNotification((newNotification) => {
      setNotifications(prev => {
        // Check if notification already exists
        const exists = prev.some(n => n._id === newNotification._id)
        if (!exists) {
          return [newNotification, ...prev]
        }
        return prev
      })
    })

    const unsubscribeTicketUpdates = onTicketUpdate(() => {
      // Refresh notifications when tickets are updated
      fetchNotifications()
    })

    const unsubscribeNewTickets = onNewTicket(() => {
      // Refresh notifications when new tickets are created
      fetchNotifications()
    })

    return () => {
      unsubscribeNotifications()
      unsubscribeTicketUpdates()
      unsubscribeNewTickets()
    }
  }, [onNotification, onTicketUpdate, onNewTicket])

  const markAsRead = async (id) => {
    try {
      // Debug logging
      console.log('Attempting to mark notification as read, ID:', id);
      console.log('ID type:', typeof id);
      console.log('ID valid:', !!id);
      
      if (!id) {
        throw new Error('Notification ID is missing');
      }
      
      // Mark as read via API (using admin-specific endpoint)
      await notificationAPI.markAsReadAdmin(id)
      
      // Mark as read via WebSocket for real-time updates
      wsMarkAsRead(id)
      
      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => (notification._id === id ? { ...notification, is_read: true } : notification)),
      )
      
      toast.success('Notification marked as read')
    } catch (error) {
      console.error('Error marking notification as read:', error)
      console.error('Failed ID:', id)
      
      // More specific error handling
      if (error.message.includes('not found')) {
        toast.error('Notification not found. It may have been already processed.')
      } else if (error.message.includes('Invalid notification ID')) {
        toast.error('Invalid notification ID format')
      } else {
        toast.error('Failed to mark notification as read: ' + error.message)
      }
    }
  }

  const markAllAsRead = async () => {
    try {
      setMarkingAllRead(true)
      await notificationAPI.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all notifications as read')
    } finally {
      setMarkingAllRead(false)
    }
  }

  const createSystemNotification = async () => {
    try {
      if (!systemNotification.title || !systemNotification.message) {
        toast.error('Please fill in all required fields')
        return
      }

      await notificationAPI.createSystemAlert(systemNotification)
      toast.success('System notification sent successfully')
      
      setShowCreateDialog(false)
      setSystemNotification({
        title: '',
        message: '',
        priority: 'high',
        target_roles: ['admin', 'agent']
      })
      
      // Refresh notifications
      fetchNotifications()
      fetchSystemStats()
    } catch (error) {
      console.error('Error creating system notification:', error)
      toast.error('Failed to create system notification')
    }
  }

  const handleFilterChange = (key, value) => {
    // Convert "all" values to empty strings for the API
    const apiValue = value === "all" ? "" : value;
    setFilters(prev => ({
      ...prev,
      [key]: apiValue
    }))
  }

  // Helper function to convert empty strings back to "all" for Select display
  const getSelectValue = (filterValue) => {
    return filterValue === "" ? "all" : filterValue;
  }

  const clearFilters = () => {
    setFilters({
      user_id: '',
      notification_type: '',
      priority: '',
      unread_only: false,
      days_back: ''
    })
  }

  const unreadNotifications = notifications.filter((n) => !n.is_read)
  const readNotifications = notifications.filter((n) => n.is_read)
  const urgentNotifications = notifications.filter((n) => 
    n.type === "urgent" || 
    n.type === "system_alert" || 
    n.priority === "high" || 
    n.priority === "urgent"
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading notifications...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Notifications</h2>
          <p className="text-muted-foreground">
            Monitor all helpdesk activities and urgent issues
            {isConnected && (
              <span className="ml-2 text-green-600">• Live updates enabled</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* System Stats Button */}
          <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Stats
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>System Notification Statistics</DialogTitle>
                <DialogDescription>
                  Overview of notification activity across the system
                </DialogDescription>
              </DialogHeader>
              <SystemStatsDisplay stats={systemStats} onRefresh={fetchSystemStats} />
            </DialogContent>
          </Dialog>

          {/* Create System Notification Button */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                System Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create System Notification</DialogTitle>
                <DialogDescription>
                  Send a notification to all users with selected roles
                </DialogDescription>
              </DialogHeader>
              <SystemNotificationForm 
                notification={systemNotification}
                setNotification={setSystemNotification}
                onSubmit={createSystemNotification}
              />
            </DialogContent>
          </Dialog>

          {/* Mark All Read Button */}
          {unreadNotifications.length > 0 && (
            <Button 
              onClick={markAllAsRead} 
              variant="outline"
              size="sm"
              disabled={markingAllRead}
            >
              {markingAllRead ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Marking...
                </>
              ) : (
                'Mark all read'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="notification-type">Type</Label>
              <Select 
                value={getSelectValue(filters.notification_type)} 
                onValueChange={(value) => handleFilterChange('notification_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="ticket_created">Ticket Created</SelectItem>
                  <SelectItem value="ticket_assigned">Ticket Assigned</SelectItem>
                  <SelectItem value="ticket_status_changed">Status Changed</SelectItem>
                  <SelectItem value="ticket_resolved">Ticket Resolved</SelectItem>
                  <SelectItem value="system_alert">System Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={getSelectValue(filters.priority)} 
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="days-back">Days Back</Label>
              <Select 
                value={getSelectValue(filters.days_back)} 
                onValueChange={(value) => handleFilterChange('days_back', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="unread-only"
                  checked={filters.unread_only}
                  onChange={(e) => handleFilterChange('unread_only', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="unread-only">Unread only</Label>
              </div>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadNotifications.length})</TabsTrigger>
          <TabsTrigger value="urgent">Urgent ({urgentNotifications.length})</TabsTrigger>
          <TabsTrigger value="read">Read ({readNotifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <AdminNotificationList notifications={notifications} onMarkAsRead={markAsRead} />
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <AdminNotificationList notifications={unreadNotifications} onMarkAsRead={markAsRead} />
        </TabsContent>

        <TabsContent value="urgent" className="space-y-4">
          <AdminNotificationList notifications={urgentNotifications} onMarkAsRead={markAsRead} />
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          <AdminNotificationList notifications={readNotifications} onMarkAsRead={markAsRead} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// System notification form component
function SystemNotificationForm({ notification, setNotification, onSubmit }) {
  const handleRoleToggle = (role) => {
    setNotification(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role]
    }))
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={notification.title}
          onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter notification title"
        />
      </div>
      
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={notification.message}
          onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
          placeholder="Enter notification message"
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select 
          value={notification.priority} 
          onValueChange={(value) => setNotification(prev => ({ ...prev, priority: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Target Roles</Label>
        <div className="flex items-center space-x-4 mt-2">
          {['customer', 'agent', 'admin'].map(role => (
            <div key={role} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={role}
                checked={notification.target_roles.includes(role)}
                onChange={() => handleRoleToggle(role)}
                className="rounded"
              />
              <Label htmlFor={role} className="capitalize">{role}</Label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          Send Notification
        </Button>
      </div>
    </div>
  )
}

// System stats display component
function SystemStatsDisplay({ stats, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }

  if (!stats) {
    return <div>Loading statistics...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">System Overview</h3>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total_notifications}</div>
            <div className="text-sm text-muted-foreground">Total Notifications</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.total_unread}</div>
            <div className="text-sm text-muted-foreground">Unread</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.recent_notifications_24h}</div>
            <div className="text-sm text-muted-foreground">Last 24h</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.top_notification_recipients_7d?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Priority breakdown */}
      <div>
        <h4 className="font-medium mb-2">By Priority (Last 7 days)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(stats.notifications_by_priority_7d || {}).map(([priority, count]) => (
            <div key={priority} className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="capitalize">{priority}</span>
              <Badge variant="secondary">{count}</Badge>
            </div>
          ))}
        </div>
      </div>
      
      {/* Type breakdown */}
      <div>
        <h4 className="font-medium mb-2">By Type (Last 7 days)</h4>
        <div className="space-y-1">
          {Object.entries(stats.notifications_by_type_7d || {}).map(([type, count]) => (
            <div key={type} className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="text-sm">{type.replace('_', ' ')}</span>
              <Badge variant="outline">{count}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminNotificationList({ notifications, onMarkAsRead }) {
  const getNotificationIcon = (type) => {
    switch (type) {
      case "ticket_created":
      case "new_ticket":
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case "ticket_assigned":
      case "assignment":
        return <User className="h-5 w-5 text-purple-500" />
      case "ticket_status_changed":
      case "ticket_update":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "ticket_resolved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "urgent":
      case "system_alert":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'Unknown time'
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } catch {
      return dateString
    }
  }

  const getTicketLink = (notification) => {
    const ticketId = notification.data?.ticket_id || notification.ticket_id
    return ticketId ? `/admin/tickets/${ticketId}` : null
  }

  const isUrgent = (notification) => {
    return notification.type === "urgent" || 
           notification.type === "system_alert" || 
           notification.priority === "high" || 
           notification.priority === "urgent"
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No notifications found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => {
        // Debug logging for each notification
        console.log('Rendering notification:', {
          _id: notification._id,
          id: notification.id,
          title: notification.title,
          is_read: notification.is_read
        });
        
        return (
          <Card
            key={notification._id}
            className={`${!notification.is_read ? "border-l-4 border-l-blue-500" : ""} ${isUrgent(notification) ? "border-l-red-500" : ""}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`font-medium ${!notification.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                      {notification.title}
                    </h3>
                    {!notification.is_read && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                    {isUrgent(notification) && (
                      <Badge variant="destructive" className="text-xs">
                        Urgent
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>
                  
                  {/* User info for admin view */}
                  {notification.user && (
                    <div className="text-xs text-muted-foreground mb-2">
                      User: {notification.user.full_name} ({notification.user.username}) - {notification.user.role}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{formatTime(notification.created_at)}</span>
                    <div className="flex items-center gap-2">
                      {getTicketLink(notification) && (
                        <Link href={getTicketLink(notification)}>
                          <Button variant="outline" size="sm">
                            View Ticket
                          </Button>
                        </Link>
                      )}
                      {!notification.is_read && (
                        <Button variant="ghost" size="sm" onClick={() => {
                          console.log('Mark as read clicked for notification:', notification._id);
                          onMarkAsRead(notification._id);
                        }}>
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  )
}
