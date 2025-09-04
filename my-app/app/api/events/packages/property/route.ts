import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import { z } from 'zod'
import EventVenue from "@/models/EventVenue"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get event packages for a property
export const GET = dbHandler(async (req: NextRequest, { params }: { params: { propertyId: string } }) => {
  try {
    await connectMongo()
    const { propertyId } = params

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Invalid property ID" },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(req.url)
    const eventType = searchParams.get('eventType')
    const minCapacity = searchParams.get('minCapacity')
    const maxBudget = searchParams.get('maxBudget')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Get all venues for the property to build packages
    const venuesQuery: any = { 
      propertyId: new Types.ObjectId(propertyId),
      isActive: true,
      'availability.isActive': true 
    }

    if (!includeInactive) {
      venuesQuery.isActive = true
    }

    const venues = await EventVenue.find(venuesQuery)
      .populate('equipment.equipmentId', 'name category pricing')
      .lean() as any[]

    // Create event packages based on venue combinations and event types
    const eventPackages = [
      {
        id: new Types.ObjectId().toString(),
        name: "Corporate Meeting Package",
        description: "Perfect for business meetings and presentations",
        eventType: "corporate",
        duration: 4, // hours
        minGuests: 10,
        maxGuests: 50,
        includes: [
          "Conference room with AV equipment",
          "Welcome coffee/tea",
          "Light refreshments",
          "Stationery and notepads",
          "Wi-Fi access",
          "Basic technical support"
        ],
        venues: venues.filter(venue => 
          (venue.capacity?.boardroomStyle || 0) >= 10 && 
          (venue.capacity?.boardroomStyle || 0) <= 50
        ).map(venue => ({
          id: venue._id.toString(),
          name: venue.name,
          capacity: venue.capacity?.boardroomStyle || venue.capacity?.seatedCapacity,
          basePrice: venue.pricing?.basePrice || 0
        })),
        pricing: {
          basePrice: 15000, // per event
          perPersonPrice: 500,
          cateringOptions: [
            {
              type: "basic_refreshments",
              name: "Basic Refreshments",
              pricePerPerson: 300,
              includes: ["Coffee", "Tea", "Cookies", "Fresh fruits"]
            },
            {
              type: "business_lunch",
              name: "Business Lunch",
              pricePerPerson: 800,
              includes: ["3-course meal", "Beverages", "Dessert"]
            }
          ],
          additionalServices: [
            {
              service: "photography",
              name: "Professional Photography",
              price: 8000
            },
            {
              service: "live_streaming",
              name: "Live Streaming Setup",
              price: 12000
            }
          ]
        },
        customizable: true,
        advanceBookingDays: 7,
        cancellationPolicy: "50% refund if cancelled 48 hours before event",
        isActive: true
      },
      {
        id: new Types.ObjectId().toString(),
        name: "Wedding Celebration Package",
        description: "Complete wedding package with all essentials",
        eventType: "wedding",
        duration: 8, // hours
        minGuests: 50,
        maxGuests: 500,
        includes: [
          "Decorated banquet hall",
          "Bridal suite access",
          "Wedding cake",
          "Photography coverage",
          "Floral arrangements",
          "Music system",
          "Dedicated wedding coordinator"
        ],
        venues: venues.filter(venue => 
          (venue.capacity?.seatedCapacity || 0) >= 50
        ).map(venue => ({
          id: venue._id.toString(),
          name: venue.name,
          capacity: venue.capacity?.seatedCapacity,
          basePrice: venue.pricing?.basePrice || 0
        })),
        pricing: {
          basePrice: 80000, // per event
          perPersonPrice: 2500,
          cateringOptions: [
            {
              type: "premium_buffet",
              name: "Premium Wedding Buffet",
              pricePerPerson: 1800,
              includes: ["Multi-cuisine buffet", "Welcome drinks", "Dessert counter", "Ice cream station"]
            },
            {
              type: "royal_feast",
              name: "Royal Wedding Feast",
              pricePerPerson: 3000,
              includes: ["7-course sit-down dinner", "Premium beverages", "Live cooking stations", "Imported wines"]
            }
          ],
          additionalServices: [
            {
              service: "decoration",
              name: "Premium Decoration",
              price: 25000
            },
            {
              service: "dj_services",
              name: "DJ & Entertainment",
              price: 15000
            },
            {
              service: "transportation",
              name: "Guest Transportation",
              price: 20000
            }
          ]
        },
        customizable: true,
        advanceBookingDays: 30,
        cancellationPolicy: "25% refund if cancelled 7 days before event",
        isActive: true
      },
      {
        id: new Types.ObjectId().toString(),
        name: "Birthday Party Package",
        description: "Fun-filled birthday celebration package",
        eventType: "birthday",
        duration: 4, // hours
        minGuests: 15,
        maxGuests: 100,
        includes: [
          "Decorated party hall",
          "Birthday cake",
          "Party games setup",
          "Music system",
          "Party favors",
          "Photography",
          "Balloon decorations"
        ],
        venues: venues.filter(venue => 
          (venue.capacity?.seatedCapacity || 0) >= 15 && 
          (venue.capacity?.seatedCapacity || 0) <= 100
        ).map(venue => ({
          id: venue._id.toString(),
          name: venue.name,
          capacity: venue.capacity?.seatedCapacity,
          basePrice: venue.pricing?.basePrice || 0
        })),
        pricing: {
          basePrice: 25000, // per event
          perPersonPrice: 800,
          cateringOptions: [
            {
              type: "kids_menu",
              name: "Kids Special Menu",
              pricePerPerson: 600,
              includes: ["Mini pizzas", "Chicken nuggets", "French fries", "Ice cream", "Soft drinks"]
            },
            {
              type: "family_buffet",
              name: "Family Buffet",
              pricePerPerson: 1200,
              includes: ["Mixed cuisine buffet", "Birthday cake", "Beverages", "Dessert selection"]
            }
          ],
          additionalServices: [
            {
              service: "entertainer",
              name: "Party Entertainer/Magician",
              price: 8000
            },
            {
              service: "theme_decoration",
              name: "Themed Decoration",
              price: 12000
            }
          ]
        },
        customizable: true,
        advanceBookingDays: 14,
        cancellationPolicy: "Full refund if cancelled 24 hours before event",
        isActive: true
      },
      {
        id: new Types.ObjectId().toString(),
        name: "Conference Package",
        description: "Professional conference and seminar setup",
        eventType: "conference",
        duration: 6, // hours
        minGuests: 25,
        maxGuests: 200,
        includes: [
          "Conference hall with stage",
          "AV equipment and projectors",
          "Registration desk setup",
          "Welcome refreshments",
          "Lunch break arrangement",
          "Technical support staff",
          "Conference materials"
        ],
        venues: venues.filter(venue => 
          (venue.capacity?.theatreStyle || venue.capacity?.classroomStyle || 0) >= 25
        ).map(venue => ({
          id: venue._id.toString(),
          name: venue.name,
          capacity: Math.max(venue.capacity?.theatreStyle || 0, venue.capacity?.classroomStyle || 0),
          basePrice: venue.pricing?.basePrice || 0
        })),
        pricing: {
          basePrice: 35000, // per event
          perPersonPrice: 1200,
          cateringOptions: [
            {
              type: "conference_meals",
              name: "Conference Meals",
              pricePerPerson: 1000,
              includes: ["Welcome coffee", "Mid-morning snacks", "Lunch", "Evening tea"]
            },
            {
              type: "premium_conference",
              name: "Premium Conference Package",
              pricePerPerson: 1800,
              includes: ["Welcome breakfast", "Multiple coffee breaks", "Gourmet lunch", "Networking dinner"]
            }
          ],
          additionalServices: [
            {
              service: "live_recording",
              name: "Conference Recording",
              price: 15000
            },
            {
              service: "simultaneous_translation",
              name: "Simultaneous Translation",
              price: 25000
            }
          ]
        },
        customizable: true,
        advanceBookingDays: 21,
        cancellationPolicy: "75% refund if cancelled 72 hours before event",
        isActive: true
      }
    ]

    // Apply filters
    let filteredPackages = eventPackages

    if (eventType) {
      filteredPackages = filteredPackages.filter(pkg => pkg.eventType === eventType)
    }

    if (minCapacity) {
      const capacity = parseInt(minCapacity)
      filteredPackages = filteredPackages.filter(pkg => pkg.maxGuests >= capacity)
    }

    if (maxBudget) {
      const budget = parseInt(maxBudget)
      filteredPackages = filteredPackages.filter(pkg => pkg.pricing.basePrice <= budget)
    }

    if (!includeInactive) {
      filteredPackages = filteredPackages.filter(pkg => pkg.isActive)
    }

    // Calculate package statistics
    const packageStats = {
      totalPackages: filteredPackages.length,
      byEventType: filteredPackages.reduce((acc: any, pkg) => {
        acc[pkg.eventType] = (acc[pkg.eventType] || 0) + 1
        return acc
      }, {}),
      priceRange: {
        min: Math.min(...filteredPackages.map(pkg => pkg.pricing.basePrice)),
        max: Math.max(...filteredPackages.map(pkg => pkg.pricing.basePrice)),
        average: filteredPackages.reduce((sum, pkg) => sum + pkg.pricing.basePrice, 0) / filteredPackages.length
      },
      capacityRange: {
        minGuests: Math.min(...filteredPackages.map(pkg => pkg.minGuests)),
        maxGuests: Math.max(...filteredPackages.map(pkg => pkg.maxGuests))
      }
    }

    return NextResponse.json({
      success: true,
      packages: filteredPackages,
      statistics: packageStats,
      availableVenues: venues.length
    })

  } catch (error) {
    console.error('Error fetching event packages:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch event packages" },
      { status: 500 }
    )
  }
})

