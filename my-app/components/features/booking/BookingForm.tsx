"use client"

import React, { useState, useEffect } from 'react'
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { addDays, format, differenceInDays } from "date-fns"
import { CreditCard, Users, Calendar, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { BookingCalendar } from "./BookingCalendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

interface BookedDate {
  startDate: Date
  endDate: Date
}

// Define the form schema with Zod
const bookingFormSchema = z.object({
  checkIn: z.date({
    required_error: "Check-in date is required",
  }),
  checkOut: z.date({
    required_error: "Check-out date is required",
  }),
  adults: z.coerce.number().int().min(1, {
    message: "At least 1 adult is required",
  }).max(10, {
    message: "Maximum 10 adults allowed",
  }),
  children: z.coerce.number().int().min(0).max(6, {
    message: "Maximum 6 children allowed",
  }),
  specialRequests: z.string().max(500, {
    message: "Special requests must not exceed 500 characters",
  }).optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions",
  }),
})

type BookingFormValues = z.infer<typeof bookingFormSchema>

interface BookingFormProps {
  propertyId: string
  propertyName: string
  pricePerNight: number
  bookedDates?: BookedDate[]
  minBookingDays?: number
  maxBookingDays?: number
  minDate?: Date
  maxDate?: Date
  maxGuests?: number
  taxRate?: number
  discounts?: {
    name: string
    amount: number
    type: 'percentage' | 'fixed'
  }[]
  onSubmit?: (formData: BookingFormValues & { totalPrice: number }) => Promise<void>
  redirectToCheckout?: boolean
  className?: string
}

export function BookingForm({
  propertyId,
  propertyName,
  pricePerNight,
  bookedDates = [],
  minBookingDays = 1,
  maxBookingDays = 90,
  minDate = new Date(),
  maxDate = addDays(new Date(), 365),
  maxGuests = 16,
  taxRate = 0.05,
  discounts = [],
  onSubmit,
  redirectToCheckout = true,
  className
}: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pricing, setPricing] = useState({
    nights: 0,
    basePrice: 0,
    tax: 0,
    discounts: 0,
    totalPrice: 0
  })

  // Create an array of options for adults and children selects
  const adultOptions = Array.from({ length: maxGuests }, (_, i) => i + 1)
  const childrenOptions = Array.from({ length: maxGuests / 2 + 1 }, (_, i) => i)

  // Initialize the form with default values
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      checkIn: addDays(new Date(), 1),
      checkOut: addDays(new Date(), 3),
      adults: 2,
      children: 0,
      specialRequests: "",
      agreeToTerms: false
    }
  })

  const checkIn = form.watch("checkIn")
  const checkOut = form.watch("checkOut")

  // Update pricing when form values change
  useEffect(() => {
    if (checkIn && checkOut) {
      const nights = Math.max(1, differenceInDays(checkOut, checkIn))
      const basePrice = nights * pricePerNight
      
      // Calculate discounts
      const totalDiscounts = discounts.reduce((total, discount) => {
        if (discount.type === 'percentage') {
          return total + (basePrice * discount.amount / 100)
        }
        return total + discount.amount
      }, 0)
      
      const subtotal = basePrice - totalDiscounts
      const tax = subtotal * taxRate
      const totalPrice = subtotal + tax
      
      setPricing({
        nights,
        basePrice,
        tax,
        discounts: totalDiscounts,
        totalPrice
      })
    }
  }, [checkIn, checkOut, pricePerNight, taxRate, discounts])

  const handleCalendarChange = ({ from, to }: { from: Date; to: Date }) => {
    form.setValue("checkIn", from)
    form.setValue("checkOut", to)
  }

  const onFormSubmit = async (data: BookingFormValues) => {
    if (onSubmit) {
      try {
        setIsSubmitting(true)
        
        // Make sure the dates are valid
        if (differenceInDays(data.checkOut, data.checkIn) < minBookingDays) {
          form.setError("checkIn", {
            type: "manual",
            message: `Minimum stay is ${minBookingDays} ${minBookingDays === 1 ? 'night' : 'nights'}`
          })
          return
        }
        
        if (differenceInDays(data.checkOut, data.checkIn) > maxBookingDays) {
          form.setError("checkIn", {
            type: "manual",
            message: `Maximum stay is ${maxBookingDays} nights`
          })
          return
        }
        
        // Submit the form data along with price details
        await onSubmit({
          ...data,
          totalPrice: pricing.totalPrice
        })


        // If redirectToCheckout is true, the parent component will handle the redirect
      } catch (error) {
        // Error submitting booking
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium">{formatCurrency(pricePerNight)} per night</h3>
          <p className="text-sm text-muted-foreground">{propertyName}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="checkIn"
              render={() => (
                <FormItem className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <FormLabel>Dates</FormLabel>
                  </div>
                  <BookingCalendar
                    bookedDates={bookedDates}
                    minBookingDays={minBookingDays}
                    maxBookingDays={maxBookingDays}
                    minDate={minDate}
                    maxDate={maxDate}
                    defaultSelected={{
                      from: form.getValues("checkIn"),
                      to: form.getValues("checkOut")
                    }}
                    price={pricePerNight}
                    onDateSelect={handleCalendarChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="adults"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      <FormLabel>Adults</FormLabel>
                    </div>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of adults" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {adultOptions.map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="children"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      <FormLabel>Children</FormLabel>
                    </div>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of children" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {childrenOptions.map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specialRequests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requests (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Any special requirements or requests?"
                    />
                  </FormControl>
                  <FormDescription>
                    Let the host know if you have any special requirements
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{formatCurrency(pricePerNight)} x {pricing.nights} {pricing.nights === 1 ? 'night' : 'nights'}</span>
                <span>{formatCurrency(pricing.basePrice)}</span>
              </div>
              
              {pricing.discounts > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discounts</span>
                  <span>-{formatCurrency(pricing.discounts)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span>Taxes ({(taxRate * 100).toFixed(0)}%)</span>
                <span>{formatCurrency(pricing.tax)}</span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(pricing.totalPrice)}</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the terms and conditions
                    </FormLabel>
                    <FormDescription>
                      By checking this box, you agree to the booking terms and cancellation policy.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  {redirectToCheckout ? 'Reserve' : 'Book Now'} <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
            
            <p className="text-center text-xs text-muted-foreground">
              You won't be charged yet
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 