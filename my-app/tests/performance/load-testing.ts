import { check, sleep } from 'k6'
import http from 'k6/http'
import { Rate, Counter, Trend, Gauge } from 'k6/metrics'

// Custom metrics
const bookingCreationRate = new Rate('booking_creation_success')
const bookingCreationCounter = new Counter('booking_creation_total')
const bookingCreationDuration = new Trend('booking_creation_duration')
const activeBookings = new Gauge('active_bookings')

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 50 },   // Ramp up to 50 users
    { duration: '10m', target: 100 }, // Ramp up to 100 users
    { duration: '15m', target: 200 }, // Ramp up to 200 users (peak load)
    { duration: '5m', target: 100 },  // Ramp down to 100 users
    { duration: '5m', target: 50 },   // Ramp down to 50 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms, 99% under 1s
    http_req_failed: ['rate<0.01'], // Error rate under 1%
    booking_creation_success: ['rate>0.95'], // 95% booking success rate
    booking_creation_duration: ['p(95)<2000'], // 95% of bookings under 2s
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// Test data
const testProperties = [
  { id: 'prop-001', name: 'Test Hotel 1' },
  { id: 'prop-002', name: 'Test Hotel 2' },
  { id: 'prop-003', name: 'Test Hotel 3' },
]

const testRooms = [
  { id: 'room-001', propertyId: 'prop-001', number: '101', rate: 150 },
  { id: 'room-002', propertyId: 'prop-001', number: '102', rate: 175 },
  { id: 'room-003', propertyId: 'prop-002', number: '201', rate: 200 },
  { id: 'room-004', propertyId: 'prop-002', number: '202', rate: 225 },
]

// Generate test guest data
function generateGuestData() {
  const guestId = `guest-${Math.random().toString(36).substr(2, 9)}`
  return {
    id: guestId,
    firstName: `TestUser${Math.floor(Math.random() * 1000)}`,
    lastName: `LoadTest${Math.floor(Math.random() * 1000)}`,
    email: `${guestId}@loadtest.com`,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
  }
}

// Generate test booking data
function generateBookingData() {
  const property = testProperties[Math.floor(Math.random() * testProperties.length)]
  const room = testRooms.filter(r => r.propertyId === property.id)[0]
  const guest = generateGuestData()

  const checkIn = new Date()
  checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 30) + 1) // 1-30 days from now

  const checkOut = new Date(checkIn)
  checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 7) + 1) // 1-7 nights

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

  return {
    guest,
    booking: {
      guestId: guest.id,
      propertyId: property.id,
      roomId: room.id,
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
      guests: Math.floor(Math.random() * 4) + 1,
      totalAmount: nights * room.rate,
      paymentMethod: 'credit_card',
      paymentDetails: {
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        cardholderName: `${guest.firstName} ${guest.lastName}`,
      },
    },
  }
}

// Authentication setup
function authenticate() {
  const loginData = {
    email: 'admin@loadtest.com',
    password: 'loadtest123',
  }

  const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(loginData), {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  check(response, {
    'authentication successful': (r) => r.status === 200,
    'received auth token': (r) => r.json('token') !== undefined,
  })

  return response.json('token')
}

// Room search performance test
function testRoomSearch(authToken: string) {
  const searchParams = {
    propertyId: testProperties[Math.floor(Math.random() * testProperties.length)].id,
    checkIn: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + (Math.random() * 30 + 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    guests: Math.floor(Math.random() * 4) + 1,
  }

  const response = http.post(
    `${BASE_URL}/api/os/search/rooms`,
    JSON.stringify(searchParams),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    }
  )

  check(response, {
    'room search successful': (r) => r.status === 200,
    'rooms returned': (r) => r.json('rooms') && r.json('rooms').length > 0,
    'response time acceptable': (r) => r.timings.duration < 1000,
  })

  return response
}

// Booking creation performance test
function testBookingCreation(authToken: string) {
  const testData = generateBookingData()
  const startTime = Date.now()

  // First create guest if needed
  const guestResponse = http.post(
    `${BASE_URL}/api/os/guests`,
    JSON.stringify(testData.guest),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    }
  )

  check(guestResponse, {
    'guest creation successful': (r) => r.status === 201 || r.status === 409, // 409 if guest already exists
  })

  // Create booking
  const bookingResponse = http.post(
    `${BASE_URL}/api/os/bookings`,
    JSON.stringify(testData.booking),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    }
  )

  const duration = Date.now() - startTime
  bookingCreationDuration.add(duration)
  bookingCreationCounter.add(1)

  const success = check(bookingResponse, {
    'booking creation successful': (r) => r.status === 201,
    'booking has confirmation number': (r) => r.json('booking.confirmationNumber') !== undefined,
    'booking has correct amount': (r) => r.json('booking.totalAmount') === testData.booking.totalAmount,
  })

  bookingCreationRate.add(success)

  return bookingResponse
}