// POST handler - Create custom event package
export const POST = dbHandler(async (req: NextRequest, { params }: { params: { propertyId: string } }) => {
  try {
    // Validate authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !token.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    await connectMongo()
    const { propertyId } = params

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Invalid property ID" },
        { status: 400 }
      )
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      )
    }

    try {
      const validatedData = createPackageSchema.parse(body)

      // Validate venues exist and belong to property
      const venueIds = validatedData.venueIds.map(id => new Types.ObjectId(id))
      const venues = await EventVenue.find({
        _id: { $in: venueIds },
        propertyId: new Types.ObjectId(propertyId),
        isActive: true
      })

      if (venues.length !== validatedData.venueIds.length) {
        return NextResponse.json(
          { success: false, message: "One or more venues not found or don't belong to this property" },
          { status: 404 }
        )
      }

      // Create custom package
      const customPackage = {
        id: new Types.ObjectId().toString(),
        name: validatedData.name,
        description: validatedData.description,
        eventType: validatedData.eventType,
        duration: validatedData.duration,
        minGuests: validatedData.minGuests,
        maxGuests: validatedData.maxGuests,
        includes: validatedData.includes,
        venues: venues.map(venue => ({
          id: venue._id.toString(),
          name: venue.name,
          capacity: venue.capacity?.seatedCapacity || venue.capacity?.standingCapacity,
          basePrice: venue.pricing?.basePrice || 0
        })),
        pricing: validatedData.pricing,
        customizable: validatedData.customizable,
        advanceBookingDays: validatedData.advanceBookingDays,
        cancellationPolicy: validatedData.cancellationPolicy,
        isActive: true,
        isCustom: true,
        createdBy: token.sub,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // In a real implementation, you would save this to a EventPackages collection
      // For now, return the created package

      return NextResponse.json({
        success: true,
        message: "Custom event package created successfully",
        package: customPackage,
        note: "This is a mock implementation. In production, implement a proper EventPackages model and database operations."
      }, { status: 201 })

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const formattedErrors = validationError.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
        return NextResponse.json(
          { 
            success: false, 
            message: "Validation error", 
            errors: formattedErrors
          },
          { status: 400 }
        )
      }
      throw validationError
    }

  } catch (error: any) {
    console.error('Error creating event package:', error)
    return NextResponse.json(
      { success: false, message: "Failed to create event package" },
      { status: 500 }
    )
  }
})

