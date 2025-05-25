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

export function NotificationDropdown({ isAdmin = false }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Mock notifications data - in a real app, this would come from an API
  useEffect(() => {
    const mockNotifications = isAdmin ? adminNotifications : userNotifications
    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter((n) => !n.read).length)
  }, [isAdmin])

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "new_ticket":
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case "ticket_update":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "ticket_resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "assignment":
        return <User className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationLink = (notification) => {
    if (isAdmin) {
      return `/admin/tickets/${notification.ticketId || notification.id}`
    }
    return `/dashboard/tickets/${notification.ticketId || notification.id}`
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
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="p-0">
                <Link
                  href={getNotificationLink(notification)}
                  className="w-full p-3 flex items-start gap-3 hover:bg-muted/50"
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-medium truncate ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                  </div>
                </Link>
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

// Mock data for user notifications
const userNotifications = [
  {
    id: "1",
    type: "ticket_update",
    title: "Ticket #1001 Updated",
    message: "Your login issue ticket has been assigned to our technical team.",
    time: "5 minutes ago",
    read: false,
    ticketId: "1001",
  },
  {
    id: "2",
    type: "ticket_resolved",
    title: "Ticket #1003 Resolved",
    message: "Your billing question has been resolved. Please check the response.",
    time: "2 hours ago",
    read: false,
    ticketId: "1003",
  },
  {
    id: "3",
    type: "ticket_update",
    title: "Response Required",
    message: "Agent Sarah has responded to your mobile app crash ticket.",
    time: "1 day ago",
    read: true,
    ticketId: "1004",
  },
  {
    id: "4",
    type: "ticket_update",
    title: "Ticket #1002 In Progress",
    message: "Your feature request is now being reviewed by our development team.",
    time: "2 days ago",
    read: true,
    ticketId: "1002",
  },
]

// Mock data for admin notifications
const adminNotifications = [
  {
    id: "1",
    type: "new_ticket",
    title: "New Ticket Submitted",
    message: "John Doe submitted a new high-priority login issue ticket.",
    time: "2 minutes ago",
    read: false,
    ticketId: "1001",
  },
  {
    id: "2",
    type: "urgent",
    title: "Urgent Ticket Escalated",
    message: "Ticket #1008 has been escalated due to no response for 24 hours.",
    time: "15 minutes ago",
    read: false,
    ticketId: "1008",
  },
  {
    id: "3",
    type: "assignment",
    title: "Ticket Assigned",
    message: "You have been assigned ticket #1006 - Password Reset issue.",
    time: "1 hour ago",
    read: false,
    ticketId: "1006",
  },
  {
    id: "4",
    type: "new_ticket",
    title: "New Ticket Submitted",
    message: "Sarah Williams reported a mobile app crash issue.",
    time: "3 hours ago",
    read: true,
    ticketId: "1004",
  },
  {
    id: "5",
    type: "ticket_update",
    title: "Customer Response",
    message: "Emily Davis replied to ticket #1006 with additional information.",
    time: "5 hours ago",
    read: true,
    ticketId: "1006",
  },
  {
    id: "6",
    type: "ticket_resolved",
    title: "Ticket Resolved",
    message: "Mike Support marked ticket #1010 as resolved.",
    time: "1 day ago",
    read: true,
    ticketId: "1010",
  },
]