// Booking retrieval performance test
function testBookingRetrieval(authToken: string, bookingId: string) {
  const response = http.get(`${BASE_URL}/api/os/bookings/${bookingId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })

  check(response, {
    'booking retrieval successful': (r) => r.status === 200,
    'booking data complete': (r) => {
      const booking = r.json('booking')
      return booking && booking.id && booking.guest && booking.room
    },
  })

  return response
}

// Booking modification performance test
function testBookingModification(authToken: string, bookingId: string) {
  const updateData = {
    specialRequests: `Load test update ${Math.random()}`,
    guestNotes: 'Updated during load test',
  }

  const response = http.put(
    `${BASE_URL}/api/os/bookings/${bookingId}`,
    JSON.stringify(updateData),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    }
  )

  check(response, {
    'booking update successful': (r) => r.status === 200,
    'update applied correctly': (r) => r.json('booking.specialRequests') === updateData.specialRequests,
  })

  return response
}

// Booking list performance test
function testBookingList(authToken: string) {
  const queryParams = `?page=1&limit=50&status=confirmed`

  const response = http.get(`${BASE_URL}/api/os/bookings${queryParams}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })

  check(response, {
    'booking list retrieval successful': (r) => r.status === 200,
    'pagination working': (r) => r.json('pagination') !== undefined,
    'bookings returned': (r) => r.json('bookings') && Array.isArray(r.json('bookings')),
  })

  return response
}

// Database stress test
function testDatabaseStress(authToken: string) {
  // Simulate concurrent database operations
  const operations = [
    () => testRoomSearch(authToken),
    () => testBookingList(authToken),
    () => testBookingCreation(authToken),
  ]

  // Execute random operations
  const operation = operations[Math.floor(Math.random() * operations.length)]
  return operation()
}

// API rate limiting test
function testRateLimiting(authToken: string) {
  const responses = []

  // Make rapid requests to test rate limiting
  for (let i = 0; i < 10; i++) {
    const response = http.get(`${BASE_URL}/api/os/properties`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    responses.push(response)
  }

  // Check that rate limiting is working (should get 429 status)
  const rateLimited = responses.some(r => r.status === 429)

  check(rateLimited, {
    'rate limiting active': () => rateLimited,
  })

  return responses
}

// Memory usage simulation
function testMemoryUsage(authToken: string) {
  const largePayload = {
    guestId: 'load-test-guest',
    propertyId: testProperties[0].id,
    roomId: testRooms[0].id,
    checkIn: '2024-12-25',
    checkOut: '2024-12-30',
    guests: 2,
    totalAmount: 750,
    specialRequests: 'A'.repeat(1000), // Large string to test memory handling
    guestNotes: 'B'.repeat(1000),
    internalNotes: 'C'.repeat(1000),
  }

  const response = http.post(
    `${BASE_URL}/api/os/bookings`,
    JSON.stringify(largePayload),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    }
  )

  check(response, {
    'large payload handled': (r) => r.status === 201 || r.status === 400, // 400 for validation errors is acceptable
    'response within time limit': (r) => r.timings.duration < 3000,
  })

  return response
}

// Main test function
export default function () {
  const authToken = authenticate()

  if (!authToken) {
    console.error('Failed to authenticate')
    return
  }

  // Simulate realistic user behavior with different test scenarios
  const scenario = Math.random()

  if (scenario < 0.4) {
    // 40% - Normal booking flow
    testRoomSearch(authToken)
    sleep(1)
    const bookingResponse = testBookingCreation(authToken)

    if (bookingResponse.status === 201) {
      const bookingId = bookingResponse.json('booking.id')
      sleep(2)
      testBookingRetrieval(authToken, bookingId)

      // Sometimes modify the booking
      if (Math.random() < 0.3) {
        sleep(1)
        testBookingModification(authToken, bookingId)
      }
    }

  } else if (scenario < 0.7) {
    // 30% - Browse and search behavior
    testRoomSearch(authToken)
    sleep(1)
    testBookingList(authToken)
    sleep(1)
    testRoomSearch(authToken) // Second search

  } else if (scenario < 0.9) {
    // 20% - Heavy database operations
    testDatabaseStress(authToken)
    sleep(0.5)
    testDatabaseStress(authToken)

  } else {
    // 10% - Stress testing scenarios
    if (Math.random() < 0.5) {
      testRateLimiting(authToken)
    } else {
      testMemoryUsage(authToken)
    }
  }

  // Random sleep to simulate user think time
  sleep(Math.random() * 3 + 1)
}

// Setup function - runs once before the test starts
export function setup() {
  console.log('Setting up load test environment...')

  // Warm up the application
  const warmupResponse = http.get(`${BASE_URL}/api/health`)
  check(warmupResponse, {
    'application is healthy': (r) => r.status === 200,
  })

  return { baseUrl: BASE_URL }
}

