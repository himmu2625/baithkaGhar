import { google } from 'googleapis'
import { Client } from '@microsoft/microsoft-graph-client'
import axios from 'axios'

export interface CalendarEvent {
  id?: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  attendees?: string[]
  allDay?: boolean
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    interval: number
    endDate?: Date
  }
}

export interface CalendarCredentials {
  accessToken: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
  tenantId?: string
  icalUrl?: string
}

export interface CalendarSyncResult {
  success: boolean
  eventsImported?: number
  eventsExported?: number
  errors?: string[]
}

export class CalendarSyncService {
  static async syncGoogleCalendar(
    calendarId: string,
    credentials: CalendarCredentials,
    events: CalendarEvent[],
    syncDirection: 'import' | 'export' | 'two_way' = 'two_way'
  ): Promise<CalendarSyncResult> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        credentials.clientId,
        credentials.clientSecret
      )

      oauth2Client.setCredentials({
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken
      })

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
      const result: CalendarSyncResult = { success: true, errors: [] }

      if (syncDirection === 'import' || syncDirection === 'two_way') {
        try {
          const response = await calendar.events.list({
            calendarId: calendarId,
            timeMin: new Date().toISOString(),
            maxResults: 2500,
            singleEvents: true,
            orderBy: 'startTime'
          })

          result.eventsImported = response.data.items?.length || 0
        } catch (error) {
          result.errors?.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      if (syncDirection === 'export' || syncDirection === 'two_way') {
        let exportCount = 0
        for (const event of events) {
          try {
            const googleEvent = {
              summary: event.title,
              description: event.description,
              location: event.location,
              start: {
                dateTime: event.startTime.toISOString(),
                timeZone: 'UTC'
              },
              end: {
                dateTime: event.endTime.toISOString(),
                timeZone: 'UTC'
              },
              attendees: event.attendees?.map(email => ({ email })),
              recurrence: event.recurrence ? [
                `RRULE:FREQ=${event.recurrence.frequency.toUpperCase()};INTERVAL=${event.recurrence.interval}${
                  event.recurrence.endDate ? `;UNTIL=${event.recurrence.endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z` : ''
                }`
              ] : undefined
            }

            if (event.id) {
              await calendar.events.update({
                calendarId: calendarId,
                eventId: event.id,
                requestBody: googleEvent
              })
            } else {
              await calendar.events.insert({
                calendarId: calendarId,
                requestBody: googleEvent
              })
            }
            exportCount++
          } catch (error) {
            result.errors?.push(`Export event failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
        result.eventsExported = exportCount
      }

      return result
    } catch (error) {
      return {
        success: false,
        errors: [`Google Calendar sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async syncOutlookCalendar(
    calendarId: string,
    credentials: CalendarCredentials,
    events: CalendarEvent[],
    syncDirection: 'import' | 'export' | 'two_way' = 'two_way'
  ): Promise<CalendarSyncResult> {
    try {
      const graphClient = Client.init({
        authProvider: {
          getAccessToken: async () => credentials.accessToken
        }
      })

      const result: CalendarSyncResult = { success: true, errors: [] }

      if (syncDirection === 'import' || syncDirection === 'two_way') {
        try {
          const calendarEvents = await graphClient
            .api(`/me/calendars/${calendarId}/events`)
            .filter(`start/dateTime ge '${new Date().toISOString()}'`)
            .top(2500)
            .get()

          result.eventsImported = calendarEvents.value?.length || 0
        } catch (error) {
          result.errors?.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      if (syncDirection === 'export' || syncDirection === 'two_way') {
        let exportCount = 0
        for (const event of events) {
          try {
            const outlookEvent = {
              subject: event.title,
              body: {
                contentType: 'text',
                content: event.description || ''
              },
              location: {
                displayName: event.location || ''
              },
              start: {
                dateTime: event.startTime.toISOString(),
                timeZone: 'UTC'
              },
              end: {
                dateTime: event.endTime.toISOString(),
                timeZone: 'UTC'
              },
              attendees: event.attendees?.map(email => ({
                emailAddress: { address: email, name: email }
              })),
              isAllDay: event.allDay || false,
              recurrence: event.recurrence ? {
                pattern: {
                  type: event.recurrence.frequency,
                  interval: event.recurrence.interval
                },
                range: {
                  type: event.recurrence.endDate ? 'endDate' : 'noEnd',
                  startDate: event.startTime.toISOString().split('T')[0],
                  endDate: event.recurrence.endDate?.toISOString().split('T')[0]
                }
              } : undefined
            }

            if (event.id) {
              await graphClient
                .api(`/me/calendars/${calendarId}/events/${event.id}`)
                .update(outlookEvent)
            } else {
              await graphClient
                .api(`/me/calendars/${calendarId}/events`)
                .post(outlookEvent)
            }
            exportCount++
          } catch (error) {
            result.errors?.push(`Export event failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
        result.eventsExported = exportCount
      }

      return result
    } catch (error) {
      return {
        success: false,
        errors: [`Outlook Calendar sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async syncICalCalendar(
    icalUrl: string,
    events: CalendarEvent[],
    syncDirection: 'import' | 'export' = 'import'
  ): Promise<CalendarSyncResult> {
    try {
      if (syncDirection === 'export') {
        return {
          success: false,
          errors: ['iCal export not supported - read-only format']
        }
      }

      const response = await axios.get(icalUrl, {
        headers: { 'User-Agent': 'BaithakaGHAR/1.0' },
        timeout: 30000
      })

      const icalData = response.data
      const eventCount = (icalData.match(/BEGIN:VEVENT/g) || []).length

      return {
        success: true,
        eventsImported: eventCount
      }
    } catch (error) {
      return {
        success: false,
        errors: [`iCal sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async createReservationEvents(
    reservations: Array<{
      id: string
      guestName: string
      roomNumber: string
      checkIn: Date
      checkOut: Date
      propertyName: string
    }>,
    calendarConfig: {
      providerType: 'google' | 'outlook' | 'ical'
      calendarId: string
      credentials: CalendarCredentials
    }
  ): Promise<CalendarSyncResult> {
    const events: CalendarEvent[] = reservations.map(reservation => ({
      id: `reservation_${reservation.id}`,
      title: `${reservation.guestName} - Room ${reservation.roomNumber}`,
      description: `Guest: ${reservation.guestName}\nRoom: ${reservation.roomNumber}\nProperty: ${reservation.propertyName}`,
      startTime: reservation.checkIn,
      endTime: reservation.checkOut,
      location: reservation.propertyName,
      allDay: true
    }))

    switch (calendarConfig.providerType) {
      case 'google':
        return await this.syncGoogleCalendar(
          calendarConfig.calendarId,
          calendarConfig.credentials,
          events,
          'export'
        )
      case 'outlook':
        return await this.syncOutlookCalendar(
          calendarConfig.calendarId,
          calendarConfig.credentials,
          events,
          'export'
        )
      default:
        return {
          success: false,
          errors: ['Unsupported calendar provider for event creation']
        }
    }
  }

  static async syncMaintenanceSchedule(
    maintenanceItems: Array<{
      id: string
      title: string
      description?: string
      scheduledDate: Date
      estimatedDuration: number
      roomNumber?: string
      propertyName: string
    }>,
    calendarConfig: {
      providerType: 'google' | 'outlook'
      calendarId: string
      credentials: CalendarCredentials
    }
  ): Promise<CalendarSyncResult> {
    const events: CalendarEvent[] = maintenanceItems.map(item => ({
      id: `maintenance_${item.id}`,
      title: `Maintenance: ${item.title}`,
      description: `${item.description || ''}\n${item.roomNumber ? `Room: ${item.roomNumber}\n` : ''}Property: ${item.propertyName}`,
      startTime: item.scheduledDate,
      endTime: new Date(item.scheduledDate.getTime() + item.estimatedDuration * 60 * 1000),
      location: `${item.propertyName}${item.roomNumber ? ` - Room ${item.roomNumber}` : ''}`
    }))

    switch (calendarConfig.providerType) {
      case 'google':
        return await this.syncGoogleCalendar(
          calendarConfig.calendarId,
          calendarConfig.credentials,
          events,
          'export'
        )
      case 'outlook':
        return await this.syncOutlookCalendar(
          calendarConfig.calendarId,
          calendarConfig.credentials,
          events,
          'export'
        )
      default:
        return {
          success: false,
          errors: ['Unsupported calendar provider']
        }
    }
  }

  static async syncStaffSchedule(
    staffSchedule: Array<{
      id: string
      staffName: string
      staffEmail?: string
      shift: {
        startTime: Date
        endTime: Date
        role: string
        department: string
      }
      propertyName: string
    }>,
    calendarConfig: {
      providerType: 'google' | 'outlook'
      calendarId: string
      credentials: CalendarCredentials
    }
  ): Promise<CalendarSyncResult> {
    const events: CalendarEvent[] = staffSchedule.map(schedule => ({
      id: `staff_${schedule.id}`,
      title: `${schedule.shift.role} - ${schedule.staffName}`,
      description: `Staff: ${schedule.staffName}\nRole: ${schedule.shift.role}\nDepartment: ${schedule.shift.department}\nProperty: ${schedule.propertyName}`,
      startTime: schedule.shift.startTime,
      endTime: schedule.shift.endTime,
      location: schedule.propertyName,
      attendees: schedule.staffEmail ? [schedule.staffEmail] : undefined
    }))

    switch (calendarConfig.providerType) {
      case 'google':
        return await this.syncGoogleCalendar(
          calendarConfig.calendarId,
          calendarConfig.credentials,
          events,
          'export'
        )
      case 'outlook':
        return await this.syncOutlookCalendar(
          calendarConfig.calendarId,
          calendarConfig.credentials,
          events,
          'export'
        )
      default:
        return {
          success: false,
          errors: ['Unsupported calendar provider']
        }
    }
  }

  static async syncHousekeepingTasks(
    housekeepingTasks: Array<{
      id: string
      taskType: string
      roomNumber: string
      assignedTo?: string
      assignedEmail?: string
      scheduledStart: Date
      estimatedDuration: number
      priority: 'low' | 'medium' | 'high'
      propertyName: string
    }>,
    calendarConfig: {
      providerType: 'google' | 'outlook'
      calendarId: string
      credentials: CalendarCredentials
    }
  ): Promise<CalendarSyncResult> {
    const events: CalendarEvent[] = housekeepingTasks.map(task => ({
      id: `housekeeping_${task.id}`,
      title: `${task.taskType} - Room ${task.roomNumber}`,
      description: `Task: ${task.taskType}\nRoom: ${task.roomNumber}\n${task.assignedTo ? `Assigned to: ${task.assignedTo}\n` : ''}Priority: ${task.priority}\nProperty: ${task.propertyName}`,
      startTime: task.scheduledStart,
      endTime: new Date(task.scheduledStart.getTime() + task.estimatedDuration * 60 * 1000),
      location: `${task.propertyName} - Room ${task.roomNumber}`,
      attendees: task.assignedEmail ? [task.assignedEmail] : undefined
    }))

    switch (calendarConfig.providerType) {
      case 'google':
        return await this.syncGoogleCalendar(
          calendarConfig.calendarId,
          calendarConfig.credentials,
          events,
          'export'
        )
      case 'outlook':
        return await this.syncOutlookCalendar(
          calendarConfig.calendarId,
          calendarConfig.credentials,
          events,
          'export'
        )
      default:
        return {
          success: false,
          errors: ['Unsupported calendar provider']
        }
    }
  }

  static async syncCheckInCheckOutSchedule(
    checkInOuts: Array<{
      reservationId: string
      guestName: string
      roomNumber: string
      checkInTime: Date
      checkOutTime: Date
      propertyName: string
      specialRequests?: string
    }>,
    calendarConfig: {
      providerType: 'google' | 'outlook'
      calendarId: string
      credentials: CalendarCredentials
    }
  ): Promise<CalendarSyncResult> {
    const events: CalendarEvent[] = []

    checkInOuts.forEach(item => {
      events.push({
        id: `checkin_${item.reservationId}`,
        title: `Check-in: ${item.guestName} - Room ${item.roomNumber}`,
        description: `Guest: ${item.guestName}\nRoom: ${item.roomNumber}\nProperty: ${item.propertyName}${item.specialRequests ? `\nSpecial Requests: ${item.specialRequests}` : ''}`,
        startTime: item.checkInTime,
        endTime: new Date(item.checkInTime.getTime() + 15 * 60 * 1000),
        location: item.propertyName
      })

      events.push({
        id: `checkout_${item.reservationId}`,
        title: `Check-out: ${item.guestName} - Room ${item.roomNumber}`,
        description: `Guest: ${item.guestName}\nRoom: ${item.roomNumber}\nProperty: ${item.propertyName}`,
        startTime: item.checkOutTime,
        endTime: new Date(item.checkOutTime.getTime() + 15 * 60 * 1000),
        location: item.propertyName
      })
    })

    switch (calendarConfig.providerType) {
      case 'google':
        return await this.syncGoogleCalendar(
          calendarConfig.calendarId,
          calendarConfig.credentials,
          events,
          'export'
        )
      case 'outlook':
        return await this.syncOutlookCalendar(
          calendarConfig.calendarId,
          calendarConfig.credentials,
          events,
          'export'
        )
      default:
        return {
          success: false,
          errors: ['Unsupported calendar provider']
        }
    }
  }

  static async getCalendarAvailability(
    providerType: 'google' | 'outlook',
    credentials: CalendarCredentials,
    calendarId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<{
    success: boolean
    availableSlots?: Array<{ start: Date; end: Date }>
    busySlots?: Array<{ start: Date; end: Date }>
    error?: string
  }> {
    try {
      switch (providerType) {
        case 'google':
          const oauth2Client = new google.auth.OAuth2(
            credentials.clientId,
            credentials.clientSecret
          )
          oauth2Client.setCredentials({
            access_token: credentials.accessToken,
            refresh_token: credentials.refreshToken
          })

          const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
          const freebusy = await calendar.freebusy.query({
            requestBody: {
              timeMin: timeRange.start.toISOString(),
              timeMax: timeRange.end.toISOString(),
              items: [{ id: calendarId }]
            }
          })

          const busySlots = freebusy.data.calendars?.[calendarId]?.busy?.map(slot => ({
            start: new Date(slot.start!),
            end: new Date(slot.end!)
          })) || []

          return { success: true, busySlots }

        case 'outlook':
          const graphClient = Client.init({
            authProvider: {
              getAccessToken: async () => credentials.accessToken
            }
          })

          const freeBusy = await graphClient
            .api('/me/calendar/getSchedule')
            .post({
              schedules: [calendarId],
              startTime: {
                dateTime: timeRange.start.toISOString(),
                timeZone: 'UTC'
              },
              endTime: {
                dateTime: timeRange.end.toISOString(),
                timeZone: 'UTC'
              }
            })

          const busySlots = freeBusy.value?.[0]?.freeBusyViewType === 'busy'
            ? [{ start: timeRange.start, end: timeRange.end }]
            : []

          return { success: true, busySlots }

        default:
          return { success: false, error: 'Unsupported provider type' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get availability'
      }
    }
  }

  static async deleteCalendarEvent(
    providerType: 'google' | 'outlook',
    credentials: CalendarCredentials,
    calendarId: string,
    eventId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (providerType) {
        case 'google':
          const oauth2Client = new google.auth.OAuth2(
            credentials.clientId,
            credentials.clientSecret
          )
          oauth2Client.setCredentials({
            access_token: credentials.accessToken,
            refresh_token: credentials.refreshToken
          })

          const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
          await calendar.events.delete({
            calendarId: calendarId,
            eventId: eventId
          })

          return { success: true }

        case 'outlook':
          const graphClient = Client.init({
            authProvider: {
              getAccessToken: async () => credentials.accessToken
            }
          })

          await graphClient
            .api(`/me/calendars/${calendarId}/events/${eventId}`)
            .delete()

          return { success: true }

        default:
          return { success: false, error: 'Unsupported provider type' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete event'
      }
    }
  }

  static async validateCalendarAccess(
    providerType: 'google' | 'outlook' | 'ical',
    credentials: CalendarCredentials,
    calendarId?: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      switch (providerType) {
        case 'google':
          const oauth2Client = new google.auth.OAuth2(
            credentials.clientId,
            credentials.clientSecret
          )
          oauth2Client.setCredentials({
            access_token: credentials.accessToken,
            refresh_token: credentials.refreshToken
          })
          const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
          await calendar.calendarList.list()
          return { valid: true }

        case 'outlook':
          const graphClient = Client.init({
            authProvider: {
              getAccessToken: async () => credentials.accessToken
            }
          })
          await graphClient.api('/me/calendars').get()
          return { valid: true }

        case 'ical':
          if (!credentials.icalUrl) {
            return { valid: false, error: 'iCal URL is required' }
          }
          await axios.head(credentials.icalUrl, { timeout: 10000 })
          return { valid: true }

        default:
          return { valid: false, error: 'Unsupported provider type' }
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      }
    }
  }
}