import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Mock the database connection
jest.mock('@/lib/mongodb');

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>;

describe('Rooms and Housekeeping Integration', () => {
  let mockDb: any;
  let mockRoomsCollection: any;
  let mockTasksCollection: any;

  beforeEach(() => {
    mockRoomsCollection = {
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      }),
      updateOne: jest.fn(),
      insertOne: jest.fn(),
      deleteOne: jest.fn()
    };

    mockTasksCollection = {
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      }),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn()
    };

    mockDb = {
      collection: jest.fn((name: string) => {
        if (name === 'rooms') return mockRoomsCollection;
        if (name === 'housekeeping_tasks') return mockTasksCollection;
        return mockRoomsCollection;
      })
    };

    mockConnectToDatabase.mockResolvedValue({ db: mockDb });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Room Status Updates Triggering Housekeeping Tasks', () => {
    it('should create checkout cleaning task when room status changes to cleaning', async () => {
      const roomId = new ObjectId();
      const room = {
        _id: roomId,
        number: '101',
        status: 'occupied',
        propertyId: new ObjectId()
      };

      mockRoomsCollection.findOne.mockResolvedValue(room);
      mockRoomsCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
      mockTasksCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

      // Simulate room status update to cleaning
      const updateResult = await updateRoomStatusWithTasks(roomId, 'cleaning');

      expect(mockRoomsCollection.updateOne).toHaveBeenCalledWith(
        { _id: roomId },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'cleaning',
            updatedAt: expect.any(Date)
          })
        })
      );

      // Should create a housekeeping task
      expect(mockTasksCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'checkout_cleaning',
          roomId,
          roomNumber: '101',
          status: 'scheduled',
          priority: 'high',
          title: expect.stringContaining('Checkout Cleaning')
        })
      );

      expect(updateResult.taskCreated).toBe(true);
    });

    it('should create maintenance check task when room status changes to maintenance', async () => {
      const roomId = new ObjectId();
      const room = {
        _id: roomId,
        number: '102',
        status: 'available',
        propertyId: new ObjectId()
      };

      mockRoomsCollection.findOne.mockResolvedValue(room);
      mockRoomsCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
      mockTasksCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

      const updateResult = await updateRoomStatusWithTasks(roomId, 'maintenance');

      expect(mockTasksCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'maintenance_check',
          roomId,
          roomNumber: '102',
          status: 'scheduled',
          priority: 'medium'
        })
      );

      expect(updateResult.taskCreated).toBe(true);
    });

    it('should not create duplicate tasks for same room and task type', async () => {
      const roomId = new ObjectId();
      const room = {
        _id: roomId,
        number: '103',
        status: 'occupied',
        propertyId: new ObjectId()
      };

      // Existing task for the same room
      const existingTask = {
        _id: new ObjectId(),
        type: 'checkout_cleaning',
        roomId,
        status: 'scheduled'
      };

      mockRoomsCollection.findOne.mockResolvedValue(room);
      mockTasksCollection.find().toArray.mockResolvedValue([existingTask]);

      const updateResult = await updateRoomStatusWithTasks(roomId, 'cleaning');

      // Should not create duplicate task
      expect(mockTasksCollection.insertOne).not.toHaveBeenCalled();
      expect(updateResult.taskCreated).toBe(false);
      expect(updateResult.reason).toBe('Task already exists');
    });
  });

  describe('Housekeeping Task Completion Updating Room Status', () => {
    it('should update room status to available when cleaning task is completed', async () => {
      const taskId = new ObjectId();
      const roomId = new ObjectId();

      const task = {
        _id: taskId,
        type: 'checkout_cleaning',
        roomId,
        roomNumber: '101',
        status: 'in_progress'
      };

      const room = {
        _id: roomId,
        status: 'cleaning'
      };

      mockTasksCollection.findOne.mockResolvedValue(task);
      mockRoomsCollection.findOne.mockResolvedValue(room);
      mockTasksCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
      mockRoomsCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      const completionResult = await completeTaskWithRoomUpdate(taskId);

      expect(mockTasksCollection.updateOne).toHaveBeenCalledWith(
        { _id: taskId },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'completed',
            completedAt: expect.any(Date)
          })
        })
      );

      expect(mockRoomsCollection.updateOne).toHaveBeenCalledWith(
        { _id: roomId },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'available',
            updatedAt: expect.any(Date)
          })
        })
      );

      expect(completionResult.roomStatusUpdated).toBe(true);
    });

    it('should update room status to available when maintenance task is completed', async () => {
      const taskId = new ObjectId();
      const roomId = new ObjectId();

      const task = {
        _id: taskId,
        type: 'maintenance_check',
        roomId,
        status: 'in_progress'
      };

      const room = {
        _id: roomId,
        status: 'maintenance'
      };

      mockTasksCollection.findOne.mockResolvedValue(task);
      mockRoomsCollection.findOne.mockResolvedValue(room);
      mockTasksCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
      mockRoomsCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      const completionResult = await completeTaskWithRoomUpdate(taskId);

      expect(mockRoomsCollection.updateOne).toHaveBeenCalledWith(
        { _id: roomId },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'available'
          })
        })
      );

      expect(completionResult.roomStatusUpdated).toBe(true);
    });

    it('should not update room status if task completion fails', async () => {
      const taskId = new ObjectId();
      const roomId = new ObjectId();

      const task = {
        _id: taskId,
        type: 'checkout_cleaning',
        roomId,
        status: 'in_progress'
      };

      mockTasksCollection.findOne.mockResolvedValue(task);
      mockTasksCollection.updateOne.mockRejectedValue(new Error('Task update failed'));

      await expect(completeTaskWithRoomUpdate(taskId)).rejects.toThrow('Task update failed');

      expect(mockRoomsCollection.updateOne).not.toHaveBeenCalled();
    });
  });

  describe('Room Inventory and Housekeeping Task Integration', () => {
    it('should create restocking task when inventory is low', async () => {
      const roomId = new ObjectId();
      const room = {
        _id: roomId,
        number: '104',
        inventory: [
          { itemId: 'towels', name: 'Bath Towels', quantity: 1, minimumQuantity: 4 },
          { itemId: 'sheets', name: 'Bed Sheets', quantity: 2, minimumQuantity: 3 }
        ]
      };

      mockRoomsCollection.findOne.mockResolvedValue(room);
      mockTasksCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

      const result = await checkInventoryAndCreateTasks(roomId);

      expect(mockTasksCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'inventory_restock',
          roomId,
          roomNumber: '104',
          status: 'scheduled',
          priority: 'medium',
          supplies: expect.arrayContaining(['towels', 'sheets'])
        })
      );

      expect(result.restockTaskCreated).toBe(true);
    });

    it('should update task supplies list when inventory changes', async () => {
      const taskId = new ObjectId();
      const roomId = new ObjectId();

      const task = {
        _id: taskId,
        type: 'inventory_restock',
        roomId,
        supplies: ['towels']
      };

      const updatedSupplies = ['towels', 'sheets', 'amenities'];

      mockTasksCollection.findOne.mockResolvedValue(task);
      mockTasksCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      await updateTaskSupplies(taskId, updatedSupplies);

      expect(mockTasksCollection.updateOne).toHaveBeenCalledWith(
        { _id: taskId },
        expect.objectContaining({
          $set: expect.objectContaining({
            supplies: updatedSupplies,
            updatedAt: expect.any(Date)
          })
        })
      );
    });
  });

  describe('Bulk Operations', () => {
    it('should process multiple room status updates efficiently', async () => {
      const roomIds = [new ObjectId(), new ObjectId(), new ObjectId()];
      const rooms = roomIds.map((id, index) => ({
        _id: id,
        number: `10${index + 1}`,
        status: 'occupied',
        propertyId: new ObjectId()
      }));

      mockRoomsCollection.find().toArray.mockResolvedValue(rooms);
      mockRoomsCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
      mockTasksCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

      const results = await bulkUpdateRoomStatus(roomIds, 'cleaning');

      expect(results.updated).toBe(3);
      expect(results.tasksCreated).toBe(3);
      expect(mockRoomsCollection.updateOne).toHaveBeenCalledTimes(3);
      expect(mockTasksCollection.insertOne).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in bulk operations', async () => {
      const roomIds = [new ObjectId(), new ObjectId()];
      const rooms = roomIds.map((id, index) => ({
        _id: id,
        number: `10${index + 1}`,
        status: 'occupied'
      }));

      mockRoomsCollection.find().toArray.mockResolvedValue(rooms);
      mockRoomsCollection.updateOne
        .mockResolvedValueOnce({ matchedCount: 1, modifiedCount: 1 })
        .mockRejectedValueOnce(new Error('Update failed'));

      const results = await bulkUpdateRoomStatus(roomIds, 'cleaning');

      expect(results.updated).toBe(1);
      expect(results.failed).toBe(1);
      expect(results.errors).toHaveLength(1);
    });
  });
});

