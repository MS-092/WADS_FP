"use client"

import { useState } from "react"
import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const pricingPlans = [
  {
    name: "Bronze",
    description: "Essential fragrance support for boutique perfumeries",
    price: "29",
    featured: false,
    features: [
      {
        name: "Access to basic fragrance authentication",
        tooltip: "Verify authenticity of fragrances using our basic verification tools"
      },
      {
        name: "Monthly trend reports",
        tooltip: "Receive monthly reports on fragrance market trends and consumer preferences"
      },
      {
        name: "Up to 100 product verifications/month",
        tooltip: "Verify up to 100 unique fragrance products each month"
      },
      {
        name: "Email support (48h response)",
        tooltip: "Get email support with responses within 48 hours"
      },
      {
        name: "Basic perfume database access",
        tooltip: "Access our basic database of perfume information and authenticity markers"
      },
      {
        name: "Single location support",
        tooltip: "Support for one physical retail location"
      },
      {
        name: "Seasonal collection previews",
        tooltip: "Get early previews of upcoming seasonal fragrance collections"
      },
    ],
  },
  {
    name: "Silver",
    description: "Enhanced support for growing fragrance retailers",
    price: "79",
    featured: true,
    features: [
      {
        name: "Priority fragrance authentication",
        tooltip: "Fast-track authentication process with priority handling"
      },
      {
        name: "Weekly market insights",
        tooltip: "Detailed weekly reports on market trends and competitor analysis"
      },
      {
        name: "Unlimited product verifications",
        tooltip: "No limit on the number of products you can verify each month"
      },
      {
        name: "Priority email & chat support (24h)",
        tooltip: "Priority support with 24-hour response guarantee"
      },
      {
        name: "Extended perfume database access",
        tooltip: "Access to our premium database with detailed fragrance profiles"
      },
      {
        name: "Up to 3 location support",
        tooltip: "Support for up to three physical retail locations"
      },
      {
        name: "Early access to new collections",
        tooltip: "Preview and pre-order upcoming collections before general release"
      },
      {
        name: "Batch tracking system",
        tooltip: "Track and manage fragrance batches with our specialized system"
      },
      {
        name: "Customer preference analytics",
        tooltip: "Advanced analytics on customer preferences and buying patterns"
      },
    ],
  },
  {
    name: "Gold",
    description: "Premium partnership for luxury fragrance houses",
    price: "199",
    featured: false,
    features: [
      {
        name: "Instant fragrance authentication",
        tooltip: "Real-time authentication services with immediate results"
      },
      {
        name: "Daily market analysis",
        tooltip: "Comprehensive daily market analysis and insights"
      },
      {
        name: "Dedicated account manager",
        tooltip: "Personal account manager for all your needs"
      },
      {
        name: "24/7 priority support",
        tooltip: "Round-the-clock premium support services"
      },
      {
        name: "Full perfume database access",
        tooltip: "Unlimited access to our complete fragrance database"
      },
      {
        name: "Unlimited locations",
        tooltip: "Support for unlimited retail locations"
      },
      {
        name: "VIP collection previews",
        tooltip: "Exclusive first-look access to new collections"
      },
      {
        name: "Advanced analytics dashboard",
        tooltip: "Comprehensive analytics and reporting dashboard"
      },
      {
        name: "Custom integration APIs",
        tooltip: "Custom API integration with your existing systems"
      },
      {
        name: "Exclusive industry events access",
        tooltip: "VIP access to industry events and exhibitions"
      },
      {
        name: "Training for your staff",
        tooltip: "Comprehensive training programs for your team"
      },
    ],
  },
]

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState("monthly")

  const handleUpgrade = (planName) => {
    // In a real application, this would redirect to a checkout page
    console.log(`Upgrading to ${planName} plan`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Elevate Your Fragrance Business
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Choose your membership tier and unlock premium features to enhance your fragrance business expertise.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant={billingPeriod === "monthly" ? "default" : "outline"}
                  onClick={() => setBillingPeriod("monthly")}
                >
                  Monthly Billing
                </Button>
                <Button
                  variant={billingPeriod === "annual" ? "default" : "outline"}
                  onClick={() => setBillingPeriod("annual")}
                >
                  Annual Billing
                  <span className="ml-2 text-xs text-emerald-500">Save 20%</span>
                </Button>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 lg:grid-cols-3">
              <TooltipProvider>
                {pricingPlans.map((plan) => (
                  <Card 
                    key={plan.name} 
                    className={`${
                      plan.featured ? "border-primary scale-105" : ""
                    } ${
                      plan.name === "Gold" ? "bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800" :
                      plan.name === "Silver" ? "bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700" :
                      "bg-gradient-to-b from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800"
                    } transition-all duration-200 hover:scale-105`}
                  >
                    <CardHeader>
                      <CardTitle className={`${
                        plan.name === "Gold" ? "text-amber-600 dark:text-amber-300" :
                        plan.name === "Silver" ? "text-gray-600 dark:text-gray-300" :
                        "text-orange-600 dark:text-orange-300"
                      }`}>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-baseline">
                          <span className="text-3xl font-bold">
                            ${billingPeriod === "annual" 
                              ? Math.floor(parseInt(plan.price) * 0.8)
                              : plan.price}
                          </span>
                          <span className="ml-1 text-gray-500">
                            /{billingPeriod === "annual" ? "year" : "month"}
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {plan.features.map((feature) => (
                            <li key={feature.name} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-primary" />
                              <span className="flex-1">{feature.name}</span>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{feature.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </li>
                          ))}
                        </ul>
                        <Button 
                          className={`w-full ${
                            plan.name === "Gold" ? "bg-amber-600 hover:bg-amber-700" :
                            plan.name === "Silver" ? "bg-gray-600 hover:bg-gray-700" :
                            ""
                          }`} 
                          variant={plan.featured ? "default" : "outline"}
                          onClick={() => handleUpgrade(plan.name)}
                        >
                          {plan.featured ? "Recommended" : `Choose ${plan.name}`}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
