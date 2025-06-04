"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Home, LifeBuoy, LogOut, MessageSquare, Settings, ShieldCheck, Users, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { ChatBox } from "@/components/chatbox"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"

export function DashboardSidebar({ isAdmin = false, children }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const { logout } = useAuth()

  const userMenuItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "My Tickets",
      href: "/dashboard/tickets",
      icon: MessageSquare,
    },
    {
      title: "New Ticket",
      href: "/dashboard/tickets/new",
      icon: LifeBuoy,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  const adminMenuItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: Home,
    },
    {
      title: "All Tickets",
      href: "/admin/tickets",
      icon: MessageSquare,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  const menuItems = isAdmin ? adminMenuItems : userMenuItems

  const handleLogout = () => {
    setSidebarOpen(false)
    logout()
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <img src="/OL_logo.jpg" width="40px" height="40px" alt="Olfactory Lab Logo" />
            <span className="font-bold text-lg text-foreground">OL Support</span>
          </div>

          {/* Sidebar Content */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full text-left"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <NotificationDropdown isAdmin={isAdmin} />
              <Button variant="outline" size="sm">
                {isAdmin ? "Admin Account" : "User Account"}
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-6 max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Chat Box */}
      <ChatBox isAdmin={isAdmin} isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} ticketId="1001" />
    </div>
  )
}
