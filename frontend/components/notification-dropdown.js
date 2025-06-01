"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle, Clock, MessageSquare, AlertTriangle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { apiClient } from "@/lib/api"
import { formatTimeAgo } from "@/lib/time-utils"

export function NotificationDropdown({ isAdmin = false }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.getNotifications()
        
        if (response.error) {
          setError(response.error)
          console.error('Failed to fetch notifications:', response.error)
          return
        }

        const notificationData = response.data || []
        setNotifications(notificationData)
        setUnreadCount(notificationData.filter((n) => !n.is_read).length)
      } catch (err) {
        setError('Failed to load notifications')
        console.error('Error fetching notifications:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [isAdmin])

  const markAsRead = async (id) => {
    try {
      const response = await apiClient.markNotificationAsRead(id.toString())
      
      if (response.error) {
        console.error('Failed to mark notification as read:', response.error)
        return
      }

      setNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, is_read: true } : notification)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read)
      if (unreadNotifications.length === 0) return
      
      const unreadIds = unreadNotifications.map(n => n.id)
      const response = await apiClient.markAllAsRead(unreadIds)
      
      if (response.error) {
        console.error('Failed to mark all notifications as read:', response.error)
        return
      }
      
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "ticket_created":
      case "TICKET_CREATED":
      case "new_ticket":
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case "ticket_updated":
      case "TICKET_UPDATED":
      case "ticket_update":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "ticket_resolved":
      case "TICKET_RESOLVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "ticket_assigned":
      case "TICKET_ASSIGNED":
      case "assignment":
        return <User className="h-4 w-4 text-purple-500" />
      case "comment_added":
      case "COMMENT_ADDED":
      case "message_received":
      case "MESSAGE_RECEIVED":
        return <MessageSquare className="h-4 w-4 text-green-500" />
      case "user_mentioned":
      case "USER_MENTIONED":
        return <User className="h-4 w-4 text-orange-500" />
      case "file_uploaded":
      case "FILE_UPLOADED":
        return <MessageSquare className="h-4 w-4 text-cyan-500" />
      case "system_announcement":
      case "SYSTEM_ANNOUNCEMENT":
        return <Bell className="h-4 w-4 text-indigo-500" />
      case "urgent":
      case "URGENT":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-auto p-1">
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading notifications...</div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-red-500">Failed to load notifications</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-4 space-y-2 cursor-default"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    <span className="font-medium text-sm">{notification.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.is_read && (
                      <Badge variant="secondary" className="h-2 w-2 rounded-full p-0 bg-blue-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                </div>
                {notification.message && (
                  <p className="text-sm text-muted-foreground line-clamp-2 w-full">
                    {notification.message}
                  </p>
                )}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center">
              <Link
                href={isAdmin ? "/admin/notifications" : "/dashboard/notifications"}
                className="w-full text-sm text-primary"
              >
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
