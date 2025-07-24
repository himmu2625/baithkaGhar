import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import Property from '@/models/Property';
import Booking from '@/models/Booking';
import { generatePriceSuggestions } from '@/lib/services/ai-pricing-service';

// GET: Generate AI-based price suggestions for a property
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const { id } = params;
  const { searchParams } = new URL(req.url);

  try {
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const guests = parseInt(searchParams.get('guests') || '2', 10);

    // Get property data as plain object
    const propertyDoc = await Property.findById(id).select('price location type amenities dynamicPricing').lean();
    if (!propertyDoc) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    // Defensive: ensure all required fields for property
    const property = {
      _id: propertyDoc._id ? String(propertyDoc._id) : '',
      price: typeof propertyDoc.price === 'number' ? propertyDoc.price : 0,
      location: typeof propertyDoc.location === 'object' ? propertyDoc.location : { city: '', state: '' },
      type: typeof (propertyDoc as any)['type'] === 'string' ? (propertyDoc as any)['type'] : ((propertyDoc as any)['type']?.toString?.() || ''),
      amenities: Array.isArray(propertyDoc.amenities) ? propertyDoc.amenities : [],
      dynamicPricing: propertyDoc.dynamicPricing || {},
    };

    // Get historical booking data for this property
    const historicalBookingsRaw = await Booking.find({
      propertyId: id,
      status: { $in: ['confirmed', 'completed'] },
      createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // Last 1 year
    }).select('totalPrice checkIn checkOut guests createdAt dynamicPricing propertyId').lean();

    // Defensive: ensure all required fields for bookings
    const mapBooking = (b: any) => ({
      totalPrice: typeof b.totalPrice === 'number' ? b.totalPrice : 0,
      checkIn: b.checkIn ? new Date(b.checkIn) : new Date(),
      checkOut: b.checkOut ? new Date(b.checkOut) : new Date(),
      guests: typeof b.guests === 'number' ? b.guests : 1,
      createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
      dynamicPricing: b.dynamicPricing || {},
      propertyId: b.propertyId,
    });
    const historicalBookings = Array.isArray(historicalBookingsRaw) ? historicalBookingsRaw.map(mapBooking) : [];

    // Get similar properties for comparison (as plain objects)
    const similarPropertiesDocs = await Property.find({
      _id: { $ne: id },
      type: property.type,
      'location.city': property.location.city,
      price: { $gte: property.price * 0.7, $lte: property.price * 1.3 }
    }).limit(10).select('price location type amenities dynamicPricing').lean();

    // Defensive: ensure all required fields for similar properties
    const similarProperties = similarPropertiesDocs.map((p: any) => ({
      _id: p._id ? String(p._id) : '',
      price: typeof p.price === 'number' ? p.price : 0,
      location: typeof p.location === 'object' ? p.location : { city: '', state: '' },
      type: typeof (p as any)['type'] === 'string' ? (p as any)['type'] : ((p as any)['type']?.toString?.() || ''),
      amenities: Array.isArray(p.amenities) ? p.amenities : [],
      dynamicPricing: p.dynamicPricing || {},
    }));

    // Get market data (bookings for similar properties)
    const marketBookingsRaw = await Booking.find({
      propertyId: { $in: similarProperties.map((p: any) => p._id) },
      status: { $in: ['confirmed', 'completed'] },
      createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } // Last 6 months
    }).select('totalPrice checkIn checkOut guests createdAt dynamicPricing propertyId').lean();
    const marketBookings = Array.isArray(marketBookingsRaw) ? marketBookingsRaw.map(mapBooking) : [];

    // Generate AI suggestions
    const suggestions = await generatePriceSuggestions({
      property,
      historicalBookings,
      similarProperties,
      marketBookings,
      targetDates: { startDate, endDate },
      guests
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('AI pricing suggestions error:', error);
    return NextResponse.json({
      error: 'Failed to generate price suggestions',
      details: error
    }, { status: 500 });
  }
} 