import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const { dateRange, propertyId } = await request.json();
    const { db } = await connectToDatabase();

    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);

    let propertyFilter = {};
    if (propertyId) {
      propertyFilter = { propertyId: new ObjectId(propertyId) };
    }

    const roomUtilization = await generateRoomUtilizationData(db, startDate, endDate, propertyFilter);
    const maintenance = await generateMaintenanceData(db, startDate, endDate, propertyFilter);
    const housekeeping = await generateHousekeepingData(db, startDate, endDate, propertyFilter);
    const assets = await generateAssetData(db, propertyFilter);

    return NextResponse.json({
      roomUtilization,
      maintenance,
      housekeeping,
      assets
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}

async function generateRoomUtilizationData(db: any, startDate: Date, endDate: Date, propertyFilter: any) {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const daily = await Promise.all(
    days.map(async (day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const [totalRooms, occupiedRooms, maintenanceRooms] = await Promise.all([
        db.collection('rooms').countDocuments({
          ...propertyFilter,
          createdAt: { $lte: dayEnd }
        }),
        db.collection('room_bookings').countDocuments({
          ...propertyFilter,
          checkIn: { $lte: dayEnd },
          checkOut: { $gte: dayStart },
          status: 'confirmed'
        }),
        db.collection('rooms').countDocuments({
          ...propertyFilter,
          status: { $in: ['maintenance', 'out_of_order'] },
          updatedAt: { $gte: dayStart, $lte: dayEnd }
        })
      ]);

      const revenue = await db.collection('room_bookings').aggregate([
        {
          $match: {
            ...propertyFilter,
            checkIn: { $lte: dayEnd },
            checkOut: { $gte: dayStart },
            status: 'confirmed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]).toArray();

      const availableRooms = totalRooms - occupiedRooms - maintenanceRooms;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      return {
        date: format(day, 'MMM dd'),
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        availableRooms,
        occupiedRooms,
        maintenanceRooms,
        revenue: revenue[0]?.total || 0
      };
    })
  );

  const byRoomType = await db.collection('rooms').aggregate([
    {
      $match: propertyFilter
    },
    {
      $lookup: {
        from: 'room_bookings',
        localField: '_id',
        foreignField: 'roomId',
        as: 'bookings'
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalBookings: { $sum: { $size: '$bookings' } },
        revenue: {
          $sum: {
            $reduce: {
              input: '$bookings',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.totalAmount'] }
            }
          }
        }
      }
    },
    {
      $project: {
        type: '$_id',
        count: 1,
        utilization: {
          $multiply: [
            { $divide: ['$totalBookings', '$count'] },
            100
          ]
        },
        revenue: 1
      }
    }
  ]).toArray();

  const peakHours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    occupancy: Math.floor(Math.random() * 100)
  }));

  return {
    daily,
    byRoomType,
    peakHours
  };
}

async function generateMaintenanceData(db: any, startDate: Date, endDate: Date, propertyFilter: any) {
  const costs = await db.collection('maintenance_requests').aggregate([
    {
      $match: {
        ...propertyFilter,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          type: '$type'
        },
        totalCost: { $sum: '$cost.total' }
      }
    },
    {
      $group: {
        _id: '$_id.month',
        preventive: {
          $sum: {
            $cond: [{ $eq: ['$_id.type', 'preventive'] }, '$totalCost', 0]
          }
        },
        corrective: {
          $sum: {
            $cond: [{ $eq: ['$_id.type', 'corrective'] }, '$totalCost', 0]
          }
        },
        emergency: {
          $sum: {
            $cond: [{ $eq: ['$_id.type', 'emergency'] }, '$totalCost', 0]
          }
        }
      }
    },
    {
      $project: {
        month: '$_id',
        preventive: 1,
        corrective: 1,
        emergency: 1
      }
    },
    { $sort: { month: 1 } }
  ]).toArray();

  const frequency = await db.collection('maintenance_requests').aggregate([
    {
      $match: {
        ...propertyFilter,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgCost: { $avg: '$cost.total' },
        avgDuration: { $avg: '$estimatedDuration' }
      }
    },
    {
      $project: {
        type: '$_id',
        count: 1,
        avgCost: { $round: ['$avgCost', 2] },
        avgDuration: { $round: ['$avgDuration', 1] }
      }
    }
  ]).toArray();

  const downtime = await db.collection('maintenance_requests').aggregate([
    {
      $match: {
        ...propertyFilter,
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $lookup: {
        from: 'rooms',
        localField: 'roomId',
        foreignField: '_id',
        as: 'room'
      }
    },
    {
      $unwind: '$room'
    },
    {
      $project: {
        roomId: '$roomId',
        roomNumber: '$room.number',
        hours: {
          $divide: [
            { $subtract: ['$completedAt', '$createdAt'] },
            1000 * 60 * 60
          ]
        },
        cost: '$cost.total'
      }
    },
    { $sort: { hours: -1 } },
    { $limit: 10 }
  ]).toArray();

  return {
    costs,
    frequency,
    downtime
  };
}

async function generateHousekeepingData(db: any, startDate: Date, endDate: Date, propertyFilter: any) {
  const efficiency = await db.collection('housekeeping_tasks').aggregate([
    {
      $match: {
        ...propertyFilter,
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$assignedTo',
        tasksCompleted: { $sum: 1 },
        avgTime: {
          $avg: {
            $divide: [
              { $subtract: ['$completedAt', '$startedAt'] },
              1000 * 60
            ]
          }
        },
        qualityScore: { $avg: '$qualityControl.rating' }
      }
    },
    {
      $project: {
        staff: '$_id',
        tasksCompleted: 1,
        avgTime: { $round: ['$avgTime', 1] },
        qualityScore: { $round: ['$qualityScore', 1] }
      }
    }
  ]).toArray();

  const taskTypes = await db.collection('housekeeping_tasks').aggregate([
    {
      $match: {
        ...propertyFilter,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgDuration: {
          $avg: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              {
                $divide: [
                  { $subtract: ['$completedAt', '$startedAt'] },
                  1000 * 60
                ]
              },
              null
            ]
          }
        },
        completedTasks: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        type: '$_id',
        count: 1,
        avgDuration: { $round: ['$avgDuration', 1] },
        efficiency: {
          $round: [
            { $multiply: [{ $divide: ['$completedTasks', '$count'] }, 100] },
            1
          ]
        }
      }
    }
  ]).toArray();

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const workload = await Promise.all(
    days.map(async (day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const [totalTasks, completedTasks, overdueTasks] = await Promise.all([
        db.collection('housekeeping_tasks').countDocuments({
          ...propertyFilter,
          createdAt: { $gte: dayStart, $lte: dayEnd }
        }),
        db.collection('housekeeping_tasks').countDocuments({
          ...propertyFilter,
          createdAt: { $gte: dayStart, $lte: dayEnd },
          status: 'completed'
        }),
        db.collection('housekeeping_tasks').countDocuments({
          ...propertyFilter,
          dueDate: { $lt: dayEnd },
          status: { $nin: ['completed', 'cancelled'] }
        })
      ]);

      return {
        date: format(day, 'MMM dd'),
        totalTasks,
        completedTasks,
        overdueTasks
      };
    })
  );

  return {
    efficiency,
    taskTypes,
    workload
  };
}

