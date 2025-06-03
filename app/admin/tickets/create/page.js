"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, LifeBuoy, Loader2 } from "lucide-react"
import { ticketAPI, usersAPI, adminAPI } from "@/lib/api"
import { toast } from "sonner"

export default function AdminCreateTicketPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [category, setCategory] = useState("general")
  const [priority, setPriority] = useState("medium")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true)
        const response = await usersAPI.getAllUsers({ role: "customer", per_page: 100 })
        setUsers(response.users || response || [])
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error('Failed to load users')
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    const formData = new FormData(e.target)
    const title = formData.get("title")
    const description = formData.get("description")

    if (!selectedUserId) {
      setError("Please select a user for this ticket")
      setIsSubmitting(false)
      return
    }

    try {
      const ticketData = {
        title,
        description,
        category,
        priority,
        created_by: selectedUserId // Admin creating on behalf of user
      }

      console.log('Creating ticket with data:', ticketData)
      const response = await adminAPI.createTicket(ticketData)
      console.log('Ticket created successfully:', response)
      
      toast.success(`Ticket created successfully for ${users.find(u => u._id === selectedUserId)?.full_name || 'user'}`)
      
      // Redirect to the created ticket
      router.push(`/admin/tickets/${response._id}`)
    } catch (err) {
      console.error('Error creating ticket:', err)
      setError(err.message || "Failed to create ticket. Please try again.")
      toast.error(err.message || "Failed to create ticket")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create New Order Inquiry (Admin)</h2>
          <p className="text-muted-foreground">Create an order inquiry on behalf of a customer</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Order Inquiry Details</CardTitle>
            <CardDescription>Create a new order inquiry for a customer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="user_id">Select User *</Label>
              {loadingUsers ? (
                <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading users...
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUsers.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className="flex flex-col">
                            <span>{user.full_name || user.username}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Order ID *</Label>
              <Input id="title" name="title" placeholder="Customer's Order ID" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Questions</SelectItem>
                    <SelectItem value="technical">Allergic Reactions</SelectItem>
                    <SelectItem value="billing">Order & Billing</SelectItem>
                    <SelectItem value="feature_request">Fragrance Recommendations</SelectItem>
                    <SelectItem value="bug_report">Website Issues</SelectItem>
                    <SelectItem value="account">Defective/Faulty Products</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Provide detailed information about the customer's fragrance inquiry or order concern..."
                className="min-h-[120px]"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || loadingUsers || !selectedUserId}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Inquiry...
                </>
              ) : (
                "Create Inquiry"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            Admin Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This order inquiry will be created on behalf of the selected customer. The customer will receive notifications about 
            updates and responses to this inquiry. You can assign the inquiry to a fragrance specialist after creation.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 