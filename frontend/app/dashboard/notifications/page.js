"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, MessageSquare, Clock, CheckCircle, User, AlertTriangle } from "lucide-react"
import { apiClient } from "@/lib/api"
import { formatTimeAgo } from "@/lib/time-utils"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
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

        setNotifications(response.data || [])
      } catch (err) {
        setError('Failed to load notifications')
        console.error('Error fetching notifications:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const markAsRead = async (id) => {
    try {
      const response = await apiClient.markNotificationAsRead(id)
      
      if (response.error) {
        console.error('Failed to mark notification as read:', response.error)
        return
      }

      setNotifications((prev) =>
        prev.map((notification) => 
          notification.id === id ? { ...notification, is_read: true } : notification
        ),
      )
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
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
            <p className="text-muted-foreground">Stay updated with your ticket activities</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center text-muted-foreground">Loading notifications...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
            <p className="text-muted-foreground">Stay updated with your ticket activities</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center text-red-500">Error: {error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const unreadNotifications = notifications.filter((n) => !n.is_read)
  const readNotifications = notifications.filter((n) => n.is_read)

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
          <NotificationList notifications={notifications} onMarkAsRead={markAsRead} formatTimeAgo={formatTimeAgo} />
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <NotificationList notifications={unreadNotifications} onMarkAsRead={markAsRead} formatTimeAgo={formatTimeAgo} />
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          <NotificationList notifications={readNotifications} onMarkAsRead={markAsRead} formatTimeAgo={formatTimeAgo} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NotificationList({ notifications, onMarkAsRead, formatTimeAgo }) {
  const getNotificationIcon = (type) => {
    switch (type) {
      case "ticket_created":
      case "TICKET_CREATED":
      case "new_ticket":
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case "ticket_updated":
      case "TICKET_UPDATED":
      case "ticket_update":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "ticket_resolved":
      case "TICKET_RESOLVED":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "ticket_assigned":
      case "TICKET_ASSIGNED":
      case "assignment":
        return <User className="h-5 w-5 text-purple-500" />
      case "comment_added":
      case "COMMENT_ADDED":
      case "message_received":
      case "MESSAGE_RECEIVED":
        return <MessageSquare className="h-5 w-5 text-green-500" />
      case "user_mentioned":
      case "USER_MENTIONED":
        return <User className="h-5 w-5 text-orange-500" />
      case "file_uploaded":
      case "FILE_UPLOADED":
        return <MessageSquare className="h-5 w-5 text-cyan-500" />
      case "system_announcement":
      case "SYSTEM_ANNOUNCEMENT":
        return <Bell className="h-5 w-5 text-indigo-500" />
      case "urgent":
      case "URGENT":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
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
        <Card key={notification.id} className={`${!notification.is_read ? "border-l-4 border-l-blue-500" : ""}`}>
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
                  <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</span>
                  <div className="flex items-center gap-2">
                    {!notification.is_read && (
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
