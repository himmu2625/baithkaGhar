import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { ExternalIntegrationsService } from '@/lib/services/integrations/external-integrations'
import { z } from 'zod'

const connectPMSSchema = z.object({
  propertyId: z.string(),
  systemName: z.enum(['opera', 'protel', 'cloudbeds', 'little_hotelier', 'hostfully', 'custom']),
  credentials: z.object({
    apiUrl: z.string().url(),
    apiKey: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional()
  }),
  syncSettings: z.object({
    syncReservations: z.boolean().default(true),
    syncRates: z.boolean().default(true),
    syncInventory: z.boolean().default(true),
    syncGuests: z.boolean().default(true),
    frequency: z.enum(['realtime', 'hourly', 'daily']).default('hourly')
  })
})

const connectCalendarSchema = z.object({
  propertyId: z.string(),
  providerType: z.enum(['google', 'outlook', 'apple', 'ical']),
  calendarId: z.string(),
  syncDirection: z.enum(['two_way', 'import_only', 'export_only']).default('two_way'),
  eventTypes: z.array(z.enum(['reservations', 'maintenance', 'staff_schedule', 'custom'])),
  credentials: z.object({
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    tenantId: z.string().optional(),
    icalUrl: z.string().url().optional()
  })
})

const connectAccountingSchema = z.object({
  propertyId: z.string(),
  systemName: z.enum(['quickbooks', 'xero', 'sage', 'wave', 'zoho_books', 'custom']),
  credentials: z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    realmId: z.string().optional(),
    tenantId: z.string().optional(),
    apiUrl: z.string().url().optional()
  }),
  syncSettings: z.object({
    syncInvoices: z.boolean().default(true),
    syncPayments: z.boolean().default(true),
    syncExpenses: z.boolean().default(false),
    syncCustomers: z.boolean().default(true),
    autoCreateInvoices: z.boolean().default(false),
    frequency: z.enum(['realtime', 'daily', 'weekly']).default('daily')
  }),
  chartOfAccounts: z.object({
    revenueAccount: z.string(),
    taxAccount: z.string(),
    depositAccount: z.string(),
    refundAccount: z.string()
  })
})

const connectCRMSchema = z.object({
  propertyId: z.string(),
  systemName: z.enum(['salesforce', 'hubspot', 'pipedrive', 'zoho_crm', 'custom']),
  credentials: z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    instanceUrl: z.string().url().optional(),
    apiKey: z.string().optional(),
    apiUrl: z.string().url().optional()
  }),
  syncSettings: z.object({
    syncContacts: z.boolean().default(true),
    syncLeads: z.boolean().default(false),
    syncOpportunities: z.boolean().default(false),
    createContactsFromGuests: z.boolean().default(true),
    frequency: z.enum(['realtime', 'daily']).default('daily')
  })
})

const connectReviewsSchema = z.object({
  propertyId: z.string(),
  platformName: z.enum(['tripadvisor', 'google_reviews', 'yelp', 'facebook', 'trustpilot']),
  credentials: z.object({
    apiKey: z.string().optional(),
    accessToken: z.string().optional(),
    businessId: z.string().optional(),
    locationId: z.string().optional()
  }),
  settings: z.object({
    autoResponseEnabled: z.boolean().default(false),
    responseTemplates: z.object({
      positive: z.string(),
      negative: z.string(),
      neutral: z.string()
    }),
    alertThreshold: z.number().min(1).max(5).default(3),
    monitorKeywords: z.array(z.string()).default([])
  })
})

// POST /api/os/integrations/connect - Connect external integrations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    const body = await request.json()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integrationType = body.type
    if (!integrationType) {
      return NextResponse.json({ error: 'Integration type is required' }, { status: 400 })
    }

    let result: { success: boolean; error?: string } = { success: false, error: 'Unknown integration type' }

    switch (integrationType) {
      case 'pms':
        try {
          const validatedData = connectPMSSchema.parse(body)
          const hasAccess = await validateOSAccess(session.user?.email, validatedData.propertyId)
          if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
          }

          const pmsConfig = {
            ...validatedData,
            fieldMapping: {
              guestFields: {},
              roomFields: {},
              reservationFields: {}
            },
            lastSync: new Date(),
            active: true
          }

          result = await ExternalIntegrationsService.connectPMS(pmsConfig)
        } catch (error) {
          if (error instanceof z.ZodError) {
            return NextResponse.json({
              error: 'Validation failed',
              details: error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
              }))
            }, { status: 400 })
          }
          throw error
        }
        break

      case 'calendar':
        try {
          const validatedData = connectCalendarSchema.parse(body)
          const hasAccess = await validateOSAccess(session.user?.email, validatedData.propertyId)
          if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
          }

          const calendarConfig = {
            ...validatedData,
            providerId: `${validatedData.providerType}-${Date.now()}`,
            settings: {
              createEvents: true,
              updateEvents: true,
              deleteEvents: true,
              syncPastEvents: false,
              lookAheadDays: 365
            },
            lastSync: new Date(),
            active: true
          }

          result = await ExternalIntegrationsService.connectCalendar(calendarConfig)
        } catch (error) {
          if (error instanceof z.ZodError) {
            return NextResponse.json({
              error: 'Validation failed',
              details: error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
              }))
            }, { status: 400 })
          }
          throw error
        }
        break

      case 'accounting':
        try {
          const validatedData = connectAccountingSchema.parse(body)
          const hasAccess = await validateOSAccess(session.user?.email, validatedData.propertyId)
          if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
          }

          const accountingConfig = {
            ...validatedData,
            lastSync: new Date(),
            active: true
          }

          result = await ExternalIntegrationsService.connectAccounting(accountingConfig)
        } catch (error) {
          if (error instanceof z.ZodError) {
            return NextResponse.json({
              error: 'Validation failed',
              details: error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
              }))
            }, { status: 400 })
          }
          throw error
        }
        break

      case 'crm':
        try {
          const validatedData = connectCRMSchema.parse(body)
          const hasAccess = await validateOSAccess(session.user?.email, validatedData.propertyId)
          if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
          }

          const crmConfig = {
            ...validatedData,
            fieldMapping: {
              contactFields: {},
              companyFields: {}
            },
            lastSync: new Date(),
            active: true
          }

          result = await ExternalIntegrationsService.connectCRM(crmConfig)
        } catch (error) {
          if (error instanceof z.ZodError) {
            return NextResponse.json({
              error: 'Validation failed',
              details: error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
              }))
            }, { status: 400 })
          }
          throw error
        }
        break

      case 'reviews':
        try {
          const validatedData = connectReviewsSchema.parse(body)
          const hasAccess = await validateOSAccess(session.user?.email, validatedData.propertyId)
          if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
          }

          const reviewConfig = {
            ...validatedData,
            lastSync: new Date(),
            active: true
          }

          result = await ExternalIntegrationsService.connectReviewPlatform(reviewConfig)
        } catch (error) {
          if (error instanceof z.ZodError) {
            return NextResponse.json({
              error: 'Validation failed',
              details: error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
              }))
            }, { status: 400 })
          }
          throw error
        }
        break
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${integrationType.toUpperCase()} integration connected successfully`
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Connection failed'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Connect integration API error:', error)
    return NextResponse.json(
      { error: 'Failed to connect integration' },
      { status: 500 }
    )
  }
}