// Schema for custom package creation
const createPackageSchema = z.object({
  name: z.string().min(1, "Package name is required").max(200, "Package name cannot exceed 200 characters"),
  description: z.string().min(1, "Package description is required").max(1000, "Description cannot exceed 1000 characters"),
  eventType: z.enum(['conference', 'wedding', 'birthday', 'corporate', 'meeting', 'workshop', 'celebration', 'other']),
  duration: z.number().min(1, "Duration must be at least 1 hour").max(24, "Duration cannot exceed 24 hours"),
  minGuests: z.number().min(1, "Minimum guests must be at least 1"),
  maxGuests: z.number().min(1, "Maximum guests must be at least 1"),
  includes: z.array(z.string()).min(1, "Package must include at least one service"),
  venueIds: z.array(z.string()).min(1, "At least one venue must be selected"),
  pricing: z.object({
    basePrice: z.number().min(0, "Base price cannot be negative"),
    perPersonPrice: z.number().min(0, "Per person price cannot be negative"),
    cateringOptions: z.array(z.object({
      type: z.string(),
      name: z.string(),
      pricePerPerson: z.number().min(0),
      includes: z.array(z.string())
    })).optional(),
    additionalServices: z.array(z.object({
      service: z.string(),
      name: z.string(),
      price: z.number().min(0)
    })).optional()
  }),
  customizable: z.boolean().default(true),
  advanceBookingDays: z.number().min(1, "Advance booking period must be at least 1 day").max(365, "Advance booking cannot exceed 1 year"),
  cancellationPolicy: z.string().min(1, "Cancellation policy is required").max(500, "Cancellation policy cannot exceed 500 characters")
}).refine((data) => {
  return data.maxGuests >= data.minGuests
}, {
  message: "Maximum guests must be greater than or equal to minimum guests",
  path: ["maxGuests"]
})