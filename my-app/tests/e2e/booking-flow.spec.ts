import { test, expect, Page, BrowserContext } from '@playwright/test'
import { createTestUser, createTestProperty, createTestRoom } from '../utils/test-fixtures'

test.describe('End-to-End Booking Flow', () => {
  let page: Page
  let context: BrowserContext
  let testProperty: any
  let testRoom: any

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()

    // Setup test data
    testProperty = await createTestProperty({
      name: 'E2E Test Hotel',
      address: '123 E2E Test Street'
    })
    testRoom = await createTestRoom({
      propertyId: testProperty.id,
      number: '101',
      type: 'standard',
      rate: 150
    })
  })

  test.afterAll(async () => {
    await context.close()
  })

  test.describe('Guest Booking Journey', () => {
    test('should complete full booking process from search to confirmation', async () => {
      // Step 1: Navigate to homepage
      await page.goto('/')
      await expect(page).toHaveTitle(/Baithaka Ghar/)

      // Step 2: Perform room search
      await page.fill('[data-testid="check-in-date"]', '2024-07-15')
      await page.fill('[data-testid="check-out-date"]', '2024-07-18')
      await page.selectOption('[data-testid="guest-count"]', '2')
      await page.click('[data-testid="search-rooms-btn"]')

      // Wait for search results
      await page.waitForSelector('[data-testid="room-results"]')
      await expect(page.locator('[data-testid="room-card"]')).toHaveCount(1)

      // Step 3: Select room and view details
      await page.click('[data-testid="room-card"]:first-child [data-testid="view-details-btn"]')
      await page.waitForSelector('[data-testid="room-details-modal"]')

      // Verify room details
      await expect(page.locator('[data-testid="room-number"]')).toContainText('101')
      await expect(page.locator('[data-testid="room-rate"]')).toContainText('$150')
      await expect(page.locator('[data-testid="total-amount"]')).toContainText('$450')

      // Step 4: Proceed to booking
      await page.click('[data-testid="book-now-btn"]')
      await page.waitForSelector('[data-testid="booking-form"]')

      // Step 5: Fill guest information
      await page.fill('[data-testid="guest-first-name"]', 'John')
      await page.fill('[data-testid="guest-last-name"]', 'Doe')
      await page.fill('[data-testid="guest-email"]', 'john.doe@example.com')
      await page.fill('[data-testid="guest-phone"]', '+1234567890')

      // Step 6: Fill payment information
      await page.fill('[data-testid="card-number"]', '4111111111111111')
      await page.fill('[data-testid="card-expiry"]', '12/25')
      await page.fill('[data-testid="card-cvv"]', '123')
      await page.fill('[data-testid="cardholder-name"]', 'John Doe')

      // Step 7: Add special requests (optional)
      await page.fill('[data-testid="special-requests"]', 'Late checkout requested')

      // Step 8: Review booking summary
      await expect(page.locator('[data-testid="booking-summary-total"]')).toContainText('$450')
      await expect(page.locator('[data-testid="booking-summary-nights"]')).toContainText('3 nights')

      // Step 9: Accept terms and submit booking
      await page.check('[data-testid="terms-checkbox"]')
      await page.click('[data-testid="confirm-booking-btn"]')

      // Step 10: Wait for booking confirmation
      await page.waitForSelector('[data-testid="booking-confirmation"]', { timeout: 30000 })

      // Verify confirmation details
      await expect(page.locator('[data-testid="confirmation-number"]')).toBeVisible()
      await expect(page.locator('[data-testid="confirmation-email"]')).toContainText('john.doe@example.com')
      await expect(page.locator('[data-testid="confirmation-dates"]')).toContainText('Jul 15 - Jul 18, 2024')

      // Step 11: Download confirmation PDF
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="download-confirmation-btn"]')
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/booking-confirmation-.*\.pdf/)

      // Step 12: Verify email notification was sent
      await expect(page.locator('[data-testid="email-sent-notification"]')).toBeVisible()
    })

    test('should handle payment failures gracefully', async () => {
      await page.goto('/')

      // Perform search and select room
      await page.fill('[data-testid="check-in-date"]', '2024-08-15')
      await page.fill('[data-testid="check-out-date"]', '2024-08-18')
      await page.click('[data-testid="search-rooms-btn"]')
      await page.waitForSelector('[data-testid="room-results"]')
      await page.click('[data-testid="room-card"]:first-child [data-testid="book-now-btn"]')

      // Fill guest information
      await page.fill('[data-testid="guest-first-name"]', 'Jane')
      await page.fill('[data-testid="guest-last-name"]', 'Smith')
      await page.fill('[data-testid="guest-email"]', 'jane.smith@example.com')
      await page.fill('[data-testid="guest-phone"]', '+1234567890')

      // Use declined test card
      await page.fill('[data-testid="card-number"]', '4000000000000002')
      await page.fill('[data-testid="card-expiry"]', '12/25')
      await page.fill('[data-testid="card-cvv"]', '123')
      await page.fill('[data-testid="cardholder-name"]', 'Jane Smith')

      await page.check('[data-testid="terms-checkbox"]')
      await page.click('[data-testid="confirm-booking-btn"]')

      // Wait for error message
      await page.waitForSelector('[data-testid="payment-error"]')
      await expect(page.locator('[data-testid="payment-error"]')).toContainText('Payment declined')

      // Verify user can retry with different card
      await expect(page.locator('[data-testid="retry-payment-btn"]')).toBeVisible()

      // Update to valid card
      await page.fill('[data-testid="card-number"]', '4111111111111111')
      await page.click('[data-testid="retry-payment-btn"]')

      // Should succeed this time
      await page.waitForSelector('[data-testid="booking-confirmation"]')
      await expect(page.locator('[data-testid="confirmation-number"]')).toBeVisible()
    })

    test('should validate form inputs correctly', async () => {
      await page.goto('/')

      // Perform search and select room
      await page.fill('[data-testid="check-in-date"]', '2024-09-15')
      await page.fill('[data-testid="check-out-date"]', '2024-09-18')
      await page.click('[data-testid="search-rooms-btn"]')
      await page.waitForSelector('[data-testid="room-results"]')
      await page.click('[data-testid="room-card"]:first-child [data-testid="book-now-btn"]')

      // Try to submit without filling required fields
      await page.click('[data-testid="confirm-booking-btn"]')

      // Verify validation errors
      await expect(page.locator('[data-testid="error-first-name"]')).toContainText('First name is required')
      await expect(page.locator('[data-testid="error-email"]')).toContainText('Email is required')
      await expect(page.locator('[data-testid="error-card-number"]')).toContainText('Card number is required')

      // Fill with invalid email
      await page.fill('[data-testid="guest-email"]', 'invalid-email')
      await page.click('[data-testid="confirm-booking-btn"]')
      await expect(page.locator('[data-testid="error-email"]')).toContainText('Invalid email format')

      // Fill with invalid card number
      await page.fill('[data-testid="card-number"]', '1234')
      await page.click('[data-testid="confirm-booking-btn"]')
      await expect(page.locator('[data-testid="error-card-number"]')).toContainText('Invalid card number')

      // Fill with expired card
      await page.fill('[data-testid="card-number"]', '4111111111111111')
      await page.fill('[data-testid="card-expiry"]', '01/20')
      await page.click('[data-testid="confirm-booking-btn"]')
      await expect(page.locator('[data-testid="error-card-expiry"]')).toContainText('Card has expired')
    })
  })

  test.describe('Booking Management', () => {
    let confirmationNumber: string

    test.beforeEach(async () => {
      // Create a booking first
      await page.goto('/')
      await page.fill('[data-testid="check-in-date"]', '2024-10-15')
      await page.fill('[data-testid="check-out-date"]', '2024-10-18')
      await page.click('[data-testid="search-rooms-btn"]')
      await page.waitForSelector('[data-testid="room-results"]')
      await page.click('[data-testid="room-card"]:first-child [data-testid="book-now-btn"]')

      // Fill booking form
      await page.fill('[data-testid="guest-first-name"]', 'Alice')
      await page.fill('[data-testid="guest-last-name"]', 'Johnson')
      await page.fill('[data-testid="guest-email"]', 'alice.johnson@example.com')
      await page.fill('[data-testid="guest-phone"]', '+1234567890')
      await page.fill('[data-testid="card-number"]', '4111111111111111')
      await page.fill('[data-testid="card-expiry"]', '12/25')
      await page.fill('[data-testid="card-cvv"]', '123')
      await page.fill('[data-testid="cardholder-name"]', 'Alice Johnson')

      await page.check('[data-testid="terms-checkbox"]')
      await page.click('[data-testid="confirm-booking-btn"]')

      await page.waitForSelector('[data-testid="booking-confirmation"]')
      confirmationNumber = await page.locator('[data-testid="confirmation-number"]').textContent() || ''
    })

    test('should allow guests to view booking details', async () => {
      // Navigate to booking lookup
      await page.goto('/bookings/lookup')

      // Enter confirmation number and email
      await page.fill('[data-testid="confirmation-number"]', confirmationNumber)
      await page.fill('[data-testid="guest-email"]', 'alice.johnson@example.com')
      await page.click('[data-testid="lookup-booking-btn"]')

      // Verify booking details are displayed
      await page.waitForSelector('[data-testid="booking-details"]')
      await expect(page.locator('[data-testid="booking-guest-name"]')).toContainText('Alice Johnson')
      await expect(page.locator('[data-testid="booking-dates"]')).toContainText('Oct 15 - Oct 18, 2024')
      await expect(page.locator('[data-testid="booking-total"]')).toContainText('$450')
    })

    test('should allow guests to modify booking dates', async () => {
      await page.goto('/bookings/lookup')
      await page.fill('[data-testid="confirmation-number"]', confirmationNumber)
      await page.fill('[data-testid="guest-email"]', 'alice.johnson@example.com')
      await page.click('[data-testid="lookup-booking-btn"]')

      await page.waitForSelector('[data-testid="booking-details"]')

      // Click modify booking
      await page.click('[data-testid="modify-booking-btn"]')
      await page.waitForSelector('[data-testid="modify-booking-form"]')

      // Change checkout date
      await page.fill('[data-testid="new-check-out-date"]', '2024-10-20')
      await page.click('[data-testid="calculate-new-total-btn"]')

      // Verify new total
      await expect(page.locator('[data-testid="new-total"]')).toContainText('$750')

      // Confirm modification
      await page.click('[data-testid="confirm-modification-btn"]')

      // Wait for confirmation
      await page.waitForSelector('[data-testid="modification-confirmation"]')
      await expect(page.locator('[data-testid="new-checkout-date"]')).toContainText('Oct 20, 2024')
    })

    test('should allow guests to cancel booking', async () => {
      await page.goto('/bookings/lookup')
      await page.fill('[data-testid="confirmation-number"]', confirmationNumber)
      await page.fill('[data-testid="guest-email"]', 'alice.johnson@example.com')
      await page.click('[data-testid="lookup-booking-btn"]')

      await page.waitForSelector('[data-testid="booking-details"]')

      // Click cancel booking
      await page.click('[data-testid="cancel-booking-btn"]')
      await page.waitForSelector('[data-testid="cancellation-modal"]')

      // Review cancellation policy
      await expect(page.locator('[data-testid="cancellation-policy"]')).toBeVisible()
      await expect(page.locator('[data-testid="refund-amount"]')).toContainText('$450')

      // Confirm cancellation
      await page.fill('[data-testid="cancellation-reason"]', 'Change of plans')
      await page.click('[data-testid="confirm-cancellation-btn"]')

      // Wait for cancellation confirmation
      await page.waitForSelector('[data-testid="cancellation-confirmation"]')
      await expect(page.locator('[data-testid="booking-status"]')).toContainText('Cancelled')
      await expect(page.locator('[data-testid="refund-processing"]')).toBeVisible()
    })
  })

  test.describe('Mobile Responsive Booking', () => {
    test('should work correctly on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/')

      // Verify mobile navigation
      await page.click('[data-testid="mobile-menu-toggle"]')
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

      // Close mobile menu
      await page.click('[data-testid="mobile-menu-close"]')

      // Perform search on mobile
      await page.fill('[data-testid="check-in-date"]', '2024-11-15')
      await page.fill('[data-testid="check-out-date"]', '2024-11-18')
      await page.click('[data-testid="search-rooms-btn"]')

      await page.waitForSelector('[data-testid="room-results"]')

      // Select room on mobile
      await page.click('[data-testid="room-card"]:first-child')
      await page.waitForSelector('[data-testid="mobile-room-details"]')

      // Book on mobile
      await page.click('[data-testid="mobile-book-btn"]')
      await page.waitForSelector('[data-testid="mobile-booking-form"]')

      // Fill form on mobile (with scrolling)
      await page.fill('[data-testid="guest-first-name"]', 'Mobile')
      await page.fill('[data-testid="guest-last-name"]', 'User')
      await page.fill('[data-testid="guest-email"]', 'mobile.user@example.com')

      // Scroll to payment section
      await page.locator('[data-testid="payment-section"]').scrollIntoViewIfNeeded()

      await page.fill('[data-testid="card-number"]', '4111111111111111')
      await page.fill('[data-testid="card-expiry"]', '12/25')
      await page.fill('[data-testid="card-cvv"]', '123')

      // Submit booking
      await page.check('[data-testid="terms-checkbox"]')
      await page.click('[data-testid="confirm-booking-btn"]')

      // Verify mobile confirmation page
      await page.waitForSelector('[data-testid="mobile-confirmation"]')
      await expect(page.locator('[data-testid="confirmation-number"]')).toBeVisible()
    })
  })

  test.describe('Accessibility Features', () => {
    test('should be keyboard navigable', async () => {
      await page.goto('/')

      // Navigate using keyboard
      await page.keyboard.press('Tab') // Focus on check-in input
      await page.keyboard.type('07/15/2024')

      await page.keyboard.press('Tab') // Focus on check-out input
      await page.keyboard.type('07/18/2024')

      await page.keyboard.press('Tab') // Focus on guests select
      await page.keyboard.press('ArrowDown') // Select 2 guests

      await page.keyboard.press('Tab') // Focus on search button
      await page.keyboard.press('Enter') // Submit search

      await page.waitForSelector('[data-testid="room-results"]')

      // Navigate to first room
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter') // Select room

      await page.waitForSelector('[data-testid="booking-form"]')

      // Verify form is keyboard accessible
      await page.keyboard.press('Tab')
      await page.keyboard.type('Keyboard')
      await page.keyboard.press('Tab')
      await page.keyboard.type('User')

      // Verify all form elements are reachable
      const focusableElements = await page.locator('[tabindex]:not([tabindex="-1"]), input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled])').count()
      expect(focusableElements).toBeGreaterThan(10)
    })

    test('should have proper ARIA labels and roles', async () => {
      await page.goto('/')

      // Check search form accessibility
      await expect(page.locator('[data-testid="check-in-date"]')).toHaveAttribute('aria-label')
      await expect(page.locator('[data-testid="check-out-date"]')).toHaveAttribute('aria-label')
      await expect(page.locator('[data-testid="guest-count"]')).toHaveAttribute('aria-label')

      // Perform search to check results accessibility
      await page.fill('[data-testid="check-in-date"]', '2024-12-15')
      await page.fill('[data-testid="check-out-date"]', '2024-12-18')
      await page.click('[data-testid="search-rooms-btn"]')

      await page.waitForSelector('[data-testid="room-results"]')

      // Check room cards have proper roles
      await expect(page.locator('[data-testid="room-card"]').first()).toHaveAttribute('role', 'article')
      await expect(page.locator('[data-testid="room-card"] h3').first()).toHaveAttribute('role', 'heading')

      // Check booking form accessibility
      await page.click('[data-testid="room-card"]:first-child [data-testid="book-now-btn"]')
      await page.waitForSelector('[data-testid="booking-form"]')

      await expect(page.locator('[data-testid="booking-form"]')).toHaveAttribute('role', 'form')
      await expect(page.locator('[data-testid="guest-first-name"]')).toHaveAttribute('aria-required', 'true')
      await expect(page.locator('[data-testid="guest-email"]')).toHaveAttribute('aria-required', 'true')
    })

    test('should work with screen readers', async () => {
      await page.goto('/')

      // Check for screen reader friendly content
      await expect(page.locator('[data-testid="main-heading"]')).toHaveAttribute('role', 'heading')
      await expect(page.locator('[data-testid="search-form"]')).toHaveAttribute('aria-label', 'Search for rooms')

      // Verify error messages are announced
      await page.click('[data-testid="search-rooms-btn"]') // Search without dates

      const errorMessage = page.locator('[data-testid="error-check-in"]')
      await expect(errorMessage).toHaveAttribute('role', 'alert')
      await expect(errorMessage).toHaveAttribute('aria-live', 'polite')
    })
  })

  test.describe('Performance Testing', () => {
    test('should load booking page within acceptable time', async () => {
      const startTime = Date.now()

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds

      // Check core web vitals
      const lcpMetric = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            resolve(lastEntry.startTime)
          }).observe({ entryTypes: ['largest-contentful-paint'] })
        })
      })

      expect(lcpMetric).toBeLessThan(2500) // LCP should be under 2.5s
    })

    test('should handle multiple concurrent bookings', async () => {
      // Create multiple browser contexts to simulate concurrent users
      const contexts = await Promise.all([
        context.browser()?.newContext(),
        context.browser()?.newContext(),
        context.browser()?.newContext()
      ])

      const pages = await Promise.all(
        contexts.map(ctx => ctx?.newPage())
      )

      // Simulate concurrent booking attempts
      const bookingPromises = pages.map(async (page, index) => {
        if (!page) return

        await page.goto('/')
        await page.fill('[data-testid="check-in-date"]', '2025-01-15')
        await page.fill('[data-testid="check-out-date"]', '2025-01-18')
        await page.click('[data-testid="search-rooms-btn"]')
        await page.waitForSelector('[data-testid="room-results"]')
        await page.click('[data-testid="room-card"]:first-child [data-testid="book-now-btn"]')

        // Fill unique guest info
        await page.fill('[data-testid="guest-first-name"]', `User${index}`)
        await page.fill('[data-testid="guest-last-name"]', `Test${index}`)
        await page.fill('[data-testid="guest-email"]', `user${index}@example.com`)
        await page.fill('[data-testid="guest-phone"]', `+123456789${index}`)
        await page.fill('[data-testid="card-number"]', '4111111111111111')
        await page.fill('[data-testid="card-expiry"]', '12/25')
        await page.fill('[data-testid="card-cvv"]', '123')

        await page.check('[data-testid="terms-checkbox"]')
        await page.click('[data-testid="confirm-booking-btn"]')

        return page.waitForSelector('[data-testid="booking-confirmation"]', { timeout: 30000 })
      })

      // Wait for all bookings to complete
      const results = await Promise.allSettled(bookingPromises)

      // At least one should succeed (first one to book the room)
      const successful = results.filter(result => result.status === 'fulfilled')
      expect(successful.length).toBeGreaterThan(0)

      // Clean up contexts
      await Promise.all(contexts.map(ctx => ctx?.close()))
    })
  })
})