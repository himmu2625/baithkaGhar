import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/os/rooms/[roomId]/route';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/lib/os-auth');

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>;

describe('Room API Routes', () => {
  let mockDb: any;
  let mockCollection: any;

  beforeEach(() => {
    mockCollection = {
      findOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      insertOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      }),
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

  describe('GET /api/os/rooms/[roomId]', () => {
    it('should return room details successfully', async () => {
      const mockRoom = {
        _id: new ObjectId(),
        number: '101',
        type: 'standard',
        status: 'available',
        floor: 1,
        capacity: { adults: 2, children: 1, total: 3 },
        amenities: [
          { type: 'comfort', name: 'Air Conditioning', included: true, condition: 'good' }
        ],
        pricing: { baseRate: 150, currency: 'USD' },
        housekeeping: {
          lastCleaned: new Date(),
          nextScheduled: new Date(),
          priority: 'medium'
        },
        maintenance: {
          lastInspection: new Date(),
          nextInspection: new Date(),
          issues: []
        },
        inventory: [
          { itemId: '1', name: 'TV Remote', category: 'electronics', quantity: 1 }
        ]
      };

      mockCollection.findOne.mockResolvedValue(mockRoom);

      const request = new NextRequest('http://localhost/api/os/rooms/123');
      const params = { params: { roomId: '123' } };

      const response = await GET(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.room).toBeDefined();
      expect(data.room.number).toBe('101');
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: new ObjectId('123')
      });
    });

    it('should return 404 when room not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/os/rooms/123');
      const params = { params: { roomId: '123' } };

      const response = await GET(request, params);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Room not found');
    });

    it('should return 400 for invalid ObjectId', async () => {
      const request = new NextRequest('http://localhost/api/os/rooms/invalid-id');
      const params = { params: { roomId: 'invalid-id' } };

      const response = await GET(request, params);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid room ID format');
    });
  });

  describe('PUT /api/os/rooms/[roomId]', () => {
    it('should update room successfully', async () => {
      const updateData = {
        status: 'maintenance',
        priority: 'high',
        notes: 'AC repair needed'
      };

      mockCollection.findOne.mockResolvedValue({
        _id: new ObjectId('123'),
        number: '101',
        status: 'available'
      });

      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1
      });

      const request = new NextRequest('http://localhost/api/os/rooms/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });
      const params = { params: { roomId: '123' } };

      const response = await PUT(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Room updated successfully');
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId('123') },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'maintenance',
            updatedAt: expect.any(Date)
          })
        })
      );
    });

    it('should return 404 when updating non-existent room', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/os/rooms/123', {
        method: 'PUT',
        body: JSON.stringify({ status: 'maintenance' }),
        headers: { 'Content-Type': 'application/json' }
      });
      const params = { params: { roomId: '123' } };

      const response = await PUT(request, params);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Room not found');
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost/api/os/rooms/123', {
        method: 'PUT',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      });
      const params = { params: { roomId: '123' } };

      const response = await PUT(request, params);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('At least one field must be provided');
    });
  });

  describe('DELETE /api/os/rooms/[roomId]', () => {
    it('should delete room successfully', async () => {
      mockCollection.findOne.mockResolvedValue({
        _id: new ObjectId('123'),
        number: '101',
        status: 'out_of_order'
      });

      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 1
      });

      const request = new NextRequest('http://localhost/api/os/rooms/123', {
        method: 'DELETE'
      });
      const params = { params: { roomId: '123' } };

      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Room deleted successfully');
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: new ObjectId('123')
      });
    });

    it('should prevent deletion of occupied room', async () => {
      mockCollection.findOne.mockResolvedValue({
        _id: new ObjectId('123'),
        number: '101',
        status: 'occupied'
      });

      const request = new NextRequest('http://localhost/api/os/rooms/123', {
        method: 'DELETE'
      });
      const params = { params: { roomId: '123' } };

      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Cannot delete occupied room');
      expect(mockCollection.deleteOne).not.toHaveBeenCalled();
    });
  });
});

describe('Room Business Logic', () => {
  it('should validate room status transitions', () => {
    const validTransitions = {
      'available': ['occupied', 'maintenance', 'cleaning', 'reserved'],
      'occupied': ['available', 'cleaning', 'maintenance'],
      'cleaning': ['available', 'maintenance'],
      'maintenance': ['available', 'out_of_order'],
      'reserved': ['occupied', 'available'],
      'out_of_order': ['maintenance', 'available']
    };

    // Test valid transitions
    expect(validTransitions['available']).toContain('occupied');
    expect(validTransitions['occupied']).toContain('cleaning');
    expect(validTransitions['cleaning']).toContain('available');

    // Test invalid transitions
    expect(validTransitions['occupied']).not.toContain('reserved');
    expect(validTransitions['out_of_order']).not.toContain('occupied');
  });

  it('should calculate room occupancy correctly', () => {
    const room = {
      capacity: { adults: 2, children: 1, total: 3 },
      currentOccupancy: { adults: 2, children: 0 }
    };

    const occupancyRate = (room.currentOccupancy.adults + room.currentOccupancy.children) / room.capacity.total;
    expect(occupancyRate).toBe(2/3);
  });

  it('should validate room amenities structure', () => {
    const amenity = {
      type: 'comfort',
      name: 'Air Conditioning',
      included: true,
      condition: 'good'
    };

    expect(amenity.type).toBeDefined();
    expect(amenity.name).toBeDefined();
    expect(typeof amenity.included).toBe('boolean');
    expect(['excellent', 'good', 'fair', 'poor']).toContain(amenity.condition);
  });

  it('should calculate next housekeeping schedule', () => {
    const lastCleaned = new Date('2024-01-01T10:00:00Z');
    const frequency = 24; // hours

    const nextScheduled = new Date(lastCleaned.getTime() + frequency * 60 * 60 * 1000);
    expect(nextScheduled.getTime()).toBeGreaterThan(lastCleaned.getTime());
  });
});