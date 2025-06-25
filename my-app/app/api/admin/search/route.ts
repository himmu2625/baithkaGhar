import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectMongo } from "@/lib/db/mongodb";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        results: []
      });
    }

    await connectMongo();

    const searchTerm = new RegExp(query, 'i'); // Case-insensitive search
    const results: any[] = [];

    // Search Properties
    const properties = await Property.find({
      $or: [
        { title: searchTerm },
        { 'address.city': searchTerm },
        { 'address.state': searchTerm },
        { description: searchTerm }
      ]
    })
    .select('_id title address')
    .limit(5)
    .lean();

    properties.forEach((property: any) => {
      results.push({
        id: property._id.toString(),
        title: property.title,
        type: 'property',
        icon: '<div className="bg-green-100 text-green-800 w-8 h-8 rounded-full flex items-center justify-center">P</div>',
        href: `/admin/properties/${property._id}`
      });
    });

    // Search Bookings
    const bookings = await Booking.find({
      $or: [
        { bookingId: searchTerm },
        { 'contactDetails.name': searchTerm },
        { 'contactDetails.email': searchTerm }
      ]
    })
    .populate('userId', 'name')
    .select('_id bookingId totalPrice contactDetails')
    .limit(5)
    .lean();

    bookings.forEach((booking: any) => {
      const guestName = booking.userId?.name || booking.contactDetails?.name || 'Unknown';
      results.push({
        id: booking._id.toString(),
        title: `Booking ${booking.bookingId || booking._id.toString().slice(-6)} - ${guestName}`,
        type: 'booking',
        icon: '<div className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center">B</div>',
        href: `/admin/bookings?id=${booking._id}`
      });
    });

    // Search Users
    const users = await User.find({
      $or: [
        { name: searchTerm },
        { email: searchTerm }
      ]
    })
    .select('_id name email')
    .limit(5)
    .lean();

    users.forEach((user: any) => {
      results.push({
        id: user._id.toString(),
        title: user.name || user.email,
        type: 'user',
        icon: '<div className="bg-purple-100 text-purple-800 w-8 h-8 rounded-full flex items-center justify-center">U</div>',
        href: `/admin/users/${user._id}`
      });
    });

    return NextResponse.json({
      success: true,
      results: results.slice(0, 10) // Limit total results
    });

  } catch (error: any) {
    console.error("Admin Search API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
} 