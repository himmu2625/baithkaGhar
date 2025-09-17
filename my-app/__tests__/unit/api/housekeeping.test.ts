import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/os/housekeeping/route';
import { GET as GetTask, PUT as UpdateTask } from '@/app/api/os/housekeeping/[taskId]/route';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/lib/os-auth');

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>;

describe('Housekeeping API Routes', () => {
  let mockDb: any;
  let mockCollection: any;

  beforeEach(() => {
    mockCollection = {
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis()
      }),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      })
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    mockConnectToDatabase.mockResolvedValue({ db: mockDb });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/os/housekeeping', () => {
    it('should return all housekeeping tasks', async () => {
      const mockTasks = [
        {
          _id: new ObjectId(),
          type: 'checkout_cleaning',
          roomNumber: '101',
          status: 'pending',
          priority: 'high',
          estimatedDuration: 45,
          assignedTo: 'staff123',
          assignedToName: 'John Doe',
          scheduledDate: new Date(),
          createdAt: new Date()
        },
        {
          _id: new ObjectId(),
          type: 'maintenance_check',
          roomNumber: '102',
          status: 'in_progress',
          priority: 'medium',
          estimatedDuration: 30,
          assignedTo: 'staff456',
          assignedToName: 'Jane Smith',
          scheduledDate: new Date(),
          createdAt: new Date()
        }
      ];

      mockCollection.countDocuments.mockResolvedValue(2);
      mockCollection.find().toArray.mockResolvedValue(mockTasks);

      const request = new NextRequest('http://localhost/api/os/housekeeping');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tasks).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it('should filter tasks by status', async () => {
      const pendingTasks = [
        {
          _id: new ObjectId(),
          type: 'checkout_cleaning',
          status: 'pending',
          priority: 'high'
        }
      ];

      mockCollection.countDocuments.mockResolvedValue(1);
      mockCollection.find().toArray.mockResolvedValue(pendingTasks);

      const request = new NextRequest('http://localhost/api/os/housekeeping?status=pending');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(1);
      expect(mockCollection.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });

    it('should filter tasks by assignee', async () => {
      const request = new NextRequest('http://localhost/api/os/housekeeping?assignedTo=staff123');

      await GET(request);

      expect(mockCollection.find).toHaveBeenCalledWith(
        expect.objectContaining({ assignedTo: 'staff123' })
      );
    });

    it('should filter tasks by priority', async () => {
      const request = new NextRequest('http://localhost/api/os/housekeeping?priority=high');

      await GET(request);

      expect(mockCollection.find).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'high' })
      );
    });

    it('should handle pagination correctly', async () => {
      const request = new NextRequest('http://localhost/api/os/housekeeping?page=2&limit=10');

      await GET(request);

      expect(mockCollection.find().skip).toHaveBeenCalledWith(10);
      expect(mockCollection.find().limit).toHaveBeenCalledWith(10);
    });
  });

  describe('POST /api/os/housekeeping', () => {
    it('should create new housekeeping task', async () => {
      const taskData = {
        type: 'checkout_cleaning',
        roomId: '507f1f77bcf86cd799439011',
        roomNumber: '101',
        priority: 'high',
        title: 'Clean room after checkout',
        description: 'Complete cleaning after guest checkout',
        estimatedDuration: 45,
        assignedTo: 'staff123',
        assignedToName: 'John Doe',
        scheduledDate: new Date().toISOString(),
        instructions: [
          'Strip and replace bed linens',
          'Clean bathroom thoroughly',
          'Vacuum carpets'
        ],
        checklist: [
          { item: 'Make bed', required: true, completed: false },
          { item: 'Clean bathroom', required: true, completed: false }
        ]
      };

      mockCollection.insertOne.mockResolvedValue({
        insertedId: new ObjectId()
      });

      const request = new NextRequest('http://localhost/api/os/housekeeping', {
        method: 'POST',
        body: JSON.stringify(taskData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Housekeeping task created successfully');
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'checkout_cleaning',
          roomNumber: '101',
          status: 'scheduled',
          priority: 'high'
        })
      );
    });

    it('should validate required fields', async () => {
      const invalidTaskData = {
        type: 'checkout_cleaning',
        // Missing required fields
      };

      const request = new NextRequest('http://localhost/api/os/housekeeping', {
        method: 'POST',
        body: JSON.stringify(invalidTaskData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should validate task type', async () => {
      const taskData = {
        type: 'invalid_type',
        roomId: '507f1f77bcf86cd799439011',
        roomNumber: '101',
        title: 'Test task'
      };

      const request = new NextRequest('http://localhost/api/os/housekeeping', {
        method: 'POST',
        body: JSON.stringify(taskData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid task type');
    });
  });

  describe('GET /api/os/housekeeping/[taskId]', () => {
    it('should return task details', async () => {
      const mockTask = {
        _id: new ObjectId(),
        type: 'checkout_cleaning',
        roomNumber: '101',
        status: 'pending',
        priority: 'high',
        title: 'Clean room after checkout',
        estimatedDuration: 45,
        instructions: ['Clean bathroom', 'Make bed'],
        checklist: [
          { item: 'Clean bathroom', required: true, completed: false },
          { item: 'Make bed', required: true, completed: false }
        ],
        createdAt: new Date()
      };

      mockCollection.findOne.mockResolvedValue(mockTask);

      const request = new NextRequest('http://localhost/api/os/housekeeping/123');
      const params = { params: { taskId: '123' } };

      const response = await GetTask(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.task.type).toBe('checkout_cleaning');
      expect(data.task.checklist).toHaveLength(2);
    });

    it('should return 404 for non-existent task', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/os/housekeeping/123');
      const params = { params: { taskId: '123' } };

      const response = await GetTask(request, params);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Task not found');
    });
  });

  describe('PUT /api/os/housekeeping/[taskId]', () => {
    it('should update task status', async () => {
      const existingTask = {
        _id: new ObjectId(),
        type: 'checkout_cleaning',
        status: 'pending',
        checklist: [
          { item: 'Clean bathroom', required: true, completed: false },
          { item: 'Make bed', required: true, completed: false }
        ]
      };

      mockCollection.findOne.mockResolvedValue(existingTask);
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1
      });

      const updateData = {
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        assignedTo: 'staff123'
      };

      const request = new NextRequest('http://localhost/api/os/housekeeping/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });
      const params = { params: { taskId: '123' } };

      const response = await UpdateTask(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId('123') },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'in_progress',
            updatedAt: expect.any(Date)
          })
        })
      );
    });

    it('should update checklist items', async () => {
      const existingTask = {
        _id: new ObjectId(),
        checklist: [
          { item: 'Clean bathroom', required: true, completed: false },
          { item: 'Make bed', required: true, completed: false }
        ]
      };

      mockCollection.findOne.mockResolvedValue(existingTask);
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1
      });

      const updateData = {
        checklist: [
          { item: 'Clean bathroom', required: true, completed: true },
          { item: 'Make bed', required: true, completed: false }
        ]
      };

      const request = new NextRequest('http://localhost/api/os/housekeeping/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });
      const params = { params: { taskId: '123' } };

      const response = await UpdateTask(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should auto-complete task when all required checklist items are done', async () => {
      const existingTask = {
        _id: new ObjectId(),
        status: 'in_progress',
        checklist: [
          { item: 'Clean bathroom', required: true, completed: false },
          { item: 'Make bed', required: true, completed: false },
          { item: 'Optional item', required: false, completed: false }
        ]
      };

      mockCollection.findOne.mockResolvedValue(existingTask);
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1
      });

      const updateData = {
        checklist: [
          { item: 'Clean bathroom', required: true, completed: true },
          { item: 'Make bed', required: true, completed: true },
          { item: 'Optional item', required: false, completed: false }
        ]
      };

      const request = new NextRequest('http://localhost/api/os/housekeeping/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });
      const params = { params: { taskId: '123' } };

      await UpdateTask(request, params);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId('123') },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'completed',
            completedAt: expect.any(Date)
          })
        })
      );
    });
  });
});

