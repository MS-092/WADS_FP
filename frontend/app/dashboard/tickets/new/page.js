"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { LifeBuoy } from "lucide-react"
import { ticketAPI } from "@/lib/api"
import { apiClient } from "@/lib/api"

export default function NewTicketPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [category, setCategory] = useState("general")
  const [priority, setPriority] = useState("medium")
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    const formData = new FormData(e.target)
    const title = formData.get("title")
    const description = formData.get("description")

    try {
      // Check if user is authenticated
      const token = apiClient.getToken();
      if (!token) {
        throw new Error('Please log in to create a ticket');
      }

      const ticketData = {
        title,
        description,
        category,
        priority
      }

      console.log('Creating ticket with data:', ticketData);
      const response = await ticketAPI.createTicket(ticketData)
      console.log('Ticket created successfully:', response);
      
      // Redirect to tickets page
      router.push("/dashboard/tickets")
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(err.message || "Failed to create ticket. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create New Order Inquiry</h2>
        <p className="text-muted-foreground">Submit a new inquiry about your fragrance order or product question</p>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Order Inquiry Details</CardTitle>
            <CardDescription>Please provide details about your fragrance order or product question so our specialists can assist you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Order ID</Label>
              <Input id="title" name="title" placeholder="Your Order ID" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Allergic Reactions</SelectItem>
                    <SelectItem value="billing">Order & Billing</SelectItem>
                    <SelectItem value="account">Defective/Faulty Products</SelectItem>
                    <SelectItem value="feature_request">Fragrance Recommendations</SelectItem>
                    <SelectItem value="bug_report">Website Issues</SelectItem>
                    <SelectItem value="general">General Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Please describe your fragrance inquiry, order concern, or product question in detail"
                className="min-h-[150px]"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LifeBuoy className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  Submit Inquiry
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            Need Immediate Fragrance Assistance?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            For urgent fragrance orders or product questions, you can contact our fragrance specialists directly at <strong>fragrancehelp@perfumecollection.com</strong> or
            call <strong>1-800-SCENT-NOW</strong> during business hours.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
