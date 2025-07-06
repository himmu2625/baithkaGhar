import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import SpecialOffer from '@/models/SpecialOffer';
import { adminApiAuth } from '@/lib/admin-auth';
import { NextRequest } from 'next/server';

// GET all active special offers
export async function GET() {
  try {
    await dbConnect();

    const offers = await SpecialOffer.find({
      isActive: true,
      validUntil: { $gt: new Date() },
    }).sort({ validUntil: 1 });

    return NextResponse.json({ success: true, data: offers });
  } catch (error) {
    console.error('Error fetching special offers:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching special offers.' },
      { status: 500 }
    );
  }
}

// CREATE a new special offer (Admin only)
export async function POST(req: NextRequest) {
  try {
    const authResult = await adminApiAuth(req);
    if (authResult instanceof NextResponse) {
        return authResult; // Return the unauthorized response
    }

    await dbConnect();

    const body = await req.json();
    const { 
        title, 
        subtitle, 
        description, 
        label, 
        tag, 
        validUntil, 
        targetProperties, 
        isActive, 
        imageUrl,
        publicId
    } = body;
    
    if (!title || !description || !validUntil || !imageUrl || !publicId) {
        return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    const newOffer = await SpecialOffer.create({
      title,
      subtitle,
      description,
      label,
      tag,
      validUntil,
      targetProperties: targetProperties || [],
      isActive,
      imageUrl,
      publicId
    });

    return NextResponse.json({ success: true, data: newOffer }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating special offer:', error);
     if (error.name === 'ValidationError') {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating the special offer.' },
      { status: 500 }
    );
  }
} 