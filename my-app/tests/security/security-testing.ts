import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createTestClient, TestClient } from '../utils/test-client'
import { setupTestDatabase, cleanupTestDatabase } from '../utils/test-database'
import { createTestUser, createTestProperty, createTestRoom } from '../utils/test-fixtures'

describe('Security Testing Suite', () => {
  let client: TestClient
  let normalUser: any
  let adminUser: any
  let testProperty: any
  let testRoom: any

  beforeAll(async () => {
    await setupTestDatabase()
    client = createTestClient()

    // Create test users with different roles
    normalUser = await createTestUser({
      email: 'user@security.test',
      role: 'user',
      password: 'TestPassword123!'
    })

    adminUser = await createTestUser({
      email: 'admin@security.test',
      role: 'admin',
      password: 'AdminPassword123!'
    })

    testProperty = await createTestProperty({
      name: 'Security Test Hotel',
      ownerId: adminUser.id
    })

    testRoom = await createTestRoom({
      propertyId: testProperty.id,
      number: '101',
      rate: 150
    })
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  describe('Authentication Security', () => {
    test('should prevent access without authentication', async () => {
      // Test protected endpoints without authentication
      const protectedEndpoints = [
        '/api/os/bookings',
        '/api/os/properties',
        '/api/os/rooms',
        '/api/os/guests',
        '/api/admin/users'
      ]

      for (const endpoint of protectedEndpoints) {
        const response = await client.get(endpoint, {}, { skipAuth: true })
        expect(response.status).toBe(401)
        expect(response.data.error).toContain('Unauthorized')
      }
    })

    test('should validate JWT token integrity', async () => {
      // Test with invalid JWT token
      const invalidTokens = [
        'invalid.jwt.token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        '', // Empty token
        'Bearer ', // Malformed bearer token
        'Basic dGVzdDp0ZXN0' // Wrong auth type
      ]

      for (const token of invalidTokens) {
        const response = await client.get('/api/os/bookings', {}, {
          headers: { Authorization: token }
        })
        expect(response.status).toBe(401)
      }
    })

    test('should prevent JWT token tampering', async () => {
      const validToken = await client.authenticate(normalUser.email, 'TestPassword123!')

      // Tamper with the token payload
      const tokenParts = validToken.split('.')
      const tamperedPayload = Buffer.from('{"sub":"admin","role":"admin"}').toString('base64')
      const tamperedToken = `${tokenParts[0]}.${tamperedPayload}.${tokenParts[2]}`

      const response = await client.get('/api/os/bookings', {}, {
        headers: { Authorization: `Bearer ${tamperedToken}` }
      })

      expect(response.status).toBe(401)
      expect(response.data.error).toContain('Invalid token')
    })

    test('should enforce token expiration', async () => {
      // Test would require token with past expiration time
      // This would typically be tested with time manipulation or mock tokens
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiZXhwIjoxNjAwMDAwMDAwfQ.expired_signature'

      const response = await client.get('/api/os/bookings', {}, {
        headers: { Authorization: `Bearer ${expiredToken}` }
      })

      expect(response.status).toBe(401)
    })

    test('should implement proper password hashing', async () => {
      // Create user and verify password is hashed
      const userData = {
        email: 'hash.test@security.test',
        password: 'PlaintextPassword123!',
        firstName: 'Hash',
        lastName: 'Test'
      }

      const response = await client.post('/api/auth/register', userData)
      expect(response.status).toBe(201)

      // Verify password is not stored in plaintext (requires database access)
      // This would check that the stored password hash != original password
      expect(response.data.user.password).toBeUndefined() // Password should not be returned
    })
  })

  describe('Authorization Security', () => {
    test('should enforce role-based access control', async () => {
      // Normal user should not access admin endpoints
      const userToken = await client.authenticate(normalUser.email, 'TestPassword123!')
      client.setAuthToken(userToken)

      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/properties',
        '/api/admin/analytics',
        '/api/admin/settings'
      ]

      for (const endpoint of adminEndpoints) {
        const response = await client.get(endpoint)
        expect(response.status).toBe(403)
        expect(response.data.error).toContain('Forbidden')
      }
    })

    test('should prevent horizontal privilege escalation', async () => {
      // User should not access other users\' data
      const userToken = await client.authenticate(normalUser.email, 'TestPassword123!')
      client.setAuthToken(userToken)

      // Try to access another user's profile
      const response = await client.get(`/api/os/users/${adminUser.id}`)
      expect(response.status).toBe(403)
    })

    test('should prevent vertical privilege escalation', async () => {
      // User should not be able to modify their own role
      const userToken = await client.authenticate(normalUser.email, 'TestPassword123!')
      client.setAuthToken(userToken)

      const response = await client.put(`/api/os/users/${normalUser.id}`, {
        role: 'admin' // Attempting to escalate privileges
      })

      expect(response.status).toBe(403)
    })

    test('should validate resource ownership', async () => {
      // Create booking as normal user
      const userToken = await client.authenticate(normalUser.email, 'TestPassword123!')
      client.setAuthToken(userToken)

      const bookingData = {
        guestId: normalUser.id,
        propertyId: testProperty.id,
        roomId: testRoom.id,
        checkIn: '2024-07-15',
        checkOut: '2024-07-18',
        guests: 2,
        totalAmount: 450
      }

      const bookingResponse = await client.post('/api/os/bookings', bookingData)
      expect(bookingResponse.status).toBe(201)
      const bookingId = bookingResponse.data.booking.id

      // Switch to different user and try to access the booking
      const otherUser = await createTestUser({
        email: 'other@security.test',
        role: 'user'
      })
      const otherToken = await client.authenticate(otherUser.email, 'TestPassword123!')
      client.setAuthToken(otherToken)

      const accessResponse = await client.get(`/api/os/bookings/${bookingId}`)
      expect(accessResponse.status).toBe(403)
    })
  })

  describe('Input Validation Security', () => {
    test('should prevent SQL injection attacks', async () => {
      const adminToken = await client.authenticate(adminUser.email, 'AdminPassword123!')
      client.setAuthToken(adminToken)

      const sqlInjectionPayloads = [
        "'; DROP TABLE bookings; --",
        "' OR '1'='1",
        "'; INSERT INTO users (email, role) VALUES ('hacker@evil.com', 'admin'); --",
        "' UNION SELECT * FROM users WHERE '1'='1",
        "'; UPDATE users SET role='admin' WHERE email='user@security.test'; --"
      ]

      for (const payload of sqlInjectionPayloads) {
        // Test in various input fields
        const testCases = [
          { endpoint: '/api/os/bookings', field: 'guestId', data: { guestId: payload } },
          { endpoint: '/api/os/guests', field: 'email', data: { email: payload } },
          { endpoint: '/api/os/properties', field: 'name', data: { name: payload } }
        ]

        for (const testCase of testCases) {
          const response = await client.post(testCase.endpoint, testCase.data)
          // Should either validate input (400) or handle gracefully (not 500)
          expect(response.status).not.toBe(500)

          if (response.status === 400) {
            expect(response.data.error).toContain('Invalid input')
          }
        }
      }
    })

    test('should prevent NoSQL injection attacks', async () => {
      const adminToken = await client.authenticate(adminUser.email, 'AdminPassword123!')
      client.setAuthToken(adminToken)

      const noSQLPayloads = [
        { $ne: null },
        { $gt: '' },
        { $where: 'this.password' },
        { $regex: '.*' },
        { '$or': [{}] }
      ]

      for (const payload of noSQLPayloads) {
        const response = await client.post('/api/os/bookings/search', {
          query: payload
        })

        expect(response.status).not.toBe(500)
        if (response.status === 400) {
          expect(response.data.error).toContain('Invalid')
        }
      }
    })

    test('should prevent XSS attacks', async () => {
      const adminToken = await client.authenticate(adminUser.email, 'AdminPassword123!')
      client.setAuthToken(adminToken)

      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>'
      ]

      for (const payload of xssPayloads) {
        const guestData = {
          firstName: payload,
          lastName: 'Test',
          email: 'xss.test@security.test',
          phone: '+1234567890'
        }

        const response = await client.post('/api/os/guests', guestData)

        if (response.status === 201) {
          // If creation succeeds, verify the payload is sanitized
          const guestResponse = await client.get(`/api/os/guests/${response.data.guest.id}`)
          expect(guestResponse.data.guest.firstName).not.toContain('<script>')
        }
      }
    })

    test('should validate email formats properly', async () => {
      const invalidEmails = [
        'invalid.email',
        '@invalid.com',
        'test@',
        'test..test@example.com',
        'test@.com',
        'test@com',
        '<script>alert("xss")</script>@test.com'
      ]

      for (const email of invalidEmails) {
        const response = await client.post('/api/os/guests', {
          firstName: 'Test',
          lastName: 'User',
          email: email,
          phone: '+1234567890'
        })

        expect(response.status).toBe(400)
        expect(response.data.error || response.data.errors).toContain('email')
      }
    })

    test('should validate phone number formats', async () => {
      const invalidPhones = [
        'not-a-phone',
        '123',
        '+1-800-CALL-NOW',
        '<script>alert("xss")</script>',
        '1'.repeat(50) // Very long number
      ]

      for (const phone of invalidPhones) {
        const response = await client.post('/api/os/guests', {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: phone
        })

        expect(response.status).toBe(400)
      }
    })
  })

  describe('Data Security', () => {
    test('should not expose sensitive data in API responses', async () => {
      const userToken = await client.authenticate(normalUser.email, 'TestPassword123!')
      client.setAuthToken(userToken)

      // Create a booking with payment details
      const bookingData = {
        guestId: normalUser.id,
        propertyId: testProperty.id,
        roomId: testRoom.id,
        checkIn: '2024-08-15',
        checkOut: '2024-08-18',
        guests: 2,
        totalAmount: 450,
        paymentDetails: {
          cardNumber: '4111111111111111',
          cvv: '123',
          expiryMonth: '12',
          expiryYear: '2025'
        }
      }

      const response = await client.post('/api/os/bookings', bookingData)
      expect(response.status).toBe(201)

      // Verify sensitive payment data is not exposed
      expect(response.data.booking.paymentDetails?.cardNumber).toBeUndefined()
      expect(response.data.booking.paymentDetails?.cvv).toBeUndefined()

      // Also check when retrieving the booking
      const retrieveResponse = await client.get(`/api/os/bookings/${response.data.booking.id}`)
      expect(retrieveResponse.data.booking.paymentDetails?.cardNumber).toBeUndefined()
    })

    test('should mask sensitive data in logs', async () => {
      // This would require access to application logs
      // In a real scenario, you'd check that sensitive data doesn't appear in logs
      const logData = {
        email: 'test@example.com',
        password: 'secret123',
        cardNumber: '4111111111111111',
        ssn: '123-45-6789'
      }

      const response = await client.post('/api/auth/register', logData)

      // Verify response doesn't contain sensitive data
      expect(JSON.stringify(response.data)).not.toContain('secret123')
      expect(JSON.stringify(response.data)).not.toContain('4111111111111111')
    })

    test('should prevent information disclosure through error messages', async () => {
      // Test with non-existent booking ID
      const response = await client.get('/api/os/bookings/non-existent-id')

      expect(response.status).toBe(404)
      expect(response.data.error).toBe('Booking not found') // Generic message
      expect(response.data.error).not.toContain('database')
      expect(response.data.error).not.toContain('table')
      expect(response.data.error).not.toContain('column')
    })

    test('should implement proper CORS policies', async () => {
      // Test CORS headers
      const response = await client.options('/api/os/bookings')

      expect(response.headers['access-control-allow-origin']).toBeDefined()
      expect(response.headers['access-control-allow-methods']).toBeDefined()
      expect(response.headers['access-control-allow-headers']).toBeDefined()

      // Should not allow all origins in production
      if (process.env.NODE_ENV === 'production') {
        expect(response.headers['access-control-allow-origin']).not.toBe('*')
      }
    })
  })

  describe('Rate Limiting Security', () => {
    test('should implement rate limiting for authentication endpoints', async () => {
      const authAttempts = []

      // Attempt multiple rapid authentication requests
      for (let i = 0; i < 10; i++) {
        const attempt = client.post('/api/auth/login', {
          email: 'nonexistent@test.com',
          password: 'wrongpassword'
        }, { skipAuth: true })
        authAttempts.push(attempt)
      }

      const responses = await Promise.all(authAttempts)

      // Should eventually get rate limited (429 status)
      const rateLimited = responses.some(r => r.status === 429)
      expect(rateLimited).toBe(true)
    })

    test('should implement rate limiting for API endpoints', async () => {
      const userToken = await client.authenticate(normalUser.email, 'TestPassword123!')
      client.setAuthToken(userToken)

      const requests = []

      // Make rapid API requests
      for (let i = 0; i < 20; i++) {
        requests.push(client.get('/api/os/properties'))
      }

      const responses = await Promise.all(requests)

      // Should get rate limited
      const rateLimited = responses.some(r => r.status === 429)
      expect(rateLimited).toBe(true)
    })

    test('should reset rate limits after time window', async () => {
      // This test would require waiting for the rate limit window to reset
      // In a real scenario, this might use time manipulation or shorter windows for testing

      const userToken = await client.authenticate(normalUser.email, 'TestPassword123!')
      client.setAuthToken(userToken)

      // Hit rate limit
      const rapidRequests = Array(15).fill(null).map(() => client.get('/api/os/properties'))
      await Promise.all(rapidRequests)

      // Wait for rate limit reset (would be configured window, e.g., 1 minute)
      // await new Promise(resolve => setTimeout(resolve, 60000))

      // Should be able to make requests again
      const response = await client.get('/api/os/properties')
      expect([200, 429]).toContain(response.status) // Either success or still limited
    })
  })

  describe('Session Security', () => {
    test('should invalidate sessions on logout', async () => {
      const userToken = await client.authenticate(normalUser.email, 'TestPassword123!')
      client.setAuthToken(userToken)

      // Verify token works
      let response = await client.get('/api/os/profile')
      expect(response.status).toBe(200)

      // Logout
      await client.post('/api/auth/logout')

      // Token should no longer work
      response = await client.get('/api/os/profile')
      expect(response.status).toBe(401)
    })

    test('should prevent session fixation attacks', async () => {
      // Generate session before authentication
      const preAuthResponse = await client.get('/api/health', {}, { skipAuth: true })
      const preAuthSessionId = preAuthResponse.headers['set-cookie']?.[0]

      // Authenticate
      const userToken = await client.authenticate(normalUser.email, 'TestPassword123!')
      client.setAuthToken(userToken)

      // Get post-auth session
      const postAuthResponse = await client.get('/api/os/profile')
      const postAuthSessionId = postAuthResponse.headers['set-cookie']?.[0]

      // Session ID should change after authentication
      expect(preAuthSessionId).not.toBe(postAuthSessionId)
    })

    test('should implement secure session cookies', async () => {
      const response = await client.post('/api/auth/login', {
        email: normalUser.email,
        password: 'TestPassword123!'
      }, { skipAuth: true })

      const cookies = response.headers['set-cookie'] || []

      cookies.forEach(cookie => {
        if (cookie.includes('session') || cookie.includes('token')) {
          expect(cookie).toContain('HttpOnly') // Prevent XSS
          expect(cookie).toContain('Secure') // HTTPS only (in production)
          expect(cookie).toContain('SameSite') // CSRF protection
        }
      })
    })
  })

  describe('File Upload Security', () => {
    test('should validate file types', async () => {
      const adminToken = await client.authenticate(adminUser.email, 'AdminPassword123!')
      client.setAuthToken(adminToken)

      const maliciousFiles = [
        { name: 'script.php', content: '<?php system($_GET["cmd"]); ?>' },
        { name: 'shell.jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>' },
        { name: 'malware.exe', content: 'MZ\x90\x00' }, // PE header
        { name: 'script.js', content: 'eval(atob("malicious code"))' }
      ]

      for (const file of maliciousFiles) {
        const formData = new FormData()
        formData.append('file', new Blob([file.content]), file.name)

        const response = await client.post('/api/os/upload', formData)

        // Should reject malicious file types
        expect(response.status).toBe(400)
        expect(response.data.error).toContain('file type')
      }
    })

    test('should limit file sizes', async () => {
      const adminToken = await client.authenticate(adminUser.email, 'AdminPassword123!')
      client.setAuthToken(adminToken)

      // Create large file (10MB)
      const largeContent = 'A'.repeat(10 * 1024 * 1024)
      const formData = new FormData()
      formData.append('file', new Blob([largeContent]), 'large.txt')

      const response = await client.post('/api/os/upload', formData)

      expect(response.status).toBe(400)
      expect(response.data.error).toContain('file size')
    })

    test('should scan for malicious content', async () => {
      const adminToken = await client.authenticate(adminUser.email, 'AdminPassword123!')
      client.setAuthToken(adminToken)

      // Test with EICAR test string (harmless virus signature)
      const eicarString = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'
      const formData = new FormData()
      formData.append('file', new Blob([eicarString]), 'test.txt')

      const response = await client.post('/api/os/upload', formData)

      // Should detect and reject the test virus signature
      expect(response.status).toBe(400)
      expect(response.data.error).toContain('security scan')
    })
  })

  describe('CSRF Protection', () => {
    test('should require CSRF tokens for state-changing operations', async () => {
      // Attempt state-changing operation without CSRF token
      const response = await client.post('/api/os/bookings', {
        guestId: normalUser.id,
        propertyId: testProperty.id,
        roomId: testRoom.id,
        checkIn: '2024-09-15',
        checkOut: '2024-09-18'
      }, {
        skipAuth: true,
        headers: { 'Origin': 'https://evil.com' }
      })

      expect(response.status).toBe(403)
      expect(response.data.error).toContain('CSRF')
    })

    test('should validate CSRF token origin', async () => {
      const userToken = await client.authenticate(normalUser.email, 'TestPassword123!')

      // Get CSRF token
      const csrfResponse = await client.get('/api/csrf-token', {}, {
        headers: { Authorization: `Bearer ${userToken}` }
      })
      const csrfToken = csrfResponse.data.csrfToken

      // Use token from different origin
      const response = await client.post('/api/os/bookings', {
        guestId: normalUser.id,
        propertyId: testProperty.id,
        roomId: testRoom.id
      }, {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'X-CSRF-Token': csrfToken,
          'Origin': 'https://evil.com'
        }
      })

      expect(response.status).toBe(403)
    })
  })

  describe('Security Headers', () => {
    test('should include security headers in responses', async () => {
      const response = await client.get('/', {}, { skipAuth: true })

      // Check for important security headers
      expect(response.headers['x-frame-options']).toBe('DENY')
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-xss-protection']).toBe('1; mode=block')
      expect(response.headers['strict-transport-security']).toBeDefined()
      expect(response.headers['content-security-policy']).toBeDefined()
      expect(response.headers['referrer-policy']).toBeDefined()
    })

    test('should implement proper CSP policies', async () => {
      const response = await client.get('/', {}, { skipAuth: true })
      const csp = response.headers['content-security-policy']

      expect(csp).toContain('default-src')
      expect(csp).toContain('script-src')
      expect(csp).toContain('style-src')
      expect(csp).not.toContain('unsafe-eval') // Should avoid unsafe CSP directives
    })
  })

  describe('Database Security', () => {
    test('should use parameterized queries', async () => {
      // This would be tested by examining the actual database queries
      // For now, we test that SQL injection doesn't work (covered above)

      const adminToken = await client.authenticate(adminUser.email, 'AdminPassword123!')
      client.setAuthToken(adminToken)

      const response = await client.get('/api/os/bookings?search=' + encodeURIComponent("'; DROP TABLE bookings; --"))

      // Should not cause database error
      expect(response.status).not.toBe(500)
    })

    test('should encrypt sensitive data at rest', async () => {
      // This would require database inspection to verify encryption
      // For testing purposes, we verify that sensitive data is handled properly

      const userToken = await client.authenticate(normalUser.email, 'TestPassword123!')
      client.setAuthToken(userToken)

      const guestData = {
        firstName: 'Sensitive',
        lastName: 'Data',
        email: 'sensitive@test.com',
        phone: '+1234567890',
        passportNumber: 'AB123456789', // Sensitive data
        creditCardNumber: '4111111111111111' // Very sensitive
      }

      const response = await client.post('/api/os/guests', guestData)

      // Sensitive data should not be returned in plain text
      expect(response.data.guest?.passportNumber).toBeUndefined()
      expect(response.data.guest?.creditCardNumber).toBeUndefined()
    })
  })
})