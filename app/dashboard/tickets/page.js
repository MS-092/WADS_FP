import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Clock, MessageSquare, Plus, Search } from "lucide-react"

export default function TicketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Tickets</h2>
          <p className="text-muted-foreground">View and manage your support tickets</p>
        </div>
        <Link href="/dashboard/tickets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter tickets by status, priority, or search by title</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 md:max-w-sm">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search tickets..." className="pl-8" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:max-w-md">
              <Select defaultValue="all">
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
              <Select defaultValue="all">
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
          <CardTitle>All Tickets</CardTitle>
          <CardDescription>A list of all your support tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">#{ticket.id}</TableCell>
                  <TableCell>{ticket.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`rounded-full p-1 ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                      </div>
                      <span className="capitalize">{ticket.status.replace("-", " ")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(ticket.priority)}`}
                    >
                      {ticket.priority}
                    </div>
                  </TableCell>
                  <TableCell>{ticket.created}</TableCell>
                  <TableCell>{ticket.updated}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/tickets/${ticket.id}`}>
                      <Button variant="ghost" size="sm">
                        View
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

const tickets = [
  {
    id: "1001",
    title: "Login Issue",
    description: "Unable to login to my account after password reset",
    status: "open",
    priority: "High",
    created: "Apr 23, 2023",
    updated: "Apr 24, 2023",
  },
  {
    id: "1002",
    title: "Feature Request",
    description: "Would like to see dark mode implemented",
    status: "in-progress",
    priority: "Medium",
    created: "Apr 20, 2023",
    updated: "Apr 22, 2023",
  },
  {
    id: "1003",
    title: "Billing Question",
    description: "Need clarification on my recent invoice",
    status: "resolved",
    priority: "Low",
    created: "Apr 15, 2023",
    updated: "Apr 18, 2023",
  },
  {
    id: "1004",
    title: "Mobile App Crash",
    description: "App crashes when uploading profile picture",
    status: "open",
    priority: "High",
    created: "Apr 10, 2023",
    updated: "Apr 12, 2023",
  },
  {
    id: "1005",
    title: "Account Verification",
    description: "Having trouble verifying my email address",
    status: "resolved",
    priority: "Medium",
    created: "Apr 5, 2023",
    updated: "Apr 7, 2023",
  },
]

function getStatusColor(status) {
  switch (status) {
    case "open":
      return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
    case "in-progress":
      return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
    case "resolved":
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

function getStatusIcon(status) {
  switch (status) {
    case "open":
      return <Clock className="h-4 w-4" />
    case "in-progress":
      return <MessageSquare className="h-4 w-4" />
    case "resolved":
      return <CheckCircle className="h-4 w-4" />
    default:
      return <MessageSquare className="h-4 w-4" />
  }
}
