"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  User,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  Save,
  X,
  AlertCircle,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Reservation {
  id: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  partySize: number
  reservationDate: string
  reservationTime: string
  duration: number
  status:
    | "pending"
    | "confirmed"
    | "seated"
    | "completed"
    | "cancelled"
    | "no_show"
  tableId?: string
  tableName?: string
  section?: string
  specialRequests?: string
  occasion?: string
  isVip: boolean
  source: "phone" | "online" | "walk_in" | "app"
  depositRequired: boolean
  depositAmount?: number
  depositPaid?: boolean
  remindersSent: number
  lastReminderTime?: string
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  confirmedAt?: string
}

interface Table {
  id: string
  name: string
  capacity: number
  section: string
  isAvailable: boolean
}

interface ReservationFormProps {
  propertyId: string
  reservation?: Reservation | null
  onClose: () => void
  onSave: (reservation: Reservation) => void
}

export function ReservationForm({
  propertyId,
  reservation,
  onClose,
  onSave,
}: ReservationFormProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState("basic")
  const [availableTables, setAvailableTables] = useState<Table[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    partySize: 2,
    reservationDate: new Date().toISOString().split("T")[0],
    reservationTime: "19:00",
    duration: 120,
    tableId: "",
    section: "",
    specialRequests: "",
    occasion: "",
    isVip: false,
    source: "phone" as "phone" | "online" | "walk_in" | "app",
    depositRequired: false,
    depositAmount: 0,
    notes: "",
  })

  useEffect(() => {
    if (reservation) {
      setFormData({
        customerName: reservation.customerName,
        customerPhone: reservation.customerPhone,
        customerEmail: reservation.customerEmail || "",
        partySize: reservation.partySize,
        reservationDate: reservation.reservationDate,
        reservationTime: reservation.reservationTime,
        duration: reservation.duration,
        tableId: reservation.tableId || "",
        section: reservation.section || "",
        specialRequests: reservation.specialRequests || "",
        occasion: reservation.occasion || "",
        isVip: reservation.isVip,
        source: reservation.source,
        depositRequired: reservation.depositRequired,
        depositAmount: reservation.depositAmount || 0,
        notes: reservation.notes || "",
      })
    }
  }, [reservation])

  useEffect(() => {
    const fetchAvailability = async () => {
      if (
        formData.reservationDate &&
        formData.reservationTime &&
        formData.partySize
      ) {
        try {
          const [tablesRes, slotsRes] = await Promise.all([
            fetch(
              `/api/fb/reservations/availability/tables?propertyId=${propertyId}&date=${formData.reservationDate}&time=${formData.reservationTime}&partySize=${formData.partySize}`,
              {
                headers: {
                  Authorization: `Bearer ${session?.accessToken}`,
                },
              }
            ),
            fetch(
              `/api/fb/reservations/availability/slots?propertyId=${propertyId}&date=${formData.reservationDate}&partySize=${formData.partySize}`,
              {
                headers: {
                  Authorization: `Bearer ${session?.accessToken}`,
                },
              }
            ),
          ])

          if (tablesRes.ok && slotsRes.ok) {
            const [tablesData, slotsData] = await Promise.all([
              tablesRes.json(),
              slotsRes.json(),
            ])

            setAvailableTables(tablesData.tables || [])
            setAvailableSlots(slotsData.slots || [])
          }
        } catch (error) {
          console.error("Error fetching availability:", error)
          // Mock data for development
          setAvailableTables([
            {
              id: "T01",
              name: "Table 1",
              capacity: 4,
              section: "Main Hall",
              isAvailable: true,
            },
            {
              id: "T02",
              name: "Table 2",
              capacity: 6,
              section: "Main Hall",
              isAvailable: true,
            },
            {
              id: "T03",
              name: "Table 3",
              capacity: 2,
              section: "Private Dining",
              isAvailable: true,
            },
            {
              id: "T04",
              name: "Table 4",
              capacity: 8,
              section: "Outdoor",
              isAvailable: true,
            },
          ])
          setAvailableSlots([
            "17:00",
            "17:30",
            "18:00",
            "18:30",
            "19:00",
            "19:30",
            "20:00",
            "20:30",
            "21:00",
            "21:30",
          ])
        }
      }
    }

    fetchAvailability()
  }, [
    formData.reservationDate,
    formData.reservationTime,
    formData.partySize,
    propertyId,
    session,
  ])

  const handleSave = async () => {
    if (!formData.customerName || !formData.customerPhone) {
      return
    }

    try {
      setLoading(true)

      const reservationData: Reservation = {
        id: reservation?.id || Date.now().toString(),
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || undefined,
        partySize: formData.partySize,
        reservationDate: formData.reservationDate,
        reservationTime: formData.reservationTime,
        duration: formData.duration,
        status: reservation?.status || "pending",
        tableId: formData.tableId || undefined,
        tableName: formData.tableId
          ? availableTables.find((t) => t.id === formData.tableId)?.name
          : undefined,
        section:
          formData.section || formData.tableId
            ? availableTables.find((t) => t.id === formData.tableId)?.section
            : undefined,
        specialRequests: formData.specialRequests || undefined,
        occasion: formData.occasion || undefined,
        isVip: formData.isVip,
        source: formData.source,
        depositRequired: formData.depositRequired,
        depositAmount: formData.depositRequired
          ? formData.depositAmount
          : undefined,
        depositPaid: reservation?.depositPaid || false,
        remindersSent: reservation?.remindersSent || 0,
        lastReminderTime: reservation?.lastReminderTime,
        notes: formData.notes || undefined,
        createdAt: reservation?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: reservation?.createdBy || session?.user?.id || "staff",
        confirmedAt: reservation?.confirmedAt,
      }

      const url = reservation
        ? `/api/fb/reservations/${reservation.id}`
        : "/api/fb/reservations"

      const method = reservation ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ ...reservationData, propertyId }),
      })

      if (response.ok) {
        const result = await response.json()
        onSave(result.reservation || reservationData)
      } else {
        // For development, still call onSave
        onSave(reservationData)
      }
    } catch (error) {
      console.error("Error saving reservation:", error)
      // For development, still call onSave
      const reservationData: Reservation = {
        id: reservation?.id || Date.now().toString(),
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || undefined,
        partySize: formData.partySize,
        reservationDate: formData.reservationDate,
        reservationTime: formData.reservationTime,
        duration: formData.duration,
        status: reservation?.status || "pending",
        tableId: formData.tableId || undefined,
        tableName: formData.tableId
          ? availableTables.find((t) => t.id === formData.tableId)?.name
          : undefined,
        section:
          formData.section || formData.tableId
            ? availableTables.find((t) => t.id === formData.tableId)?.section
            : undefined,
        specialRequests: formData.specialRequests || undefined,
        occasion: formData.occasion || undefined,
        isVip: formData.isVip,
        source: formData.source,
        depositRequired: formData.depositRequired,
        depositAmount: formData.depositRequired
          ? formData.depositAmount
          : undefined,
        depositPaid: reservation?.depositPaid || false,
        remindersSent: reservation?.remindersSent || 0,
        lastReminderTime: reservation?.lastReminderTime,
        notes: formData.notes || undefined,
        createdAt: reservation?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: reservation?.createdBy || session?.user?.id || "staff",
        confirmedAt: reservation?.confirmedAt,
      }
      onSave(reservationData)
    } finally {
      setLoading(false)
    }
  }

  const getSuitableTables = () => {
    return availableTables
      .filter(
        (table) =>
          table.capacity >= formData.partySize &&
          table.capacity <= formData.partySize + 2
      )
      .sort((a, b) => a.capacity - b.capacity)
  }

  const occasions = [
    "Birthday",
    "Anniversary",
    "Date Night",
    "Business Meeting",
    "Family Gathering",
    "Celebration",
    "Romantic Dinner",
    "Other",
  ]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white">
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 -mx-6 -mt-6 px-6 pt-6 pb-8">
          {/* Decorative blur elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full blur-lg"></div>

          <div className="relative flex items-center space-x-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-white">
                {reservation ? "Edit Reservation" : "New Reservation"}
              </DialogTitle>
              <DialogDescription className="text-blue-100">
                {reservation
                  ? `Update reservation details for ${reservation.customerName}`
                  : "Create a new dining reservation"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] pt-4">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/80 backdrop-blur-sm border border-blue-100 p-1 rounded-lg">
              <TabsTrigger
                value="basic"
                className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Guest Info
              </TabsTrigger>
              <TabsTrigger
                value="timing"
                className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium flex items-center gap-2"
              >
                <CalendarIcon className="w-4 h-4" />
                Date & Time
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium flex items-center gap-2"
              >
                💳 Billing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Guest Information
                  </CardTitle>
                  <CardDescription>
                    Essential guest details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="customerName"
                        className="text-sm font-medium text-gray-700"
                      >
                        Customer Name *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="customerName"
                          placeholder="Enter full name"
                          value={formData.customerName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customerName: e.target.value,
                            })
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="customerPhone"
                        className="text-sm font-medium text-gray-700"
                      >
                        Phone Number *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="customerPhone"
                          placeholder="Phone number"
                          value={formData.customerPhone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customerPhone: e.target.value,
                            })
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="customerEmail"
                        className="text-sm font-medium text-gray-700"
                      >
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="customerEmail"
                          type="email"
                          placeholder="Email address"
                          value={formData.customerEmail}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customerEmail: e.target.value,
                            })
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="partySize"
                        className="text-sm font-medium text-gray-700"
                      >
                        Party Size *
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="partySize"
                          type="number"
                          min="1"
                          max="20"
                          value={formData.partySize}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              partySize: parseInt(e.target.value) || 1,
                            })
                          }
                          placeholder="Number of guests"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="source"
                        className="text-sm font-medium text-gray-700"
                      >
                        Booking Source *
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Select
                          value={formData.source}
                          onValueChange={(value) =>
                            setFormData({ ...formData, source: value as any })
                          }
                        >
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select booking source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="phone">📞 Phone Call</SelectItem>
                            <SelectItem value="online">
                              🌐 Online Booking
                            </SelectItem>
                            <SelectItem value="app">📱 Mobile App</SelectItem>
                            <SelectItem value="walk_in">🚶 Walk-in</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="isVip"
                        className="text-sm font-medium text-gray-700"
                      >
                        VIP Customer
                      </Label>
                      <div className="flex items-center space-x-3 pt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <Switch
                          id="isVip"
                          checked={formData.isVip}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, isVip: checked })
                          }
                          className="data-[state=checked]:bg-blue-600"
                        />
                        <span className="text-sm text-gray-700 font-medium">
                          ⭐ Priority service and special treatment
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timing" className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Reservation Timing
                  </CardTitle>
                  <CardDescription>
                    Select date, time, and duration for the reservation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="reservationDate"
                        className="text-sm font-medium text-slate-700"
                      >
                        Reservation Date *
                      </Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="reservationDate"
                          type="date"
                          value={formData.reservationDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              reservationDate: e.target.value,
                            })
                          }
                          min={new Date().toISOString().split("T")[0]}
                          className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="reservationTime"
                        className="text-sm font-medium text-slate-700"
                      >
                        Reservation Time *
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
                        <Select
                          value={formData.reservationTime}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              reservationTime: value,
                            })
                          }
                        >
                          <SelectTrigger className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Select time slot" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSlots.map((slot) => (
                              <SelectItem key={slot} value={slot}>
                                🕐 {slot}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="duration"
                        className="text-sm font-medium text-slate-700"
                      >
                        Duration
                      </Label>
                      <Select
                        value={formData.duration.toString()}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            duration: parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">⏱️ 1 hour</SelectItem>
                          <SelectItem value="90">⏱️ 1.5 hours</SelectItem>
                          <SelectItem value="120">⏱️ 2 hours</SelectItem>
                          <SelectItem value="150">⏱️ 2.5 hours</SelectItem>
                          <SelectItem value="180">⏱️ 3 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {availableSlots.length === 0 && formData.reservationDate && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            Limited Availability
                          </p>
                          <p className="text-sm text-yellow-700">
                            No time slots available for the selected date and
                            party size.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="text-base font-medium text-slate-800 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    Table Assignment
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Assign a specific table for the reservation (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="tableId"
                      className="text-sm font-medium text-slate-700"
                    >
                      Preferred Table
                    </Label>
                    <Select
                      value={formData.tableId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, tableId: value })
                      }
                    >
                      <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select a table (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-preference">
                          🏷️ No Preference
                        </SelectItem>
                        {getSuitableTables().map((table) => (
                          <SelectItem key={table.id} value={table.id}>
                            🪑 {table.name} - {table.capacity} seats (
                            {table.section})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {getSuitableTables().length === 0 &&
                    formData.partySize > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <div>
                            <p className="text-sm font-medium text-red-800">
                              No Suitable Tables
                            </p>
                            <p className="text-sm text-red-700">
                              No tables available for a party of{" "}
                              {formData.partySize} at the selected time.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    Special Preferences
                  </CardTitle>
                  <CardDescription>
                    Special requests, occasions, and dietary requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="occasion"
                      className="text-sm font-medium text-slate-700"
                    >
                      Special Occasion
                    </Label>
                    <Select
                      value={formData.occasion}
                      onValueChange={(value) =>
                        setFormData({ ...formData, occasion: value })
                      }
                    >
                      <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select special occasion (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-occasion">
                          🏷️ No Special Occasion
                        </SelectItem>
                        {occasions.map((occasion) => (
                          <SelectItem key={occasion} value={occasion}>
                            🎉 {occasion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="specialRequests"
                      className="text-sm font-medium text-slate-700"
                    >
                      Special Requests & Dietary Requirements
                    </Label>
                    <Textarea
                      id="specialRequests"
                      placeholder="Any special dietary requirements, seating preferences, allergies, or other requests..."
                      value={formData.specialRequests}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specialRequests: e.target.value,
                        })
                      }
                      rows={3}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-lg">💳</span>
                    Deposit & Billing
                  </CardTitle>
                  <CardDescription>
                    Deposit requirements and additional notes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="depositRequired"
                      className="text-sm font-medium text-slate-700"
                    >
                      Deposit Required
                    </Label>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <Switch
                        id="depositRequired"
                        checked={formData.depositRequired}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            depositRequired: checked,
                          })
                        }
                        className="data-[state=checked]:bg-green-500"
                      />
                      <span className="text-sm text-green-800 font-medium">
                        💰 Require advance payment for reservation security
                      </span>
                    </div>
                  </div>

                  {formData.depositRequired && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="depositAmount"
                        className="text-sm font-medium text-slate-700"
                      >
                        Deposit Amount (₹) *
                      </Label>
                      <Input
                        id="depositAmount"
                        type="number"
                        placeholder="Enter deposit amount"
                        value={formData.depositAmount || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            depositAmount: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                        className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="notes"
                      className="text-sm font-medium text-slate-700"
                    >
                      Internal Notes
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Internal notes for staff (not visible to customer)..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows={3}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {reservation && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="mb-3 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-blue-600" />
                        <h4 className="text-sm font-medium text-blue-900">
                          Reservation History
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">📅 Created:</span>
                          <span className="font-medium text-slate-800">
                            {new Date(reservation.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">
                            ✏️ Last Updated:
                          </span>
                          <span className="font-medium text-slate-800">
                            {new Date(reservation.updatedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">
                            📬 Reminders Sent:
                          </span>
                          <span className="font-medium text-slate-800">
                            {reservation.remindersSent}
                          </span>
                        </div>
                        {reservation.confirmedAt && (
                          <div className="flex justify-between">
                            <span className="text-blue-700">
                              ✅ Confirmed At:
                            </span>
                            <span className="font-medium text-slate-800">
                              {new Date(
                                reservation.confirmedAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="border-t bg-gradient-to-r from-gray-50 to-blue-50 -mx-6 -mb-6 px-6 pb-6 pt-4">
          <div className="flex justify-between items-center w-full">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>

            <div className="flex space-x-2">
              {currentTab !== "basic" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const tabs = ["basic", "timing", "preferences", "billing"]
                    const currentIndex = tabs.indexOf(currentTab)
                    if (currentIndex > 0) {
                      setCurrentTab(tabs[currentIndex - 1])
                    }
                  }}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  ← Previous
                </Button>
              )}

              {currentTab !== "billing" ? (
                <Button
                  onClick={() => {
                    const tabs = ["basic", "timing", "preferences", "billing"]
                    const currentIndex = tabs.indexOf(currentTab)
                    if (currentIndex < tabs.length - 1) {
                      setCurrentTab(tabs[currentIndex + 1])
                    }
                  }}
                  disabled={
                    currentTab === "basic" &&
                    (!formData.customerName || !formData.customerPhone)
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next →
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={
                    loading || !formData.customerName || !formData.customerPhone
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading
                    ? "🔄 Saving..."
                    : reservation
                    ? "✅ Update Reservation"
                    : "🍽️ Create Reservation"}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
