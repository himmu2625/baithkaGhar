import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import { z } from 'zod'
import Order from "@/models/Order"
import MenuItem from "@/models/MenuItem"
import Table from "@/models/Table"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get orders for a property
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const status = searchParams.get('status')
    const orderType = searchParams.get('orderType')
    const tableId = searchParams.get('tableId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const includeCompleted = searchParams.get('includeCompleted') === 'true'

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Build query
    const query: any = { propertyId: new Types.ObjectId(propertyId) }
    
    if (status) {
      query.status = status
    } else if (!includeCompleted) {
      // By default, exclude completed orders to show active ones
      query.status = { $ne: 'completed' }
    }
    
    if (orderType) {
      query.orderType = orderType
    }
    
    if (tableId && Types.ObjectId.isValid(tableId)) {
      query.tableId = new Types.ObjectId(tableId)
    }

    // Get orders with populated data
    const skip = (page - 1) * limit
    
    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .populate('items.itemId', 'name basePrice')
        .populate('tableId', 'number section')
        .populate('createdBy', 'name email')
        .sort({ 'timestamps.ordered': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ])

    // Transform orders for frontend
    const transformedOrders = orders.map(order => ({
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      customerName: order.guestInfo?.name || 'Guest',
      customerPhone: order.guestInfo?.phone || '',
      customerEmail: order.guestInfo?.email || '',
      orderType: order.orderType,
      tableId: order.tableId?._id?.toString() || null,
      tableName: order.tableId?.number ? `Table ${order.tableId.number}` : null,
      status: order.status,
      priority: order.priority || 'normal',
      items: order.items?.map(item => ({
        id: item._id?.toString() || '',
        menuItemId: item.itemId?._id?.toString() || '',
        menuItemName: item.itemId?.name || 'Unknown Item',
        categoryName: item.categoryName || '',
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.subtotal || 0,
        modifications: item.modifications || [],
        specialRequests: item.specialRequests || '',
        status: item.status || 'pending',
        preparationTime: item.preparationTime || 0
      })) || [],
      subtotal: order.pricing?.subtotal || 0,
      tax: order.pricing?.tax || 0,
      discount: order.pricing?.discount || 0,
      totalAmount: order.pricing?.total || 0,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod || '',
      notes: order.notes || '',
      specialInstructions: order.specialInstructions || '',
      estimatedTime: order.estimatedCompletionTime ? Math.ceil((new Date(order.estimatedCompletionTime).getTime() - Date.now()) / 60000) : null,
      createdAt: order.timestamps?.ordered?.toISOString() || order.createdAt?.toISOString() || '',
      updatedAt: order.timestamps?.lastModified?.toISOString() || order.updatedAt?.toISOString() || '',
      servedAt: order.timestamps?.served?.toISOString() || null,
      kitchenNotes: order.kitchenNotes || ''
    }))

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    )
  }
})

