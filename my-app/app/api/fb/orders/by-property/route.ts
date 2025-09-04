import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Order from "@/models/Order"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get all orders for a property
export const GET = dbHandler(async (req: NextRequest) => {
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
    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required as query parameter" },
        { status: 400 }
      )
    }
    const status = searchParams.get('status')
    const orderType = searchParams.get('orderType')
    const paymentStatus = searchParams.get('paymentStatus')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const tableId = searchParams.get('tableId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'timestamps.ordered'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1

    // Build query
    const query: any = { propertyId: new Types.ObjectId(propertyId) }

    if (status) {
      query.status = status
    }

    if (orderType) {
      query.orderType = orderType
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus
    }

    if (tableId && Types.ObjectId.isValid(tableId)) {
      query.tableId = new Types.ObjectId(tableId)
    }

    // Date range filter
    if (startDate || endDate) {
      query['timestamps.ordered'] = {}
      if (startDate) {
        query['timestamps.ordered'].$gte = new Date(startDate)
      }
      if (endDate) {
        query['timestamps.ordered'].$lte = new Date(endDate)
      }
    }

    // Build sort object
    const sort: any = {}
    sort[sortBy] = sortOrder

    // Calculate skip for pagination
    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('tableId', 'number section')
        .populate('items.itemId', 'name basePrice preparationTime')
        .populate('assignedWaiter', 'name email')
        .populate('assignedChef', 'name email')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean() as unknown as any[],
      Order.countDocuments(query)
    ])

    // Transform orders for frontend
    const formattedOrders = orders.map(order => ({
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod || null,
      guestInfo: order.guestInfo,
      table: order.tableId || null,
      items: order.items.map((item: any) => ({
        id: item._id?.toString(),
        item: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        modifiers: item.modifiers || [],
        specialInstructions: item.specialInstructions || ''
      })),
      pricing: order.pricing,
      timestamps: order.timestamps,
      assignedWaiter: order.assignedWaiter || null,
      assignedChef: order.assignedChef || null,
      specialInstructions: order.specialInstructions || '',
      priorityLevel: order.priorityLevel,
      source: order.source,
      deliveryInfo: order.deliveryInfo || null,
      estimatedPreparationTime: order.estimatedPreparationTime || 0,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }))

    // Get summary statistics
    const statusCounts = await Order.aggregate([
      { $match: { propertyId: new Types.ObjectId(propertyId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    const summary = {
      total,
      statusCounts: statusCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count
        return acc
      }, {})
    }

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      summary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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