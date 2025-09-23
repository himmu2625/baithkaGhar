'use client'

interface OfflineBooking {
  id: string
  propertyId: string
  roomType: string
  checkInDate: string
  checkOutDate: string
  guests: number
  guestInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address?: string
    specialRequests?: string
  }
  pricing: {
    baseRate: number
    taxes: number
    fees: number
    total: number
  }
  status: 'draft' | 'pending-sync' | 'synced' | 'failed'
  createdAt: string
  lastModified: string
  syncAttempts: number
  errorMessage?: string
}

interface OfflineData {
  properties: any[]
  roomTypes: any[]
  availability: any[]
  pricing: any[]
  lastSync: string
}

interface SyncResult {
  success: boolean
  syncedBookings: string[]
  failedBookings: string[]
  errors: string[]
}

export class OfflineBookingService {
  private dbName = 'HotelBookingOffline'
  private dbVersion = 1
  private db: IDBDatabase | null = null
  private syncInProgress = false
  private syncQueue: string[] = []

  constructor() {
    this.initializeDatabase()
    this.registerServiceWorker()
    this.setupConnectionListeners()
  }

  // Database initialization
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Bookings store
        if (!db.objectStoreNames.contains('bookings')) {
          const bookingStore = db.createObjectStore('bookings', { keyPath: 'id' })
          bookingStore.createIndex('status', 'status')
          bookingStore.createIndex('propertyId', 'propertyId')
          bookingStore.createIndex('createdAt', 'createdAt')
        }

