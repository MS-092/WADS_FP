import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, MessageSquare, Plus } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back, John!</h2>
          <p className="text-muted-foreground">Here's an overview of your support tickets</p>
        </div>
        <Link href="/dashboard/tickets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">-1 from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+3 from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4h</div>
            <p className="text-xs text-muted-foreground">-1h from last week</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center gap-4 rounded-lg border p-3">
                  <div className={`rounded-full p-1 ${getStatusColor(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{ticket.title}</p>
                    <p className="text-sm text-muted-foreground">{ticket.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full px-2 py-1 text-xs ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </div>
                    <Link href={`/dashboard/tickets/${ticket.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/tickets">
              <Button variant="outline">View all tickets</Button>
            </Link>
          </CardFooter>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Help Resources</CardTitle>
            <CardDescription>Helpful resources and documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {helpResources.map((resource, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-1">
                    <resource.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{resource.title}</p>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="#">
              <Button variant="outline">View knowledge base</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

const recentTickets = [
  {
    id: "1",
    title: "Login Issue",
    description: "Unable to login to my account after password reset",
    status: "open",
    priority: "High",
  },
  {
    id: "2",
    title: "Feature Request",
    description: "Would like to see dark mode implemented",
    status: "in-progress",
    priority: "Medium",
  },
  {
    id: "3",
    title: "Billing Question",
    description: "Need clarification on my recent invoice",
    status: "resolved",
    priority: "Low",
  },
  {
    id: "4",
    title: "Mobile App Crash",
    description: "App crashes when uploading profile picture",
    status: "open",
    priority: "High",
  },
]

const helpResources = [
  {
    icon: MessageSquare,
    title: "FAQs",
    description: "Frequently asked questions about our services",
  },
  {
    icon: CheckCircle,
    title: "User Guide",
    description: "Step-by-step guide to using our platform",
  },
  {
    icon: Clock,
    title: "Video Tutorials",
    description: "Visual guides for common tasks and features",
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
