import { NextRequest, NextResponse } from "next/server"
import { PropertyService } from "@/services/property-service"
import { dbHandler } from "@/lib/db"
import { getSession } from "@/lib/get-session"
import Property, { IProperty } from "@/models/Property"
import User from "@/models/User"
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import { connectMongo } from "@/lib/db/mongodb"
import { z } from 'zod'
import { formatPropertyType } from "@/lib/utils"

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

// GET handler for properties
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')
    const propertyType = searchParams.get('propertyType')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    
    // Build query
    const query: any = { 
      // Only show available and published properties
      status: 'available', 
      isPublished: true,
      verificationStatus: 'approved'
    }
    
    if (city) {
      // Match city name case-insensitive in both address.city field and legacy city field
      const cityRegex = new RegExp(city, 'i');
      query.$or = [
        { 'address.city': cityRegex },
        { city: cityRegex }
      ];
    }
    
    if (propertyType) query.propertyType = propertyType
    if (minPrice || maxPrice) {
      query.$and = query.$and || [];
      const priceQuery: any = {};
      
      // Create OR condition for different price formats
      const priceConditions = [];
      
      // Check base price in price object
      if (minPrice) {
        priceConditions.push({ 'price.base': { $gte: parseFloat(minPrice) } });
      }
      if (maxPrice) {
        priceConditions.push({ 'price.base': { $lte: parseFloat(maxPrice) } });
      }
      
      // Check perNight in pricing object
      if (minPrice) {
        priceConditions.push({ 'pricing.perNight': { $gte: minPrice } });
      }
      if (maxPrice) {
        priceConditions.push({ 'pricing.perNight': { $lte: maxPrice } });
      }
      
      // Add price conditions to query
      if (priceConditions.length > 0) {
        query.$and.push({ $or: priceConditions });
      }
    }
    
    const properties = await Property.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean()
    
    if (properties.length === 0 && city) {
      // Check if the city exists in the City collection
      try {
        const cityExists = await connectMongo().then(() => 
          import('@/models/city').then(({ default: City }) => 
            City.findOne({ name: { $regex: new RegExp(city, 'i') } })
          )
        );
      } catch (cityCheckError) {
        // Silently handle error
      }
    }

    // Transform properties for the frontend
    const formattedProperties = properties.map(property => {
      // Find the first available image as thumbnail
      let thumbnail = null;
      if (property.categorizedImages && property.categorizedImages.length > 0) {
        const firstCategory = property.categorizedImages[0];
        if (firstCategory.files && firstCategory.files.length > 0) {
          thumbnail = firstCategory.files[0]?.url || null;
        }
      } else if (property.legacyGeneralImages && property.legacyGeneralImages.length > 0) {
        thumbnail = property.legacyGeneralImages[0]?.url || null;
      } else if (property.images && property.images.length > 0) {
        // Handle string or object with url property
        thumbnail = typeof property.images[0] === 'string' 
          ? property.images[0]
          : (property.images[0] as any)?.url || null;
      }
      
      // Get price from appropriate field
      const price = property.price?.base || 
                  ((property.pricing?.perNight ? parseFloat(property.pricing.perNight as string) : 0));
      
      return {
        id: property._id.toString(),
        title: property.title || property.name || 'Unnamed Property',
        type: formatPropertyType(property.propertyType),
        address: property.address,
        city: property.address?.city || (property as any).city || 'Unknown City',
        price: price,
        thumbnail: thumbnail,
        rating: property.rating || 0,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        maxGuests: property.maxGuests || 1
      };
    });
    
    // Set cache control headers to prevent caching
    const response = NextResponse.json({
      success: true,
      properties: formattedProperties
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    
    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch properties" },
      { status: 500 }
    )
  }
})

