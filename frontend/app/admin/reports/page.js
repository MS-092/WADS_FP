import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, LineChart, PieChart } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
        <p className="text-muted-foreground">View detailed reports and analytics on support performance</p>
      </div>
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
          </TabsList>
          <div className="mt-6">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {overviewStats.map((stat, index) => (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.change}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Ticket Volume</CardTitle>
                        <CardDescription>Number of tickets over time</CardDescription>
                      </div>
                      <Select defaultValue="30days">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7days">Last 7 days</SelectItem>
                          <SelectItem value="30days">Last 30 days</SelectItem>
                          <SelectItem value="90days">Last 90 days</SelectItem>
                          <SelectItem value="year">Last year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <div className="h-[300px] w-full bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                      <LineChart className="h-8 w-8 text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Ticket Volume Chart</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Ticket Categories</CardTitle>
                    <CardDescription>Distribution of tickets by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                      <PieChart className="h-8 w-8 text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Category Distribution</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Agent Performance</CardTitle>
                      <CardDescription>Response times and resolution rates by agent</CardDescription>
                    </div>
                    <Select defaultValue="30days">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">Last 7 days</SelectItem>
                        <SelectItem value="30days">Last 30 days</SelectItem>
                        <SelectItem value="90days">Last 90 days</SelectItem>
                        <SelectItem value="year">Last year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Agent Performance Chart</span>
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Response Time</CardTitle>
                    <CardDescription>Average time to first response</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                      <LineChart className="h-8 w-8 text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Response Time Chart</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Resolution Time</CardTitle>
                    <CardDescription>Average time to ticket resolution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                      <LineChart className="h-8 w-8 text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Resolution Time Chart</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="tickets" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Ticket Status Distribution</CardTitle>
                      <CardDescription>Current distribution of tickets by status</CardDescription>
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                    <PieChart className="h-8 w-8 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Status Distribution Chart</span>
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Ticket Priority</CardTitle>
                    <CardDescription>Distribution of tickets by priority</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Priority Distribution Chart</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Resolution Rate</CardTitle>
                    <CardDescription>Percentage of tickets resolved over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                      <LineChart className="h-8 w-8 text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Resolution Rate Chart</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

const overviewStats = [
  {
    title: "Total Tickets",
    value: "2,856",
    change: "+12% from last month",
    icon: BarChart3,
  },
  {
    title: "Avg. Response Time",
    value: "2.4h",
    change: "-18% from last month",
    icon: LineChart,
  },
  {
    title: "Avg. Resolution Time",
    value: "1.2d",
    change: "-15% from last month",
    icon: LineChart,
  },
  {
    title: "Customer Satisfaction",
    value: "92%",
    change: "+3% from last month",
    icon: PieChart,
  },
]
