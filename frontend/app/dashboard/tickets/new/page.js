"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LifeBuoy, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NewTicketPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    // Validation
    if (!formData.title.trim()) {
      setError("Please enter a ticket title")
      setIsSubmitting(false)
      return
    }

    if (!formData.description.trim()) {
      setError("Please enter a ticket description")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await apiClient.createTicket({
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority
      })

      if (response.data) {
        setSuccess(true)
        // Redirect to tickets list after a short delay
        setTimeout(() => {
          router.push("/dashboard/tickets")
        }, 2000)
      } else {
        setError(response.error || "Failed to create ticket")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ticket Created Successfully!</h2>
          <p className="text-muted-foreground">Your support ticket has been submitted and our team will respond soon.</p>
        </div>
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600">
                <LifeBuoy className="h-3 w-3 text-white" />
              </div>
              <p className="text-green-800 dark:text-green-200">
                Your ticket "{formData.title}" has been created with {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)} priority.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create New Ticket</h2>
        <p className="text-muted-foreground">Describe your issue and our support team will help you resolve it.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Ticket Details</CardTitle>
            <CardDescription>
              Please provide as much detail as possible to help us understand and resolve your issue quickly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief summary of your issue"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleChange("priority", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - General questions or minor issues</SelectItem>
                  <SelectItem value="medium">Medium - Standard support request</SelectItem>
                  <SelectItem value="high">High - Urgent issue affecting work</SelectItem>
                  <SelectItem value="critical">Critical - System down or data loss</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your issue in detail. Include steps to reproduce, error messages, and any relevant information."
                className="min-h-[120px]"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="attachment">Attachments (Optional)</Label>
              <Input id="attachment" type="file" disabled={isSubmitting} />
              <p className="text-xs text-muted-foreground">
                You can upload screenshots or documents related to your issue
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating Ticket..." : "Submit Ticket"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            Need Immediate Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            For urgent issues, you can contact our support team directly at{" "}
            <strong>support@helpdeskpro.com</strong> or call{" "}
            <strong>1-800-HELP-NOW</strong> during business hours.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
