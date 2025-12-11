"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Phone,
  Clock,
  MessageSquare,
  FileText,
  AlertCircle,
  CheckCircle2,
  Info,
  Upload,
  X,
  MapPin,
} from "lucide-react"

import { useBookingFlow } from "@/lib/booking-flow/context"
import {
  ProgressIndicator,
  BOOKING_STEPS,
} from "@/app/booking/components/ProgressIndicator"
import { BookingSummary } from "@/app/booking/components/BookingSummary"
import {
  validateEmail,
  validatePhone,
  validateName,
  validateGSTIN,
} from "@/lib/booking-flow/validation"

// Country codes for phone validation
const COUNTRY_CODES = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+86", country: "China", flag: "🇨🇳" },
]

// Generate arrival time options (12:00 AM to 11:30 PM in 30-min intervals)
const ARRIVAL_TIMES = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? "00" : "30"
  const period = hour < 12 ? "AM" : "PM"
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minute} ${period}`
})

// Special request options
const SPECIAL_REQUESTS = [
  {
    id: "earlyCheckIn",
    label: "Early Check-in",
    description: "Subject to availability",
  },
  {
    id: "highFloor",
    label: "High Floor",
    description: "Preferred high floor room",
  },
  {
    id: "twinBeds",
    label: "Twin Beds",
    description: "Separate beds instead of double",
  },
  {
    id: "quietRoom",
    label: "Quiet Room",
    description: "Away from noise and elevators",
  },
  {
    id: "airportPickup",
    label: "Airport Pickup",
    description: "Need pickup service",
  },
]

interface ValidationState {
  firstName: { valid: boolean; message: string }
  lastName: { valid: boolean; message: string }
  email: { valid: boolean; message: string }
  phone: { valid: boolean; message: string }
  gstin: { valid: boolean; message: string }
}

export default function GuestDetailsPage() {
  const router = useRouter()
  const {
    bookingData,
    updateBookingData,
    nextStep,
    previousStep,
    isStepValid,
  } = useBookingFlow()

  // Form state
  const [firstName, setFirstName] = useState(
    bookingData.guestInfo?.firstName || ""
  )
  const [lastName, setLastName] = useState(
    bookingData.guestInfo?.lastName || ""
  )
  const [email, setEmail] = useState(bookingData.guestInfo?.email || "")
  const [countryCode, setCountryCode] = useState(
    bookingData.guestInfo?.countryCode || "+91"
  )
  const [phone, setPhone] = useState(bookingData.guestInfo?.phone || "")
  const [address, setAddress] = useState(bookingData.guestInfo?.address || "")
  const [idProof, setIdProof] = useState<File | null>(null)
  const [idProofPreview, setIdProofPreview] = useState<string | null>(
    bookingData.guestInfo?.idProof &&
      typeof bookingData.guestInfo.idProof === "string"
      ? bookingData.guestInfo.idProof
      : null
  )
  const [arrivalTime, setArrivalTime] = useState(bookingData.arrivalTime || "")

  // Special requests state
  const [specialRequests, setSpecialRequests] = useState<string[]>(
    bookingData.specialRequests?.requests || []
  )
  const [comments, setComments] = useState(
    bookingData.specialRequests?.comments || ""
  )

  // GST details state
  const [includeGST, setIncludeGST] = useState(
    !!bookingData.gstDetails?.companyName
  )
  const [companyName, setCompanyName] = useState(
    bookingData.gstDetails?.companyName || ""
  )
  const [gstin, setGstin] = useState(bookingData.gstDetails?.gstin || "")
  const [companyAddress, setCompanyAddress] = useState(
    bookingData.gstDetails?.companyAddress || ""
  )

  // Validation state
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    gstin: false,
  })

  const [showErrors, setShowErrors] = useState(false)

  // Real-time validation
  const validation: ValidationState = useMemo(() => {
    return {
      firstName: validateName(firstName, "First name"),
      lastName: validateName(lastName, "Last name"),
      email: validateEmail(email),
      phone: validatePhone(phone, countryCode),
      gstin: includeGST ? validateGSTIN(gstin) : { valid: true, message: "" },
    }
  }, [firstName, lastName, email, phone, countryCode, gstin, includeGST])

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return (
      validation.firstName.valid &&
      validation.lastName.valid &&
      validation.email.valid &&
      validation.phone.valid &&
      arrivalTime !== "" &&
      (!includeGST || (validation.gstin.valid && companyName && companyAddress))
    )
  }, [validation, arrivalTime, includeGST, companyName, companyAddress])

  // Handle field blur (mark as touched)
  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  // Toggle special request
  const handleSpecialRequestToggle = (requestId: string) => {
    setSpecialRequests((prev) =>
      prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId]
    )
  }

  // Handle ID proof file change
  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
      ]
      if (!validTypes.includes(file.type)) {
        alert("Please upload a valid file (JPG, PNG, WebP, or PDF)")
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB")
        return
      }
      setIdProof(file)
      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setIdProofPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setIdProofPreview(null)
      }
    }
  }

  // Convert file to base64 string for storage
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  // Remove ID proof
  const handleRemoveIdProof = () => {
    setIdProof(null)
    setIdProofPreview(null)
    const fileInput = document.getElementById("idProof") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  // Handle back button
  const handleBack = async () => {
    // Convert file to base64 if exists
    let idProofString: string | undefined = undefined
    if (idProof) {
      try {
        idProofString = await fileToBase64(idProof)
      } catch (error) {
        console.error("Error converting file to base64:", error)
      }
    }

    // Save current data before going back
    updateBookingData({
      guestInfo: {
        firstName,
        lastName,
        email,
        countryCode,
        phone,
        address: address || undefined,
        idProof: idProofString || bookingData.guestInfo?.idProof,
      },
      arrivalTime,
      specialRequests: {
        requests: specialRequests,
        comments,
      },
      gstDetails: includeGST
        ? {
            required: true,
            companyName,
            gstin,
            companyAddress,
          }
        : undefined,
    })
    previousStep()

    // Reconstruct URL with all necessary parameters from bookingData
    const {
      propertyData,
      roomCategoryData,
      dateSelection,
      guestSelection,
      mealSelection,
    } = bookingData

    if (propertyData && roomCategoryData && dateSelection && guestSelection) {
      let reviewUrl = `/booking/review?propertyId=${propertyData._id}`
      reviewUrl += `&categoryId=${roomCategoryData._id}`
      reviewUrl += `&checkIn=${dateSelection.checkIn.toISOString()}`
      reviewUrl += `&checkOut=${dateSelection.checkOut.toISOString()}`
      reviewUrl += `&rooms=${guestSelection.rooms}`
      reviewUrl += `&adults=${guestSelection.adults}`
      reviewUrl += `&children=${guestSelection.children}`

      if (
        guestSelection.roomConfigurations &&
        guestSelection.roomConfigurations.length > 0
      ) {
        reviewUrl += `&roomConfigs=${encodeURIComponent(
          JSON.stringify(guestSelection.roomConfigurations)
        )}`
      }

      if (
        mealSelection?.selectedMeals &&
        mealSelection.selectedMeals.length > 0
      ) {
        reviewUrl += `&meals=${encodeURIComponent(
          JSON.stringify(mealSelection.selectedMeals)
        )}`
      }

      router.push(reviewUrl)
    } else {
      // Fallback if data is missing
      router.back()
    }
  }

  // Handle continue to payment
  const handleContinue = async () => {
    setShowErrors(true)

    if (!isFormValid) {
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    // Convert file to base64 if exists
    let idProofString: string | undefined = undefined
    if (idProof) {
      try {
        idProofString = await fileToBase64(idProof)
      } catch (error) {
        console.error("Error converting file to base64:", error)
      }
    } else if (
      bookingData.guestInfo?.idProof &&
      typeof bookingData.guestInfo.idProof === "string"
    ) {
      // Keep existing idProof if no new file uploaded
      idProofString = bookingData.guestInfo.idProof
    }

    // Update booking data
    updateBookingData({
      guestInfo: {
        firstName,
        lastName,
        email,
        countryCode,
        phone,
        address: address || undefined,
        idProof: idProofString,
      },
      arrivalTime,
      specialRequests: {
        requests: specialRequests,
        comments,
      },
      gstDetails: includeGST
        ? {
            required: true,
            companyName,
            gstin,
            companyAddress,
          }
        : undefined,
      currentStep: 2,
    })

    nextStep()
    router.push("/booking/payment")
  }

  // Track if component is mounted to avoid redirect race condition
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Redirect if Step 1 not completed (after component mounts and context hydrates)
  useEffect(() => {
    // Wait a bit for context to hydrate from sessionStorage
    const timer = setTimeout(() => {
      if (isMounted && !isStepValid(1)) {
        // Build URL with available data or go back
        const {
          propertyData,
          roomCategoryData,
          dateSelection,
          guestSelection,
          mealSelection,
        } = bookingData

        if (
          propertyData &&
          roomCategoryData &&
          dateSelection &&
          guestSelection
        ) {
          let reviewUrl = `/booking/review?propertyId=${propertyData._id}`
          reviewUrl += `&categoryId=${roomCategoryData._id}`
          reviewUrl += `&checkIn=${dateSelection.checkIn.toISOString()}`
          reviewUrl += `&checkOut=${dateSelection.checkOut.toISOString()}`
          reviewUrl += `&rooms=${guestSelection.rooms}`
          reviewUrl += `&adults=${guestSelection.adults}`
          reviewUrl += `&children=${guestSelection.children}`

          if (
            guestSelection.roomConfigurations &&
            guestSelection.roomConfigurations.length > 0
          ) {
            reviewUrl += `&roomConfigs=${encodeURIComponent(
              JSON.stringify(guestSelection.roomConfigurations)
            )}`
          }

          if (
            mealSelection?.selectedMeals &&
            mealSelection.selectedMeals.length > 0
          ) {
            reviewUrl += `&meals=${encodeURIComponent(
              JSON.stringify(mealSelection.selectedMeals)
            )}`
          }

          router.push(reviewUrl)
        } else {
          router.push("/")
        }
      }
    }, 100) // Small delay to allow context hydration

    return () => clearTimeout(timer)
  }, [isMounted, isStepValid, router, bookingData])

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressIndicator currentStep={2} steps={BOOKING_STEPS} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Guest Details
              </h1>
              <p className="text-sm text-gray-600">
                Please provide your information to complete the booking
              </p>
            </div>

            {/* Validation Alert */}
            {showErrors && !isFormValid && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-sm text-red-800">
                  Please fix all errors before continuing to payment.
                </AlertDescription>
              </Alert>
            )}

            {/* Guest Information Card */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h2>
              </div>

              <div className="space-y-4">
                {/* First Name */}
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => handleBlur("firstName")}
                    placeholder="Enter your first name"
                    className={`mt-1 ${
                      touched.firstName && !validation.firstName.valid
                        ? "border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                  />
                  {touched.firstName && !validation.firstName.valid && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validation.firstName.message}
                    </p>
                  )}
                  {touched.firstName && validation.firstName.valid && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Looks good!
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => handleBlur("lastName")}
                    placeholder="Enter your last name"
                    className={`mt-1 ${
                      touched.lastName && !validation.lastName.valid
                        ? "border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                  />
                  {touched.lastName && !validation.lastName.valid && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validation.lastName.message}
                    </p>
                  )}
                  {touched.lastName && validation.lastName.valid && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Looks good!
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur("email")}
                      placeholder="your.email@example.com"
                      className={`pl-10 ${
                        touched.email && !validation.email.valid
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                    />
                  </div>
                  {touched.email && !validation.email.valid && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validation.email.message}
                    </p>
                  )}
                  {touched.email && validation.email.valid && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Valid email address
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Booking confirmation will be sent to this email
                  </p>
                </div>

                {/* Phone Number */}
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number <span className="text-red-600">*</span>
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_CODES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.flag} {country.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex-1 relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) =>
                          setPhone(e.target.value.replace(/[^0-9]/g, ""))
                        }
                        onBlur={() => handleBlur("phone")}
                        placeholder="9876543210"
                        className={`pl-10 ${
                          touched.phone && !validation.phone.valid
                            ? "border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                      />
                    </div>
                  </div>
                  {touched.phone && !validation.phone.valid && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validation.phone.message}
                    </p>
                  )}
                  {touched.phone && validation.phone.valid && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Valid phone number
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Property may contact you for booking details
                  </p>
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address" className="text-sm font-medium">
                    Address
                  </Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your complete address"
                      rows={3}
                      className="pl-10 resize-none"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Your residential or mailing address
                  </p>
                </div>

                {/* ID Proof Upload */}
                <div>
                  <Label htmlFor="idProof" className="text-sm font-medium">
                    ID Proof
                  </Label>
                  <div className="mt-1">
                    {!idProof ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          Upload your ID proof (Aadhaar, Passport, Driving
                          License, etc.)
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          Accepted formats: JPG, PNG, WebP, PDF (Max 5MB)
                        </p>
                        <Input
                          id="idProof"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                          onChange={handleIdProofChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document.getElementById("idProof")?.click()
                          }
                          className="mt-2"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </Button>
                      </div>
                    ) : (
                      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {idProofPreview ? (
                              <img
                                src={idProofPreview}
                                alt="ID Proof preview"
                                className="h-16 w-16 object-cover rounded border border-gray-300"
                              />
                            ) : (
                              <FileText className="h-12 w-12 text-gray-400" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {idProof.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(idProof.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveIdProof}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Upload a valid government-issued ID for
                    verification
                  </p>
                </div>
              </div>
            </Card>

            {/* Arrival Time Card */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Arrival Information
                </h2>
              </div>

              <div>
                <Label htmlFor="arrivalTime" className="text-sm font-medium">
                  Expected Arrival Time <span className="text-red-600">*</span>
                </Label>
                <Select value={arrivalTime} onValueChange={setArrivalTime}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your arrival time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {ARRIVAL_TIMES.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showErrors && !arrivalTime && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Please select your expected arrival time
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Standard check-in:{" "}
                  {bookingData.propertyData?.checkInTime || "2:00 PM"}
                </p>
              </div>
            </Card>

            {/* Special Requests Card */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Special Requests
                </h2>
                <Badge variant="secondary" className="text-xs">
                  Optional
                </Badge>
              </div>

              <div className="space-y-4">
                {/* Quick Request Checkboxes */}
                <div className="space-y-3">
                  {SPECIAL_REQUESTS.map((request) => (
                    <div key={request.id} className="flex items-start gap-3">
                      <Checkbox
                        id={request.id}
                        checked={specialRequests.includes(request.id)}
                        onCheckedChange={() =>
                          handleSpecialRequestToggle(request.id)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={request.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {request.label}
                        </Label>
                        <p className="text-xs text-gray-500">
                          {request.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Comments */}
                <div>
                  <Label htmlFor="comments" className="text-sm font-medium">
                    Additional Comments
                  </Label>
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Any other special requests or preferences..."
                    rows={4}
                    className="mt-1 resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {comments.length}/500 characters
                  </p>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-xs text-blue-800">
                    Special requests are subject to availability and may incur
                    additional charges. The property will do their best to
                    accommodate your requests.
                  </AlertDescription>
                </Alert>
              </div>
            </Card>

            {/* GST Details Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    GST Details
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeGST"
                    checked={includeGST}
                    onCheckedChange={(checked) =>
                      setIncludeGST(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="includeGST"
                    className="text-sm cursor-pointer"
                  >
                    I need GST invoice
                  </Label>
                </div>
              </div>

              {includeGST && (
                <div className="space-y-4">
                  {/* Company Name */}
                  <div>
                    <Label
                      htmlFor="companyName"
                      className="text-sm font-medium"
                    >
                      Company Name <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter registered company name"
                      className="mt-1"
                    />
                    {showErrors && includeGST && !companyName && (
                      <p className="text-xs text-red-600 mt-1">
                        Company name is required for GST invoice
                      </p>
                    )}
                  </div>

                  {/* GSTIN */}
                  <div>
                    <Label htmlFor="gstin" className="text-sm font-medium">
                      GSTIN <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="gstin"
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      onBlur={() => handleBlur("gstin")}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      className={`mt-1 ${
                        touched.gstin && includeGST && !validation.gstin.valid
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                    />
                    {touched.gstin && includeGST && !validation.gstin.valid && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validation.gstin.message}
                      </p>
                    )}
                    {touched.gstin && includeGST && validation.gstin.valid && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Valid GSTIN format
                      </p>
                    )}
                  </div>

                  {/* Company Address */}
                  <div>
                    <Label
                      htmlFor="companyAddress"
                      className="text-sm font-medium"
                    >
                      Company Address <span className="text-red-600">*</span>
                    </Label>
                    <Textarea
                      id="companyAddress"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Enter complete registered address"
                      rows={3}
                      className="mt-1 resize-none"
                    />
                    {showErrors && includeGST && !companyAddress && (
                      <p className="text-xs text-red-600 mt-1">
                        Company address is required for GST invoice
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!includeGST && (
                <p className="text-sm text-gray-600">
                  Enable this option if you need a GST invoice for business
                  expenses. You can add GST details later from your booking
                  confirmation email.
                </p>
              )}
            </Card>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center justify-center gap-2 flex-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Review
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!isFormValid}
                className="flex items-center justify-center gap-2 flex-1 bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Continue to Payment
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {!isFormValid && showErrors && (
              <p className="text-xs text-center text-gray-600">
                Please fill all required fields correctly to proceed
              </p>
            )}
          </div>

          {/* Right side: Booking Summary */}
          <div className="lg:col-span-1">
            {bookingData.propertyData &&
              bookingData.roomCategoryData &&
              bookingData.dateSelection &&
              bookingData.guestSelection &&
              bookingData.pricing && (
                <BookingSummary
                  propertyData={bookingData.propertyData}
                  roomCategoryData={bookingData.roomCategoryData}
                  dateSelection={bookingData.dateSelection}
                  guestSelection={bookingData.guestSelection}
                  pricing={bookingData.pricing}
                  showEditButtons={false}
                  compact={false}
                />
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