// Teardown function - runs once after the test completes
export function teardown(data: any) {
  console.log('Cleaning up load test environment...')

  // Could include cleanup operations here
  // e.g., delete test data, reset counters, etc.
}

// Custom scenarios for different types of load testing
export const scenarios = {
  // Spike testing - sudden increase in load
  spike_test: {
    executor: 'ramping-arrival-rate',
    startRate: 0,
    timeUnit: '1s',
    preAllocatedVUs: 50,
    maxVUs: 500,
    stages: [
      { duration: '1m', target: 10 },   // Normal load
      { duration: '30s', target: 200 }, // Spike
      { duration: '1m', target: 10 },   // Back to normal
    ],
  },

  // Stress testing - find breaking point
  stress_test: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 100 },
      { duration: '5m', target: 200 },
      { duration: '5m', target: 300 },
      { duration: '5m', target: 400 },
      { duration: '10m', target: 500 }, // Breaking point
      { duration: '3m', target: 0 },
    ],
  },

  // Volume testing - large amounts of data
  volume_test: {
    executor: 'constant-vus',
    vus: 100,
    duration: '30m',
  },

  // Endurance testing - extended periods
  endurance_test: {
    executor: 'constant-vus',
    vus: 50,
    duration: '2h',
  },
}

// Performance monitoring functions
export function handleSummary(data: any) {
  return {
    'performance-summary.html': htmlReport(data),
    'performance-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}

function htmlReport(data: any) {
  const metrics = data.metrics
  const thresholds = data.thresholds

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Booking System Load Test Results</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .metric { margin: 10px 0; padding: 10px; border: 1px solid #ccc; }
            .passed { background-color: #d4edda; }
            .failed { background-color: #f8d7da; }
            .chart { width: 100%; height: 200px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <h1>Booking System Load Test Results</h1>

        <h2>Test Summary</h2>
        <p>Test Duration: ${data.state.testDuration}</p>
        <p>Total VUs: ${data.state.vusMax}</p>
        <p>Total Iterations: ${data.metrics.iterations?.values.count || 0}</p>

        <h2>Key Metrics</h2>
        <div class="metric ${thresholds['http_req_duration']?.ok ? 'passed' : 'failed'}">
            <h3>Response Time</h3>
            <p>Average: ${metrics.http_req_duration?.values.avg?.toFixed(2)}ms</p>
            <p>95th Percentile: ${metrics.http_req_duration?.values['p(95)']?.toFixed(2)}ms</p>
            <p>99th Percentile: ${metrics.http_req_duration?.values['p(99)']?.toFixed(2)}ms</p>
        </div>

        <div class="metric ${thresholds['http_req_failed']?.ok ? 'passed' : 'failed'}">
            <h3>Error Rate</h3>
            <p>Failed Requests: ${(metrics.http_req_failed?.values.rate * 100)?.toFixed(2)}%</p>
        </div>

        <div class="metric ${thresholds['booking_creation_success']?.ok ? 'passed' : 'failed'}">
            <h3>Booking Creation</h3>
            <p>Success Rate: ${(metrics.booking_creation_success?.values.rate * 100)?.toFixed(2)}%</p>
            <p>Total Bookings: ${metrics.booking_creation_total?.values.count || 0}</p>
            <p>Average Duration: ${metrics.booking_creation_duration?.values.avg?.toFixed(2)}ms</p>
        </div>

        <h2>Threshold Results</h2>
        ${Object.entries(thresholds || {}).map(([name, result]: [string, any]) => `
            <div class="metric ${result.ok ? 'passed' : 'failed'}">
                <h4>${name}</h4>
                <p>Status: ${result.ok ? 'PASSED' : 'FAILED'}</p>
                ${result.fails?.map((fail: any) => `<p>❌ ${fail.failedThreshold}</p>`).join('') || ''}
            </div>
        `).join('')}
    </body>
    </html>
  `
}

function textSummary(data: any, options: any) {
  return `
Performance Test Summary
========================

Test Duration: ${data.state.testDuration}
Max VUs: ${data.state.vusMax}
Total Iterations: ${data.metrics.iterations?.values.count || 0}

Key Metrics:
- Response Time (avg): ${data.metrics.http_req_duration?.values.avg?.toFixed(2)}ms
- Response Time (p95): ${data.metrics.http_req_duration?.values['p(95)']?.toFixed(2)}ms
- Error Rate: ${(data.metrics.http_req_failed?.values.rate * 100)?.toFixed(2)}%
- Booking Success Rate: ${(data.metrics.booking_creation_success?.values.rate * 100)?.toFixed(2)}%

Threshold Status:
${Object.entries(data.thresholds || {}).map(([name, result]: [string, any]) =>
  `- ${name}: ${result.ok ? '✅ PASSED' : '❌ FAILED'}`
).join('\n')}
  `
}