import { connectToDatabase } from '@/lib/mongodb'
import { createBookingSchema } from '@/lib/validation/booking-validation'
import { z } from 'zod'

export interface MigrationResult {
  success: boolean
  totalRecords: number
  processedRecords: number
  successfulMigrations: number
  failedMigrations: number
  errors: MigrationError[]
  warnings: string[]
  duration: number
  timestamp: Date
}

export interface MigrationError {
  recordIndex: number
  recordId?: string
  error: string
  data?: any
}

export interface MigrationOptions {
  batchSize?: number
  dryRun?: boolean
  skipValidation?: boolean
  continueOnError?: boolean
  backupBeforeMigration?: boolean
  logProgress?: boolean
}

export interface LegacyBookingData {
  [key: string]: any
}

export class BookingMigrationManager {
  private errors: MigrationError[] = []
  private warnings: string[] = []
  private backupCollections: string[] = []

  async migrateFromLegacySystem(
    legacyData: LegacyBookingData[],
    options: MigrationOptions = {}
  ): Promise<MigrationResult> {
    const startTime = Date.now()
    const {
      batchSize = 100,
      dryRun = false,
      skipValidation = false,
      continueOnError = true,
      backupBeforeMigration = true,
      logProgress = true
    } = options

    this.errors = []
    this.warnings = []

    try {
      await connectToDatabase()

      if (logProgress) {
        console.log(`Starting migration of ${legacyData.length} records`)
      }

      // Create backup if requested
      if (backupBeforeMigration && !dryRun) {
        await this.createBackup()
      }

      let processedRecords = 0
      let successfulMigrations = 0
      let failedMigrations = 0

      // Process in batches
      for (let i = 0; i < legacyData.length; i += batchSize) {
        const batch = legacyData.slice(i, i + batchSize)

        if (logProgress) {
          console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(legacyData.length / batchSize)}`)
        }

        const batchResults = await this.processBatch(batch, i, {
          dryRun,
          skipValidation,
          continueOnError
        })

        processedRecords += batchResults.processed
        successfulMigrations += batchResults.successful
        failedMigrations += batchResults.failed

        // Small delay between batches to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const duration = Date.now() - startTime

      if (logProgress) {
        console.log(`Migration completed in ${duration}ms`)
        console.log(`Processed: ${processedRecords}, Successful: ${successfulMigrations}, Failed: ${failedMigrations}`)
      }

      return {
        success: failedMigrations === 0,
        totalRecords: legacyData.length,
        processedRecords,
        successfulMigrations,
        failedMigrations,
        errors: this.errors,
        warnings: this.warnings,
        duration,
        timestamp: new Date()
      }
    } catch (error) {
      const duration = Date.now() - startTime
      this.errors.push({
        recordIndex: -1,
        error: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })

      return {
        success: false,
        totalRecords: legacyData.length,
        processedRecords: 0,
        successfulMigrations: 0,
        failedMigrations: legacyData.length,
        errors: this.errors,
        warnings: this.warnings,
        duration,
        timestamp: new Date()
      }
    }
  }

  private async processBatch(
    batch: LegacyBookingData[],
    startIndex: number,
    options: {
      dryRun: boolean
      skipValidation: boolean
      continueOnError: boolean
    }
  ): Promise<{ processed: number; successful: number; failed: number }> {
    let processed = 0
    let successful = 0
    let failed = 0

    for (let i = 0; i < batch.length; i++) {
      const recordIndex = startIndex + i
      const legacyRecord = batch[i]

      try {
        processed++

        // Transform legacy data to new format
        const transformedData = await this.transformLegacyRecord(legacyRecord, recordIndex)

        // Validate if not skipped
        if (!options.skipValidation) {
          await this.validateTransformedData(transformedData, recordIndex)
        }

        // Save if not dry run
        if (!options.dryRun) {
          await this.saveBooking(transformedData, recordIndex)
        }

        successful++
      } catch (error) {
        failed++
        this.errors.push({
          recordIndex,
          recordId: legacyRecord.id || legacyRecord._id,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: legacyRecord
        })

        if (!options.continueOnError) {
          throw error
        }
      }
    }

    return { processed, successful, failed }
  }

  private async transformLegacyRecord(
    legacyData: LegacyBookingData,
    recordIndex: number
  ): Promise<any> {
    try {
      // Define common field mappings between legacy and new system
      const fieldMappings: Record<string, string> = {
        'guest_name': 'guestDetails.name',
        'guest_email': 'guestDetails.email',
        'guest_phone': 'guestDetails.phone',
        'check_in': 'dateFrom',
        'check_out': 'dateTo',
        'checkin_date': 'dateFrom',
        'checkout_date': 'dateTo',
        'arrival_date': 'dateFrom',
        'departure_date': 'dateTo',
        'guest_count': 'guests',
        'number_of_guests': 'guests',
        'total_price': 'totalAmount',
        'total_cost': 'totalAmount',
        'booking_amount': 'totalAmount',
        'special_requests': 'specialRequests',
        'notes': 'specialRequests',
        'booking_status': 'status',
        'payment_status': 'paymentStatus',
        'property_id': 'propertyId',
        'hotel_id': 'propertyId'
      }

      // Start with base booking structure
      const transformedBooking: any = {
        guestDetails: {},
        roomPreference: {}
      }

      // Apply field mappings
      Object.entries(legacyData).forEach(([legacyKey, value]) => {
        const newKey = fieldMappings[legacyKey.toLowerCase()] || legacyKey

        if (value !== null && value !== undefined && value !== '') {
          this.setNestedProperty(transformedBooking, newKey, value)
        }
      })

      // Transform and validate dates
      if (legacyData.check_in || legacyData.checkin_date || legacyData.arrival_date) {
        const checkInValue = legacyData.check_in || legacyData.checkin_date || legacyData.arrival_date
        transformedBooking.dateFrom = this.transformDate(checkInValue, recordIndex, 'check-in')
      }

      if (legacyData.check_out || legacyData.checkout_date || legacyData.departure_date) {
        const checkOutValue = legacyData.check_out || legacyData.checkout_date || legacyData.departure_date
        transformedBooking.dateTo = this.transformDate(checkOutValue, recordIndex, 'check-out')
      }

      // Transform guest details
      if (legacyData.guest_name || legacyData.guestName || legacyData.name) {
        transformedBooking.guestDetails.name = legacyData.guest_name || legacyData.guestName || legacyData.name
      }

      if (legacyData.guest_email || legacyData.guestEmail || legacyData.email) {
        transformedBooking.guestDetails.email = legacyData.guest_email || legacyData.guestEmail || legacyData.email
      }

      if (legacyData.guest_phone || legacyData.guestPhone || legacyData.phone) {
        transformedBooking.guestDetails.phone = legacyData.guest_phone || legacyData.guestPhone || legacyData.phone
      }

      // Transform status values
      if (legacyData.status || legacyData.booking_status) {
        const statusValue = legacyData.status || legacyData.booking_status
        transformedBooking.status = this.transformStatus(statusValue)
      }

      if (legacyData.payment_status || legacyData.paymentStatus) {
        const paymentStatusValue = legacyData.payment_status || legacyData.paymentStatus
        transformedBooking.paymentStatus = this.transformPaymentStatus(paymentStatusValue)
      }

      // Set defaults for required fields
      transformedBooking.guests = transformedBooking.guests || 1
      transformedBooking.children = transformedBooking.children || 0
      transformedBooking.rooms = transformedBooking.rooms || 1
      transformedBooking.status = transformedBooking.status || 'confirmed'
      transformedBooking.paymentStatus = transformedBooking.paymentStatus || 'pending'
      transformedBooking.source = transformedBooking.source || 'direct'

      // Add metadata about migration
      transformedBooking.migrationMetadata = {
        migratedAt: new Date(),
        originalId: legacyData.id || legacyData._id,
        legacySource: legacyData.source || 'unknown',
        recordIndex
      }

      return transformedBooking
    } catch (error) {
      throw new Error(`Failed to transform record at index ${recordIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private transformDate(dateValue: any, recordIndex: number, fieldName: string): string {
    if (!dateValue) {
      throw new Error(`Missing ${fieldName} date`)
    }

    let date: Date

    if (dateValue instanceof Date) {
      date = dateValue
    } else if (typeof dateValue === 'string') {
      // Try parsing various date formats
      const timestamp = Date.parse(dateValue)
      if (isNaN(timestamp)) {
        // Try common formats
        const formats = [
          /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
          /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
          /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
          /^\d{4}\/\d{2}\/\d{2}$/ // YYYY/MM/DD
        ]

        let parsed = false
        for (const format of formats) {
          if (format.test(dateValue)) {
            const parts = dateValue.split(/[-\/]/)
            if (parts.length === 3) {
              // Handle different date formats
              if (dateValue.includes('/') && parts[2].length === 4) {
                // MM/DD/YYYY or YYYY/MM/DD
                if (parts[0].length === 4) {
                  date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
                } else {
                  date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]))
                }
              } else {
                // YYYY-MM-DD or MM-DD-YYYY
                if (parts[0].length === 4) {
                  date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
                } else {
                  date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]))
                }
              }
              parsed = true
              break
            }
          }
        }

        if (!parsed) {
          throw new Error(`Invalid ${fieldName} date format: ${dateValue}`)
        }
      } else {
        date = new Date(timestamp)
      }
    } else if (typeof dateValue === 'number') {
      date = new Date(dateValue)
    } else {
      throw new Error(`Invalid ${fieldName} date type: ${typeof dateValue}`)
    }

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid ${fieldName} date: ${dateValue}`)
    }

    return date.toISOString()
  }

  private transformStatus(statusValue: any): string {
    if (typeof statusValue !== 'string') {
      return 'confirmed'
    }

    const statusMappings: Record<string, string> = {
      'active': 'confirmed',
      'booked': 'confirmed',
      'reserved': 'confirmed',
      'confirmed': 'confirmed',
      'pending': 'pending',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'completed': 'completed',
      'finished': 'completed',
      'done': 'completed'
    }

    const normalizedStatus = statusValue.toLowerCase().trim()
    return statusMappings[normalizedStatus] || 'confirmed'
  }

  private transformPaymentStatus(paymentStatusValue: any): string {
    if (typeof paymentStatusValue !== 'string') {
      return 'pending'
    }

    const paymentMappings: Record<string, string> = {
      'paid': 'paid',
      'completed': 'paid',
      'success': 'paid',
      'successful': 'paid',
      'pending': 'pending',
      'processing': 'pending',
      'failed': 'failed',
      'error': 'failed',
      'refunded': 'refunded',
      'refund': 'refunded'
    }

    const normalizedStatus = paymentStatusValue.toLowerCase().trim()
    return paymentMappings[normalizedStatus] || 'pending'
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key]
    }

    current[keys[keys.length - 1]] = value
  }

  private async validateTransformedData(data: any, recordIndex: number): Promise<void> {
    try {
      await createBookingSchema.parseAsync(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
        throw new Error(`Validation failed: ${errorMessages}`)
      }
      throw error
    }
  }

  private async saveBooking(bookingData: any, recordIndex: number): Promise<void> {
    try {
      const Booking = (await import('@/models/Booking')).default
      const booking = new Booking(bookingData)
      await booking.save()
    } catch (error) {
      throw new Error(`Failed to save booking: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async createBackup(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupCollectionName = `bookings_backup_${timestamp}`

      const { default: mongoose } = await import('mongoose')
      const db = mongoose.connection.db

      if (!db) {
        throw new Error('Database connection not available')
      }

      // Copy current bookings collection to backup
      await db.collection('bookings').aggregate([
        { $match: {} },
        { $out: backupCollectionName }
      ]).toArray()

      this.backupCollections.push(backupCollectionName)
      this.warnings.push(`Backup created: ${backupCollectionName}`)

      console.log(`Backup created: ${backupCollectionName}`)
    } catch (error) {
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async rollbackToBackup(backupCollectionName: string): Promise<boolean> {
    try {
      await connectToDatabase()

      const { default: mongoose } = await import('mongoose')
      const db = mongoose.connection.db

      if (!db) {
        throw new Error('Database connection not available')
      }

      // Check if backup exists
      const collections = await db.listCollections({ name: backupCollectionName }).toArray()
      if (collections.length === 0) {
        throw new Error(`Backup collection ${backupCollectionName} not found`)
      }

      // Drop current bookings collection
      await db.collection('bookings').drop()

      // Rename backup to bookings
      await db.collection(backupCollectionName).rename('bookings')

      console.log(`Successfully rolled back to backup: ${backupCollectionName}`)
      return true
    } catch (error) {
      console.error(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    }
  }

  async exportBookingsToCSV(propertyId?: string): Promise<string> {
    try {
      await connectToDatabase()

      const Booking = (await import('@/models/Booking')).default
      const query = propertyId ? { propertyId } : {}

      const bookings = await Booking.find(query)
        .populate('userId', 'name email')
        .populate('propertyId', 'title')
        .lean()

      const csvHeaders = [
        'ID',
        'Property',
        'Guest Name',
        'Guest Email',
        'Guest Phone',
        'Check-in Date',
        'Check-out Date',
        'Guests',
        'Rooms',
        'Total Amount',
        'Status',
        'Payment Status',
        'Created At'
      ]

      const csvRows = bookings.map(booking => [
        booking._id?.toString() || '',
        booking.propertyId?.title || booking.propertyId || '',
        booking.contactDetails?.name || booking.guestDetails?.name || '',
        booking.contactDetails?.email || booking.guestDetails?.email || '',
        booking.contactDetails?.phone || booking.guestDetails?.phone || '',
        booking.dateFrom ? new Date(booking.dateFrom).toISOString().split('T')[0] : '',
        booking.dateTo ? new Date(booking.dateTo).toISOString().split('T')[0] : '',
        booking.guests || 0,
        booking.rooms || 1,
        booking.totalPrice || booking.totalAmount || 0,
        booking.status || '',
        booking.paymentStatus || '',
        booking.createdAt ? new Date(booking.createdAt).toISOString() : ''
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      return csvContent
    } catch (error) {
      throw new Error(`Failed to export bookings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async importFromCSV(csvContent: string, options: MigrationOptions = {}): Promise<MigrationResult> {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim())
      if (lines.length < 2) {
        throw new Error('CSV must contain at least a header row and one data row')
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      const dataRows = lines.slice(1)

      const legacyData = dataRows.map((row, index) => {
        const values = row.split(',').map(v => v.replace(/"/g, '').trim())
        const record: LegacyBookingData = {}

        headers.forEach((header, i) => {
          if (values[i]) {
            record[header.toLowerCase().replace(/\s+/g, '_')] = values[i]
          }
        })

        return record
      })

      return await this.migrateFromLegacySystem(legacyData, options)
    } catch (error) {
      throw new Error(`Failed to import from CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  getBackupCollections(): string[] {
    return [...this.backupCollections]
  }
}

export default BookingMigrationManager