import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Order from "@/models/Order"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get orders for kitchen display
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

    const showCompleted = searchParams.get('showCompleted') === 'true'
    const orderType = searchParams.get('orderType') // Filter by order type

    // Build query for active orders
    const query: any = { 
      propertyId: new Types.ObjectId(propertyId),
      status: showCompleted 
        ? { $in: ['confirmed', 'preparing', 'ready', 'served'] } 
        : { $in: ['confirmed', 'preparing', 'ready'] }
    }

    if (orderType) {
      query.orderType = orderType
    }

    const orders = await Order.find(query)
      .populate('tableId', 'number section')
      .populate('items.itemId', 'name basePrice preparationTime category')
      .populate('assignedChef', 'name email')
      .sort({ 
        priorityLevel: -1, // Urgent first
        'timestamps.confirmed': 1 // Oldest first
      })
      .lean() as unknown as any[]

    // Transform orders for kitchen display
    const kitchenOrders = orders.map(order => {
      // Calculate estimated completion time
      const totalPrepTime = order.items.reduce((total: number, item: any) => {
        const itemPrepTime = item.itemId?.preparationTime || 15
        return total + (itemPrepTime * item.quantity)
      }, 0)

      const orderTime = order.timestamps.confirmed || order.timestamps.ordered
      const estimatedCompletion = new Date(orderTime.getTime() + (totalPrepTime * 60 * 1000))
      
      // Calculate time elapsed
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60)) // minutes
      
      // Determine if order is running late
      const isLate = now > estimatedCompletion && order.status !== 'ready'
      
      // Get priority color
      const getPriorityColor = (priority: string, isLate: boolean) => {
        if (isLate) return 'red'
        switch (priority) {
          case 'urgent': return 'red'
          case 'high': return 'orange'
          case 'medium': return 'yellow'
          case 'low': return 'green'
          default: return 'gray'
        }
      }

      return {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        status: order.status,
        priorityLevel: order.priorityLevel,
        priorityColor: getPriorityColor(order.priorityLevel, isLate),
        isLate,
        elapsedTime: elapsed,
        estimatedCompletion,
        table: order.tableId ? {
          number: order.tableId.number,
          section: order.tableId.section
        } : null,
        guestInfo: {
          name: order.guestInfo.name,
          phone: order.guestInfo.phone,
          roomNumber: order.guestInfo.roomNumber || null
        },
        items: order.items.map((item: any) => ({
          id: item._id?.toString(),
          name: item.itemId?.name || 'Unknown Item',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          preparationTime: item.itemId?.preparationTime || 15,
          modifiers: item.modifiers || [],
          specialInstructions: item.specialInstructions || ''
        })),
        specialInstructions: order.specialInstructions || '',
        assignedChef: order.assignedChef ? {
          id: order.assignedChef._id?.toString(),
          name: order.assignedChef.name
        } : null,
        timestamps: {
          ordered: order.timestamps.ordered,
          confirmed: order.timestamps.confirmed,
          preparing: order.timestamps.preparing,
          ready: order.timestamps.ready
        },
        totalItems: order.items.reduce((total: number, item: any) => total + item.quantity, 0),
        estimatedPreparationTime: totalPrepTime
      }
    })

    // Group orders by status for better organization
    const groupedOrders = {
      confirmed: kitchenOrders.filter(order => order.status === 'confirmed'),
      preparing: kitchenOrders.filter(order => order.status === 'preparing'),
      ready: kitchenOrders.filter(order => order.status === 'ready'),
      served: showCompleted ? kitchenOrders.filter(order => order.status === 'served') : []
    }

    // Get summary statistics
    const statistics = {
      totalActiveOrders: kitchenOrders.length,
      confirmedOrders: groupedOrders.confirmed.length,
      preparingOrders: groupedOrders.preparing.length,
      readyOrders: groupedOrders.ready.length,
      lateOrders: kitchenOrders.filter(order => order.isLate).length,
      averageWaitTime: kitchenOrders.length > 0 
        ? Math.round(kitchenOrders.reduce((sum, order) => sum + order.elapsedTime, 0) / kitchenOrders.length)
        : 0
    }

    return NextResponse.json({
      success: true,
      orders: showCompleted ? kitchenOrders : kitchenOrders.filter(order => order.status !== 'served'),
      groupedOrders,
      statistics,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching kitchen orders:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch kitchen orders" },
      { status: 500 }
    )
  }
})