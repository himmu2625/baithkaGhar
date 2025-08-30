import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { validateOSAccess } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import mongoose from 'mongoose';

// Sync Log Schema
const SyncLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  syncId: { type: String, required: true },
  propertyId: { type: String, required: true },
  channelName: { type: String, required: true },
  syncType: { 
    type: String, 
    enum: ['inventory', 'rates', 'bookings', 'full'], 
    required: true 
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  status: { 
    type: String, 
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  recordsProcessed: { type: Number, default: 0 },
  successfulRecords: { type: Number, default: 0 },
  failedRecords: { type: Number, default: 0 },
  syncErrors: [{ type: String }],
  warnings: [{ type: String }],
  metadata: {
    triggeredBy: { type: String }, // 'manual', 'auto', 'webhook'
    userEmail: { type: String },
    duration: { type: Number }, // milliseconds
    avgProcessingTime: { type: Number }, // ms per record
    retryCount: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { 
  collection: 'synclogs',
  timestamps: true 
});

const SyncLog = mongoose.models.SyncLog || mongoose.model('SyncLog', SyncLogSchema);

// GET: Fetch sync logs for a property
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const propertyId = params.id;
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const channelName = searchParams.get('channel');
    const syncType = searchParams.get('type');
    const status = searchParams.get('status');

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();

    // Build query filters
    const query: any = { propertyId };
    if (channelName) query.channelName = channelName;
    if (syncType) query.syncType = syncType;
    if (status) query.status = status;

    // Fetch logs with pagination
    const logs = await SyncLog.find(query)
      .sort({ startTime: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    // Generate sample logs if none exist (for demo purposes)
    if (logs.length === 0) {
      const sampleLogs = generateSampleLogs(propertyId);
      return NextResponse.json({
        logs: sampleLogs,
        pagination: {
          total: sampleLogs.length,
          limit,
          offset,
          hasMore: false
        }
      });
    }

    const totalCount = await SyncLog.countDocuments(query);

    // Transform logs for frontend
    const transformedLogs = logs.map(log => ({
      id: log.id || log._id?.toString(),
      syncId: log.syncId,
      propertyId: log.propertyId,
      channelName: log.channelName,
      syncType: log.syncType,
      startTime: log.startTime?.toISOString(),
      endTime: log.endTime?.toISOString(),
      status: log.status,
      recordsProcessed: log.recordsProcessed || 0,
      successfulRecords: log.successfulRecords || 0,
      failedRecords: log.failedRecords || 0,
      errors: log.syncErrors || [],
      warnings: log.warnings || []
    }));

    return NextResponse.json({
      logs: transformedLogs,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + logs.length < totalCount
      }
    });
  } catch (error) {
    console.error('Sync logs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch sync logs' }, { status: 500 });
  }
}

function generateSampleLogs(propertyId: string) {
  const channels = ['booking.com', 'expedia', 'makemytrip', 'oyo', 'agoda'];
  const syncTypes = ['inventory', 'rates', 'bookings'];
  const statuses = ['completed', 'completed', 'completed', 'failed']; // 75% success rate
  const logs = [];

  for (let i = 0; i < 20; i++) {
    const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + Math.random() * 300000); // up to 5 minutes
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const recordsProcessed = Math.floor(Math.random() * 200) + 10;
    const failedRecords = status === 'failed' ? Math.floor(recordsProcessed * 0.3) : Math.floor(Math.random() * 3);
    
    logs.push({
      id: `LOG_${Date.now()}_${i}`,
      syncId: `SYNC_${Date.now()}_${i}`,
      propertyId,
      channelName: channels[Math.floor(Math.random() * channels.length)],
      syncType: syncTypes[Math.floor(Math.random() * syncTypes.length)],
      startTime: startTime.toISOString(),
      endTime: status !== 'running' ? endTime.toISOString() : undefined,
      status,
      recordsProcessed,
      successfulRecords: recordsProcessed - failedRecords,
      failedRecords,
      errors: status === 'failed' ? [
        'Rate validation failed for room type deluxe',
        'Inventory sync timeout for dates 2024-03-15 to 2024-03-20',
        'Authentication token expired during sync'
      ].slice(0, Math.floor(Math.random() * 3) + 1) : []
    });
  }

  return logs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}