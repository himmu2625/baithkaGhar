import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectMongo } from '@/lib/db/mongodb';
import DynamicPricingRule from '@/models/DynamicPricingRule';

// GET - Fetch all dynamic pricing rules for a property
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectMongo();

    const rules = await DynamicPricingRule.find({ propertyId: id })
      .sort({ priority: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      rules
    });
  } catch (error) {
    console.error('[API] Error fetching dynamic pricing rules:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pricing rules' },
      { status: 500 }
    );
  }
}

// POST - Create a new dynamic pricing rule
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    await connectMongo();

    const rule = await DynamicPricingRule.create({
      ...body,
      propertyId: id
    });

    return NextResponse.json({
      success: true,
      rule
    });
  } catch (error) {
    console.error('[API] Error creating dynamic pricing rule:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create pricing rule' },
      { status: 500 }
    );
  }
}

// PUT - Update a dynamic pricing rule
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { ruleId, ...updates } = await req.json();

    await connectMongo();

    const rule = await DynamicPricingRule.findOneAndUpdate(
      { _id: ruleId, propertyId: id },
      { $set: updates },
      { new: true }
    );

    if (!rule) {
      return NextResponse.json(
        { success: false, message: 'Rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      rule
    });
  } catch (error) {
    console.error('[API] Error updating dynamic pricing rule:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update pricing rule' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a dynamic pricing rule
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json(
        { success: false, message: 'Rule ID is required' },
        { status: 400 }
      );
    }

    await connectMongo();

    const result = await DynamicPricingRule.findOneAndDelete({
      _id: ruleId,
      propertyId: id
    });

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    console.error('[API] Error deleting dynamic pricing rule:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete pricing rule' },
      { status: 500 }
    );
  }
}