        // Offline data store
        if (!db.objectStoreNames.contains('offlineData')) {
          const dataStore = db.createObjectStore('offlineData', { keyPath: 'key' })
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
          syncStore.createIndex('priority', 'priority')
          syncStore.createIndex('timestamp', 'timestamp')
        }
      }
    })
  }

  // Service Worker registration
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration)

        // Listen for messages from Service Worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this))
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data

    switch (type) {
      case 'CACHE_UPDATED':
        this.handleCacheUpdate(data)
        break
      case 'SYNC_REQUESTED':
        this.syncPendingBookings()
        break
      case 'NETWORK_STATUS':
        this.handleNetworkStatusChange(data.online)
        break
    }
  }

  // Connection monitoring
  private setupConnectionListeners(): void {
    window.addEventListener('online', () => {
      console.log('Connection restored - syncing offline bookings')
      this.syncPendingBookings()
    })

    window.addEventListener('offline', () => {
      console.log('Connection lost - enabling offline mode')
    })
  }

  // Core booking functions
  async createOfflineBooking(bookingData: Omit<OfflineBooking, 'id' | 'status' | 'createdAt' | 'lastModified' | 'syncAttempts'>): Promise<string> {
    const booking: OfflineBooking = {
      ...bookingData,
      id: this.generateBookingId(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      syncAttempts: 0
    }

    await this.saveBookingLocally(booking)

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.queueBookingForSync(booking.id)
    }

    return booking.id
  }

  async updateOfflineBooking(bookingId: string, updates: Partial<OfflineBooking>): Promise<void> {
    const booking = await this.getOfflineBooking(bookingId)
    if (!booking) {
      throw new Error('Booking not found')
    }

    const updatedBooking = {
      ...booking,
      ...updates,
      lastModified: new Date().toISOString()
    }

    await this.saveBookingLocally(updatedBooking)

    // Queue for sync if it was already synced before
    if (booking.status === 'synced') {
      updatedBooking.status = 'pending-sync'
      await this.saveBookingLocally(updatedBooking)
      this.queueBookingForSync(bookingId)
    }
  }

  async getOfflineBooking(bookingId: string): Promise<OfflineBooking | null> {
    if (!this.db) {
      await this.initializeDatabase()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['bookings'], 'readonly')
      const store = transaction.objectStore('bookings')
      const request = store.get(bookingId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async getAllOfflineBookings(): Promise<OfflineBooking[]> {
    if (!this.db) {
      await this.initializeDatabase()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['bookings'], 'readonly')
      const store = transaction.objectStore('bookings')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  async getPendingBookings(): Promise<OfflineBooking[]> {
    if (!this.db) {
      await this.initializeDatabase()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['bookings'], 'readonly')
      const store = transaction.objectStore('bookings')
      const index = store.index('status')
      const request = index.getAll('pending-sync')

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  private async saveBookingLocally(booking: OfflineBooking): Promise<void> {
    if (!this.db) {
      await this.initializeDatabase()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['bookings'], 'readwrite')
      const store = transaction.objectStore('bookings')
      const request = store.put(booking)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  // Sync functionality
  async syncPendingBookings(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, syncedBookings: [], failedBookings: [], errors: ['Sync already in progress'] }
    }

    this.syncInProgress = true
    const result: SyncResult = {
      success: true,
      syncedBookings: [],
      failedBookings: [],
      errors: []
    }

    try {
      const pendingBookings = await this.getPendingBookings()

      for (const booking of pendingBookings) {
        try {
          const syncSuccess = await this.syncSingleBooking(booking)
          if (syncSuccess) {
            result.syncedBookings.push(booking.id)
          } else {
            result.failedBookings.push(booking.id)
          }
        } catch (error) {
          result.failedBookings.push(booking.id)
          result.errors.push(`Failed to sync booking ${booking.id}: ${error}`)
        }
      }

      if (result.failedBookings.length > 0) {
        result.success = false
      }
    } catch (error) {
      result.success = false
      result.errors.push(`Sync process failed: ${error}`)
    } finally {
      this.syncInProgress = false
    }

    return result
  }

  private async syncSingleBooking(booking: OfflineBooking): Promise<boolean> {
    try {
      // Convert offline booking to API format
      const apiBooking = this.convertToApiFormat(booking)

      // Send to server
      const response = await fetch('/api/bookings/offline-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiBooking)
      })

      if (response.ok) {
        const result = await response.json()

        // Update local booking with server confirmation
        const updatedBooking: OfflineBooking = {
          ...booking,
          status: 'synced',
          lastModified: new Date().toISOString(),
          errorMessage: undefined
        }

        await this.saveBookingLocally(updatedBooking)
        return true
      } else {
        // Handle sync failure
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))

        const failedBooking: OfflineBooking = {
          ...booking,
          status: 'failed',
          syncAttempts: booking.syncAttempts + 1,
          errorMessage: errorData.error || 'Sync failed',
          lastModified: new Date().toISOString()
        }

        await this.saveBookingLocally(failedBooking)
        return false
      }
    } catch (error) {
      console.error('Error syncing booking:', error)

      const failedBooking: OfflineBooking = {
        ...booking,
        status: 'failed',
        syncAttempts: booking.syncAttempts + 1,
        errorMessage: error instanceof Error ? error.message : 'Network error',
        lastModified: new Date().toISOString()
      }

      await this.saveBookingLocally(failedBooking)
      return false
    }
  }

  private queueBookingForSync(bookingId: string): void {
    if (!this.syncQueue.includes(bookingId)) {
      this.syncQueue.push(bookingId)
    }

    // Process queue
    this.processSync()
  }

  private async processSync(): Promise<void> {
    if (this.syncInProgress || this.syncQueue.length === 0 || !navigator.onLine) {
      return
    }

    const bookingId = this.syncQueue.shift()!
    const booking = await this.getOfflineBooking(bookingId)

    if (booking && booking.status === 'pending-sync') {
      await this.syncSingleBooking(booking)
    }

    // Continue processing queue
    setTimeout(() => this.processSync(), 1000)
  }

  // Offline data management
  async cacheOfflineData(data: OfflineData): Promise<void> {
    if (!this.db) {
      await this.initializeDatabase()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite')
      const store = transaction.objectStore('offlineData')

      const requests = [
        store.put({ key: 'properties', data: data.properties }),
        store.put({ key: 'roomTypes', data: data.roomTypes }),
        store.put({ key: 'availability', data: data.availability }),
        store.put({ key: 'pricing', data: data.pricing }),
        store.put({ key: 'lastSync', data: data.lastSync })
      ]

      let completed = 0
      const total = requests.length

      requests.forEach(request => {
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          completed++
          if (completed === total) {
            resolve()
          }
        }
      })
    })
  }

  async getOfflineData<T>(key: string): Promise<T | null> {
    if (!this.db) {
      await this.initializeDatabase()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readonly')
      const store = transaction.objectStore('offlineData')
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.data : null)
      }
    })
  }

  async isDataStale(): Promise<boolean> {
    const lastSync = await this.getOfflineData<string>('lastSync')
    if (!lastSync) return true

    const lastSyncTime = new Date(lastSync).getTime()
    const now = new Date().getTime()
    const hoursSinceSync = (now - lastSyncTime) / (1000 * 60 * 60)

    return hoursSinceSync > 24 // Data is stale after 24 hours
  }

  // Utility functions
  private generateBookingId(): string {
    return `offline-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }

  private convertToApiFormat(offlineBooking: OfflineBooking): any {
    return {
      propertyId: offlineBooking.propertyId,
      roomType: offlineBooking.roomType,
      checkInDate: offlineBooking.checkInDate,
      checkOutDate: offlineBooking.checkOutDate,
      guests: offlineBooking.guests,
      guestInfo: offlineBooking.guestInfo,
      pricing: offlineBooking.pricing,
      offlineId: offlineBooking.id,
      createdOffline: true,
      createdAt: offlineBooking.createdAt
    }
  }

  // Network status
  isOnline(): boolean {
    return navigator.onLine
  }

  async getNetworkStatus(): Promise<{ online: boolean; quality?: 'good' | 'slow' | 'poor' }> {
    const online = navigator.onLine

    if (!online) {
      return { online: false }
    }

    // Test connection quality
    try {
      const start = Date.now()
      await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      })
      const duration = Date.now() - start

      let quality: 'good' | 'slow' | 'poor' = 'good'
      if (duration > 3000) {
        quality = 'poor'
      } else if (duration > 1000) {
        quality = 'slow'
      }

      return { online: true, quality }
    } catch (error) {
      return { online: false }
    }
  }

  private handleCacheUpdate(data: any): void {
    console.log('Cache updated:', data)
    // Trigger UI update if needed
  }

  private handleNetworkStatusChange(online: boolean): void {
    if (online) {
      this.syncPendingBookings()
    }
  }

  // Cleanup functions
  async deleteOfflineBooking(bookingId: string): Promise<void> {
    if (!this.db) {
      await this.initializeDatabase()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['bookings'], 'readwrite')
      const store = transaction.objectStore('bookings')
      const request = store.delete(bookingId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async clearOfflineData(): Promise<void> {
    if (!this.db) {
      await this.initializeDatabase()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['bookings', 'offlineData'], 'readwrite')

      const bookingsStore = transaction.objectStore('bookings')
      const dataStore = transaction.objectStore('offlineData')

      const requests = [
        bookingsStore.clear(),
        dataStore.clear()
      ]

      let completed = 0
      const total = requests.length

      requests.forEach(request => {
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          completed++
          if (completed === total) {
            resolve()
          }
        }
      })
    })
  }

  // Statistics
  async getOfflineStats(): Promise<{
    totalBookings: number
    pendingSync: number
    synced: number
    failed: number
    lastSync?: string
  }> {
    const allBookings = await this.getAllOfflineBookings()
    const lastSync = await this.getOfflineData<string>('lastSync')

    return {
      totalBookings: allBookings.length,
      pendingSync: allBookings.filter(b => b.status === 'pending-sync').length,
      synced: allBookings.filter(b => b.status === 'synced').length,
      failed: allBookings.filter(b => b.status === 'failed').length,
      lastSync: lastSync || undefined
    }
  }
}