// POST handler - Create new order
export const POST = dbHandler(async (req: NextRequest) => {
  try {
    // Validate authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !token.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    await connectMongo()

    // Parse and validate request body
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      )
    }

    // Validate propertyId
    if (!body.propertyId || !Types.ObjectId.isValid(body.propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    try {
      const validatedData = createOrderSchema.parse(body)

      // Generate order number
      const orderCount = await Order.countDocuments({ 
        propertyId: new Types.ObjectId(body.propertyId)
      })
      const orderNumber = `ORD${Date.now().toString().slice(-6)}${String(orderCount + 1).padStart(3, '0')}`

      // Validate table if provided
      if (validatedData.tableId) {
        const table = await Table.findOne({
          _id: new Types.ObjectId(validatedData.tableId),
          propertyId: new Types.ObjectId(body.propertyId),
          isActive: true
        })

        if (!table) {
          return NextResponse.json(
            { success: false, message: "Table not found or doesn't belong to this property" },
            { status: 404 }
          )
        }

        // Check table availability for dine-in orders
        if (validatedData.orderType === 'dine_in' && table.status !== 'available') {
          return NextResponse.json(
            { success: false, message: "Table is not available" },
            { status: 409 }
          )
        }
      }

      // Validate and calculate items
      const validatedItems = []
      let calculatedSubtotal = 0

      for (const orderItem of validatedData.items) {
        const menuItem = await MenuItem.findOne({
          _id: new Types.ObjectId(orderItem.itemId),
          propertyId: new Types.ObjectId(body.propertyId),
          isActive: true,
          isAvailable: true
        })

        if (!menuItem) {
          return NextResponse.json(
            { success: false, message: `Menu item ${orderItem.itemId} not found or not available` },
            { status: 404 }
          )
        }

        const itemSubtotal = menuItem.basePrice * orderItem.quantity
        calculatedSubtotal += itemSubtotal

        validatedItems.push({
          itemId: new Types.ObjectId(orderItem.itemId),
          quantity: orderItem.quantity,
          unitPrice: menuItem.basePrice,
          modifiers: orderItem.modifiers || [],
          specialInstructions: orderItem.specialInstructions || '',
          subtotal: itemSubtotal
        })
      }

      // Calculate pricing
      const tax = Math.round(calculatedSubtotal * 0.18) // 18% GST
      const serviceCharge = validatedData.orderType === 'dine_in' ? Math.round(calculatedSubtotal * 0.10) : 0 // 10% service charge for dine-in
      const deliveryFee = validatedData.orderType === 'delivery' ? 50 : 0 // Fixed delivery fee
      const discount = validatedData.discount || 0
      const total = calculatedSubtotal + tax + serviceCharge + deliveryFee - discount

      // Create order
      const orderData = {
        propertyId: new Types.ObjectId(body.propertyId),
        orderNumber,
        orderType: validatedData.orderType,
        guestInfo: validatedData.guestInfo,
        items: validatedItems,
        pricing: {
          subtotal: calculatedSubtotal,
          tax,
          serviceCharge,
          deliveryFee,
          discount,
          total
        },
        status: 'pending',
        tableId: validatedData.tableId ? new Types.ObjectId(validatedData.tableId) : undefined,
        timestamps: {
          ordered: new Date()
        },
        paymentStatus: 'pending',
        priorityLevel: validatedData.priorityLevel || 'medium',
        source: validatedData.source || 'pos',
        specialInstructions: validatedData.specialInstructions || '',
        deliveryInfo: validatedData.deliveryInfo,
        estimatedPreparationTime: validatedItems.reduce((total, item) => total + 15, 0), // 15 mins per item estimate
        createdBy: new Types.ObjectId(token.sub),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const order = await Order.create(orderData)

      // Update table status if dine-in
      if (validatedData.orderType === 'dine_in' && validatedData.tableId) {
        await Table.findByIdAndUpdate(validatedData.tableId, {
          status: 'occupied',
          lastUpdatedBy: new Types.ObjectId(token.sub)
        })
      }

      // Populate the created order
      const populatedOrder = await Order.findById(order._id)
        .populate('tableId', 'number section')
        .populate('items.itemId', 'name basePrice preparationTime')
        .populate('createdBy', 'name email')
        .lean() as any

      return NextResponse.json({
        success: true,
        message: "Order created successfully",
        order: {
          id: populatedOrder!._id.toString(),
          orderNumber: populatedOrder!.orderNumber,
          orderType: populatedOrder!.orderType,
          status: populatedOrder!.status,
          paymentStatus: populatedOrder!.paymentStatus,
          guestInfo: populatedOrder!.guestInfo,
          table: populatedOrder!.tableId,
          items: populatedOrder!.items,
          pricing: populatedOrder!.pricing,
          timestamps: populatedOrder!.timestamps,
          priorityLevel: populatedOrder!.priorityLevel,
          source: populatedOrder!.source,
          estimatedPreparationTime: populatedOrder!.estimatedPreparationTime,
          createdAt: populatedOrder!.createdAt,
          createdBy: populatedOrder!.createdBy
        }
      }, { status: 201 })

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const formattedErrors = validationError.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
        return NextResponse.json(
          { 
            success: false, 
            message: "Validation error", 
            errors: formattedErrors
          },
          { status: 400 }
        )
      }
      throw validationError
    }

  } catch (error: any) {
    console.error('Error creating order:', error)
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message
      }))
      return NextResponse.json(
        { 
          success: false, 
          message: "Database validation error", 
          errors: validationErrors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 500 }
    )
  }
})

// Schema for order creation validation
const createOrderSchema = z.object({
  orderType: z.enum(['dine_in', 'takeaway', 'room_service', 'delivery']),
  guestInfo: z.object({
    name: z.string().min(1, "Guest name is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    email: z.string().email().optional(),
    roomNumber: z.string().optional()
  }),
  items: z.array(z.object({
    itemId: z.string().min(1, "Item ID is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    modifiers: z.array(z.object({
      modifierId: z.string(),
      selectedOptions: z.array(z.object({
        optionIndex: z.number(),
        quantity: z.number().default(1),
        priceAdjustment: z.number().default(0)
      }))
    })).default([]),
    specialInstructions: z.string().optional()
  })).min(1, "At least one item is required"),
  tableId: z.string().optional(),
  specialInstructions: z.string().optional(),
  priorityLevel: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  source: z.enum(['pos', 'online', 'app', 'phone', 'walk_in']).default('pos'),
  discount: z.number().min(0).default(0),
  deliveryInfo: z.object({
    address: z.string().min(1, "Delivery address is required"),
    instructions: z.string().optional(),
    estimatedDeliveryTime: z.string().optional()
  }).optional()
}).refine((data) => {
  // Validate delivery info for delivery orders
  if (data.orderType === 'delivery' && !data.deliveryInfo) {
    return false
  }
  // Validate room number for room service
  if (data.orderType === 'room_service' && !data.guestInfo.roomNumber) {
    return false
  }
  return true
}, {
  message: "Additional information required for this order type"
})