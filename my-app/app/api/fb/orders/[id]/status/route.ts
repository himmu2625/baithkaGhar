import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import { z } from 'zod'
import Order from "@/models/Order"
import Table from "@/models/Table"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// PUT handler - Update order status
export const PUT = dbHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
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
    const { id } = params

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      )
    }

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

    try {
      const validatedData = updateStatusSchema.parse(body)

      // Check if order exists
      const order = await Order.findById(id).populate('tableId')
      if (!order) {
        return NextResponse.json(
          { success: false, message: "Order not found" },
          { status: 404 }
        )
      }

      // Validate status transition
      const validTransitions: { [key: string]: string[] } = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['preparing', 'cancelled'],
        'preparing': ['ready', 'cancelled'],
        'ready': ['served', 'delivered'],
        'served': [],
        'delivered': [],
        'cancelled': []
      }

      const currentStatus = order.status
      if (!validTransitions[currentStatus]?.includes(validatedData.status)) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Invalid status transition from '${currentStatus}' to '${validatedData.status}'` 
          },
          { status: 400 }
        )
      }

      // Prepare update data
      const updateData: any = {
        status: validatedData.status,
        lastUpdatedBy: new Types.ObjectId(token.sub),
        updatedAt: new Date()
      }

      // Update timestamps based on status
      const now = new Date()
      const timestamps = { ...order.timestamps }
      
      switch (validatedData.status) {
        case 'confirmed':
          timestamps.confirmed = now
          if (validatedData.estimatedReadyTime) {
            timestamps.estimatedReady = new Date(validatedData.estimatedReadyTime)
          }
          break
        case 'preparing':
          timestamps.preparing = now
          break
        case 'ready':
          timestamps.ready = now
          break
        case 'served':
          timestamps.served = now
          // Free up table for dine-in orders
          if (order.orderType === 'dine_in' && order.tableId) {
            await Table.findByIdAndUpdate(order.tableId._id, {
              status: 'available',
              lastUpdatedBy: new Types.ObjectId(token.sub)
            })
          }
          break
        case 'delivered':
          timestamps.delivered = now
          if (validatedData.deliveryPersonId) {
            updateData['deliveryInfo.deliveryPersonId'] = new Types.ObjectId(validatedData.deliveryPersonId)
          }
          if (validatedData.actualDeliveryTime) {
            updateData['deliveryInfo.actualDeliveryTime'] = new Date(validatedData.actualDeliveryTime)
          }
          break
        case 'cancelled':
          timestamps.cancelled = now
          updateData.cancellationReason = validatedData.reason
          // Free up table if it was a dine-in order
          if (order.orderType === 'dine_in' && order.tableId) {
            await Table.findByIdAndUpdate(order.tableId._id, {
              status: 'available',
              lastUpdatedBy: new Types.ObjectId(token.sub)
            })
          }
          break
      }

      updateData.timestamps = timestamps

      // Update assigned staff if provided
      if (validatedData.assignedWaiterId) {
        updateData.assignedWaiter = new Types.ObjectId(validatedData.assignedWaiterId)
      }
      if (validatedData.assignedChefId) {
        updateData.assignedChef = new Types.ObjectId(validatedData.assignedChefId)
      }

      // Update order
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
      .populate('tableId', 'number section')
      .populate('items.itemId', 'name basePrice preparationTime')
      .populate('assignedWaiter', 'name email')
      .populate('assignedChef', 'name email')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .lean() as any

      // Log activity
      const activity = {
        orderId: id,
        action: `Status updated to ${validatedData.status}`,
        performedBy: token.sub,
        timestamp: new Date(),
        details: validatedData.reason ? { reason: validatedData.reason } : {}
      }

      return NextResponse.json({
        success: true,
        message: `Order status updated to ${validatedData.status}`,
        order: {
          id: updatedOrder!._id.toString(),
          orderNumber: updatedOrder!.orderNumber,
          orderType: updatedOrder!.orderType,
          status: updatedOrder!.status,
          paymentStatus: updatedOrder!.paymentStatus,
          guestInfo: updatedOrder!.guestInfo,
          table: updatedOrder!.tableId,
          items: updatedOrder!.items,
          pricing: updatedOrder!.pricing,
          timestamps: updatedOrder!.timestamps,
          assignedWaiter: updatedOrder!.assignedWaiter,
          assignedChef: updatedOrder!.assignedChef,
          deliveryInfo: updatedOrder!.deliveryInfo,
          estimatedPreparationTime: updatedOrder!.estimatedPreparationTime,
          cancellationReason: updatedOrder!.cancellationReason,
          updatedAt: updatedOrder!.updatedAt,
          lastUpdatedBy: updatedOrder!.lastUpdatedBy
        },
        activity
      })

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
    console.error('Error updating order status:', error)
    
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
      { success: false, message: "Failed to update order status" },
      { status: 500 }
    )
  }
})

// Schema for status update validation
const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'served', 'delivered', 'cancelled']),
  reason: z.string().optional(), // For cancellation or notes
  assignedWaiterId: z.string().optional(),
  assignedChefId: z.string().optional(),
  estimatedReadyTime: z.string().optional(), // ISO date string
  deliveryPersonId: z.string().optional(),
  actualDeliveryTime: z.string().optional(), // ISO date string
})