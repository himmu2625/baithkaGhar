"use client"

export const dynamic = 'force-dynamic';

import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { BackButton } from "@/components/ui/back-button"

const faqs = [
  {
    id: "booking",
    category: "Booking & Reservations",
    questions: [
      {
        id: "cancel-booking",
        question: "How do I cancel my booking?",
        answer:
          "You can cancel your booking by logging into your account, navigating to 'My Bookings', and selecting the booking you wish to cancel. Click on the 'Cancel Booking' button and follow the instructions. Please note that cancellation policies vary by property.",
      },
      {
        id: "modify-booking",
        question: "Can I modify my booking dates?",
        answer:
          "Yes, you can modify your booking dates subject to availability. Log into your account, go to 'My Bookings', select the booking you wish to modify, and click on 'Modify Booking'. If the new dates are available, you can make the change. Additional charges may apply based on the new dates.",
      },
      {
        id: "booking-confirmation",
        question: "How long does it take to receive a booking confirmation?",
        answer:
          "You will receive an instant booking confirmation via email once your booking is complete. If you don't receive a confirmation within 10 minutes, please check your spam folder or contact our customer support.",
      },
      {
        id: "payment-methods",
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit and debit cards, net banking, UPI, and popular digital wallets. All payments are processed securely through our payment gateway.",
      },
    ],
  },
  {
    id: "account",
    category: "Account & Profile",
    questions: [
      {
        id: "create-account",
        question: "How do I create an account?",
        answer:
          "You can create an account by clicking on the 'Login/Signup' button at the top of the page and selecting 'Sign Up'. Fill in your details, verify your email or phone number, and you're all set!",
      },
      {
        id: "reset-password",
        question: "I forgot my password. How do I reset it?",
        answer:
          "Click on the 'Login/Signup' button, then select 'Forgot Password'. Enter your registered email address, and we'll send you a password reset link. Follow the instructions in the email to create a new password.",
      },
      {
        id: "update-profile",
        question: "How do I update my profile information?",
        answer:
          "Log into your account, navigate to your profile page by clicking on your name or profile picture, and select 'Edit Profile'. Make the necessary changes and save your updates.",
      },
    ],
  },
  {
    id: "properties",
    category: "Properties & Amenities",
    questions: [
      {
        id: "property-ratings",
        question: "How are property ratings determined?",
        answer:
          "Property ratings are based on a combination of guest reviews, amenities offered, location, and overall quality of service. Our team also conducts periodic quality checks to ensure properties maintain our standards.",
      },
      {
        id: "special-requests",
        question: "Can I make special requests for my stay?",
        answer:
          "Yes, you can add special requests during the booking process. There's a dedicated field for special requests on the booking form. While properties try their best to accommodate these requests, they cannot be guaranteed.",
      },
      {
        id: "pet-friendly",
        question: "How do I find pet-friendly accommodations?",
        answer:
          "You can use the filter option in our search results to show only pet-friendly properties. Look for the 'Pet-Friendly' filter under the 'Amenities' section.",
      },
    ],
  },
  {
    id: "pricing",
    category: "Pricing & Refunds",
    questions: [
      {
        id: "price-guarantee",
        question: "Do you offer a best price guarantee?",
        answer:
          "Yes, we offer a best price guarantee. If you find the same property at a lower price on another website within 24 hours of booking, we'll refund the difference.",
      },
      {
        id: "refund-process",
        question: "How long does it take to process a refund?",
        answer:
          "Refunds are typically processed within 5-7 business days. However, it may take an additional 3-5 business days for the amount to reflect in your account, depending on your bank or payment provider.",
      },
      {
        id: "hidden-fees",
        question: "Are there any hidden fees?",
        answer:
          "No, we believe in transparent pricing. All applicable taxes and fees are clearly displayed before you confirm your booking. There are no hidden charges.",
      },
    ],
  },
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  const filteredFaqs = faqs
    .map((category) => {
      const filteredQuestions = category.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      )

      return {
        ...category,
        questions: filteredQuestions,
      }
    })
    .filter((category) => category.questions.length > 0)

  // Expand categories with matching questions
  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (query) {
      const categoriesToExpand = filteredFaqs.map((category) => category.id)
      setExpandedCategories(categoriesToExpand)
    } else {
      setExpandedCategories([])
    }
  }

  return (
    <main className="pt-24 pb-16">
      <section className="bg-lightBeige py-16">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <BackButton 
              className="text-darkGreen hover:text-mediumGreen" 
              variant="ghost"
            />
          </div>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl font-bold text-darkGreen mb-4">Frequently Asked Questions</h1>
            <p className="text-mediumGreen text-lg">Find answers to common questions about Baithaka Ghar</p>
          </div>

          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGreen" />
              <Input
                type="text"
                placeholder="Search for questions..."
                className="pl-10 border-brownTan focus:border-brownTan"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((category) => (
                <div key={category.id} className="mb-8">
                  <h2 className="text-2xl font-bold text-darkGreen mb-4">{category.category}</h2>
                  <Accordion
                    type="single"
                    collapsible
                    className="border rounded-lg overflow-hidden"
                    value={expandedCategories.includes(category.id) ? category.questions[0].id : undefined}
                  >
                    {category.questions.map((item) => (
                      <AccordionItem key={item.id} value={item.id} className="border-b last:border-b-0">
                        <AccordionTrigger className="px-4 py-3 hover:bg-brownTan/10 text-darkGreen font-medium">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 py-3 bg-white text-mediumGreen">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-mediumGreen">No results found for "{searchQuery}"</p>
                <p className="text-brownTan mt-2">Try a different search term or browse the categories below</p>
              </div>
            )}

            {searchQuery && filteredFaqs.length === 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-darkGreen mb-4">Still have questions?</h3>
                <p className="text-mediumGreen mb-4">
                  If you couldn't find what you were looking for, please contact our customer support team.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="mailto:support@baithakaghar.com" className="text-brownTan hover:underline">
                    support@baithakaghar.com
                  </a>
                  <a href="tel:+919356547176" className="text-brownTan hover:underline">
                    +91 9356547176
                  </a>
                  <a href="tel:+919936712614" className="text-brownTan hover:underline">
                    +91 9936712614
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
