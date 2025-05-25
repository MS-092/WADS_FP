"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, MessageSquare, AlertTriangle, User, Bell } from "lucide-react"
import Link from "next/link"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(userNotifications)

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

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

  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">Stay updated with your ticket activities</p>
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
        <Card key={notification.id} className={`${!notification.read ? "border-l-4 border-l-blue-500" : ""}`}>
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
                </div>
                <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                  <div className="flex items-center gap-2">
                    {notification.ticketId && (
                      <Link href={`/dashboard/tickets/${notification.ticketId}`}>
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

// Mock data for user notifications
const userNotifications = [
  {
    id: "1",
    type: "ticket_update",
    title: "Ticket #1001 Updated",
    message:
      "Your login issue ticket has been assigned to our technical team. Sarah Tech will be handling your case and will respond within 24 hours.",
    time: "5 minutes ago",
    read: false,
    ticketId: "1001",
  },
  {
    id: "2",
    type: "ticket_resolved",
    title: "Ticket #1003 Resolved",
    message:
      "Your billing question has been resolved. Please check the response from our finance team and let us know if you need any clarification.",
    time: "2 hours ago",
    read: false,
    ticketId: "1003",
  },
  {
    id: "3",
    type: "ticket_update",
    title: "Response Required",
    message:
      "Agent Sarah has responded to your mobile app crash ticket. Please provide the additional information requested to help us resolve the issue.",
    time: "1 day ago",
    read: true,
    ticketId: "1004",
  },
  {
    id: "4",
    type: "ticket_update",
    title: "Ticket #1002 In Progress",
    message:
      "Your feature request is now being reviewed by our development team. We will update you on the progress within the next week.",
    time: "2 days ago",
    read: true,
    ticketId: "1002",
  },
  {
    id: "5",
    type: "ticket_update",
    title: "Ticket #1005 Closed",
    message:
      "Your account verification ticket has been successfully resolved and closed. Your account is now fully verified.",
    time: "3 days ago",
    read: true,
    ticketId: "1005",
  },
]
