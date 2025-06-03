"use client"

import React, { useState, useEffect, useCallback, memo } from 'react'
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

export const NotificationDropdown = memo(function NotificationDropdown({ isAdmin = false }) {
  const { 
    notifications: wsNotifications, 
    onNotification, 
    onTicketUpdate,
    markNotificationAsRead: wsMarkAsRead 
  } = useWebSocketContext()
  
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      console.log('[NotificationDropdown] Fetching notifications for admin:', isAdmin)
      const response = await notificationAPI.getNotifications({ page: 1, per_page: 10 })
      console.log('[NotificationDropdown] API Response:', response)
      const fetchedNotifications = response.notifications || []
      console.log('[NotificationDropdown] Setting notifications:', fetchedNotifications)
      setNotifications(fetchedNotifications)
      setUnreadCount(fetchedNotifications.filter(n => !n.is_read).length)
    } catch (error) {
      console.error('[NotificationDropdown] Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Memoize the new notification handler to prevent unnecessary re-renders
  const handleNewNotification = useCallback((newNotification) => {
    console.log('[NotificationDropdown] New notification received:', newNotification)
    setNotifications(prev => {
      const exists = prev.some(n => n._id === newNotification._id)
      if (!exists) {
        setUnreadCount(count => count + 1)
        return [newNotification, ...prev.slice(0, 9)] // Keep max 10 items
      }
      return prev
    })
  }, [])

  // Memoize the ticket update handler
  const handleTicketUpdate = useCallback((ticketUpdate) => {
    // Only refresh notifications for significant ticket updates
    // This reduces API calls and prevents excessive re-renders
    if (ticketUpdate.status === 'closed' || ticketUpdate.status === 'assigned') {
      fetchNotifications()
    }
  }, [fetchNotifications])

  // Listen for real-time notifications with stable handlers
  useEffect(() => {
    const unsubscribeNotifications = onNotification(handleNewNotification)
    const unsubscribeTicketUpdates = onTicketUpdate(handleTicketUpdate)

    return () => {
      unsubscribeNotifications()
      unsubscribeTicketUpdates()
    }
  }, [onNotification, onTicketUpdate, handleNewNotification, handleTicketUpdate])

  // Merge WebSocket notifications with API notifications - but only when there are new ones
  useEffect(() => {
    console.log('[NotificationDropdown] WebSocket notifications update:', wsNotifications.length, 'notifications')
    if (wsNotifications.length > 0) {
      console.log('[NotificationDropdown] Merging WebSocket notifications:', wsNotifications)
      setNotifications(prev => {
        const merged = [...wsNotifications, ...prev]
        const unique = merged.filter((notification, index, arr) => 
          arr.findIndex(n => n._id === notification._id) === index
        )
        console.log('[NotificationDropdown] Final merged notifications:', unique.slice(0, 10))
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

  // Memoize the notification icon function to prevent recreation
  const getNotificationIcon = useCallback((type) => {
    switch (type) {
      case "ticket_assigned":
        return <User className="h-4 w-4" />
      case "ticket_status_changed":
        return <CheckCircle className="h-4 w-4" />
      case "ticket_comment":
        return <MessageSquare className="h-4 w-4" />
      case "system":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }, [])

  // Memoize the status color function
  const getStatusColor = useCallback((type) => {
    switch (type) {
      case "ticket_assigned":
        return "bg-blue-500"
      case "ticket_status_changed":
        return "bg-green-500"
      case "ticket_comment":
        return "bg-purple-500"
      case "system":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-80">
          {loading && notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mx-auto mb-2" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Bell className="h-4 w-4 mx-auto mb-2" />
              No notifications yet
            </div>
          ) : (
            notifications.map((notification, index) => {
              // console.log('[NotificationDropdown] Rendering notification:', notification.title, 'ID:', notification._id)
              return (
                <DropdownMenuItem key={notification._id || index} className="p-0">
                  <div
                    className={`w-full p-3 cursor-pointer transition-colors ${
                      notification.is_read ? "opacity-60" : "bg-blue-50 dark:bg-blue-950"
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification._id)
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`rounded-full p-1 ${getStatusColor(notification.notification_type)}`}>
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">{notification.title}</p>
                          {!notification.is_read && <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{notification.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                          {notification.data?.ticket_id && (
                            <Link
                              href={`/dashboard/tickets/${notification.data.ticket_id}`}
                              className="text-xs text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Ticket
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              )
            })
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/notifications" className="w-full text-center text-sm">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
