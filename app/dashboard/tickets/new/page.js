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

export default function NewTicketPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate ticket creation - in a real app, this would be an API call
    setTimeout(() => {
      setIsSubmitting(false)
      router.push("/dashboard/tickets")
    }, 1000)
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
            <div className="space-y-2">
              <Label htmlFor="title">Order ID</Label>
              <Input id="title" placeholder="Your Order ID" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select defaultValue="technical">
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Allergic Reactions</SelectItem>
                    <SelectItem value="billing">Order & Billing</SelectItem>
                    <SelectItem value="account">Defective/Faulty Products</SelectItem>
                    <SelectItem value="feature">Fragrance Recommendations</SelectItem>
                    <SelectItem value="other">General Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select defaultValue="medium">
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Please describe your fragrance inquiry, order concern, or product question in detail"
                className="min-h-[150px]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachment">Attachments (Optional)</Label>
              <Input id="attachment" type="file" />
              <p className="text-xs text-muted-foreground">
                You can upload screenshots or documents related to your issue
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Inquiry"}
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
