import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Room from '@/models/Room';
import { validateOSAccess } from '@/lib/auth/os-auth';
import { getServerSession } from 'next-auth';

interface Params {
  params: {
    roomId: string;
  };
}

interface InventoryItem {
  item: string;
  category: 'furniture' | 'electronics' | 'linens' | 'bathroom' | 'kitchen' | 'decor' | 'safety';
  quantity: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'missing';
  lastChecked: Date;
  needsReplacement: boolean;
  cost: number;
  supplier?: string;
  _id?: string;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { roomId } = params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const condition = searchParams.get('condition') || '';
    const needsReplacement = searchParams.get('needsReplacement');
    const includeStats = searchParams.get('includeStats') === 'true';

    // Validate roomId format
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid room ID format' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);

    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find the room and validate access
    const room = await Room.findById(roomId).select('propertyId inventory roomNumber').lean();
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Validate OS access
    const hasAccess = await validateOSAccess(session.user.email, room.propertyId.toString());
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this property' },
        { status: 403 }
      );
    }

    let inventory = room.inventory || [];

    // Apply filters
    if (category && category !== 'all') {
      inventory = inventory.filter(item => item.category === category);
    }

    if (condition && condition !== 'all') {
      inventory = inventory.filter(item => item.condition === condition);
    }

    if (needsReplacement !== null) {
      const needsReplacementBool = needsReplacement === 'true';
      inventory = inventory.filter(item => item.needsReplacement === needsReplacementBool);
    }

    // Sort inventory by category, then by item name
    inventory.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.item.localeCompare(b.item);
    });

    const responseData: any = {
      roomId,
      roomNumber: room.roomNumber,
      inventory: inventory.map(item => ({
        ...item,
        _id: item._id?.toString() || new mongoose.Types.ObjectId().toString()
      })),
      totalItems: inventory.length
    };

    // Include statistics if requested
    if (includeStats) {
      const stats = {
        totalItems: inventory.length,
        totalValue: inventory.reduce((sum, item) => sum + (item.cost * item.quantity), 0),
        categories: {} as { [key: string]: number },
        conditions: {} as { [key: string]: number },
        needsReplacement: inventory.filter(item => item.needsReplacement).length,
        lastChecked: {
          oldest: null as Date | null,
          newest: null as Date | null,
          overdue: 0 // Items not checked in last 90 days
        }
      };

      // Calculate category distribution
      inventory.forEach(item => {
        stats.categories[item.category] = (stats.categories[item.category] || 0) + item.quantity;
        stats.conditions[item.condition] = (stats.conditions[item.condition] || 0) + 1;

        // Track check dates
        if (!stats.lastChecked.oldest || item.lastChecked < stats.lastChecked.oldest) {
          stats.lastChecked.oldest = item.lastChecked;
        }
        if (!stats.lastChecked.newest || item.lastChecked > stats.lastChecked.newest) {
          stats.lastChecked.newest = item.lastChecked;
        }

        // Check if overdue (not checked in 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        if (item.lastChecked < ninetyDaysAgo) {
          stats.lastChecked.overdue++;
        }
      });

      responseData.statistics = stats;
    }

    // Add quick actions
    responseData.availableActions = [
      'add_item',
      'bulk_update',
      'generate_report',
      'schedule_audit'
    ];

    if (inventory.some(item => item.needsReplacement)) {
      responseData.availableActions.push('create_purchase_order');
    }

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching room inventory:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch room inventory: ${(error as Error).message}`
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { roomId } = params;
    const inventoryData = await request.json();

    // Validate roomId format
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid room ID format' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);

    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find the room and validate access
    const room = await Room.findById(roomId).select('propertyId inventory roomNumber');
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Validate OS access
    const hasAccess = await validateOSAccess(session.user.email, room.propertyId.toString());
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this property' },
        { status: 403 }
      );
    }

    // Validate inventory item data
    const requiredFields = ['item', 'category', 'quantity', 'condition', 'cost'];
    for (const field of requiredFields) {
      if (inventoryData[field] === undefined || inventoryData[field] === null) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`
          },
          { status: 400 }
        );
      }
    }

    // Validate category
    const validCategories = ['furniture', 'electronics', 'linens', 'bathroom', 'kitchen', 'decor', 'safety'];
    if (!validCategories.includes(inventoryData.category)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate condition
    const validConditions = ['excellent', 'good', 'fair', 'poor', 'missing'];
    if (!validConditions.includes(inventoryData.condition)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid condition. Must be one of: ${validConditions.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (inventoryData.quantity < 0 || inventoryData.cost < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quantity and cost must be non-negative'
        },
        { status: 400 }
      );
    }

    // Check if item already exists in room inventory
    const existingItemIndex = room.inventory?.findIndex(
      item => item.item.toLowerCase() === inventoryData.item.toLowerCase() &&
               item.category === inventoryData.category
    ) ?? -1;

    if (existingItemIndex !== -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item already exists in room inventory. Use PUT to update existing items.'
        },
        { status: 409 }
      );
    }

    // Create new inventory item
    const newInventoryItem: InventoryItem = {
      item: inventoryData.item.trim(),
      category: inventoryData.category,
      quantity: parseInt(inventoryData.quantity),
      condition: inventoryData.condition,
      lastChecked: new Date(),
      needsReplacement: inventoryData.needsReplacement || false,
      cost: parseFloat(inventoryData.cost),
      supplier: inventoryData.supplier?.trim() || undefined,
      _id: new mongoose.Types.ObjectId().toString()
    };

    // Add to room inventory
    if (!room.inventory) {
      room.inventory = [];
    }
    room.inventory.push(newInventoryItem);

    // Update last modified tracking
    room.lastModifiedBy = session.user.id || session.user.email;
    room.updatedAt = new Date();

    await room.save();

    return NextResponse.json({
      success: true,
      data: {
        inventoryItem: newInventoryItem,
        message: 'Inventory item added successfully',
        roomId: roomId,
        totalItems: room.inventory.length
      }
    });

  } catch (error) {
    console.error('Error adding inventory item:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to add inventory item: ${(error as Error).message}`
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { roomId } = params;
    const updateData = await request.json();
    const { itemId, bulkUpdate, ...itemUpdates } = updateData;

    // Validate roomId format
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid room ID format' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);

    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find the room and validate access
    const room = await Room.findById(roomId).select('propertyId inventory roomNumber');
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Validate OS access
    const hasAccess = await validateOSAccess(session.user.email, room.propertyId.toString());
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this property' },
        { status: 403 }
      );
    }

    let updatedCount = 0;
    const updatedItems: any[] = [];

    if (bulkUpdate && Array.isArray(updateData.items)) {
      // Bulk update multiple items
      for (const itemUpdate of updateData.items) {
        if (!itemUpdate.itemId) continue;

        const itemIndex = room.inventory?.findIndex(
          item => item._id?.toString() === itemUpdate.itemId
        ) ?? -1;

        if (itemIndex === -1) continue;

        // Update allowed fields
        const allowedFields = ['condition', 'quantity', 'needsReplacement', 'cost', 'supplier'];
        allowedFields.forEach(field => {
          if (itemUpdate[field] !== undefined && room.inventory) {
            room.inventory[itemIndex][field as keyof InventoryItem] = itemUpdate[field];
          }
        });

        // Update lastChecked for condition changes
        if (itemUpdate.condition && room.inventory) {
          room.inventory[itemIndex].lastChecked = new Date();
        }

        updatedItems.push(room.inventory[itemIndex]);
        updatedCount++;
      }

    } else if (itemId) {
      // Single item update
      const itemIndex = room.inventory?.findIndex(
        item => item._id?.toString() === itemId
      ) ?? -1;

      if (itemIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'Inventory item not found' },
          { status: 404 }
        );
      }

      // Validate condition if provided
      if (itemUpdates.condition) {
        const validConditions = ['excellent', 'good', 'fair', 'poor', 'missing'];
        if (!validConditions.includes(itemUpdates.condition)) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid condition. Must be one of: ${validConditions.join(', ')}`
            },
            { status: 400 }
          );
        }
      }

      // Update allowed fields
      const allowedFields = ['condition', 'quantity', 'needsReplacement', 'cost', 'supplier'];
      let hasChanges = false;

      allowedFields.forEach(field => {
        if (itemUpdates[field] !== undefined && room.inventory) {
          room.inventory[itemIndex][field as keyof InventoryItem] = itemUpdates[field];
          hasChanges = true;
        }
      });

      // Update lastChecked if there were changes
      if (hasChanges && room.inventory) {
        room.inventory[itemIndex].lastChecked = new Date();
        updatedItems.push(room.inventory[itemIndex]);
        updatedCount = 1;
      }

    } else {
      return NextResponse.json(
        { success: false, error: 'Either itemId or bulkUpdate with items array is required' },
        { status: 400 }
      );
    }

    if (updatedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'No items were updated' },
        { status: 400 }
      );
    }

    // Update room tracking
    room.lastModifiedBy = session.user.id || session.user.email;
    room.updatedAt = new Date();

    await room.save();

    return NextResponse.json({
      success: true,
      data: {
        message: `${updatedCount} inventory item(s) updated successfully`,
        updatedItems: updatedItems,
        updatedCount: updatedCount,
        roomId: roomId
      }
    });

  } catch (error) {
    console.error('Error updating inventory items:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update inventory items: ${(error as Error).message}`
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { roomId } = params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    // Validate roomId format
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid room ID format' },
        { status: 400 }
      );
    }

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);

    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find the room and validate access
    const room = await Room.findById(roomId).select('propertyId inventory roomNumber');
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Validate OS access
    const hasAccess = await validateOSAccess(session.user.email, room.propertyId.toString());
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this property' },
        { status: 403 }
      );
    }

    // Find and remove the inventory item
    const itemIndex = room.inventory?.findIndex(
      item => item._id?.toString() === itemId
    ) ?? -1;

    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    const deletedItem = room.inventory![itemIndex];
    room.inventory!.splice(itemIndex, 1);

    // Update room tracking
    room.lastModifiedBy = session.user.id || session.user.email;
    room.updatedAt = new Date();

    await room.save();

    return NextResponse.json({
      success: true,
      data: {
        message: 'Inventory item deleted successfully',
        deletedItem: {
          id: deletedItem._id,
          item: deletedItem.item,
          category: deletedItem.category
        },
        remainingItems: room.inventory!.length,
        roomId: roomId
      }
    });

  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to delete inventory item: ${(error as Error).message}`
      },
      { status: 500 }
    );
  }
}