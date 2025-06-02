import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Clock, MessageSquare, ShieldCheck, Shield } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { FAQAccordion } from "@/components/FAQAccordion"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 max-w-7xl">
          <Link href="#home">
            <div className="flex items-center gap-2 font-bold">
              <img src="/OL_logo.jpg" width="40px" height="40px" alt="Olfactory Lab Logo" />
              <span>Olfactory Lab Support</span>
            </div>
          </Link>
          <div className="flex items-center gap-6"> 
            <nav className="hidden md:flex items-center gap-6 mr-2">
              <Link href="#features" className="text-sm font-medium hover:underline hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#faq" className="text-sm font-medium hover:underline hover:text-primary transition-colors">
                FAQ
              </Link>
            </nav>
            <div className="flex items-center gap-4">
               <div className="rounded-md px-3 py-1.5 bg-gray-200 dark:bg-gray-800">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section id="home" className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Premium Support For Your Fragrance Needs
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Submit, track, and resolve your perfume-related inquiries through our easy to use Help Desk Ticketing System. 
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="gap-1.5">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline">
                      Log in
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-full overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-blue-950/50 dark:to-indigo-950/50">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img src="/OLbackground.png"></img>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-950">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Powerful Features for Efficient Support
                </h2>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-center space-y-2 rounded-lg border p-4 shadow-sm">
                  <div className="rounded-full bg-primary/10 p-2.5">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-center text-gray-500 dark:text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="faq" className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <FAQAccordion />
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full border-t">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl flex flex-col gap-2 sm:flex-row sm:justify-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
            © {new Date().getFullYear()} Olfactory Engineers. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: MessageSquare,
    title: "Ticket Management",
    description: "Create, track, and resolve support tickets efficiently with our intuitive interface.",
  },
  {
    icon: Shield,
    title: "Secure Authentication",
    description: "Secure login and registration for both customers and admins.",
  },
  {
    icon: Clock,
    title: "Priority Levels",
    description: "Set and manage priority levels for each ticket to focus on critical issues.",
  },
  {
    icon: CheckCircle,
    title: "Smart Assignment",
    description: "Assign tickets to specific admins based on expertise and workload.",
  },
  {
    icon: ArrowRight,
    title: "Notifications",
    description: "Receive email notifications for ticket updates and responses.",
  },
  {
    icon: ShieldCheck,
    title: "Reporting",
    description: "Generate detailed reports on ticket status, response times, and agent performance.",
  },
]