// POST handler to create a property (protected)
export const POST = dbHandler(async (req: NextRequest) => {
  try {
    // Validate token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !token.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      )
  }
  
    // Connect to database first
    try {
      await connectMongo()
    } catch (dbError) {
      return NextResponse.json(
        { success: false, message: "Database connection failed" },
        { status: 500 }
      )
    }

    // Check if user exists
    let user;
    try {
      user = await User.findById(token.sub)
      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        )
      }
    } catch (userError) {
      return NextResponse.json(
        { success: false, message: "Error finding user" },
        { status: 500 }
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
      const validatedData = propertySchema.parse(body)

      // Create property with user ID
      try {
        const propertyData = {
          ...validatedData,
          userId: token.sub,
          hostId: token.sub,
          status: user.role === 'admin' || user.role === 'super_admin' ? 'active' : 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const property = await Property.create(propertyData);

        return NextResponse.json({
          success: true,
          message: "Property created successfully",
          property
        })
      } catch (createError: any) {
        // Log the specific validation error if it's a Mongoose error
        if (createError.name === 'ValidationError') {
          const validationErrors = Object.values(createError.errors).map((err: any) => ({
            field: err.path,
            message: err.message
          }));
          return NextResponse.json(
            { 
              success: false, 
              message: "Validation error", 
              errors: validationErrors 
            },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { success: false, message: "Failed to create property in database", error: createError.message },
          { status: 500 }
        )
      }
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const formattedErrors = validationError.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
          // TypeScript fix: Only include received property if it exists
          ...(('received' in e) ? { received: e.received } : {})
        }));
        return NextResponse.json(
          { 
            success: false, 
            message: "Validation error", 
            errors: formattedErrors
          },
          { status: 400 }
        )
      }
      throw validationError;
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create property", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
})

// Schema for property creation validation
const propertySchema = z.object({
  propertyType: z.enum(['apartment', 'house', 'hotel', 'villa', 'resort']),
  name: z.string().min(1, "Property name is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "Zip code is required"),
    country: z.string().min(1, "Country is required")
  }),
  contactNo: z.string().min(1, "Contact number is required"),
  email: z.string().email("Invalid email format"),
  generalAmenities: z.object({
    wifi: z.boolean(),
    tv: z.boolean(),
    kitchen: z.boolean(),
    parking: z.boolean(),
    ac: z.boolean(),
    pool: z.boolean(),
    geyser: z.boolean(),
    shower: z.boolean(),
    bathTub: z.boolean(),
    reception24x7: z.boolean(),
    roomService: z.boolean(),
    restaurant: z.boolean(),
    bar: z.boolean(),
    pub: z.boolean(),
    fridge: z.boolean(),
  }),
  otherAmenities: z.string().optional(),
  categorizedImages: z.array(z.object({
    category: z.string(),
    files: z.array(z.object({
      url: z.string(),
      public_id: z.string()
    }))
  })),
  legacyGeneralImages: z.array(z.object({
    url: z.string(),
    public_id: z.string()
  })).optional(),
  propertyUnits: z.array(z.object({
    unitTypeName: z.string(),
    unitTypeCode: z.string(),
    count: z.number(),
    pricing: z.object({
      price: z.string(),
      pricePerWeek: z.string(),
      pricePerMonth: z.string()
    })
  })).optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  pricing: z.object({
    perNight: z.string(),
    perWeek: z.string(),
    perMonth: z.string()
  }).optional(),
  totalHotelRooms: z.string().optional(),
  status: z.enum(['available', 'unavailable', 'maintenance', 'deleted']).default('available'),
  policyDetails: z.string().optional(),
  minStay: z.string().optional(),
  maxStay: z.string().optional(),
  propertySize: z.string().optional(),
  availability: z.string().optional(),
  maxGuests: z.number().default(2),
  beds: z.number().default(1),
  isPublished: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  rating: z.number().default(0),
  reviewCount: z.number().default(0),
  verificationStatus: z.enum(['pending', 'approved', 'rejected']).default('pending')
});
