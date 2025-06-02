"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, MessageSquare, AlertTriangle, User, Bell, Loader2 } from "lucide-react"
import Link from "next/link"
import { notificationAPI } from "@/lib/api"
import { useWebSocketContext } from "@/components/providers/WebSocketProvider"
import { toast } from "sonner"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  
  // Get WebSocket context for real-time updates
  const { 
    onNotification,
    onTicketUpdate,
    markNotificationAsRead: wsMarkAsRead,
    isConnected
  } = useWebSocketContext()

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationAPI.getNotifications({ per_page: 50 })
      
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

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications()
  }, [])

  // Listen for real-time notifications
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

    return () => {
      unsubscribeNotifications()
      unsubscribeTicketUpdates()
    }
  }, [onNotification, onTicketUpdate])

  const markAsRead = async (id) => {
    try {
      // Mark as read via API
      await notificationAPI.markAsRead(id)
      
      // Mark as read via WebSocket for real-time updates
      wsMarkAsRead(id)
      
      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => (notification._id === id ? { ...notification, is_read: true } : notification)),
      )
      
      toast.success('Notification marked as read')
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
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
    return ticketId ? `/dashboard/tickets/${ticketId}` : null
  }

  const unreadNotifications = notifications.filter((n) => !n.is_read)
  const readNotifications = notifications.filter((n) => n.is_read)

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
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated with your ticket activities
            {isConnected && (
              <span className="ml-2 text-green-600">• Live updates enabled</span>
            )}
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button 
            onClick={markAllAsRead} 
            variant="outline"
            disabled={markingAllRead}
          >
            {markingAllRead ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Marking as read...
              </>
            ) : (
              'Mark all as read'
            )}
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadNotifications.length})</TabsTrigger>
          <TabsTrigger value="read">Read ({readNotifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <NotificationList notifications={notifications} onMarkAsRead={markAsRead} />
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <NotificationList notifications={unreadNotifications} onMarkAsRead={markAsRead} />
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          <NotificationList notifications={readNotifications} onMarkAsRead={markAsRead} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NotificationList({ notifications, onMarkAsRead }) {
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
    return ticketId ? `/dashboard/tickets/${ticketId}` : null
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
      {notifications.map((notification) => (
        <Card key={notification._id} className={`${!notification.is_read ? "border-l-4 border-l-blue-500" : ""}`}>
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
                </div>
                <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>
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
                      <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(notification._id)}>
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
