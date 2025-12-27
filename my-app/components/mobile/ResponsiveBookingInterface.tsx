"use client"

import React, { useState, useEffect } from 'react'
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { addDays, format, differenceInDays } from "date-fns"
import {
  CreditCard,
  Users,
  Calendar,
  ArrowRight,
  Loader2,
  ChevronDown,
  MapPin,
  Star,
  Wifi,
  Car,
  Coffee,
  Tv,
  ShieldCheck,
  Heart,
  Share,
  X,
  Menu,
  ChevronLeft
} from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface BookedDate {
  startDate: Date
  endDate: Date
}

interface Amenity {
  icon: React.ReactNode
  name: string
  available: boolean
}

interface PropertyImage {
  id: string
  url: string
  alt: string
  featured?: boolean
}

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
  roomType: z.string().optional(),
  specialRequests: z.string().max(500, {
    message: "Special requests must not exceed 500 characters",
  }).optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions",
  }),
  contactEmail: z.string().email("Please enter a valid email"),
  contactPhone: z.string().min(10, "Please enter a valid phone number"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
})

type BookingFormValues = z.infer<typeof bookingFormSchema>

interface ResponsiveBookingInterfaceProps {
  propertyId: string
  propertyName: string
  propertyDescription?: string
  propertyLocation?: string
  propertyRating?: number
  propertyImages?: PropertyImage[]
  pricePerNight: number
  originalPrice?: number
  bookedDates?: BookedDate[]
  minBookingDays?: number
  maxBookingDays?: number
  minDate?: Date
  maxDate?: Date
  maxGuests?: number
  taxRate?: number
  cleaningFee?: number
  serviceFee?: number
  amenities?: Amenity[]
  roomTypes?: Array<{ id: string; name: string; price: number; maxGuests: number }>
  discounts?: {
    name: string
    amount: number
    type: 'percentage' | 'fixed'
    code?: string
  }[]
  cancellationPolicy?: string
  instantBook?: boolean
  onSubmit?: (formData: BookingFormValues & { totalPrice: number }) => Promise<void>
  onSaveForLater?: (formData: Partial<BookingFormValues>) => void
  onShare?: () => void
  className?: string
}

