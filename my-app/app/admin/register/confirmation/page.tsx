"use client"

import Link from "next/link"
import { CheckCircle2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminRegisterConfirmationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-center">Registration Submitted</CardTitle>
          <CardDescription className="text-center">
            Your admin access request has been received
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <p>
              Thank you for your registration request. Your application for admin access
              is now pending approval from a Super Admin.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-4">
              <h3 className="font-medium text-amber-800 mb-2">What happens next?</h3>
              <ul className="text-sm text-amber-700 list-disc list-inside space-y-1 text-left">
                <li>A Super Admin will review your request</li>
                <li>You'll receive an email notification about your approval status</li>
                <li>If approved, you can login with the credentials you provided</li>
                <li>Your access level will be set according to your assigned role</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            className="w-full bg-darkGreen hover:bg-darkGreen/90" 
            asChild
          >
            <Link href="/admin/login">
              Return to Login
            </Link>
          </Button>
          
          <Link
            href="/"
            className="text-sm text-darkGreen hover:underline flex items-center justify-center"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to homepage
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
} 