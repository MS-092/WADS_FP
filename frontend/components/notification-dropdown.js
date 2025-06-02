"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Bell, CheckCircle, Clock, MessageSquare, User } from "lucide-react"
import { notificationAPI } from "@/lib/api"
import { useWebSocketContext } from "./providers/WebSocketProvider"

export function NotificationDropdown({ isAdmin = false }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  
  // Get WebSocket context for real-time updates
  const { 
    notifications: wsNotifications, 
    markNotificationAsRead: wsMarkAsRead,
    onNotification,
    onTicketUpdate,
    isConnected
  } = useWebSocketContext()

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationAPI.getNotifications({ per_page: 10 })
      
      if (response && response.notifications) {
        setNotifications(response.notifications)
        setUnreadCount(response.unread_count || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Fall back to empty state on error
      setNotifications([])
      setUnreadCount(0)
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
          setUnreadCount(count => count + 1)
          return [newNotification, ...prev.slice(0, 9)] // Keep max 10 items
        }
        return prev
      })
    })

    const unsubscribeTicketUpdates = onTicketUpdate((ticketUpdate) => {
      // Refresh notifications when tickets are updated
      // This ensures we have the latest ticket-related notifications
      fetchNotifications()
    })

    return () => {
      unsubscribeNotifications()
      unsubscribeTicketUpdates()
    }
  }, [onNotification, onTicketUpdate])

  // Merge WebSocket notifications with API notifications
  useEffect(() => {
    if (wsNotifications.length > 0) {
      setNotifications(prev => {
        const merged = [...wsNotifications, ...prev]
        const unique = merged.filter((notification, index, arr) => 
          arr.findIndex(n => n._id === notification._id) === index
        )
        return unique.slice(0, 10) // Keep max 10 items
      })
    }
  }, [wsNotifications])

  const markAsRead = async (id) => {
    try {
      // Mark as read via API
      await notificationAPI.markAsRead(id)
      
      // Mark as read via WebSocket for real-time updates
      wsMarkAsRead(id)
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "ticket_created":
      case "new_ticket":
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case "ticket_assigned":
      case "assignment":
        return <User className="h-4 w-4 text-purple-500" />
      case "ticket_status_changed":
      case "ticket_update":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "ticket_resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "urgent":
      case "system_alert":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationLink = (notification) => {
    if (notification.data?.ticket_id || notification.ticket_id) {
      const ticketId = notification.data?.ticket_id || notification.ticket_id
      if (isAdmin) {
        return `/admin/tickets/${ticketId}`
      }
      return `/dashboard/tickets/${ticketId}`
    }
    
    // Fallback to notifications page
    if (isAdmin) {
      return `/admin/notifications`
    }
    return `/dashboard/notifications`
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {/* Connection status indicator */}
          <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem key={notification._id} className="p-0">
                <Link
                  href={getNotificationLink(notification)}
                  className="w-full p-3 flex items-start gap-3 hover:bg-muted/50"
                  onClick={() => !notification.is_read && markAsRead(notification._id)}
                >
                  <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-medium truncate ${!notification.is_read ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {notification.title}
                      </p>
                      {!notification.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatTime(notification.created_at)}</p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link 
            href={isAdmin ? "/admin/notifications" : "/dashboard/notifications"}
            className="w-full text-center"
          >
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
