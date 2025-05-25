"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, MessageSquare, AlertTriangle, User, Bell } from "lucide-react"
import Link from "next/link"

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState(adminNotifications)

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)
  const urgentNotifications = notifications.filter((n) => n.type === "urgent")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Notifications</h2>
          <p className="text-muted-foreground">Monitor all helpdesk activities and urgent issues</p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
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

function AdminNotificationList({ notifications, onMarkAsRead }) {
  const getNotificationIcon = (type) => {
    switch (type) {
      case "new_ticket":
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case "ticket_update":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "ticket_resolved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "urgent":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "assignment":
        return <User className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
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
        <Card
          key={notification.id}
          className={`${!notification.read ? "border-l-4 border-l-blue-500" : ""} ${notification.type === "urgent" ? "border-l-red-500" : ""}`}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={`font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                    {notification.title}
                  </h3>
                  {!notification.read && (
                    <Badge variant="secondary" className="text-xs">
                      New
                    </Badge>
                  )}
                  {notification.type === "urgent" && (
                    <Badge variant="destructive" className="text-xs">
                      Urgent
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                  <div className="flex items-center gap-2">
                    {notification.ticketId && (
                      <Link href={`/admin/tickets/${notification.ticketId}`}>
                        <Button variant="outline" size="sm">
                          View Ticket
                        </Button>
                      </Link>
                    )}
                    {!notification.read && (
                      <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(notification.id)}>
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

// Mock data for admin notifications
const adminNotifications = [
  {
    id: "1",
    type: "new_ticket",
    title: "New High Priority Ticket",
    message:
      "John Doe submitted a new high-priority login issue ticket. This requires immediate attention as it affects user access.",
    time: "2 minutes ago",
    read: false,
    ticketId: "1001",
  },
  {
    id: "2",
    type: "urgent",
    title: "Ticket Escalated - SLA Breach",
    message:
      "Ticket #1008 has been escalated due to no response for 24 hours. This is now breaching our SLA agreement.",
    time: "15 minutes ago",
    read: false,
    ticketId: "1008",
  },
  {
    id: "3",
    type: "assignment",
    title: "New Ticket Assignment",
    message:
      "You have been assigned ticket #1006 - Password Reset issue. Customer Emily Davis is waiting for assistance.",
    time: "1 hour ago",
    read: false,
    ticketId: "1006",
  },
  {
    id: "4",
    type: "new_ticket",
    title: "Mobile App Issue Reported",
    message: "Sarah Williams reported a critical mobile app crash issue affecting multiple users. Priority: High.",
    time: "3 hours ago",
    read: true,
    ticketId: "1004",
  },
  {
    id: "5",
    type: "ticket_update",
    title: "Customer Response Received",
    message:
      "Emily Davis replied to ticket #1006 with additional information and screenshots of the password reset issue.",
    time: "5 hours ago",
    read: true,
    ticketId: "1006",
  },
  {
    id: "6",
    type: "ticket_resolved",
    title: "Ticket Successfully Resolved",
    message: "Mike Support marked ticket #1010 as resolved. Customer satisfaction rating: 5 stars.",
    time: "1 day ago",
    read: true,
    ticketId: "1010",
  },
  {
    id: "7",
    type: "urgent",
    title: "System Alert - High Ticket Volume",
    message:
      "Unusual spike in ticket submissions detected. 15 new tickets in the last hour. Consider allocating additional resources.",
    time: "2 days ago",
    read: true,
    ticketId: null,
  },
]
