import axios from 'axios'

export interface CRMCredentials {
  accessToken: string
  refreshToken?: string
  instanceUrl?: string
  apiKey?: string
  apiUrl?: string
  hubId?: string
  domain?: string
}

export interface Contact {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
  customFields?: { [key: string]: any }
  tags?: string[]
  source?: string
  lastActivity?: Date
}

export interface Lead {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  source?: string
  value?: number
  currency?: string
  description?: string
  assignedTo?: string
  propertyInterest?: string
  checkInDate?: Date
  checkOutDate?: Date
}

export interface Opportunity {
  id?: string
  name: string
  contactId: string
  amount?: number
  currency?: string
  stage: string
  probability?: number
  closeDate?: Date
  description?: string
  propertyId?: string
  reservationId?: string
}

export interface CRMSyncResult {
  success: boolean
  contactsCreated?: number
  leadsCreated?: number
  opportunitiesCreated?: number
  contactsUpdated?: number
  errors?: string[]
  externalIds?: { [localId: string]: string }
}

export class CRMIntegrationService {
  static async syncSalesforceContacts(
    credentials: CRMCredentials,
    contacts: Contact[]
  ): Promise<CRMSyncResult> {
    try {
      const result: CRMSyncResult = {
        success: true,
        errors: [],
        externalIds: {},
        contactsCreated: 0,
        contactsUpdated: 0
      }

      for (const contact of contacts) {
        try {
          const existingContact = await this.findSalesforceContact(credentials, contact.email)

          const salesforceContact = {
            FirstName: contact.firstName,
            LastName: contact.lastName,
            Email: contact.email,
            Phone: contact.phone,
            Account: contact.company ? { Name: contact.company } : undefined,
            MailingStreet: contact.address?.street,
            MailingCity: contact.address?.city,
            MailingState: contact.address?.state,
            MailingCountry: contact.address?.country,
            MailingPostalCode: contact.address?.postalCode,
            LeadSource: contact.source || 'Property Management System'
          }

          if (existingContact) {
            await axios.patch(
              `${credentials.instanceUrl}/services/data/v58.0/sobjects/Contact/${existingContact.id}`,
              salesforceContact,
              {
                headers: {
                  'Authorization': `Bearer ${credentials.accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            )
            result.contactsUpdated!++
            result.externalIds![contact.id || contact.email] = existingContact.id
          } else {
            const response = await axios.post(
              `${credentials.instanceUrl}/services/data/v58.0/sobjects/Contact`,
              salesforceContact,
              {
                headers: {
                  'Authorization': `Bearer ${credentials.accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            )
            result.contactsCreated!++
            result.externalIds![contact.id || contact.email] = response.data.id
          }
        } catch (error) {
          result.errors?.push(`Contact sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return result
    } catch (error) {
      return {
        success: false,
        errors: [`Salesforce sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async syncHubSpotContacts(
    credentials: CRMCredentials,
    contacts: Contact[]
  ): Promise<CRMSyncResult> {
    try {
      const result: CRMSyncResult = {
        success: true,
        errors: [],
        externalIds: {},
        contactsCreated: 0,
        contactsUpdated: 0
      }

      for (const contact of contacts) {
        try {
          const existingContact = await this.findHubSpotContact(credentials, contact.email)

          const hubspotContact = {
            properties: {
              firstname: contact.firstName,
              lastname: contact.lastName,
              email: contact.email,
              phone: contact.phone,
              company: contact.company,
              address: contact.address?.street,
              city: contact.address?.city,
              state: contact.address?.state,
              country: contact.address?.country,
              zip: contact.address?.postalCode,
              hs_lead_status: 'NEW',
              lifecyclestage: 'lead'
            }
          }

          if (existingContact) {
            await axios.patch(
              `https://api.hubapi.com/crm/v3/objects/contacts/${existingContact.id}`,
              hubspotContact,
              {
                headers: {
                  'Authorization': `Bearer ${credentials.accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            )
            result.contactsUpdated!++
            result.externalIds![contact.id || contact.email] = existingContact.id
          } else {
            const response = await axios.post(
              'https://api.hubapi.com/crm/v3/objects/contacts',
              hubspotContact,
              {
                headers: {
                  'Authorization': `Bearer ${credentials.accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            )
            result.contactsCreated!++
            result.externalIds![contact.id || contact.email] = response.data.id
          }
        } catch (error) {
          result.errors?.push(`Contact sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return result
    } catch (error) {
      return {
        success: false,
        errors: [`HubSpot sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async syncPipedriveContacts(
    credentials: CRMCredentials,
    contacts: Contact[]
  ): Promise<CRMSyncResult> {
    try {
      const result: CRMSyncResult = {
        success: true,
        errors: [],
        externalIds: {},
        contactsCreated: 0,
        contactsUpdated: 0
      }

      for (const contact of contacts) {
        try {
          const existingContact = await this.findPipedriveContact(credentials, contact.email)

          const pipedriveContact = {
            name: `${contact.firstName} ${contact.lastName}`,
            email: [{ value: contact.email, primary: true }],
            phone: contact.phone ? [{ value: contact.phone, primary: true }] : undefined,
            org_name: contact.company
          }

          if (existingContact) {
            await axios.put(
              `${credentials.apiUrl || 'https://api.pipedrive.com'}/v1/persons/${existingContact.id}?api_token=${credentials.apiKey}`,
              pipedriveContact,
              {
                headers: { 'Content-Type': 'application/json' }
              }
            )
            result.contactsUpdated!++
            result.externalIds![contact.id || contact.email] = existingContact.id
          } else {
            const response = await axios.post(
              `${credentials.apiUrl || 'https://api.pipedrive.com'}/v1/persons?api_token=${credentials.apiKey}`,
              pipedriveContact,
              {
                headers: { 'Content-Type': 'application/json' }
              }
            )
            result.contactsCreated!++
            result.externalIds![contact.id || contact.email] = response.data.data.id.toString()
          }
        } catch (error) {
          result.errors?.push(`Contact sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return result
    } catch (error) {
      return {
        success: false,
        errors: [`Pipedrive sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async createLeadsFromInquiries(
    systemName: 'salesforce' | 'hubspot' | 'pipedrive',
    credentials: CRMCredentials,
    inquiries: Array<{
      firstName: string
      lastName: string
      email: string
      phone?: string
      propertyInterest: string
      checkInDate: Date
      checkOutDate: Date
      message?: string
      source?: string
    }>
  ): Promise<CRMSyncResult> {
    switch (systemName) {
      case 'salesforce':
        return await this.createSalesforceLeads(credentials, inquiries)
      case 'hubspot':
        return await this.createHubSpotDeals(credentials, inquiries)
      case 'pipedrive':
        return await this.createPipedriveDeals(credentials, inquiries)
      default:
        return {
          success: false,
          errors: ['Unsupported CRM system']
        }
    }
  }

  private static async createSalesforceLeads(
    credentials: CRMCredentials,
    inquiries: any[]
  ): Promise<CRMSyncResult> {
    const result: CRMSyncResult = {
      success: true,
      errors: [],
      leadsCreated: 0
    }

    for (const inquiry of inquiries) {
      try {
        const salesforceLead = {
          FirstName: inquiry.firstName,
          LastName: inquiry.lastName,
          Email: inquiry.email,
          Phone: inquiry.phone,
          Company: inquiry.propertyInterest,
          Status: 'Open - Not Contacted',
          LeadSource: inquiry.source || 'Website',
          Description: `Property Interest: ${inquiry.propertyInterest}\nCheck-in: ${inquiry.checkInDate.toDateString()}\nCheck-out: ${inquiry.checkOutDate.toDateString()}\n${inquiry.message || ''}`
        }

        await axios.post(
          `${credentials.instanceUrl}/services/data/v58.0/sobjects/Lead`,
          salesforceLead,
          {
            headers: {
              'Authorization': `Bearer ${credentials.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        result.leadsCreated!++
      } catch (error) {
        result.errors?.push(`Lead creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  private static async createHubSpotDeals(
    credentials: CRMCredentials,
    inquiries: any[]
  ): Promise<CRMSyncResult> {
    const result: CRMSyncResult = {
      success: true,
      errors: [],
      leadsCreated: 0
    }

    for (const inquiry of inquiries) {
      try {
        const contact = await this.findOrCreateHubSpotContact(credentials, {
          firstName: inquiry.firstName,
          lastName: inquiry.lastName,
          email: inquiry.email,
          phone: inquiry.phone
        })

        const hubspotDeal = {
          properties: {
            dealname: `${inquiry.propertyInterest} - ${inquiry.firstName} ${inquiry.lastName}`,
            dealstage: 'appointmentscheduled',
            pipeline: 'default',
            hubspot_owner_id: null,
            amount: null,
            dealtype: 'newbusiness',
            description: `Property Interest: ${inquiry.propertyInterest}\nCheck-in: ${inquiry.checkInDate.toDateString()}\nCheck-out: ${inquiry.checkOutDate.toDateString()}\n${inquiry.message || ''}`
          },
          associations: [{
            to: { id: contact.id },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]
          }]
        }

        await axios.post(
          'https://api.hubapi.com/crm/v3/objects/deals',
          hubspotDeal,
          {
            headers: {
              'Authorization': `Bearer ${credentials.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        result.leadsCreated!++
      } catch (error) {
        result.errors?.push(`Deal creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  private static async createPipedriveDeals(
    credentials: CRMCredentials,
    inquiries: any[]
  ): Promise<CRMSyncResult> {
    const result: CRMSyncResult = {
      success: true,
      errors: [],
      leadsCreated: 0
    }

    for (const inquiry of inquiries) {
      try {
        const person = await this.findOrCreatePipedrivePerson(credentials, {
          firstName: inquiry.firstName,
          lastName: inquiry.lastName,
          email: inquiry.email,
          phone: inquiry.phone
        })

        const pipedriveDeal = {
          title: `${inquiry.propertyInterest} - ${inquiry.firstName} ${inquiry.lastName}`,
          person_id: person.id,
          stage_id: 1,
          status: 'open',
          expected_close_date: inquiry.checkInDate.toISOString().split('T')[0],
          notes: `Property Interest: ${inquiry.propertyInterest}\nCheck-in: ${inquiry.checkInDate.toDateString()}\nCheck-out: ${inquiry.checkOutDate.toDateString()}\n${inquiry.message || ''}`
        }

        await axios.post(
          `${credentials.apiUrl || 'https://api.pipedrive.com'}/v1/deals?api_token=${credentials.apiKey}`,
          pipedriveDeal,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        )

        result.leadsCreated!++
      } catch (error) {
        result.errors?.push(`Deal creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  private static async findSalesforceContact(
    credentials: CRMCredentials,
    email: string
  ): Promise<{ id: string } | null> {
    try {
      const response = await axios.get(
        `${credentials.instanceUrl}/services/data/v58.0/query?q=SELECT Id FROM Contact WHERE Email='${email}' LIMIT 1`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`
          }
        }
      )

      return response.data.records?.[0] || null
    } catch (error) {
      return null
    }
  }

  private static async findHubSpotContact(
    credentials: CRMCredentials,
    email: string
  ): Promise<{ id: string } | null> {
    try {
      const response = await axios.get(
        `https://api.hubapi.com/crm/v3/objects/contacts/${email}?idProperty=email`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`
          }
        }
      )

      return { id: response.data.id }
    } catch (error) {
      return null
    }
  }

  private static async findPipedriveContact(
    credentials: CRMCredentials,
    email: string
  ): Promise<{ id: string } | null> {
    try {
      const response = await axios.get(
        `${credentials.apiUrl || 'https://api.pipedrive.com'}/v1/persons/search?term=${email}&fields=email&api_token=${credentials.apiKey}`,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      )

      return response.data.data?.items?.[0]?.item || null
    } catch (error) {
      return null
    }
  }

  private static async findOrCreateHubSpotContact(
    credentials: CRMCredentials,
    contact: { firstName: string; lastName: string; email: string; phone?: string }
  ): Promise<{ id: string }> {
    const existing = await this.findHubSpotContact(credentials, contact.email)
    if (existing) return existing

    const response = await axios.post(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      {
        properties: {
          firstname: contact.firstName,
          lastname: contact.lastName,
          email: contact.email,
          phone: contact.phone
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return { id: response.data.id }
  }

  private static async findOrCreatePipedrivePerson(
    credentials: CRMCredentials,
    contact: { firstName: string; lastName: string; email: string; phone?: string }
  ): Promise<{ id: string }> {
    const existing = await this.findPipedriveContact(credentials, contact.email)
    if (existing) return existing

    const response = await axios.post(
      `${credentials.apiUrl || 'https://api.pipedrive.com'}/v1/persons?api_token=${credentials.apiKey}`,
      {
        name: `${contact.firstName} ${contact.lastName}`,
        email: [{ value: contact.email, primary: true }],
        phone: contact.phone ? [{ value: contact.phone, primary: true }] : undefined
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    )

    return { id: response.data.data.id.toString() }
  }

  static async trackGuestLifecycle(
    systemName: 'salesforce' | 'hubspot' | 'pipedrive',
    credentials: CRMCredentials,
    guestActivities: Array<{
      guestEmail: string
      activityType: 'booking_created' | 'check_in' | 'check_out' | 'review_left' | 'inquiry_made' | 'cancellation'
      propertyId: string
      reservationId?: string
      timestamp: Date
      details?: any
    }>
  ): Promise<CRMSyncResult> {
    const result: CRMSyncResult = {
      success: true,
      errors: [],
      contactsUpdated: 0
    }

    for (const activity of guestActivities) {
      try {
        switch (systemName) {
          case 'salesforce':
            await this.createSalesforceActivity(credentials, activity)
            break
          case 'hubspot':
            await this.createHubSpotActivity(credentials, activity)
            break
          case 'pipedrive':
            await this.createPipedriveActivity(credentials, activity)
            break
        }
        result.contactsUpdated!++
      } catch (error) {
        result.errors?.push(`Activity tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  private static async createSalesforceActivity(
    credentials: CRMCredentials,
    activity: any
  ): Promise<void> {
    const contact = await this.findSalesforceContact(credentials, activity.guestEmail)
    if (!contact) return

    const salesforceTask = {
      Subject: `Guest ${activity.activityType.replace('_', ' ')} - Property ${activity.propertyId}`,
      Status: 'Completed',
      Priority: 'Normal',
      WhoId: contact.id,
      ActivityDate: activity.timestamp.toISOString().split('T')[0],
      Description: `Activity: ${activity.activityType}\nProperty: ${activity.propertyId}\nReservation: ${activity.reservationId || 'N/A'}\nDetails: ${JSON.stringify(activity.details || {})}`
    }

    await axios.post(
      `${credentials.instanceUrl}/services/data/v58.0/sobjects/Task`,
      salesforceTask,
      {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
  }

  private static async createHubSpotActivity(
    credentials: CRMCredentials,
    activity: any
  ): Promise<void> {
    const contact = await this.findHubSpotContact(credentials, activity.guestEmail)
    if (!contact) return

    const hubspotEngagement = {
      engagement: {
        active: true,
        type: 'NOTE',
        timestamp: activity.timestamp.getTime()
      },
      associations: {
        contactIds: [contact.id]
      },
      metadata: {
        body: `Guest ${activity.activityType.replace('_', ' ')} - Property ${activity.propertyId}\n\nReservation: ${activity.reservationId || 'N/A'}\nDetails: ${JSON.stringify(activity.details || {}, null, 2)}`
      }
    }

    await axios.post(
      'https://api.hubapi.com/engagements/v1/engagements',
      hubspotEngagement,
      {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
  }

  private static async createPipedriveActivity(
    credentials: CRMCredentials,
    activity: any
  ): Promise<void> {
    const contact = await this.findPipedriveContact(credentials, activity.guestEmail)
    if (!contact) return

    const pipedriveActivity = {
      subject: `Guest ${activity.activityType.replace('_', ' ')} - Property ${activity.propertyId}`,
      type: 'call',
      done: 1,
      person_id: contact.id,
      due_date: activity.timestamp.toISOString().split('T')[0],
      note: `Activity: ${activity.activityType}\nProperty: ${activity.propertyId}\nReservation: ${activity.reservationId || 'N/A'}\nDetails: ${JSON.stringify(activity.details || {})}`
    }

    await axios.post(
      `${credentials.apiUrl || 'https://api.pipedrive.com'}/v1/activities?api_token=${credentials.apiKey}`,
      pipedriveActivity,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  static async syncReservationToCRM(
    systemName: 'salesforce' | 'hubspot' | 'pipedrive',
    credentials: CRMCredentials,
    reservations: Array<{
      id: string
      guestEmail: string
      guestName: string
      propertyName: string
      checkIn: Date
      checkOut: Date
      totalAmount: number
      currency: string
      status: string
      roomType: string
    }>
  ): Promise<CRMSyncResult> {
    const result: CRMSyncResult = {
      success: true,
      errors: [],
      opportunitiesCreated: 0
    }

    for (const reservation of reservations) {
      try {
        switch (systemName) {
          case 'salesforce':
            await this.createSalesforceOpportunity(credentials, reservation)
            break
          case 'hubspot':
            await this.createHubSpotDeal(credentials, reservation)
            break
          case 'pipedrive':
            await this.createPipedriveDeal(credentials, reservation)
            break
        }
        result.opportunitiesCreated!++
      } catch (error) {
        result.errors?.push(`Opportunity sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  private static async createSalesforceOpportunity(
    credentials: CRMCredentials,
    reservation: any
  ): Promise<void> {
    const contact = await this.findSalesforceContact(credentials, reservation.guestEmail)
    if (!contact) return

    const opportunity = {
      Name: `${reservation.propertyName} - ${reservation.guestName}`,
      StageName: reservation.status === 'confirmed' ? 'Closed Won' : 'Proposal/Price Quote',
      CloseDate: reservation.checkOut.toISOString().split('T')[0],
      Amount: reservation.totalAmount,
      ContactId: contact.id,
      Description: `Reservation ID: ${reservation.id}\nProperty: ${reservation.propertyName}\nRoom Type: ${reservation.roomType}\nCheck-in: ${reservation.checkIn.toDateString()}\nCheck-out: ${reservation.checkOut.toDateString()}`
    }

    await axios.post(
      `${credentials.instanceUrl}/services/data/v58.0/sobjects/Opportunity`,
      opportunity,
      {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
  }

  private static async createHubSpotDeal(
    credentials: CRMCredentials,
    reservation: any
  ): Promise<void> {
    const contact = await this.findHubSpotContact(credentials, reservation.guestEmail)
    if (!contact) return

    const deal = {
      properties: {
        dealname: `${reservation.propertyName} - ${reservation.guestName}`,
        dealstage: reservation.status === 'confirmed' ? 'closedwon' : 'qualifiedtobuy',
        pipeline: 'default',
        amount: reservation.totalAmount.toString(),
        closedate: reservation.checkOut.toISOString(),
        description: `Reservation ID: ${reservation.id}\nProperty: ${reservation.propertyName}\nRoom Type: ${reservation.roomType}\nCheck-in: ${reservation.checkIn.toDateString()}\nCheck-out: ${reservation.checkOut.toDateString()}`
      },
      associations: [{
        to: { id: contact.id },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]
      }]
    }

    await axios.post(
      'https://api.hubapi.com/crm/v3/objects/deals',
      deal,
      {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
  }

  private static async createPipedriveDeal(
    credentials: CRMCredentials,
    reservation: any
  ): Promise<void> {
    const contact = await this.findPipedriveContact(credentials, reservation.guestEmail)
    if (!contact) return

    const deal = {
      title: `${reservation.propertyName} - ${reservation.guestName}`,
      person_id: contact.id,
      value: reservation.totalAmount,
      currency: reservation.currency,
      stage_id: reservation.status === 'confirmed' ? 5 : 3, // Won or In Progress
      status: reservation.status === 'confirmed' ? 'won' : 'open',
      expected_close_date: reservation.checkOut.toISOString().split('T')[0],
      notes: `Reservation ID: ${reservation.id}\nProperty: ${reservation.propertyName}\nRoom Type: ${reservation.roomType}\nCheck-in: ${reservation.checkIn.toDateString()}\nCheck-out: ${reservation.checkOut.toDateString()}`
    }

    await axios.post(
      `${credentials.apiUrl || 'https://api.pipedrive.com'}/v1/deals?api_token=${credentials.apiKey}`,
      deal,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  static async segmentGuests(
    systemName: 'salesforce' | 'hubspot' | 'pipedrive',
    credentials: CRMCredentials,
    segmentationRules: Array<{
      name: string
      criteria: {
        totalBookings?: { min?: number; max?: number }
        totalSpent?: { min?: number; max?: number; currency?: string }
        lastBookingDays?: number
        preferredProperties?: string[]
        roomTypes?: string[]
        bookingSource?: string[]
      }
      tags?: string[]
    }>
  ): Promise<{
    success: boolean
    segmentsProcessed: number
    contactsSegmented: number
    errors?: string[]
  }> {
    const result = {
      success: true,
      segmentsProcessed: 0,
      contactsSegmented: 0,
      errors: [] as string[]
    }

    for (const segment of segmentationRules) {
      try {
        switch (systemName) {
          case 'hubspot':
            await this.createHubSpotList(credentials, segment)
            break
          case 'salesforce':
            await this.createSalesforceReport(credentials, segment)
            break
          case 'pipedrive':
            await this.tagPipedriveContacts(credentials, segment)
            break
        }
        result.segmentsProcessed++
      } catch (error) {
        result.errors.push(`Segmentation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  private static async createHubSpotList(
    credentials: CRMCredentials,
    segment: any
  ): Promise<void> {
    const listData = {
      name: segment.name,
      dynamic: true,
      filters: this.buildHubSpotFilters(segment.criteria)
    }

    await axios.post(
      'https://api.hubapi.com/contacts/v1/lists',
      listData,
      {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
  }

  private static buildHubSpotFilters(criteria: any): any[] {
    const filters = []

    if (criteria.totalSpent?.min) {
      filters.push({
        operator: 'GTE',
        property: 'total_revenue',
        value: criteria.totalSpent.min
      })
    }

    if (criteria.lastBookingDays) {
      filters.push({
        operator: 'LT',
        property: 'last_booking_date',
        value: new Date(Date.now() - criteria.lastBookingDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
    }

    return filters
  }

  private static async createSalesforceReport(credentials: CRMCredentials, segment: any): Promise<void> {
    console.log(`Creating Salesforce report for segment: ${segment.name}`)
  }

  private static async tagPipedriveContacts(credentials: CRMCredentials, segment: any): Promise<void> {
    console.log(`Tagging Pipedrive contacts for segment: ${segment.name}`)
  }

  static async generateCRMReport(
    systemName: 'salesforce' | 'hubspot' | 'pipedrive',
    credentials: CRMCredentials,
    reportType: 'guest_lifecycle' | 'revenue_analysis' | 'lead_conversion' | 'booking_trends',
    dateRange: { start: Date; end: Date }
  ): Promise<{
    success: boolean
    report?: any
    error?: string
  }> {
    try {
      switch (systemName) {
        case 'salesforce':
          return await this.generateSalesforceReport(credentials, reportType, dateRange)
        case 'hubspot':
          return await this.generateHubSpotReport(credentials, reportType, dateRange)
        case 'pipedrive':
          return await this.generatePipedriveReport(credentials, reportType, dateRange)
        default:
          return { success: false, error: 'Unsupported CRM system' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed'
      }
    }
  }

  private static async generateSalesforceReport(
    credentials: CRMCredentials,
    reportType: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{ success: boolean; report?: any; error?: string }> {
    try {
      const reportQuery = this.buildSalesforceQuery(reportType, dateRange)
      const response = await axios.get(
        `${credentials.instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent(reportQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`
          }
        }
      )

      return { success: true, report: response.data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed'
      }
    }
  }

  private static buildSalesforceQuery(reportType: string, dateRange: { start: Date; end: Date }): string {
    const startDate = dateRange.start.toISOString().split('T')[0]
    const endDate = dateRange.end.toISOString().split('T')[0]

    switch (reportType) {
      case 'guest_lifecycle':
        return `SELECT Id, Name, Email, CreatedDate, LastActivityDate FROM Contact WHERE CreatedDate >= ${startDate} AND CreatedDate <= ${endDate}`
      case 'revenue_analysis':
        return `SELECT SUM(Amount), COUNT(Id), CALENDAR_MONTH(CloseDate) FROM Opportunity WHERE CloseDate >= ${startDate} AND CloseDate <= ${endDate} AND IsWon = true GROUP BY CALENDAR_MONTH(CloseDate)`
      default:
        return `SELECT Id, Name FROM Contact LIMIT 10`
    }
  }

  private static async generateHubSpotReport(
    credentials: CRMCredentials,
    reportType: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{ success: boolean; report?: any; error?: string }> {
    try {
      const response = await axios.get(
        `https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,createdate,lastmodifieddate`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`
          }
        }
      )

      return { success: true, report: response.data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed'
      }
    }
  }

  private static async generatePipedriveReport(
    credentials: CRMCredentials,
    reportType: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{ success: boolean; report?: any; error?: string }> {
    try {
      const response = await axios.get(
        `${credentials.apiUrl || 'https://api.pipedrive.com'}/v1/deals?start=0&limit=100&api_token=${credentials.apiKey}`
      )

      return { success: true, report: response.data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed'
      }
    }
  }

  static async validateCredentials(
    systemName: 'salesforce' | 'hubspot' | 'pipedrive',
    credentials: CRMCredentials
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      switch (systemName) {
        case 'salesforce':
          await axios.get(
            `${credentials.instanceUrl}/services/data/v58.0/sobjects/`,
            {
              headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
            }
          )
          return { valid: true }

        case 'hubspot':
          await axios.get(
            'https://api.hubapi.com/crm/v3/objects/contacts?limit=1',
            {
              headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
            }
          )
          return { valid: true }

        case 'pipedrive':
          await axios.get(
            `${credentials.apiUrl || 'https://api.pipedrive.com'}/v1/users/me?api_token=${credentials.apiKey}`
          )
          return { valid: true }

        default:
          return { valid: false, error: 'Unsupported CRM system' }
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      }
    }
  }
}