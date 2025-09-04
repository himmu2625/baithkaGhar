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

// POST /api/events/leads/[leadId]/interactions - Add interaction to lead
export async function POST(request: NextRequest, { params }: RouteParams) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { leadId } = params;
    const body = await request.json();

    const {
      type,
      summary,
      outcome,
      duration,
      followUpRequired = false,
      followUpDate,
      nextAction
    } = body;

    // Validation
    if (!type || !summary || !outcome) {
      return NextResponse.json({ 
        error: 'Interaction type, summary, and outcome are required' 
      }, { status: 400 });
    }

    const lead = await EventLead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Add interaction
    const interactionData = {
      type,
      date: new Date(),
      summary,
      outcome,
      duration,
      followUpRequired,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      nextAction,
      contactedBy: session.user.id
    };

    await lead.addInteraction(interactionData, session.user.id);

    // Update lead status based on interaction outcome
    if (outcome === 'positive' && lead.status === 'new') {
      lead.status = 'interested';
    } else if (outcome === 'negative') {
      lead.status = 'contacted'; // Keep as contacted but note negative outcome
    }

    // Set next follow-up date if specified
    if (followUpRequired && followUpDate) {
      lead.nextFollowUp = new Date(followUpDate);
      lead.reminderSet = true;
    }

    await lead.save();

    // Populate and return updated lead
    await lead.populate('interactions.contactedBy', 'name');

    return NextResponse.json({ 
      lead,
      message: 'Interaction added successfully' 
    });
  });
}

// GET /api/events/leads/[leadId]/interactions - Get lead interactions
export async function GET(request: NextRequest, { params }: RouteParams) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { leadId } = params;

    const lead = await EventLead.findById(leadId)
      .populate('interactions.contactedBy', 'name email')
      .select('interactions')
      .lean();

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Sort interactions by date (most recent first)
    const interactions = lead.interactions?.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ) || [];

    return NextResponse.json({ interactions });
  });
}