async function generateAssetData(db: any, propertyFilter: any) {
  const depreciation = await db.collection('room_assets').aggregate([
    {
      $match: propertyFilter
    },
    {
      $group: {
        _id: '$category',
        originalValue: { $sum: '$financial.purchasePrice' },
        currentValue: { $sum: '$financial.currentValue' }
      }
    },
    {
      $project: {
        category: '$_id',
        originalValue: 1,
        currentValue: 1,
        depreciationRate: {
          $round: [
            {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ['$originalValue', '$currentValue'] },
                    '$originalValue'
                  ]
                },
                100
              ]
            },
            2
          ]
        }
      }
    }
  ]).toArray();

  const lifecycle = await db.collection('room_assets').aggregate([
    {
      $match: propertyFilter
    },
    {
      $project: {
        assetId: { $toString: '$_id' },
        name: 1,
        age: {
          $divide: [
            { $subtract: [new Date(), '$purchaseDate'] },
            1000 * 60 * 60 * 24 * 365
          ]
        },
        condition: '$condition.overall',
        nextMaintenance: { $dateToString: { format: '%Y-%m-%d', date: '$maintenance.nextScheduled' } },
        estimatedLife: '$specifications.expectedLifespan'
      }
    },
    { $limit: 20 }
  ]).toArray();

  return {
    depreciation,
    lifecycle
  };
}