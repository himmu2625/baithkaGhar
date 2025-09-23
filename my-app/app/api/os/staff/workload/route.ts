import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { StaffTaskManagementService } from '@/lib/services/staff-task-management'

// GET /api/os/staff/workload - Get staff workload
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { searchParams } = new URL(request.url)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const propertyId = searchParams.get('propertyId')
    const date = searchParams.get('date')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const workloadDate = date ? new Date(date) : new Date()
    const workloads = await StaffTaskManagementService.getStaffWorkload(propertyId, workloadDate)

    return NextResponse.json({
      success: true,
      workloads
    })

  } catch (error) {
    console.error('Get staff workload API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff workload' },
      { status: 500 }
    )
  }
}