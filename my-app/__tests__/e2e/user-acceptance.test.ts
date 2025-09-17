import { test, expect, Page } from '@playwright/test';

// User Acceptance Tests for Property Management System
// These tests cover complete user workflows from end-to-end

test.describe('Property Management System - User Acceptance Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Mock authentication for testing
    await page.route('**/api/auth/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user', role: 'manager', name: 'Test Manager' },
          token: 'mock-token'
        })
      });
    });

    await page.goto('http://localhost:3000');
  });

  test.describe('Room Management Workflow', () => {
    test('Manager can view and update room status', async () => {
      await test.step('Navigate to room management', async () => {
        await page.click('[data-testid="rooms-menu"]');
        await expect(page).toHaveURL(/.*\/rooms/);
        await expect(page.getByText('Room Management')).toBeVisible();
      });

      await test.step('View room list with status indicators', async () => {
        await expect(page.getByTestId('room-grid')).toBeVisible();

        // Should see room cards with status
        const roomCards = page.locator('[data-testid^="room-card-"]');
        await expect(roomCards.first()).toBeVisible();

        // Status indicators should be present
        await expect(page.locator('.status-indicator').first()).toBeVisible();
      });

      await test.step('Click on a room to view details', async () => {
        await page.click('[data-testid="room-card-101"]');

        // Should open room detail dialog
        await expect(page.getByTestId('room-detail-dialog')).toBeVisible();
        await expect(page.getByText('Room 101')).toBeVisible();
      });

      await test.step('Update room status', async () => {
        // Click edit button
        await page.click('[data-testid="edit-room-button"]');

        // Change status dropdown
        await page.click('[data-testid="room-status-select"]');
        await page.click('[data-testid="status-maintenance"]');

        // Add notes
        await page.fill('[data-testid="room-notes"]', 'AC unit needs inspection');

        // Save changes
        await page.click('[data-testid="save-room-button"]');

        // Should see success message
        await expect(page.getByText('Room updated successfully')).toBeVisible();

        // Status should be updated
        await expect(page.locator('[data-testid="room-status"]')).toContainText('Maintenance');
      });

      await test.step('Verify housekeeping task was created', async () => {
        await page.click('[data-testid="housekeeping-menu"]');
        await expect(page).toHaveURL(/.*\/housekeeping/);

        // Should see new maintenance task
        await expect(page.getByText('Maintenance Check - Room 101')).toBeVisible();
      });
    });

    test('Staff can view room inventory and report issues', async () => {
      await test.step('Navigate to room 102', async () => {
        await page.goto('/rooms/102');
        await expect(page.getByText('Room 102')).toBeVisible();
      });

      await test.step('View inventory tab', async () => {
        await page.click('[data-testid="inventory-tab"]');
        await expect(page.getByTestId('inventory-list')).toBeVisible();

        // Should see inventory items
        await expect(page.getByText('Bath Towels')).toBeVisible();
        await expect(page.getByText('Bed Sheets')).toBeVisible();
      });

      await test.step('Report damaged item', async () => {
        // Click on towels item
        await page.click('[data-testid="inventory-item-towels"]');

        // Mark as damaged
        await page.click('[data-testid="condition-select"]');
        await page.click('[data-testid="condition-damaged"]');

        // Add notes
        await page.fill('[data-testid="item-notes"]', 'Torn and stained');

        // Save changes
        await page.click('[data-testid="save-item-button"]');

        // Should see success message
        await expect(page.getByText('Inventory updated')).toBeVisible();
      });

      await test.step('Verify maintenance request created', async () => {
        await page.click('[data-testid="maintenance-menu"]');

        // Should see new maintenance request for damaged towels
        await expect(page.getByText('Replace Damaged Towels - Room 102')).toBeVisible();
      });
    });
  });

  test.describe('Housekeeping Task Management Workflow', () => {
    test('Housekeeper can view assigned tasks and complete them', async () => {
      await test.step('Login as housekeeper', async () => {
        await page.route('**/api/auth/**', (route) => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: { id: 'hk-001', role: 'housekeeper', name: 'Maria Rodriguez' },
              token: 'mock-token'
            })
          });
        });

        await page.reload();
        await expect(page.getByText('Maria Rodriguez')).toBeVisible();
      });

      await test.step('View assigned tasks', async () => {
        await page.click('[data-testid="my-tasks-menu"]');
        await expect(page).toHaveURL(/.*\/housekeeping\/my-tasks/);

        // Should see today's tasks
        await expect(page.getByTestId('task-list')).toBeVisible();
        await expect(page.getByText('Checkout Cleaning - Room 103')).toBeVisible();
      });

      await test.step('Start a task', async () => {
        await page.click('[data-testid="task-103"]');

        // Task detail should open
        await expect(page.getByTestId('task-detail')).toBeVisible();

        // Click start task
        await page.click('[data-testid="start-task-button"]');

        // Timer should start
        await expect(page.getByTestId('task-timer')).toBeVisible();
        await expect(page.getByTestId('task-status')).toContainText('In Progress');
      });

      await test.step('Complete checklist items', async () => {
        // Should see checklist
        await expect(page.getByTestId('task-checklist')).toBeVisible();

        // Check off items
        await page.check('[data-testid="checklist-item-0"]');
        await page.check('[data-testid="checklist-item-1"]');
        await page.check('[data-testid="checklist-item-2"]');

        // Progress bar should update
        const progressBar = page.getByTestId('task-progress');
        await expect(progressBar).toHaveAttribute('value', '60'); // 3 out of 5 items
      });

      await test.step('Add photos and notes', async () => {
        // Upload photo
        await page.setInputFiles('[data-testid="photo-upload"]', './test-fixtures/room-photo.jpg');

        // Add completion notes
        await page.fill('[data-testid="completion-notes"]', 'Room cleaned thoroughly, restocked amenities');
      });

      await test.step('Complete remaining items and finish task', async () => {
        // Complete remaining checklist items
        await page.check('[data-testid="checklist-item-3"]');
        await page.check('[data-testid="checklist-item-4"]');

        // Complete task button should be enabled
        await expect(page.getByTestId('complete-task-button')).toBeEnabled();
        await page.click('[data-testid="complete-task-button"]');

        // Should see completion confirmation
        await expect(page.getByText('Task completed successfully')).toBeVisible();

        // Task status should update
        await expect(page.getByTestId('task-status')).toContainText('Completed');
      });

      await test.step('Verify room status updated', async () => {
        await page.click('[data-testid="rooms-menu"]');
        await page.click('[data-testid="room-card-103"]');

        // Room should now be available
        await expect(page.getByTestId('room-status')).toContainText('Available');
      });
    });

    test('Supervisor can assign tasks and monitor progress', async () => {
      await test.step('Login as supervisor', async () => {
        await page.route('**/api/auth/**', (route) => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: { id: 'sv-001', role: 'supervisor', name: 'Sarah Johnson' },
              token: 'mock-token'
            })
          });
        });

        await page.reload();
      });

      await test.step('Create new housekeeping task', async () => {
        await page.click('[data-testid="housekeeping-menu"]');
        await page.click('[data-testid="create-task-button"]');

        // Fill task form
        await page.selectOption('[data-testid="task-type"]', 'deep_clean');
        await page.selectOption('[data-testid="task-room"]', 'room-104');
        await page.selectOption('[data-testid="task-priority"]', 'medium');
        await page.fill('[data-testid="task-title"]', 'Deep Clean Suite 104');
        await page.fill('[data-testid="task-description"]', 'Comprehensive cleaning before VIP guest arrival');

        // Assign to staff member
        await page.selectOption('[data-testid="assign-to"]', 'hk-002');

        // Set schedule
        await page.fill('[data-testid="scheduled-date"]', '2024-01-15');
        await page.fill('[data-testid="scheduled-time"]', '10:00');

        // Save task
        await page.click('[data-testid="save-task-button"]');

        await expect(page.getByText('Task created successfully')).toBeVisible();
      });

      await test.step('Monitor task progress', async () => {
        await page.click('[data-testid="dashboard-menu"]');

        // Should see task dashboard
        await expect(page.getByTestId('task-dashboard')).toBeVisible();

        // Check task statistics
        await expect(page.getByTestId('pending-tasks')).toBeVisible();
        await expect(page.getByTestId('in-progress-tasks')).toBeVisible();
        await expect(page.getByTestId('completed-tasks')).toBeVisible();

        // Should see the new task in pending
        await expect(page.getByText('Deep Clean Suite 104')).toBeVisible();
      });

      await test.step('Reassign task', async () => {
        await page.click('[data-testid="task-deep-clean-104"]');
        await page.click('[data-testid="reassign-button"]');

        // Select different staff member
        await page.selectOption('[data-testid="new-assignee"]', 'hk-001');
        await page.click('[data-testid="confirm-reassign"]');

        await expect(page.getByText('Task reassigned successfully')).toBeVisible();
      });
    });
  });

  test.describe('Maintenance Request Workflow', () => {
    test('Guest services can report maintenance issues', async () => {
      await test.step('Login as front desk agent', async () => {
        await page.route('**/api/auth/**', (route) => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: { id: 'fd-001', role: 'front_desk', name: 'John Smith' },
              token: 'mock-token'
            })
          });
        });

        await page.reload();
      });

      await test.step('Report maintenance issue', async () => {
        await page.click('[data-testid="maintenance-menu"]');
        await page.click('[data-testid="report-issue-button"]');

        // Fill maintenance form
        await page.selectOption('[data-testid="issue-room"]', 'room-105');
        await page.selectOption('[data-testid="issue-category"]', 'plumbing');
        await page.selectOption('[data-testid="issue-priority"]', 'high');
        await page.fill('[data-testid="issue-title"]', 'Bathroom leak');
        await page.fill('[data-testid="issue-description"]', 'Water leaking from sink faucet in room 105');

        // Mark as guest impact
        await page.check('[data-testid="guest-impact"]');

        // Add photo
        await page.setInputFiles('[data-testid="issue-photo"]', './test-fixtures/leak-photo.jpg');

        // Submit request
        await page.click('[data-testid="submit-issue-button"]');

        await expect(page.getByText('Maintenance request submitted')).toBeVisible();
      });

      await test.step('Verify maintenance request appears in list', async () => {
        await expect(page.getByText('Bathroom leak - Room 105')).toBeVisible();
        await expect(page.locator('[data-testid="priority-high"]')).toBeVisible();
      });
    });

    test('Maintenance staff can receive and complete requests', async () => {
      await test.step('Login as maintenance technician', async () => {
        await page.route('**/api/auth/**', (route) => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: { id: 'mt-001', role: 'maintenance', name: 'Bob Wilson' },
              token: 'mock-token'
            })
          });
        });

        await page.reload();
      });

      await test.step('View assigned maintenance requests', async () => {
        await page.click('[data-testid="my-requests-menu"]');

        // Should see assigned requests
        await expect(page.getByTestId('request-list')).toBeVisible();
        await expect(page.getByText('Bathroom leak - Room 105')).toBeVisible();
      });

      await test.step('Accept and start work on request', async () => {
        await page.click('[data-testid="request-105"]');

        // Request details should open
        await expect(page.getByTestId('request-detail')).toBeVisible();

        // Accept request
        await page.click('[data-testid="accept-request-button"]');

        // Start work
        await page.click('[data-testid="start-work-button"]');

        await expect(page.getByTestId('request-status')).toContainText('In Progress');
      });

      await test.step('Update progress and add parts used', async () => {
        // Add progress update
        await page.fill('[data-testid="progress-notes"]', 'Identified faulty valve, replacing now');

        // Add parts used
        await page.click('[data-testid="add-parts-button"]');
        await page.fill('[data-testid="part-name"]', 'Sink valve cartridge');
        await page.fill('[data-testid="part-cost"]', '15.99');
        await page.click('[data-testid="save-part-button"]');

        // Update progress
        await page.click('[data-testid="update-progress-button"]');
      });

      await test.step('Complete request', async () => {
        // Mark as completed
        await page.fill('[data-testid="completion-notes"]', 'Replaced faulty valve, leak stopped, tested thoroughly');
        await page.fill('[data-testid="total-time"]', '45');

        // Upload completion photo
        await page.setInputFiles('[data-testid="completion-photo"]', './test-fixtures/fixed-sink.jpg');

        // Complete request
        await page.click('[data-testid="complete-request-button"]');

        await expect(page.getByText('Maintenance request completed')).toBeVisible();
        await expect(page.getByTestId('request-status')).toContainText('Completed');
      });

      await test.step('Verify room status updated', async () => {
        await page.click('[data-testid="rooms-menu"]');
        await page.click('[data-testid="room-card-105"]');

        // Room should be available again
        await expect(page.getByTestId('room-status')).toContainText('Available');

        // Should see maintenance history
        await page.click('[data-testid="history-tab"]');
        await expect(page.getByText('Bathroom leak - Completed')).toBeVisible();
      });
    });
  });

  test.describe('Analytics and Reporting Workflow', () => {
    test('Manager can view comprehensive analytics dashboard', async () => {
      await test.step('Navigate to analytics', async () => {
        await page.click('[data-testid="analytics-menu"]');
        await expect(page).toHaveURL(/.*\/analytics/);
        await expect(page.getByText('Analytics & Reporting')).toBeVisible();
      });

      await test.step('View room utilization metrics', async () => {
        await page.click('[data-testid="utilization-tab"]');

        // Should see utilization charts
        await expect(page.getByTestId('occupancy-chart')).toBeVisible();
        await expect(page.getByTestId('revenue-chart')).toBeVisible();

        // Key metrics should be displayed
        await expect(page.getByTestId('avg-occupancy')).toBeVisible();
        await expect(page.getByTestId('total-revenue')).toBeVisible();
      });

      await test.step('View maintenance cost tracking', async () => {
        await page.click('[data-testid="maintenance-tab"]');

        // Should see maintenance analytics
        await expect(page.getByTestId('cost-breakdown-chart')).toBeVisible();
        await expect(page.getByTestId('frequency-chart')).toBeVisible();

        // Cost metrics should be visible
        await expect(page.getByTestId('total-maintenance-cost')).toBeVisible();
        await expect(page.getByTestId('avg-repair-time')).toBeVisible();
      });

      await test.step('View housekeeping efficiency', async () => {
        await page.click('[data-testid="housekeeping-tab"]');

        // Should see efficiency metrics
        await expect(page.getByTestId('efficiency-chart')).toBeVisible();
        await expect(page.getByTestId('task-completion-chart')).toBeVisible();

        // Staff performance should be visible
        await expect(page.getByTestId('staff-performance')).toBeVisible();
      });

      await test.step('Export analytics report', async () => {
        await page.click('[data-testid="export-report-button"]');

        // Download should start
        const downloadPromise = page.waitForEvent('download');
        await page.click('[data-testid="confirm-export"]');
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toMatch(/analytics-report-.+\.pdf/);
      });
    });
  });

  test.describe('Mobile Workflow', () => {
    test('Housekeeper can use mobile interface for task management', async () => {
      await test.step('Access mobile housekeeping interface', async () => {
        // Simulate mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        await page.goto('/mobile/housekeeping');
        await expect(page.getByText('Housekeeping')).toBeVisible();
      });

      await test.step('View mobile task list', async () => {
        // Should see mobile-optimized task list
        await expect(page.getByTestId('mobile-task-list')).toBeVisible();

        // Tasks should be displayed in mobile cards
        const taskCards = page.locator('[data-testid^="mobile-task-"]');
        await expect(taskCards.first()).toBeVisible();
      });

      await test.step('Start task from mobile interface', async () => {
        await page.click('[data-testid="mobile-task-106"]');

        // Should see mobile task execution view
        await expect(page.getByTestId('mobile-task-view')).toBeVisible();
        await expect(page.getByTestId('mobile-timer')).toBeVisible();

        // Start task
        await page.click('[data-testid="mobile-start-button"]');

        await expect(page.getByTestId('mobile-timer')).toContainText('00:');
      });

      await test.step('Complete checklist on mobile', async () => {
        // Mobile checklist should be touch-friendly
        await page.click('[data-testid="mobile-checklist-0"]');
        await page.click('[data-testid="mobile-checklist-1"]');

        // Progress should update
        await expect(page.getByTestId('mobile-progress')).toHaveAttribute('value', '40');
      });

      await test.step('Take photos with mobile camera', async () => {
        await page.click('[data-testid="mobile-camera-button"]');

        // Simulate camera capture
        await page.setInputFiles('[data-testid="mobile-photo-input"]', './test-fixtures/mobile-room.jpg');

        // Photo should appear in preview
        await expect(page.getByTestId('photo-preview')).toBeVisible();
      });
    });
  });

  test.describe('Integration Scenarios', () => {
    test('Complete guest checkout to room ready workflow', async () => {
      await test.step('Guest checks out of room', async () => {
        // Simulate PMS checkout
        await page.route('**/api/integrations/booking-sync', (route) => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                guestCheckedOut: true,
                roomId: 'room-107',
                checkoutTime: new Date()
              }
            })
          });
        });

        await page.goto('/rooms/107');
        await page.click('[data-testid="checkout-guest-button"]');

        // Room status should change to cleaning
        await expect(page.getByTestId('room-status')).toContainText('Cleaning');
      });

      await test.step('Housekeeping task automatically created', async () => {
        await page.click('[data-testid="housekeeping-menu"]');

        // Should see new checkout cleaning task
        await expect(page.getByText('Checkout Cleaning - Room 107')).toBeVisible();
      });

      await test.step('Housekeeper completes cleaning', async () => {
        // Switch to housekeeper view
        await page.route('**/api/auth/**', (route) => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: { id: 'hk-003', role: 'housekeeper', name: 'Lisa Park' },
              token: 'mock-token'
            })
          });
        });

        await page.reload();
        await page.click('[data-testid="task-107"]');

        // Complete all checklist items
        const checkboxes = page.locator('[data-testid^="checklist-item-"]');
        const count = await checkboxes.count();
        for (let i = 0; i < count; i++) {
          await checkboxes.nth(i).check();
        }

        // Complete task
        await page.click('[data-testid="complete-task-button"]');
      });

      await test.step('Room automatically becomes available', async () => {
        await page.click('[data-testid="rooms-menu"]');
        await page.click('[data-testid="room-card-107"]');

        // Room should be available
        await expect(page.getByTestId('room-status')).toContainText('Available');

        // Should be ready for next guest
        await expect(page.getByTestId('room-ready-indicator')).toBeVisible();
      });
    });

    test('Maintenance issue escalation workflow', async () => {
      await test.step('Emergency maintenance issue reported', async () => {
        await page.goto('/maintenance/report');

        // Report urgent issue
        await page.selectOption('[data-testid="issue-room"]', 'room-108');
        await page.selectOption('[data-testid="issue-category"]', 'electrical');
        await page.selectOption('[data-testid="issue-priority"]', 'emergency');
        await page.check('[data-testid="safety-risk"]');

        await page.fill('[data-testid="issue-title"]', 'Electrical sparking');
        await page.fill('[data-testid="issue-description"]', 'Outlet sparking in bathroom, safety hazard');

        await page.click('[data-testid="submit-issue-button"]');
      });

      await test.step('Room automatically marked out of order', async () => {
        await page.click('[data-testid="rooms-menu"]');
        await page.click('[data-testid="room-card-108"]');

        // Room should be out of order
        await expect(page.getByTestId('room-status')).toContainText('Out of Order');
      });

      await test.step('Maintenance staff receives immediate notification', async () => {
        // Check that push notification was triggered
        await expect(page.getByTestId('notification-alert')).toBeVisible();
        await expect(page.getByText('Emergency maintenance alert')).toBeVisible();
      });

      await test.step('Issue resolved and room restored', async () => {
        // Simulate maintenance completion
        await page.route('**/api/maintenance/complete', (route) => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              roomStatusUpdated: true
            })
          });
        });

        await page.click('[data-testid="resolve-issue-button"]');

        // Room should return to available
        await expect(page.getByTestId('room-status')).toContainText('Available');
      });
    });
  });

  test.afterEach(async () => {
    await page.close();
  });
});

// Performance and accessibility tests
test.describe('Performance and Accessibility', () => {
  test('Dashboard loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="dashboard-loaded"]');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
  });

  test('Mobile interface is touch-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/mobile/housekeeping');

    // Touch targets should be at least 44px
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Application is keyboard accessible', async ({ page }) => {
    await page.goto('/rooms');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'INPUT', 'SELECT', 'A']).toContain(focusedElement);

    // Should be able to activate with Enter/Space
    await page.keyboard.press('Enter');
    // Verify some interaction occurred (context dependent)
  });
});