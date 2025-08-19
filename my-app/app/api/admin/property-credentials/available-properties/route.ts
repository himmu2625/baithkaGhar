import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Property from '@/models/Property';
import PropertyLogin from '@/models/PropertyLogin';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Get all approved properties
    const query: any = { verificationStatus: 'approved' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } }
      ];
    }

    const properties = await Property.find(query)
      .select('_id name title address location verificationStatus createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Get property IDs that already have credentials
    const propertiesWithCredentials = await PropertyLogin.find({})
      .select('propertyId')
      .lean();

    const propertyIdsWithCredentials = propertiesWithCredentials.map(cred => cred.propertyId.toString());

    // Filter out properties that already have credentials
    const availableProperties = properties.filter(property => 
      !propertyIdsWithCredentials.includes(property._id.toString())
    );

    return NextResponse.json({
      success: true,
      data: availableProperties,
      total: availableProperties.length
    });

  } catch (error) {
    console.error('Error fetching available properties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 