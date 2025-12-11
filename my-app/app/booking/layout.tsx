"use client"

import { BookingFlowProvider } from "@/lib/booking-flow/context"

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <BookingFlowProvider>{children}</BookingFlowProvider>
}
