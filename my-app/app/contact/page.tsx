"use client"

export const dynamic = 'force-dynamic';

import type React from "react"

import { useState } from "react"
import { Mail, Phone, MapPin, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { BackButton } from "@/components/ui/back-button"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // In a real app, this would send the form data to an API
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Reset form
      setName("")
      setEmail("")
      setPhone("")
      setMessage("")
      setIsSubmitted(true)

      // Reset success message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false)
      }, 5000)
    } catch (error) {
      setError("Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
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
            <h1 className="text-4xl font-bold text-darkGreen mb-4">Contact Us</h1>
            <p className="text-mediumGreen text-lg">
              We'd love to hear from you. Reach out to us with any questions or feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
              <Card className="bg-white border-brownTan h-full">
                <CardContent className="pt-6 flex flex-col items-center text-center h-full">
                  <div className="bg-brownTan w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <Phone className="text-lightBeige h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-darkGreen mb-2">Phone</h3>
                  <p className="text-mediumGreen mb-4">Our customer service team is available to assist you</p>
                  <div className="space-y-2 mt-auto">
                    <a href="tel: +91 9356547176" className="text-brownTan hover:underline block">
                      +91 9356547176
                    </a>
                    <a href="tel: +91 9936712614" className="text-brownTan hover:underline block">
                      +91 9936712614
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-white border-brownTan h-full">
                <CardContent className="pt-6 flex flex-col items-center text-center h-full">
                  <div className="bg-brownTan w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <Mail className="text-lightBeige h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-darkGreen mb-2">Email</h3>
                  <p className="text-mediumGreen mb-4">Send us an email and we'll get back to you</p>
                  <a href="mailto:anuragsingh@baithakaghar.com" className="text-brownTan hover:underline mt-auto">
                  anuragsingh@baithakaghar.com
                  </a>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-white border-brownTan h-full">
                <CardContent className="pt-6 flex flex-col items-center text-center h-full">
                  <div className="bg-brownTan w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="text-lightBeige h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-darkGreen mb-2">Office</h3>
                  <p className="text-mediumGreen mb-4">Visit our office during business hours</p>
                  <p className="text-brownTan mt-auto">Ground Floor, Silver Palm Resort (New Jolly Panda Resort), Near Novotel Hotel, Behind Solitude Villa Calangute- Aguda Road, Anna Waddo, Candolim -GOA 403515</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="border-brownTan">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-darkGreen mb-6 text-center">Send Us a Message</h2>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
                )}

                {isSubmitted && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    Thank you for your message! We'll get back to you soon.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-darkGreen">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="border-brownTan focus:border-brownTan"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-darkGreen">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="border-brownTan focus:border-brownTan"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-darkGreen">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        className="border-brownTan focus:border-brownTan"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-darkGreen">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help you?"
                      required
                      className="min-h-[150px] border-brownTan focus:border-brownTan"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-brownTan hover:bg-brownTan/80 text-lightBeige"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-darkGreen text-center mb-8">Frequently Asked Questions</h2>
          <p className="text-center text-mediumGreen mb-8">
            Can't find what you're looking for? Visit our{" "}
            <a href="/faq" className="text-brownTan hover:underline">
              FAQ page
            </a>{" "}
            or contact us directly.
          </p>
        </div>
      </section>
    </main>
  )
}
