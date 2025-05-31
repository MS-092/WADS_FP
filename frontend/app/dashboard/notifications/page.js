"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, MessageSquare, AlertTriangle, User, Bell } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api"

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
      const promises = unreadNotifications.map(n => apiClient.markNotificationAsRead(n.id))
      
      await Promise.all(promises)
      
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now'
    
    try {
      // Handle both ISO string and date object
      const date = new Date(dateString)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown time'
      }
      
      const now = new Date()
      const diffInMs = now.getTime() - date.getTime()
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      
      if (diffInMinutes < 1) return 'Just now'
      if (diffInMinutes === 1) return '1 minute ago'
      if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
      
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours === 1) return '1 hour ago'
      if (diffInHours < 24) return `${diffInHours} hours ago`
      
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays === 1) return '1 day ago'
      if (diffInDays < 7) return `${diffInDays} days ago`
      
      const diffInWeeks = Math.floor(diffInDays / 7)
      if (diffInWeeks === 1) return '1 week ago'
      if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`
      
      // For older dates, show the actual date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting time:', error)
      return 'Unknown time'
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

  const getNotificationLink = (notification) => {
    // Use action_url if available, otherwise fallback to ticket link
    if (notification.action_url) {
      return notification.action_url
    }
    
    const ticketId = notification.ticket_id || notification.ticketId
    if (ticketId) {
      return `/dashboard/tickets/${ticketId}`
    }
    
    return '/dashboard/notifications'
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
                    {(notification.ticket_id || notification.ticketId) && (
                      <Link href={getNotificationLink(notification)}>
                        <Button variant="outline" size="sm">
                          View Ticket
                        </Button>
                      </Link>
                    )}
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
