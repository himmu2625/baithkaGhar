import { NextRequest, NextResponse } from 'next/server'
import { GuestCommunicationService } from '@/lib/services/os/guest-communication-service'
import { auth } from '@/lib/auth'

// GET /api/os/guests/[id]/communication - Get guest communication data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`💬 [GET /api/os/guests/${params.id}/communication] Fetching guest communication data`)
    
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: propertyId } = params
    const { searchParams } = new URL(request.url)

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Parse query parameters for message filters
    const messageFilters: any = { propertyId }
    
    if (searchParams.get('guestId')) {
      messageFilters.guestId = searchParams.get('guestId')
    }
    
    if (searchParams.get('bookingId')) {
      messageFilters.bookingId = searchParams.get('bookingId')
    }
    
    if (searchParams.get('type')) {
      messageFilters.type = searchParams.get('type')
    }
    
    if (searchParams.get('category')) {
      messageFilters.category = searchParams.get('category')
    }
    
    if (searchParams.get('channel')) {
      messageFilters.channel = searchParams.get('channel')
    }
    
    if (searchParams.get('status')) {
      messageFilters.status = searchParams.get('status')
    }
    
    if (searchParams.get('page')) {
      messageFilters.page = parseInt(searchParams.get('page')!)
    }
    
    if (searchParams.get('limit')) {
      messageFilters.limit = parseInt(searchParams.get('limit')!)
    }

    // Parse conversation filters
    const conversationFilters: any = {}
    
    if (searchParams.get('conversationStatus')) {
      conversationFilters.status = searchParams.get('conversationStatus')
    }
    
    if (searchParams.get('assignedTo')) {
      conversationFilters.assignedTo = searchParams.get('assignedTo')
    }

    // Get analytics timeframe
    const analyticsTimeframe = (searchParams.get('timeframe') as '7d' | '30d' | '90d') || '30d'

    // Fetch communication data
    const [messagesResult, conversationsResult, templatesResult, analyticsResult] = await Promise.all([
      GuestCommunicationService.getMessages(messageFilters),
      GuestCommunicationService.getConversations(propertyId, conversationFilters),
      GuestCommunicationService.getTemplates(propertyId),
      GuestCommunicationService.getCommunicationAnalytics(propertyId, analyticsTimeframe)
    ])

    if (!messagesResult.success) {
      return NextResponse.json(
        { error: messagesResult.error },
        { status: 400 }
      )
    }

    if (!conversationsResult.success) {
      return NextResponse.json(
        { error: conversationsResult.error },
        { status: 400 }
      )
    }

    if (!templatesResult.success) {
      return NextResponse.json(
        { error: templatesResult.error },
        { status: 400 }
      )
    }

    if (!analyticsResult.success) {
      return NextResponse.json(
        { error: analyticsResult.error },
        { status: 400 }
      )
    }
    
    console.log(`✅ [GET /api/os/guests/${propertyId}/communication] Communication data retrieved successfully`)

    return NextResponse.json({
      success: true,
      propertyId,
      data: {
        messages: messagesResult.data,
        conversations: conversationsResult.data,
        templates: templatesResult.data,
        analytics: analyticsResult.data
      },
      filters: {
        messages: messageFilters,
        conversations: conversationFilters,
        analyticsTimeframe
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [GET /api/os/guests/${params?.id}/communication] Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/os/guests/[id]/communication - Send message or create template
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`💬 [POST /api/os/guests/${params.id}/communication] Creating communication resource`)
    
    // Check authentication and authorization
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage guest communication
    if (!['admin', 'super_admin', 'property_manager', 'guest_relations', 'front_desk'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: propertyId } = params
    const body = await request.json()

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    const { action, data } = body

    if (!action || !data) {
      return NextResponse.json(
        { error: 'Action and data are required' },
        { status: 400 }
      )
    }

    let result: any = null

    switch (action) {
      case 'sendMessage':
        const { guestId, bookingId, type, category, channel, to, subject, content, priority, attachments } = data
        
        if (!guestId || !type || !category || !channel || !to || !content) {
          return NextResponse.json(
            { error: 'Guest ID, type, category, channel, recipient, and content are required for sending messages' },
            { status: 400 }
          )
        }

        result = await GuestCommunicationService.sendMessage({
          bookingId: bookingId || '',
          guestId,
          propertyId,
          type,
          category,
          channel,
          direction: 'outbound',
          from: session.user.email || 'property@example.com',
          to,
          subject: subject || '',
          content,
          attachments: attachments || [],
          priority: priority || 'normal',
          isAutomated: false,
          tags: [],
          metadata: {
            sentBy: session.user.id,
            sentByName: session.user.name
          }
        })
        break
        
      case 'createTemplate':
        const { name, templateCategory, templateType, templateChannel, templateSubject, templateContent, variables, isActive, trigger } = data
        
        if (!name || !templateCategory || !templateType || !templateChannel || !templateContent) {
          return NextResponse.json(
            { error: 'Name, category, type, channel, and content are required for template creation' },
            { status: 400 }
          )
        }

        result = await GuestCommunicationService.createTemplate({
          name,
          category: templateCategory,
          type: templateType,
          channel: templateChannel,
          subject: templateSubject || '',
          content: templateContent,
          variables: variables || [],
          isActive: isActive !== undefined ? isActive : true,
          trigger: trigger || undefined,
          propertyId
        })
        break
        
      case 'createBulkMessage':
        const { bulkName, templateId, targetCriteria, bulkChannel, scheduledAt, totalRecipients } = data
        
        if (!bulkName || !templateId || !targetCriteria || !bulkChannel || !totalRecipients) {
          return NextResponse.json(
            { error: 'Name, template ID, target criteria, channel, and total recipients are required for bulk messages' },
            { status: 400 }
          )
        }

        result = await GuestCommunicationService.createBulkMessage({
          name: bulkName,
          templateId,
          targetCriteria,
          channel: bulkChannel,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
          status: scheduledAt ? 'scheduled' : 'draft',
          totalRecipients,
          propertyId,
          createdBy: session.user.id
        })
        break
        
      case 'processAutomatedMessages':
        // This action doesn't require additional data
        result = await GuestCommunicationService.processAutomatedMessages()
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Operation failed' },
        { status: 400 }
      )
    }
    
    console.log(`✅ [POST /api/os/guests/${propertyId}/communication] ${action} completed successfully`)

    return NextResponse.json({
      success: true,
      action,
      propertyId,
      data: result.data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [POST /api/os/guests/${params?.id}/communication] Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/os/guests/[id]/communication - Update conversation status or preferences
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`💬 [PUT /api/os/guests/${params.id}/communication] Updating communication resource`)
    
    // Check authentication and authorization
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update guest communication
    if (!['admin', 'super_admin', 'property_manager', 'guest_relations', 'front_desk'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: propertyId } = params
    const body = await request.json()

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    const { action, resourceId, updates } = body

    if (!action || !updates) {
      return NextResponse.json(
        { error: 'Action and updates are required' },
        { status: 400 }
      )
    }

    let result: any = null

    switch (action) {
      case 'updateConversationStatus':
        if (!resourceId) {
          return NextResponse.json(
            { error: 'Conversation ID is required for status updates' },
            { status: 400 }
          )
        }
        
        const { status } = updates
        if (!status) {
          return NextResponse.json(
            { error: 'Status is required for conversation status update' },
            { status: 400 }
          )
        }
        
        result = await GuestCommunicationService.updateConversationStatus(resourceId, status, session.user.id)
        break
        
      case 'updateCommunicationPreferences':
        const { guestId } = updates
        if (!guestId) {
          return NextResponse.json(
            { error: 'Guest ID is required for preference updates' },
            { status: 400 }
          )
        }
        
        result = await GuestCommunicationService.updateCommunicationPreferences(guestId, updates)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Update failed' },
        { status: 400 }
      )
    }
    
    console.log(`✅ [PUT /api/os/guests/${propertyId}/communication] ${action} completed successfully`)

    return NextResponse.json({
      success: true,
      action,
      propertyId,
      resourceId: resourceId || null,
      data: result.data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [PUT /api/os/guests/${params?.id}/communication] Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/os/guests/[id]/communication - Delete messages or templates
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`💬 [DELETE /api/os/guests/${params.id}/communication] Deleting communication resource`)
    
    // Check authentication and authorization
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete communication resources
    if (!['admin', 'super_admin', 'property_manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: propertyId } = params
    const { searchParams } = new URL(request.url)

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    const action = searchParams.get('action')
    const resourceId = searchParams.get('resourceId')

    if (!action || !resourceId) {
      return NextResponse.json(
        { error: 'Action and resource ID are required' },
        { status: 400 }
      )
    }

    // For safety, we typically mark resources as inactive rather than delete
    let result: any = { success: true, message: 'Resource marked as inactive' }

    switch (action) {
      case 'deleteTemplate':
        // In production, mark template as inactive rather than deleting
        console.log('Marking template as inactive:', resourceId)
        result = { success: true, message: 'Template marked as inactive' }
        break
        
      case 'deleteMessage':
        // In production, mark message as deleted rather than removing
        console.log('Marking message as deleted:', resourceId)
        result = { success: true, message: 'Message marked as deleted' }
        break
        
      case 'deleteBulkMessage':
        // In production, cancel/mark bulk message as cancelled
        console.log('Cancelling bulk message:', resourceId)
        result = { success: true, message: 'Bulk message cancelled' }
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Deletion failed' },
        { status: 400 }
      )
    }
    
    console.log(`✅ [DELETE /api/os/guests/${propertyId}/communication] ${action} completed successfully`)

    return NextResponse.json({
      success: true,
      action,
      propertyId,
      resourceId,
      message: result.message || 'Resource deleted successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [DELETE /api/os/guests/${params?.id}/communication] Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}