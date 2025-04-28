
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { MainNav } from "@/components/main-nav"

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <div className="container mx-auto py-12 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">Find answers to common questions about using Olfactory Engineers</p>
        </div>

        <div className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search FAQs..." className="pl-8" />
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Common Questions</CardTitle>
              <CardDescription>Browse through our most frequently asked questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

const faqs = [
  {
    question: "How do I create a new support ticket?",
    answer: "To create a new ticket, log in to your account and click on the 'New Ticket' button in your dashboard. Fill out the ticket form with details about your issue and submit it. You'll receive a confirmation email with your ticket number.",
  },
  {
    question: "What information should I include in my ticket?",
    answer: "Include a clear title, detailed description of the issue, steps to reproduce the problem (if applicable), and any relevant screenshots or files. The more information you provide, the better we can assist you.",
  },
  {
    question: "How can I check the status of my ticket?",
    answer: "You can view all your tickets and their current status in your dashboard under the 'My Tickets' section. Each ticket will show its current status (Open, In Progress, or Resolved).",
  },
  {
    question: "How do I update or add information to an existing ticket?",
    answer: "Open the specific ticket from your dashboard and use the comment section to add new information. You can also upload additional files if needed.",
  },
  {
    question: "What are the different ticket priority levels?",
    answer: "We have three priority levels: Low (general inquiries), Medium (issues affecting work but with workarounds), and High (critical issues blocking work). Priority can be set when creating a ticket.",
  },
  {
    question: "How do I reset my password?",
    answer: "Click on the 'Forgot Password' link on the login page. Enter your email address, and we'll send you instructions to reset your password.",
  },
]
