'use client'

import * as React from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    question: 'How do I submit a ticket?',
    answer: 'You can submit a ticket by logging into your account and clicking the "Create Ticket" button on your dashboard.',
  },
  {
    question: 'Can I track the status of my request?',
    answer: 'Yes, you can view all submitted tickets and track their progress from the Ticket List page.',
  },
  {
    question: 'How long does it take to get a response?',
    answer: 'Our support team typically responds within 24 hours on business days.',
  },
]

export function FAQAccordion() {
  return (
    <Accordion.Root type="single" collapsible className="w-full max-w-2xl mx-auto space-y-4">
      {faqs.map((faq, index) => (
        <Accordion.Item
          key={index}
          value={`item-${index}`}
          className="border border-gray-200 rounded-lg overflow-hidden dark:border-gray-700"
        >
          <Accordion.Header>
            <Accordion.Trigger
              className={cn(
                'flex w-full items-center justify-between bg-white px-4 py-3 text-left font-medium text-gray-900 transition hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {faq.question}
              <ChevronDown className="h-5 w-5 transition-transform duration-300 AccordionChevron" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content
            className="px-4 pb-4 pt-2 text-sm text-gray-600 dark:text-gray-300 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
          >
            {faq.answer}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}
