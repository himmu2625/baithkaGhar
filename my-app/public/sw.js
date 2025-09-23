// Service Worker for Offline Booking Functionality
const CACHE_NAME = 'hotel-booking-offline-v1'
const API_CACHE_NAME = 'hotel-booking-api-v1'
const STATIC_CACHE_NAME = 'hotel-booking-static-v1'

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/booking',
  '/offline',
  '/manifest.json',
  // Add other critical static assets
]

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/properties',
  '/api/room-types',
  '/api/availability',
  '/api/pricing'
]

// Network timeout for API calls
const NETWORK_TIMEOUT = 3000

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker')

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_CACHE_URLS)
      }),

      // Cache API data
      caches.open(API_CACHE_NAME).then((cache) => {
        console.log('[SW] Pre-caching API data')
        return Promise.allSettled(
          API_CACHE_URLS.map(url =>
            fetch(url)
              .then(response => response.ok ? cache.put(url, response) : Promise.resolve())
              .catch(() => Promise.resolve()) // Ignore errors during pre-caching
          )
        )
      })
    ]).then(() => {
      console.log('[SW] Installation complete')
      return self.skipWaiting()
    })
  )
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker')

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME &&
                cacheName !== API_CACHE_NAME &&
                cacheName !== STATIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),

      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete')

      // Notify clients that SW is ready
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            timestamp: new Date().toISOString()
          })
        })
      })
    })
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle requests from the same origin
  if (url.origin !== self.location.origin) {
    return
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
  } else if (request.destination === 'document') {
    event.respondWith(handlePageRequest(request))
  } else {
    event.respondWith(handleStaticRequest(request))
  }
})

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url)

  // Special handling for offline sync endpoint
  if (url.pathname === '/api/bookings/offline-sync') {
    return handleOfflineSync(request)
  }

  // Special handling for booking creation
  if (url.pathname === '/api/bookings' && request.method === 'POST') {
    return handleBookingCreation(request)
  }

  try {
    // Try network first with timeout
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
      )
    ])

    if (networkResponse.ok) {
      // Cache successful responses for read operations
      if (request.method === 'GET') {
        const cache = await caches.open(API_CACHE_NAME)
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    }

    throw new Error('Network response not ok')
  } catch (error) {
    console.log('[SW] Network failed for API request:', request.url)

    // Fall back to cache for GET requests
    if (request.method === 'GET') {
      const cache = await caches.open(API_CACHE_NAME)
      const cachedResponse = await cache.match(request)

      if (cachedResponse) {
        console.log('[SW] Serving API request from cache:', request.url)
        return cachedResponse
      }
    }

    // Return offline response for critical endpoints
    return createOfflineResponse(request)
  }
}

// Handle page requests with cache-first strategy for offline pages
async function handlePageRequest(request) {
  try {
    // Try network first for page requests
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      return networkResponse
    }

    throw new Error('Network response not ok')
  } catch (error) {
    console.log('[SW] Network failed for page request, serving offline page')

    // Serve offline page
    const cache = await caches.open(STATIC_CACHE_NAME)
    const offlinePage = await cache.match('/offline')

    if (offlinePage) {
      return offlinePage
    }

    // Fallback offline response
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Hotel Booking</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-message { max-width: 400px; margin: 0 auto; }
            .icon { font-size: 64px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <div class="icon">📱</div>
            <h1>You're Offline</h1>
            <p>No internet connection found. You can still browse cached content and create offline bookings.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

// Handle static asset requests with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
      return networkResponse
    }

    throw new Error('Network response not ok')
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url)
    return new Response('Not found', { status: 404 })
  }
}