export function ResponsiveBookingInterface({
  propertyId,
  propertyName,
  propertyDescription,
  propertyLocation,
  propertyRating = 4.5,
  propertyImages = [],
  pricePerNight,
  originalPrice,
  bookedDates = [],
  minBookingDays = 1,
  maxBookingDays = 90,
  minDate = new Date(),
  maxDate = addDays(new Date(), 365),
  maxGuests = 16,
  taxRate = 0.05,
  cleaningFee = 0,
  serviceFee = 0,
  amenities = [],
  roomTypes = [],
  discounts = [],
  cancellationPolicy,
  instantBook = false,
  onSubmit,
  onSaveForLater,
  onShare,
  className
}: ResponsiveBookingInterfaceProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [pricing, setPricing] = useState({
    nights: 0,
    basePrice: 0,
    cleaningFee,
    serviceFee,
    tax: 0,
    discounts: 0,
    totalPrice: 0
  })

  const adultOptions = Array.from({ length: maxGuests }, (_, i) => i + 1)
  const childrenOptions = Array.from({ length: Math.min(maxGuests / 2 + 1, 7) }, (_, i) => i)

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      checkIn: addDays(new Date(), 1),
      checkOut: addDays(new Date(), 3),
      adults: 2,
      children: 0,
      specialRequests: "",
      agreeToTerms: false,
      contactEmail: "",
      contactPhone: "",
      firstName: "",
      lastName: "",
      roomType: roomTypes[0]?.id || ""
    }
  })

  const checkIn = form.watch("checkIn")
  const checkOut = form.watch("checkOut")
  const selectedRoomType = form.watch("roomType")

  useEffect(() => {
    if (checkIn && checkOut) {
      const nights = Math.max(1, differenceInDays(checkOut, checkIn))
      const selectedRoom = roomTypes.find(room => room.id === selectedRoomType)
      const nightlyRate = selectedRoom?.price || pricePerNight
      const basePrice = nights * nightlyRate

      const totalDiscounts = discounts.reduce((total, discount) => {
        if (discount.type === 'percentage') {
          return total + (basePrice * discount.amount / 100)
        }
        return total + discount.amount
      }, 0)

      const subtotal = basePrice - totalDiscounts + cleaningFee + serviceFee
      const tax = subtotal * taxRate
      const totalPrice = subtotal + tax

      setPricing({
        nights,
        basePrice,
        cleaningFee,
        serviceFee,
        tax,
        discounts: totalDiscounts,
        totalPrice
      })
    }
  }, [checkIn, checkOut, pricePerNight, taxRate, discounts, selectedRoomType, roomTypes, cleaningFee, serviceFee])

  const onFormSubmit = async (data: BookingFormValues) => {
    if (onSubmit) {
      try {
        setIsSubmitting(true)

        if (differenceInDays(data.checkOut, data.checkIn) < minBookingDays) {
          form.setError("checkIn", {
            type: "manual",
            message: `Minimum stay is ${minBookingDays} ${minBookingDays === 1 ? 'night' : 'nights'}`
          })
          return
        }

        await onSubmit({
          ...data,
          totalPrice: pricing.totalPrice
        })
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

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-6">
      {[1, 2, 3].map((step) => (
        <div
          key={step}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            step === currentStep
              ? 'bg-primary text-primary-foreground'
              : step < currentStep
              ? 'bg-primary/20 text-primary'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {step}
        </div>
      ))}
    </div>
  )

  const renderPropertyHeader = () => (
    <div className="relative">
      {/* Image Gallery */}
      <div className="relative h-64 sm:h-80 overflow-hidden rounded-t-lg">
        {propertyImages.length > 0 ? (
          <>
            <img
              src={propertyImages[currentImageIndex]?.url}
              alt={propertyImages[currentImageIndex]?.alt}
              className="w-full h-full object-cover"
            />
            {propertyImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {propertyImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No images available</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onShare}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
          >
            <Share className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsFavorited(!isFavorited)}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
          >
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>

        {/* Instant Book Badge */}
        {instantBook && (
          <Badge className="absolute top-4 left-4 bg-primary">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Instant Book
          </Badge>
        )}
      </div>

      {/* Property Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-xl font-semibold line-clamp-2">{propertyName}</h1>
            {propertyLocation && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {propertyLocation}
              </div>
            )}
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
            <span className="text-sm font-medium">{propertyRating.toFixed(1)}</span>
          </div>
        </div>

        {propertyDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {propertyDescription}
          </p>
        )}

        {/* Price Display */}
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold">{formatCurrency(pricePerNight)}</span>
          {originalPrice && originalPrice > pricePerNight && (
            <span className="text-lg text-muted-foreground line-through">
              {formatCurrency(originalPrice)}
            </span>
          )}
          <span className="text-sm text-muted-foreground">per night</span>
        </div>

        {/* Amenities Preview */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {amenities.slice(0, 4).map((amenity, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {amenity.icon}
                <span className="ml-1">{amenity.name}</span>
              </Badge>
            ))}
            {amenities.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{amenities.length - 4} more
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">When are you staying?</h2>

        {/* Quick Date Picker */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <FormField
            control={form.control}
            name="checkIn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check-in</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    min={format(minDate, 'yyyy-MM-dd')}
                    max={format(maxDate, 'yyyy-MM-dd')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="checkOut"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check-out</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    min={checkIn ? format(addDays(checkIn, 1), 'yyyy-MM-dd') : format(addDays(minDate, 1), 'yyyy-MM-dd')}
                    max={format(maxDate, 'yyyy-MM-dd')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Guests */}
      <div>
        <h3 className="text-lg font-semibold mb-4">How many guests?</h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="adults"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adults</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Adults" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {adultOptions.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'Adult' : 'Adults'}
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
                <FormLabel>Children</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Children" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {childrenOptions.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 0 ? 'Children' : num === 1 ? 'Child' : 'Children'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Room Type Selection */}
      {roomTypes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Choose your room</h3>
          <div className="space-y-3">
            {roomTypes.map((room) => (
              <FormField
                key={room.id}
                control={form.control}
                name="roomType"
                render={({ field }) => (
                  <FormItem>
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        field.value === room.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                      onClick={() => field.onChange(room.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{room.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Up to {room.maxGuests} guests
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(room.price)}</p>
                          <p className="text-xs text-muted-foreground">per night</p>
                        </div>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Your details</h2>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="John" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Doe" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="contactEmail"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input {...field} type="email" placeholder="john@example.com" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contactPhone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input {...field} type="tel" placeholder="+91 9876543210" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="specialRequests"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Special Requests (Optional)</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Any special requirements or requests?"
                rows={3}
              />
            </FormControl>
            <FormDescription>
              Let the host know if you have any special requirements
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Review and book</h2>

      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Dates</span>
            <span>
              {format(checkIn, 'MMM d')} - {format(checkOut, 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Guests</span>
            <span>
              {form.getValues('adults')} adults
              {form.getValues('children') > 0 && `, ${form.getValues('children')} children`}
            </span>
          </div>
          {form.getValues('roomType') && (
            <div className="flex justify-between text-sm">
              <span>Room</span>
              <span>
                {roomTypes.find(r => r.id === form.getValues('roomType'))?.name}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Price Details
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showPriceBreakdown ? 'rotate-180' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>{formatCurrency(pricePerNight)} x {pricing.nights} nights</span>
            <span>{formatCurrency(pricing.basePrice)}</span>
          </div>

          {showPriceBreakdown && (
            <>
              {cleaningFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Cleaning fee</span>
                  <span>{formatCurrency(cleaningFee)}</span>
                </div>
              )}

              {serviceFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Service fee</span>
                  <span>{formatCurrency(serviceFee)}</span>
                </div>
              )}

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
            </>
          )}

          <Separator />

          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(pricing.totalPrice)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <FormField
        control={form.control}
        name="agreeToTerms"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="text-sm">
                I agree to the terms and conditions
              </FormLabel>
              <FormDescription className="text-xs">
                By checking this box, you agree to the booking terms and cancellation policy.
              </FormDescription>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {cancellationPolicy && (
        <div className="p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-1">Cancellation Policy</h4>
          <p className="text-xs text-muted-foreground">{cancellationPolicy}</p>
        </div>
      )}
    </div>
  )

  return (
    <div className={`max-w-md mx-auto bg-background ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          {currentStep > 1 && (
            <Button variant="ghost" size="sm" onClick={prevStep}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="font-semibold">
            {currentStep === 1 ? 'Select dates' : currentStep === 2 ? 'Your details' : 'Review booking'}
          </h1>
          <div className="w-8" /> {/* Spacer */}
        </div>
        {renderStepIndicator()}
      </div>

      {/* Property Header - only show on step 1 */}
      {currentStep === 1 && renderPropertyHeader()}

      {/* Form Content */}
      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <div className="flex space-x-3 pt-4">
              {currentStep < 3 && (
                <>
                  {onSaveForLater && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => onSaveForLater(form.getValues())}
                    >
                      Save for Later
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex-1"
                    disabled={currentStep === 1 && (!checkIn || !checkOut)}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}

              {currentStep === 3 && (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    <>
                      {instantBook ? 'Book Instantly' : 'Request to Book'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {currentStep === 3 && (
              <p className="text-center text-xs text-muted-foreground">
                {instantBook ? "You'll be charged immediately" : "You won't be charged yet"}
              </p>
            )}
          </form>
        </Form>
      </div>

      {/* Fixed Price Bar - show on steps 2 and 3 */}
      {currentStep > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">{formatCurrency(pricing.totalPrice)}</p>
              <p className="text-sm text-muted-foreground">
                {pricing.nights} nights • {format(checkIn, 'MMM d')} - {format(checkOut, 'MMM d')}
              </p>
            </div>
            {currentStep === 2 && (
              <Button onClick={nextStep} disabled={!form.formState.isValid}>
                Review
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}