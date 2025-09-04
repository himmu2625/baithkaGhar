import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/utils/dbConnect';
import EventLead from '@/models/EventLead';
import { apiHandler } from '@/lib/utils/apiHandler';

interface RouteParams {
  params: {
    leadId: string;
  };
}

// GET /api/events/leads/[leadId] - Get lead details
export async function GET(request: NextRequest, { params }: RouteParams) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { leadId } = params;

    const lead = await EventLead.findById(leadId)
      .populate('assignedTo', 'name email phone')
      .populate('conversionData.bookingId', 'bookingNumber eventName eventDate')
      .populate('interactions.contactedBy', 'name')
      .lean();

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ lead });
  });
}

// PUT /api/events/leads/[leadId] - Update lead
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { leadId } = params;
    const updates = await request.json();

    const lead = await EventLead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Track changes for audit
    const originalStatus = lead.status;
    const originalAssignedTo = lead.assignedTo;

    // Update lead fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'createdAt' && key !== 'leadNumber') {
        (lead as any)[key] = updates[key];
      }
    });

    lead.lastUpdatedBy = session.user.id;

    // Track reassignment
    if (updates.assignedTo && updates.assignedTo !== originalAssignedTo?.toString()) {
      lead.reassignmentHistory = lead.reassignmentHistory || [];
      lead.reassignmentHistory.push({
        from: originalAssignedTo,
        to: updates.assignedTo,
        date: new Date(),
        reason: updates.reassignmentReason || 'Manual reassignment'
      });
      lead.assignedDate = new Date();
    }

    await lead.save();

    // Populate the response
    await lead.populate('assignedTo', 'name email phone');

    return NextResponse.json({ 
      lead,
      message: 'Lead updated successfully' 
    });
  });
}

// DELETE /api/events/leads/[leadId] - Soft delete lead
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { leadId } = params;

    const lead = await EventLead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Soft delete
    lead.isActive = false;
    lead.status = 'inactive';
    lead.lastUpdatedBy = session.user.id;
    await lead.save();

    return NextResponse.json({ message: 'Lead deleted successfully' });
  });
}