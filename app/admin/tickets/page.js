"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, UserPlus } from "lucide-react"

export default function AdminTicketsPage() {
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Filter tickets based on selected filters
  const filteredTickets = adminTickets.filter((ticket) => {
    const matchesStatus = selectedStatus === "all" || ticket.status.toLowerCase().replace(" ", "-") === selectedStatus
    const matchesPriority = selectedPriority === "all" || ticket.priority.toLowerCase() === selectedPriority
    const matchesSearch =
      searchQuery === "" ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesPriority && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Tickets</h2>
          <p className="text-muted-foreground">Manage and assign support tickets</p>
        </div>
        <Link href="/admin/tickets/create">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Create Ticket
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter tickets by status, priority, or search by title or user</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 md:max-w-sm">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tickets or users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:max-w-md">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ticket Management</CardTitle>
          <CardDescription>A list of all support tickets in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">#{ticket.id}</TableCell>
                  <TableCell>{ticket.user}</TableCell>
                  <TableCell>{ticket.title}</TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(ticket.status)}`}
                    >
                      {ticket.status}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(ticket.priority)}`}
                    >
                      {ticket.priority}
                    </div>
                  </TableCell>
                  <TableCell>{ticket.assignedTo || "Unassigned"}</TableCell>
                  <TableCell>{ticket.created}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/tickets/${ticket.id}`}>
                      <Button variant="ghost" size="sm">
                        Manage
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

const adminTickets = [
  {
    id: "1001",
    user: "John Doe",
    title: "Login Issue",
    status: "Open",
    priority: "High",
    assignedTo: "Sarah Tech",
    created: "Apr 23, 2023",
  },
  {
    id: "1002",
    user: "Jane Smith",
    title: "Feature Request",
    status: "In Progress",
    priority: "Medium",
    assignedTo: "Mike Support",
    created: "Apr 20, 2023",
  },
  {
    id: "1003",
    user: "Robert Johnson",
    title: "Billing Question",
    status: "Resolved",
    priority: "Low",
    assignedTo: "Lisa Finance",
    created: "Apr 15, 2023",
  },
  {
    id: "1004",
    user: "Sarah Williams",
    title: "Mobile App Crash",
    status: "Open",
    priority: "High",
    assignedTo: null,
    created: "Apr 10, 2023",
  },
  {
    id: "1005",
    user: "Michael Brown",
    title: "Account Verification",
    status: "Resolved",
    priority: "Medium",
    assignedTo: "Sarah Tech",
    created: "Apr 5, 2023",
  },
  {
    id: "1006",
    user: "Emily Davis",
    title: "Password Reset",
    status: "Open",
    priority: "Medium",
    assignedTo: null,
    created: "Apr 25, 2023",
  },
  {
    id: "1007",
    user: "David Wilson",
    title: "Subscription Upgrade",
    status: "In Progress",
    priority: "Low",
    assignedTo: "Lisa Finance",
    created: "Apr 22, 2023",
  },
  {
    id: "1008",
    user: "Jennifer Taylor",
    title: "API Integration Issue",
    status: "Open",
    priority: "High",
    assignedTo: "Mike Support",
    created: "Apr 18, 2023",
  },
  {
    id: "1009",
    user: "Thomas Anderson",
    title: "Data Export Problem",
    status: "In Progress",
    priority: "Medium",
    assignedTo: "Sarah Tech",
    created: "Apr 16, 2023",
  },
  {
    id: "1010",
    user: "Amanda Martinez",
    title: "Dashboard Not Loading",
    status: "Resolved",
    priority: "High",
    assignedTo: "Mike Support",
    created: "Apr 12, 2023",
  },
]

function getStatusColor(status) {
  switch (status) {
    case "Open":
      return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
    case "In Progress":
      return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
    case "Resolved":
      return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
  }
}

function getPriorityColor(priority) {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
    case "Medium":
      return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
    case "Low":
      return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
  }
}
