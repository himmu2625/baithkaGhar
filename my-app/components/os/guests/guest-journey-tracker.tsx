"use client"

import React, { useState, useEffect } from "react"
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle, GlassCardDescription } from "@/components/os/ui/glass-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  User,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  MessageSquare,
  Bell,
  CheckCircle2,
  Circle,
  AlertCircle,
  Gift,
  Car,
  Utensils,
  Bed,
  Coffee,
  Wind,
  Wifi,
  Tv,
  Bath,
  CreditCard,
  Receipt,
  Camera,
  Heart,
  Flag,
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Edit,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Guest {
  id: string
  name: string
  email: string
  phone: string
  profileImage?: string
  vipStatus: "regular" | "silver" | "gold" | "platinum"
  stayCount: number
  totalSpent: number
  currentStay?: {
    checkIn: string
    checkOut: string
    roomNumber: string
    adults: number
    children: number
    specialRequests: string[]
    preferences: {
      bedType: string
      pillowType: string
      temperature: number
      floor: string
    }
  }
  journey: JourneyStep[]
  communication: Communication[]
  feedback: Feedback[]
  services: Service[]
}

interface JourneyStep {
  id: string
  title: string
  description: string
  status: "completed" | "in-progress" | "pending" | "cancelled"
  timestamp: string
  completedBy?: string
  notes?: string
  category: "pre-arrival" | "arrival" | "stay" | "departure" | "post-stay"
}

interface Communication {
  id: string
  type: "email" | "sms" | "call" | "in-person" | "whatsapp"
  message: string
  timestamp: string
  sentBy: string
  response?: string
  status: "sent" | "delivered" | "read" | "replied"
}

interface Feedback {
  id: string
  category: string
  rating: number
  comment: string
  timestamp: string
  response?: string
  status: "new" | "acknowledged" | "resolved"
}

interface Service {
  id: string
  name: string
  category: "dining" | "spa" | "transport" | "laundry" | "concierge" | "room-service"
  status: "requested" | "confirmed" | "in-progress" | "completed" | "cancelled"
  requestTime: string
  completionTime?: string
  cost: number
  notes: string
}

const sampleGuests: Guest[] = [
  {
    id: "1",
    name: "Rajesh Kumar",
    email: "rajesh.kumar@email.com",
    phone: "+91 98765 43210",
    vipStatus: "gold",
    stayCount: 5,
    totalSpent: 125000,
    currentStay: {
      checkIn: "2024-01-15",
      checkOut: "2024-01-18",
      roomNumber: "205",
      adults: 2,
      children: 1,
      specialRequests: ["Late checkout", "Extra towels", "Baby cot"],
      preferences: {
        bedType: "King",
        pillowType: "Soft",
        temperature: 22,
        floor: "High floor"
      }
    },
    journey: [
      {
        id: "1",
        title: "Booking Confirmation",
        description: "Reservation confirmed and welcome email sent",
        status: "completed",
        timestamp: "2024-01-10T10:00:00Z",
        completedBy: "System",
        category: "pre-arrival"
      },
      {
        id: "2",
        title: "Pre-arrival Communication",
        description: "Check-in instructions and local recommendations sent",
        status: "completed",
        timestamp: "2024-01-14T18:00:00Z",
        completedBy: "Front Desk",
        category: "pre-arrival"
      },
      {
        id: "3",
        title: "Guest Check-in",
        description: "Smooth check-in process completed",
        status: "completed",
        timestamp: "2024-01-15T15:30:00Z",
        completedBy: "Priya Sharma",
        category: "arrival"
      },
      {
        id: "4",
        title: "Room Assignment",
        description: "Assigned to preferred room with special requests fulfilled",
        status: "completed",
        timestamp: "2024-01-15T15:45:00Z",
        completedBy: "Priya Sharma",
        category: "arrival"
      },
      {
        id: "5",
        title: "Welcome Drink",
        description: "Complimentary welcome drink served",
        status: "completed",
        timestamp: "2024-01-15T16:00:00Z",
        completedBy: "Room Service",
        category: "arrival"
      },
      {
        id: "6",
        title: "Daily Housekeeping",
        description: "Room cleaning and amenity replenishment",
        status: "in-progress",
        timestamp: "2024-01-16T11:00:00Z",
        category: "stay"
      },
      {
        id: "7",
        title: "Check-out Process",
        description: "Bill settlement and departure",
        status: "pending",
        timestamp: "2024-01-18T12:00:00Z",
        category: "departure"
      },
      {
        id: "8",
        title: "Follow-up Survey",
        description: "Guest satisfaction survey",
        status: "pending",
        timestamp: "2024-01-19T10:00:00Z",
        category: "post-stay"
      }
    ],
    communication: [
      {
        id: "1",
        type: "email",
        message: "Welcome to Baithaka GHAR! Your room is ready.",
        timestamp: "2024-01-15T15:30:00Z",
        sentBy: "System",
        status: "read"
      },
      {
        id: "2",
        type: "sms",
        message: "Your room service order is on the way!",
        timestamp: "2024-01-15T19:30:00Z",
        sentBy: "Room Service",
        status: "delivered"
      }
    ],
    feedback: [
      {
        id: "1",
        category: "Room Quality",
        rating: 4,
        comment: "Room was clean and comfortable, but the WiFi was slow.",
        timestamp: "2024-01-16T09:00:00Z",
        status: "acknowledged"
      }
    ],
    services: [
      {
        id: "1",
        name: "Airport Pickup",
        category: "transport",
        status: "completed",
        requestTime: "2024-01-15T12:00:00Z",
        completionTime: "2024-01-15T15:00:00Z",
        cost: 1200,
        notes: "Driver: Amit, Car: Honda City"
      },
      {
        id: "2",
        name: "Dinner Reservation",
        category: "dining",
        status: "confirmed",
        requestTime: "2024-01-16T14:00:00Z",
        cost: 0,
        notes: "Table for 3 at 8 PM, restaurant terrace"
      }
    ]
  }
]

