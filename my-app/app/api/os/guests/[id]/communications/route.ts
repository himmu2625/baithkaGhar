import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { validateOSAccess } from '@/lib/auth/os-auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET: Fetch guest communications
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const propertyId = params.id;
    const { searchParams } = request.nextUrl;
    const guestId = searchParams.get('guestId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || '';
    const channel = searchParams.get('channel') || '';

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    // Build match query
    const matchQuery: any = {
      propertyId: new ObjectId(propertyId)
    };

    if (guestId) {
      matchQuery.guestId = new ObjectId(guestId);
    }

    if (type) {
      matchQuery.type = type;
    }

    if (channel) {
      matchQuery.channel = channel;
    }

    // Get communications with pagination
    const skip = (page - 1) * limit;
    
    const communications = await db.collection('guest_communications')
      .find(matchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalCommunications = await db.collection('guest_communications').countDocuments(matchQuery);

    // Get guest details for each communication if not filtered by guestId
    if (!guestId && communications.length > 0) {
      const guestIds = [...new Set(communications.map(c => c.guestId.toString()))];
      const guests = await db.collection('guest_profiles')
        .find({ _id: { $in: guestIds.map(id => new ObjectId(id)) } })
        .toArray();
      
      const guestMap = guests.reduce((acc, guest) => {
        acc[guest._id.toString()] = guest;
        return acc;
      }, {});

      communications.forEach(comm => {
        comm.guest = guestMap[comm.guestId.toString()];
      });
    }

    return NextResponse.json({
      success: true,
      communications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCommunications / limit),
        totalCommunications,
        hasMore: skip + communications.length < totalCommunications
      }
    });

  } catch (error) {
    console.error('Communications fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch communications' }, { status: 500 });
  }
}

// POST: Create new communication
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const propertyId = params.id;
    const body = await request.json();

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate required fields
    const {
      guestId,
      type, // 'email', 'sms', 'whatsapp', 'phone', 'in-person', 'system'
      subject,
      content,
      direction, // 'inbound', 'outbound'
      channel, // 'email', 'sms', 'whatsapp', 'phone', 'in-person', 'system'
      priority, // 'low', 'normal', 'high', 'urgent'
      scheduledFor,
      metadata
    } = body;

    if (!guestId || !type || !content || !direction || !channel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Verify guest exists
    const guest = await db.collection('guest_profiles').findOne({
      _id: new ObjectId(guestId),
      propertyId: new ObjectId(propertyId)
    });

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    const communication = {
      guestId: new ObjectId(guestId),
      propertyId: new ObjectId(propertyId),
      type,
      subject: subject || '',
      content,
      direction,
      channel,
      priority: priority || 'normal',
      status: scheduledFor ? 'scheduled' : 'sent',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      sentAt: scheduledFor ? null : new Date(),
      deliveredAt: null,
      readAt: null,
      responseReceived: false,
      metadata: metadata || {},
      attachments: [],
      createdBy: session.user?.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('guest_communications').insertOne(communication);

    // Update guest's communication history
    await db.collection('guest_profiles').updateOne(
      { _id: new ObjectId(guestId) },
      {
        $push: {
          communicationHistory: {
            communicationId: result.insertedId,
            type,
            direction,
            createdAt: new Date()
          }
        },
        $set: { updatedAt: new Date() }
      }
    );

    // Send actual communication based on channel
    if (!scheduledFor) {
      await sendCommunication(communication, guest);
    }

    return NextResponse.json({
      success: true,
      communicationId: result.insertedId,
      communication: { ...communication, _id: result.insertedId }
    });

  } catch (error) {
    console.error('Communication creation error:', error);
    return NextResponse.json({ error: 'Failed to create communication' }, { status: 500 });
  }
}

// PUT: Update communication status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const propertyId = params.id;
    const body = await request.json();
    const { communicationId, status, deliveredAt, readAt, responseReceived, response } = body;

    if (!session || !propertyId || !communicationId) {
      return NextResponse.json({ error: 'Unauthorized or missing data' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    const updateData: any = {
      updatedAt: new Date()
    };

    if (status) updateData.status = status;
    if (deliveredAt) updateData.deliveredAt = new Date(deliveredAt);
    if (readAt) updateData.readAt = new Date(readAt);
    if (responseReceived !== undefined) updateData.responseReceived = responseReceived;
    if (response) updateData.response = response;

    const result = await db.collection('guest_communications').updateOne(
      {
        _id: new ObjectId(communicationId),
        propertyId: new ObjectId(propertyId)
      },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Communication not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Communication update error:', error);
    return NextResponse.json({ error: 'Failed to update communication' }, { status: 500 });
  }
}

// Helper function to send actual communication
async function sendCommunication(communication: any, guest: any) {
  // This is where you would integrate with actual communication services
  // For now, we'll just log and update status
  
  try {
    switch (communication.channel) {
      case 'email':
        // Integrate with email service (SendGrid, SES, etc.)
        console.log(`Sending email to ${guest.email}: ${communication.subject}`);
        break;
        
      case 'sms':
        // Integrate with SMS service (Twilio, AWS SNS, etc.)
        console.log(`Sending SMS to ${guest.phone}: ${communication.content}`);
        break;
        
      case 'whatsapp':
        // Integrate with WhatsApp Business API
        console.log(`Sending WhatsApp to ${guest.phone}: ${communication.content}`);
        break;
        
      case 'phone':
        // Log phone call attempt
        console.log(`Phone call scheduled for ${guest.phone}`);
        break;
        
      default:
        console.log(`Communication logged: ${communication.type}`);
    }

    // Mark as delivered (in a real implementation, this would be updated by webhooks)
    const { db } = await connectToDatabase();
    await db.collection('guest_communications').updateOne(
      { _id: communication._id },
      { 
        $set: { 
          status: 'delivered',
          deliveredAt: new Date(),
          sentAt: new Date()
        } 
      }
    );

  } catch (error) {
    console.error('Failed to send communication:', error);
    
    // Mark as failed
    const { db } = await connectToDatabase();
    await db.collection('guest_communications').updateOne(
      { _id: communication._id },
      { 
        $set: { 
          status: 'failed',
          failureReason: error.message,
          updatedAt: new Date()
        } 
      }
    );
  }
}