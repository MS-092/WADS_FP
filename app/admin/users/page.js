"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, UserPlus } from "lucide-react"

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")

  // Filter users based on selected filters
  const filteredUsers = users.filter((user) => {
    const matchesRole = selectedRole === "all" || user.role.toLowerCase() === selectedRole
    const matchesSearch =
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesRole && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage users and their access levels</p>
        </div>
        <Link href="/admin/users/new">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter users by role or search by name or email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 md:max-w-sm">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="md:w-[200px]">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Support Agent</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A list of all users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleColor(user.role)}`}
                    >
                      {user.role}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(user.status)}`}
                    >
                      {user.status}
                    </div>
                  </TableCell>
                  <TableCell>{user.joined}</TableCell>
                  <TableCell>{user.lastActive}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/users/${user.id}`}>
                      <Button variant="ghost" size="sm">
                        Edit
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

const users = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "User",
    status: "Active",
    joined: "Jan 15, 2023",
    lastActive: "Apr 25, 2023",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "User",
    status: "Active",
    joined: "Feb 10, 2023",
    lastActive: "Apr 24, 2023",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    role: "Support Agent",
    status: "Active",
    joined: "Mar 5, 2022",
    lastActive: "Apr 25, 2023",
  },
  {
    id: "4",
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    role: "Support Agent",
    status: "Active",
    joined: "Apr 20, 2022",
    lastActive: "Apr 25, 2023",
  },
  {
    id: "5",
    name: "David Wilson",
    email: "david.wilson@example.com",
    role: "Admin",
    status: "Active",
    joined: "Jan 5, 2022",
    lastActive: "Apr 25, 2023",
  },
  {
    id: "6",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    role: "User",
    status: "Inactive",
    joined: "Mar 15, 2023",
    lastActive: "Apr 10, 2023",
  },
  {
    id: "7",
    name: "Robert Brown",
    email: "robert.brown@example.com",
    role: "User",
    status: "Suspended",
    joined: "Feb 25, 2023",
    lastActive: "Mar 30, 2023",
  },
  {
    id: "8",
    name: "Lisa Martinez",
    email: "lisa.martinez@example.com",
    role: "Support Agent",
    status: "Active",
    joined: "Jan 10, 2022",
    lastActive: "Apr 25, 2023",
  },
  {
    id: "9",
    name: "Michael Taylor",
    email: "michael.taylor@example.com",
    role: "Admin",
    status: "Active",
    joined: "Dec 5, 2021",
    lastActive: "Apr 25, 2023",
  },
  {
    id: "10",
    name: "Jennifer Anderson",
    email: "jennifer.anderson@example.com",
    role: "User",
    status: "Active",
    joined: "Apr 1, 2023",
    lastActive: "Apr 22, 2023",
  },
]

function getRoleColor(role) {
  switch (role) {
    case "Admin":
      return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400"
    case "Support Agent":
      return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
    case "User":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
  }
}

function getStatusColor(status) {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
    case "Inactive":
      return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
    case "Suspended":
      return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
  }
}