// Helper functions that would be implemented in the actual system

async function updateRoomStatusWithTasks(roomId: ObjectId, newStatus: string) {
  const { db } = await connectToDatabase();

  const room = await db.collection('rooms').findOne({ _id: roomId });
  if (!room) {
    throw new Error('Room not found');
  }

  // Update room status
  await db.collection('rooms').updateOne(
    { _id: roomId },
    {
      $set: {
        status: newStatus,
        updatedAt: new Date()
      }
    }
  );

  // Create appropriate housekeeping task based on status
  let taskCreated = false;
  let reason = '';

  if (newStatus === 'cleaning') {
    // Check if checkout cleaning task already exists
    const existingTask = await db.collection('housekeeping_tasks').find({
      roomId,
      type: 'checkout_cleaning',
      status: { $in: ['scheduled', 'assigned', 'in_progress'] }
    }).toArray();

    if (existingTask.length === 0) {
      await db.collection('housekeeping_tasks').insertOne({
        type: 'checkout_cleaning',
        roomId,
        roomNumber: room.number,
        status: 'scheduled',
        priority: 'high',
        title: `Checkout Cleaning - Room ${room.number}`,
        description: 'Complete room cleaning after guest checkout',
        estimatedDuration: 45,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      taskCreated = true;
    } else {
      reason = 'Task already exists';
    }
  } else if (newStatus === 'maintenance') {
    const existingTask = await db.collection('housekeeping_tasks').find({
      roomId,
      type: 'maintenance_check',
      status: { $in: ['scheduled', 'assigned', 'in_progress'] }
    }).toArray();

    if (existingTask.length === 0) {
      await db.collection('housekeeping_tasks').insertOne({
        type: 'maintenance_check',
        roomId,
        roomNumber: room.number,
        status: 'scheduled',
        priority: 'medium',
        title: `Maintenance Check - Room ${room.number}`,
        description: 'Room maintenance inspection required',
        estimatedDuration: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      taskCreated = true;
    } else {
      reason = 'Task already exists';
    }
  }

  return { taskCreated, reason };
}

async function completeTaskWithRoomUpdate(taskId: ObjectId) {
  const { db } = await connectToDatabase();

  const task = await db.collection('housekeeping_tasks').findOne({ _id: taskId });
  if (!task) {
    throw new Error('Task not found');
  }

  // Update task to completed
  await db.collection('housekeeping_tasks').updateOne(
    { _id: taskId },
    {
      $set: {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );

  // Update room status based on task type
  let roomStatusUpdated = false;
  let newRoomStatus = '';

  if (task.type === 'checkout_cleaning' || task.type === 'maintenance_check') {
    newRoomStatus = 'available';
  } else if (task.type === 'deep_clean') {
    newRoomStatus = 'available';
  }

  if (newRoomStatus) {
    const room = await db.collection('rooms').findOne({ _id: task.roomId });
    if (room) {
      await db.collection('rooms').updateOne(
        { _id: task.roomId },
        {
          $set: {
            status: newRoomStatus,
            updatedAt: new Date()
          }
        }
      );
      roomStatusUpdated = true;
    }
  }

  return { roomStatusUpdated };
}

async function checkInventoryAndCreateTasks(roomId: ObjectId) {
  const { db } = await connectToDatabase();

  const room = await db.collection('rooms').findOne({ _id: roomId });
  if (!room) {
    throw new Error('Room not found');
  }

  // Check for low inventory items
  const lowStockItems = room.inventory?.filter((item: any) =>
    item.quantity <= (item.minimumQuantity || 2)
  ) || [];

  let restockTaskCreated = false;

  if (lowStockItems.length > 0) {
    await db.collection('housekeeping_tasks').insertOne({
      type: 'inventory_restock',
      roomId,
      roomNumber: room.number,
      status: 'scheduled',
      priority: 'medium',
      title: `Restock Inventory - Room ${room.number}`,
      description: 'Replenish low inventory items',
      supplies: lowStockItems.map((item: any) => item.itemId),
      estimatedDuration: 20,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    restockTaskCreated = true;
  }

  return { restockTaskCreated, lowStockItems: lowStockItems.length };
}

async function updateTaskSupplies(taskId: ObjectId, supplies: string[]) {
  const { db } = await connectToDatabase();

  await db.collection('housekeeping_tasks').updateOne(
    { _id: taskId },
    {
      $set: {
        supplies,
        updatedAt: new Date()
      }
    }
  );
}

async function bulkUpdateRoomStatus(roomIds: ObjectId[], newStatus: string) {
  const { db } = await connectToDatabase();

  const rooms = await db.collection('rooms').find({
    _id: { $in: roomIds }
  }).toArray();

  let updated = 0;
  let failed = 0;
  let tasksCreated = 0;
  const errors: string[] = [];

  for (const room of rooms) {
    try {
      const result = await updateRoomStatusWithTasks(room._id, newStatus);
      updated++;
      if (result.taskCreated) tasksCreated++;
    } catch (error) {
      failed++;
      errors.push(`Room ${room.number}: ${(error as Error).message}`);
    }
  }

  return { updated, failed, tasksCreated, errors };
}