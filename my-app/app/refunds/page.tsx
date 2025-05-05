"use client"

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function RefundsPage() {
  const router = useRouter()

  return (
    <main className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-darkGreen">Refund Status</h1>
          <Button
            onClick={() => router.push("/bookings")}
            className="bg-mediumGreen hover:bg-darkGreen text-lightYellow"
          >
            View Bookings
          </Button>
        </div>

        <Card className="border-lightGreen">
          <CardHeader>
            <CardTitle className="text-darkGreen">Refund Requests</CardTitle>
            <CardDescription>Track the status of your refund requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-mediumGreen/50 mb-4" />
              <h3 className="text-lg font-medium text-darkGreen mb-2">No refunds in progress</h3>
              <p className="text-mediumGreen">
                You don't have any pending refund requests. Refund history will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
