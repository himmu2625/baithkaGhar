import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import SpecialOffer from '@/models/SpecialOffer';
import { adminApiAuth } from '@/lib/admin-auth';
import { NextRequest } from 'next/server';

// GET all special offers for admin
export async function GET(req: NextRequest) {
  try {
    const authResult = await adminApiAuth(req);
    if (authResult instanceof NextResponse) {
        return authResult; // Return the unauthorized response
    }

    await dbConnect();

    // Fetch all offers, without filtering by active status or date
    const offers = await SpecialOffer.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: offers });
  } catch (error) {
    console.error('Error fetching all special offers for admin:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching special offers.' },
      { status: 500 }
    );
  }
} 