describe('Housekeeping Business Logic', () => {
  it('should calculate task completion percentage', () => {
    const checklist = [
      { item: 'Task 1', required: true, completed: true },
      { item: 'Task 2', required: true, completed: false },
      { item: 'Task 3', required: false, completed: true },
      { item: 'Task 4', required: false, completed: false }
    ];

    const completedItems = checklist.filter(item => item.completed).length;
    const completionPercentage = (completedItems / checklist.length) * 100;

    expect(completionPercentage).toBe(50);
  });

  it('should validate task status transitions', () => {
    const validTransitions = {
      'scheduled': ['assigned', 'in_progress', 'cancelled'],
      'assigned': ['in_progress', 'cancelled'],
      'in_progress': ['paused', 'completed', 'cancelled'],
      'paused': ['in_progress', 'cancelled'],
      'completed': ['requires_inspection'],
      'cancelled': []
    };

    expect(validTransitions['scheduled']).toContain('assigned');
    expect(validTransitions['in_progress']).toContain('completed');
    expect(validTransitions['completed']).not.toContain('cancelled');
  });

  it('should calculate estimated completion time', () => {
    const task = {
      estimatedDuration: 45, // minutes
      startedAt: new Date('2024-01-01T10:00:00Z'),
      checklist: [
        { item: 'Task 1', completed: true },
        { item: 'Task 2', completed: false }
      ]
    };

    const completionPercentage = task.checklist.filter(item => item.completed).length / task.checklist.length;
    const elapsedTime = Date.now() - task.startedAt.getTime();
    const estimatedTotal = elapsedTime / completionPercentage;
    const estimatedRemaining = estimatedTotal - elapsedTime;

    expect(estimatedRemaining).toBeGreaterThan(0);
  });

  it('should prioritize tasks correctly', () => {
    const tasks = [
      { priority: 'low', scheduledDate: new Date('2024-01-01') },
      { priority: 'high', scheduledDate: new Date('2024-01-02') },
      { priority: 'urgent', scheduledDate: new Date('2024-01-03') },
      { priority: 'medium', scheduledDate: new Date('2024-01-01') }
    ];

    const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };

    const sortedTasks = tasks.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      return a.scheduledDate.getTime() - b.scheduledDate.getTime();
    });

    expect(sortedTasks[0].priority).toBe('urgent');
    expect(sortedTasks[1].priority).toBe('high');
  });
});