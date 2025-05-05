"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Calendar, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function BookingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("upcoming")

  return (
    <main className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-darkGreen">My Bookings</h1>
          <Button onClick={() => router.push("/")} className="bg-mediumGreen hover:bg-darkGreen text-lightYellow">
            Book New Stay
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger
              value="upcoming"
              className="data-[state=active]:bg-lightGreen data-[state=active]:text-darkGreen"
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-lightGreen data-[state=active]:text-darkGreen"
            >
              Completed
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="data-[state=active]:bg-lightGreen data-[state=active]:text-darkGreen"
            >
              Cancelled
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <Card className="border-lightGreen">
              <CardHeader>
                <CardTitle className="text-darkGreen">Upcoming Bookings</CardTitle>
                <CardDescription>Your upcoming stays</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-mediumGreen/50 mb-4" />
                  <h3 className="text-lg font-medium text-darkGreen mb-2">No upcoming bookings</h3>
                  <p className="text-mediumGreen">
                    You don't have any upcoming bookings. Start exploring and book your perfect stay!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card className="border-lightGreen">
              <CardHeader>
                <CardTitle className="text-darkGreen">Completed Bookings</CardTitle>
                <CardDescription>Your past stays</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Building className="h-12 w-12 mx-auto text-mediumGreen/50 mb-4" />
                  <h3 className="text-lg font-medium text-darkGreen mb-2">No completed bookings</h3>
                  <p className="text-mediumGreen">
                    You don't have any completed bookings yet. Book a stay to see it here after your visit.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancelled">
            <Card className="border-lightGreen">
              <CardHeader>
                <CardTitle className="text-darkGreen">Cancelled Bookings</CardTitle>
                <CardDescription>Your cancelled reservations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-mediumGreen/50 mb-4" />
                  <h3 className="text-lg font-medium text-darkGreen mb-2">No cancelled bookings</h3>
                  <p className="text-mediumGreen">You don't have any cancelled bookings.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