const JOURNEY_CATEGORIES = {
  "pre-arrival": { color: "bg-blue-500", label: "Pre-Arrival" },
  "arrival": { color: "bg-green-500", label: "Arrival" },
  "stay": { color: "bg-purple-500", label: "Stay" },
  "departure": { color: "bg-orange-500", label: "Departure" },
  "post-stay": { color: "bg-gray-500", label: "Post-Stay" },
}

const VIP_BADGES = {
  regular: { color: "bg-gray-100 text-gray-800", icon: "👤" },
  silver: { color: "bg-gray-300 text-gray-800", icon: "🥈" },
  gold: { color: "bg-yellow-100 text-yellow-800", icon: "🥇" },
  platinum: { color: "bg-purple-100 text-purple-800", icon: "💎" },
}

export function GuestJourneyTracker() {
  const [guests] = useState<Guest[]>(sampleGuests)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(guests[0])
  const [activeTab, setActiveTab] = useState("journey")
  const [searchQuery, setSearchQuery] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [newService, setNewService] = useState("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("en-IN"),
      time: date.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-400" />
      case "pending":
        return <Circle className="h-4 w-4 text-gray-400" />
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-red-400" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getJourneyProgress = (journey: JourneyStep[]) => {
    const completed = journey.filter(step => step.status === "completed").length
    return (completed / journey.length) * 100
  }

  const getServiceIcon = (category: string) => {
    switch (category) {
      case "dining": return <Utensils className="h-4 w-4" />
      case "transport": return <Car className="h-4 w-4" />
      case "room-service": return <Bed className="h-4 w-4" />
      case "spa": return <Heart className="h-4 w-4" />
      case "concierge": return <Bell className="h-4 w-4" />
      case "laundry": return <Bath className="h-4 w-4" />
      default: return <Gift className="h-4 w-4" />
    }
  }

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4" />
      case "sms": return <MessageSquare className="h-4 w-4" />
      case "call": return <Phone className="h-4 w-4" />
      case "whatsapp": return <MessageSquare className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  if (!selectedGuest) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Guest Journey</h2>
          <p className="text-white/70">Track and manage guest experience</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      {/* Guest Overview */}
      <GlassCard variant="gradient" className="overflow-hidden">
        <GlassCardContent>
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 py-6">
            {/* Guest Info */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {selectedGuest.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{selectedGuest.name}</h3>
                  <Badge className={VIP_BADGES[selectedGuest.vipStatus].color}>
                    {VIP_BADGES[selectedGuest.vipStatus].icon} {selectedGuest.vipStatus.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-white/80">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{selectedGuest.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{selectedGuest.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Stay Info */}
            {selectedGuest.currentStay && (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <Bed className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">Room {selectedGuest.currentStay.roomNumber}</div>
                  <div className="text-xs text-white/60">Current Room</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <Calendar className="h-6 w-6 text-green-400 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-white">
                    {formatDateTime(selectedGuest.currentStay.checkIn).date} - {formatDateTime(selectedGuest.currentStay.checkOut).date}
                  </div>
                  <div className="text-xs text-white/60">Stay Duration</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <Users className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">
                    {selectedGuest.currentStay.adults + selectedGuest.currentStay.children}
                  </div>
                  <div className="text-xs text-white/60">
                    {selectedGuest.currentStay.adults}A, {selectedGuest.currentStay.children}C
                  </div>
                </div>
              </div>
            )}

            {/* Guest Stats */}
            <div className="flex flex-col space-y-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{selectedGuest.stayCount}</div>
                <div className="text-xs text-white/60">Total Stays</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">
                  {formatCurrency(selectedGuest.totalSpent)}
                </div>
                <div className="text-xs text-white/60">Total Spent</div>
              </div>
            </div>
          </div>

          {/* Journey Progress */}
          <div className="border-t border-white/20 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Journey Progress</span>
              <span className="text-sm text-white/60">
                {Math.round(getJourneyProgress(selectedGuest.journey))}% Complete
              </span>
            </div>
            <Progress 
              value={getJourneyProgress(selectedGuest.journey)} 
              className="h-2 bg-white/10"
            />
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Journey Details */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-white/10">
          <TabsTrigger value="journey" className="text-white data-[state=active]:bg-white/20">
            Journey
          </TabsTrigger>
          <TabsTrigger value="communication" className="text-white data-[state=active]:bg-white/20">
            Messages
          </TabsTrigger>
          <TabsTrigger value="services" className="text-white data-[state=active]:bg-white/20">
            Services
          </TabsTrigger>
          <TabsTrigger value="feedback" className="text-white data-[state=active]:bg-white/20">
            Feedback
          </TabsTrigger>
          <TabsTrigger value="preferences" className="text-white data-[state=active]:bg-white/20">
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Journey Timeline */}
        <TabsContent value="journey" className="space-y-4">
          <GlassCard variant="subtle">
            <GlassCardHeader>
              <GlassCardTitle>Guest Journey Timeline</GlassCardTitle>
              <GlassCardDescription>Track every touchpoint in the guest experience</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-6">
                {Object.entries(JOURNEY_CATEGORIES).map(([category, config]) => {
                  const categorySteps = selectedGuest.journey.filter(step => step.category === category)
                  
                  if (categorySteps.length === 0) return null
                  
                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className={cn("w-3 h-3 rounded-full", config.color)} />
                        <h4 className="font-semibold text-white">{config.label}</h4>
                        <div className="flex-1 h-px bg-white/20" />
                      </div>
                      
                      <div className="space-y-3 ml-6">
                        {categorySteps.map((step, index) => {
                          const { date, time } = formatDateTime(step.timestamp)
                          
                          return (
                            <div key={step.id} className="flex items-start space-x-4 p-4 bg-white/5 rounded-lg">
                              <div className="flex-shrink-0 mt-1">
                                {getStatusIcon(step.status)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium text-white">{step.title}</h5>
                                  <div className="text-xs text-white/60">
                                    {date} at {time}
                                  </div>
                                </div>
                                
                                <p className="text-sm text-white/70 mt-1">{step.description}</p>
                                
                                {step.completedBy && (
                                  <div className="flex items-center space-x-2 mt-2">
                                    <User className="h-3 w-3 text-white/50" />
                                    <span className="text-xs text-white/50">by {step.completedBy}</span>
                                  </div>
                                )}
                                
                                {step.notes && (
                                  <div className="mt-2 p-2 bg-white/5 rounded text-xs text-white/70">
                                    {step.notes}
                                  </div>
                                )}
                              </div>
                              
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs border-white/20",
                                  step.status === "completed" && "text-green-400 border-green-400/30",
                                  step.status === "in-progress" && "text-yellow-400 border-yellow-400/30",
                                  step.status === "pending" && "text-gray-400 border-gray-400/30"
                                )}
                              >
                                {step.status}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </GlassCardContent>
          </GlassCard>
        </TabsContent>

        {/* Communication History */}
        <TabsContent value="communication" className="space-y-4">
          <GlassCard variant="subtle">
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <GlassCardTitle>Communication History</GlassCardTitle>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </div>
              <GlassCardDescription>All guest communications in one place</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                {selectedGuest.communication.map((comm) => {
                  const { date, time } = formatDateTime(comm.timestamp)
                  
                  return (
                    <div key={comm.id} className="flex items-start space-x-4 p-4 bg-white/5 rounded-lg">
                      <div className="flex-shrink-0 p-2 bg-white/10 rounded-lg">
                        {getCommunicationIcon(comm.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white capitalize">{comm.type}</span>
                            <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                              {comm.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-white/60">
                            {date} at {time}
                          </div>
                        </div>
                        
                        <p className="text-sm text-white/80 mb-2">{comm.message}</p>
                        
                        <div className="flex items-center space-x-2 text-xs text-white/50">
                          <User className="h-3 w-3" />
                          <span>Sent by {comm.sentBy}</span>
                        </div>
                        
                        {comm.response && (
                          <div className="mt-3 p-3 bg-white/10 rounded-lg">
                            <div className="text-xs text-white/60 mb-1">Guest Response:</div>
                            <p className="text-sm text-white/80">{comm.response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </GlassCardContent>
          </GlassCard>
        </TabsContent>

        {/* Services */}
        <TabsContent value="services" className="space-y-4">
          <GlassCard variant="subtle">
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <GlassCardTitle>Guest Services</GlassCardTitle>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
              <GlassCardDescription>Requested and provided services</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedGuest.services.map((service) => {
                  const { date: reqDate, time: reqTime } = formatDateTime(service.requestTime)
                  
                  return (
                    <div key={service.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white/10 rounded-lg">
                            {getServiceIcon(service.category)}
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{service.name}</h4>
                            <p className="text-xs text-white/60 capitalize">{service.category}</p>
                          </div>
                        </div>
                        
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs border-white/20",
                            service.status === "completed" && "text-green-400 border-green-400/30",
                            service.status === "confirmed" && "text-blue-400 border-blue-400/30",
                            service.status === "in-progress" && "text-yellow-400 border-yellow-400/30"
                          )}
                        >
                          {service.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-xs text-white/70">
                        <div className="flex justify-between">
                          <span>Requested:</span>
                          <span>{reqDate} at {reqTime}</span>
                        </div>
                        
                        {service.completionTime && (
                          <div className="flex justify-between">
                            <span>Completed:</span>
                            <span>{formatDateTime(service.completionTime).date}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span>Cost:</span>
                          <span className="font-semibold text-green-400">
                            {service.cost > 0 ? formatCurrency(service.cost) : "Complimentary"}
                          </span>
                        </div>
                        
                        {service.notes && (
                          <div className="mt-3 p-2 bg-white/5 rounded text-xs">
                            {service.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </GlassCardContent>
          </GlassCard>
        </TabsContent>

        {/* Feedback */}
        <TabsContent value="feedback" className="space-y-4">
          <GlassCard variant="subtle">
            <GlassCardHeader>
              <GlassCardTitle>Guest Feedback</GlassCardTitle>
              <GlassCardDescription>Reviews and ratings from the guest</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                {selectedGuest.feedback.map((feedback) => {
                  const { date, time } = formatDateTime(feedback.timestamp)
                  
                  return (
                    <div key={feedback.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-white">{feedback.category}</h4>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < feedback.rating
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-400"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs border-white/20",
                              feedback.status === "resolved" && "text-green-400 border-green-400/30",
                              feedback.status === "acknowledged" && "text-yellow-400 border-yellow-400/30",
                              feedback.status === "new" && "text-red-400 border-red-400/30"
                            )}
                          >
                            {feedback.status}
                          </Badge>
                          <span className="text-xs text-white/60">
                            {date}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-white/80 mb-3">{feedback.comment}</p>
                      
                      {feedback.response && (
                        <div className="p-3 bg-white/10 rounded-lg">
                          <div className="text-xs text-white/60 mb-1">Our Response:</div>
                          <p className="text-sm text-white/80">{feedback.response}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </GlassCardContent>
          </GlassCard>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-4">
          <GlassCard variant="subtle">
            <GlassCardHeader>
              <GlassCardTitle>Guest Preferences</GlassCardTitle>
              <GlassCardDescription>Personalized settings and special requests</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              {selectedGuest.currentStay && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-white mb-3">Room Preferences</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-white/5 rounded-lg text-center">
                        <Bed className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                        <div className="text-sm font-medium text-white">
                          {selectedGuest.currentStay.preferences.bedType}
                        </div>
                        <div className="text-xs text-white/60">Bed Type</div>
                      </div>
                      
                      <div className="p-3 bg-white/5 rounded-lg text-center">
                        <Bath className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                        <div className="text-sm font-medium text-white">
                          {selectedGuest.currentStay.preferences.pillowType}
                        </div>
                        <div className="text-xs text-white/60">Pillow Type</div>
                      </div>
                      
                      <div className="p-3 bg-white/5 rounded-lg text-center">
                        <Wind className="h-6 w-6 text-green-400 mx-auto mb-2" />
                        <div className="text-sm font-medium text-white">
                          {selectedGuest.currentStay.preferences.temperature}°C
                        </div>
                        <div className="text-xs text-white/60">Temperature</div>
                      </div>
                      
                      <div className="p-3 bg-white/5 rounded-lg text-center">
                        <MapPin className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                        <div className="text-sm font-medium text-white">
                          {selectedGuest.currentStay.preferences.floor}
                        </div>
                        <div className="text-xs text-white/60">Floor Preference</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-3">Special Requests</h4>
                    <div className="space-y-2">
                      {selectedGuest.currentStay.specialRequests.map((request, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          <span className="text-white">{request}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}