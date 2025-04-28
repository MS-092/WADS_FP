import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart3, CheckCircle, Clock, MessageSquare, Users } from "lucide-react"

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">Overview of all support activities and metrics</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">+24 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">+8 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">86</div>
            <p className="text-xs text-muted-foreground">+16 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,456</div>
            <p className="text-xs text-muted-foreground">+120 from last month</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Latest support tickets across all users</CardDescription>
            </div>
            <Link href="/admin/tickets">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
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
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminTickets.map((ticket) => (
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
                    <TableCell>{ticket.created}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Support team performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{metric.name}</p>
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                  </div>
                  <div className="font-bold">{metric.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/admin/reports">
              <Button className="w-full">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Detailed Reports
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
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
    created: "Apr 23, 2023",
  },
  {
    id: "1002",
    user: "Jane Smith",
    title: "Feature Request",
    status: "In Progress",
    priority: "Medium",
    created: "Apr 20, 2023",
  },
  {
    id: "1003",
    user: "Robert Johnson",
    title: "Billing Question",
    status: "Resolved",
    priority: "Low",
    created: "Apr 15, 2023",
  },
  {
    id: "1004",
    user: "Sarah Williams",
    title: "Mobile App Crash",
    status: "Open",
    priority: "High",
    created: "Apr 10, 2023",
  },
  {
    id: "1005",
    user: "Michael Brown",
    title: "Account Verification",
    status: "Resolved",
    priority: "Medium",
    created: "Apr 5, 2023",
  },
]

const performanceMetrics = [
  {
    name: "Average Response Time",
    description: "Time to first response",
    value: "2.4 hours",
  },
  {
    name: "Average Resolution Time",
    description: "Time to ticket resolution",
    value: "1.2 days",
  },
  {
    name: "Customer Satisfaction",
    description: "Based on feedback surveys",
    value: "92%",
  },
  {
    name: "First Contact Resolution",
    description: "Tickets resolved in first contact",
    value: "78%",
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
