"use client"

export const dynamic = 'force-dynamic';

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { RazorpayButton } from "@/components/payments/razorpay-button"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Info } from "lucide-react"
import Link from "next/link"

export default function RazorpayTestPage() {
  // In a real app, these would come from actual booking data
  const mockBookingId = "mock-booking-" + Date.now()
  const mockPropertyId = "mock-property-123"

  return (
    <div className="container max-w-3xl py-10">
      <Link href="/" className="flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to home
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle>Razorpay Test Payment</CardTitle>
          <CardDescription>
            This is a test page to demonstrate Razorpay payment integration.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200 flex items-start">
              <Info className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Test Mode</p>
                <p>This is a test integration. No actual payment will be processed.</p>
                <p className="mt-2">
                  In test mode, you can use any of these details:
                </p>
                <ul className="list-disc list-inside mt-1">
                  <li>Card Number: 4111 1111 1111 1111</li>
                  <li>Expiry: Any future date</li>
                  <li>CVV: Any 3 digits</li>
                  <li>Name: Any name</li>
                </ul>
              </div>
            </div>
            
            <div className="border rounded-md p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Booking ID:</span>
                <span className="text-sm font-medium">{mockBookingId}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Property:</span>
                <span className="text-sm font-medium">Luxury Villa with Pool</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Check-in:</span>
                <span className="text-sm font-medium">May 1, 2025</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Check-out:</span>
                <span className="text-sm font-medium">May 5, 2025</span>
              </div>
              <div className="flex justify-between mt-4 pt-4 border-t">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold">₹15,000</span>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline">Cancel</Button>
          <RazorpayButton
            bookingId={mockBookingId}
            propertyId={mockPropertyId}
            returnUrl="/checkout/test"
          >
            Pay ₹15,000
          </RazorpayButton>
        </CardFooter>
      </Card>
    </div>
  )
} 