// Handle offline booking creation
async function handleBookingCreation(request) {
  try {
    // Try to send the booking to the server
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      return networkResponse
    }

    throw new Error('Network response not ok')
  } catch (error) {
    console.log('[SW] Booking creation failed, storing offline')

    // Store booking for offline sync
    const bookingData = await request.json()
    await storeOfflineBooking(bookingData)

    // Return success response with offline flag
    return new Response(JSON.stringify({
      success: true,
      offline: true,
      message: 'Booking stored offline and will sync when connection is restored',
      bookingId: generateOfflineBookingId()
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Handle offline sync requests
async function handleOfflineSync(request) {
  try {
    // Always try to sync with server
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Notify clients of successful sync
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_SUCCESS',
            timestamp: new Date().toISOString()
          })
        })
      })

      return networkResponse
    }

    throw new Error('Sync failed')
  } catch (error) {
    console.log('[SW] Offline sync failed')

    // Return error response
    return new Response(JSON.stringify({
      success: false,
      error: 'Unable to sync offline bookings at this time'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Create offline API responses
function createOfflineResponse(request) {
  const url = new URL(request.url)

  // Customize responses based on endpoint
  switch (url.pathname) {
    case '/api/properties':
      return createPropertiesOfflineResponse()
    case '/api/room-types':
      return createRoomTypesOfflineResponse()
    case '/api/availability':
      return createAvailabilityOfflineResponse()
    default:
      return new Response(JSON.stringify({
        error: 'Offline mode - data not available',
        offline: true
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
  }
}

function createPropertiesOfflineResponse() {
  const offlineProperties = [
    {
      id: 'prop-offline-001',
      name: 'Baithaka GHAR (Offline Mode)',
      location: 'Cached Location',
      description: 'Limited offline data available',
      amenities: ['WiFi', 'Parking'],
      images: [],
      offline: true
    }
  ]

  return new Response(JSON.stringify({
    success: true,
    properties: offlineProperties,
    offline: true
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

function createRoomTypesOfflineResponse() {
  const offlineRoomTypes = [
    {
      id: 'room-offline-001',
      name: 'Standard Room (Cached)',
      description: 'Basic room with essential amenities',
      capacity: 2,
      basePrice: 100,
      offline: true
    }
  ]

  return new Response(JSON.stringify({
    success: true,
    roomTypes: offlineRoomTypes,
    offline: true
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

function createAvailabilityOfflineResponse() {
  return new Response(JSON.stringify({
    success: false,
    error: 'Availability data requires internet connection',
    offline: true
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Utility functions
async function storeOfflineBooking(bookingData) {
  // This would integrate with IndexedDB via the OfflineBookingService
  // For now, just store in a simple cache
  const cache = await caches.open(CACHE_NAME)
  const bookingId = generateOfflineBookingId()

  await cache.put(
    `/offline-bookings/${bookingId}`,
    new Response(JSON.stringify({
      ...bookingData,
      id: bookingId,
      offline: true,
      createdAt: new Date().toISOString()
    }))
  )

  return bookingId
}

function generateOfflineBookingId() {
  return `offline-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

// Background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)

  if (event.tag === 'offline-booking-sync') {
    event.waitUntil(syncOfflineBookings())
  }
})

async function syncOfflineBookings() {
  console.log('[SW] Syncing offline bookings')

  try {
    // This would integrate with the OfflineBookingService
    // to sync pending bookings

    // Notify clients
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_REQUESTED',
        timestamp: new Date().toISOString()
      })
    })

    return true
  } catch (error) {
    console.error('[SW] Sync failed:', error)
    return false
  }
}

// Push notifications for sync status
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()

    if (data.type === 'booking-sync-status') {
      event.waitUntil(
        self.registration.showNotification('Booking Sync Update', {
          body: data.message,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png'
        })
      )
    }
  }
})

// Network quality monitoring
self.addEventListener('message', (event) => {
  const { type, data } = event.data

  if (type === 'CHECK_NETWORK_QUALITY') {
    checkNetworkQuality().then(quality => {
      event.ports[0].postMessage({
        type: 'NETWORK_QUALITY_RESULT',
        quality
      })
    })
  }
})

async function checkNetworkQuality() {
  try {
    const start = Date.now()
    const response = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-cache'
    })
    const duration = Date.now() - start

    if (!response.ok) {
      return 'offline'
    }

    if (duration < 500) {
      return 'good'
    } else if (duration < 2000) {
      return 'moderate'
    } else {
      return 'slow'
    }
  } catch (error) {
    return 'offline'
  }
}

console.log('[SW] Service worker script loaded')