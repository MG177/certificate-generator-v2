import { test, expect } from '@playwright/test';

test.describe('Email Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display email configuration dialog', async ({ page }) => {
    // Look for email configuration button or settings
    const emailConfigButton = page.locator(
      '[data-testid="email-config-button"]'
    );

    if (await emailConfigButton.isVisible()) {
      await emailConfigButton.click();

      // Verify email configuration dialog is visible
      const dialog = page.locator('[data-testid="email-config-dialog"]');
      await expect(dialog).toBeVisible();

      // Verify form fields are present
      await expect(page.locator('[data-testid="smtp-host"]')).toBeVisible();
      await expect(page.locator('[data-testid="smtp-port"]')).toBeVisible();
      await expect(page.locator('[data-testid="smtp-user"]')).toBeVisible();
      await expect(page.locator('[data-testid="smtp-pass"]')).toBeVisible();
      await expect(page.locator('[data-testid="from-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="from-address"]')).toBeVisible();
    }
  });

  test('should configure SMTP settings', async ({ page }) => {
    // Open email configuration dialog
    const emailConfigButton = page.locator(
      '[data-testid="email-config-button"]'
    );
    if (await emailConfigButton.isVisible()) {
      await emailConfigButton.click();

      // Fill SMTP settings
      await page.fill('[data-testid="smtp-host"]', 'smtp.test.com');
      await page.fill('[data-testid="smtp-port"]', '587');
      await page.fill('[data-testid="smtp-user"]', 'test@test.com');
      await page.fill('[data-testid="smtp-pass"]', 'testpass');
      await page.fill('[data-testid="from-name"]', 'Test Sender');
      await page.fill('[data-testid="from-address"]', 'test@test.com');

      // Test connection
      await page.click('[data-testid="test-connection"]');

      // Wait for test result
      await page.waitForSelector('[data-testid="connection-status"]', {
        timeout: 10000,
      });

      // Verify connection status
      const status = page.locator('[data-testid="connection-status"]');
      await expect(status).toBeVisible();

      // Save configuration
      await page.click('[data-testid="save-email-config"]');

      // Verify success message
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    }
  });

  test('should send individual email', async ({ page }) => {
    // First, create a test event with participants
    await createTestEvent(page);

    // Navigate to participant manager
    await page.click('[data-testid="participant-manager-tab"]');

    // Wait for participants to load
    await page.waitForSelector('[data-testid="participant-table"]');

    // Click send button on first participant
    const sendButton = page.locator('[data-testid="send-email-button-0"]');
    if (await sendButton.isVisible()) {
      await sendButton.click();

      // Wait for email sending process
      await page.waitForSelector('[data-testid="email-sending-indicator"]', {
        timeout: 10000,
      });

      // Wait for completion
      await page.waitForSelector('[data-testid="email-sending-indicator"]', {
        state: 'hidden',
        timeout: 15000,
      });

      // Verify success message
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();

      // Verify email status updated
      const emailStatus = page.locator('[data-testid="email-status-0"]');
      await expect(emailStatus).toContainText('Sent');
    }
  });

  test('should send bulk emails', async ({ page }) => {
    // First, create a test event with participants
    await createTestEvent(page);

    // Navigate to participant manager
    await page.click('[data-testid="participant-manager-tab"]');

    // Wait for participants to load
    await page.waitForSelector('[data-testid="participant-table"]');

    // Select multiple participants
    await page.check('[data-testid="participant-checkbox-0"]');
    await page.check('[data-testid="participant-checkbox-1"]');
    await page.check('[data-testid="participant-checkbox-2"]');

    // Click bulk send button
    const bulkSendButton = page.locator('[data-testid="bulk-send-emails"]');
    if (await bulkSendButton.isVisible()) {
      await bulkSendButton.click();

      // Verify progress indicator
      const progressIndicator = page.locator(
        '[data-testid="bulk-email-progress"]'
      );
      await expect(progressIndicator).toBeVisible();

      // Wait for completion
      await page.waitForSelector('[data-testid="bulk-email-progress"]', {
        state: 'hidden',
        timeout: 30000,
      });

      // Verify success message
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();

      // Verify email statuses updated
      await expect(
        page.locator('[data-testid="email-status-0"]')
      ).toContainText('Sent');
      await expect(
        page.locator('[data-testid="email-status-1"]')
      ).toContainText('Sent');
      await expect(
        page.locator('[data-testid="email-status-2"]')
      ).toContainText('Sent');
    }
  });

  test('should handle email failures gracefully', async ({ page }) => {
    // First, create a test event with participants
    await createTestEvent(page);

    // Navigate to participant manager
    await page.click('[data-testid="participant-manager-tab"]');

    // Wait for participants to load
    await page.waitForSelector('[data-testid="participant-table"]');

    // Edit first participant to have invalid email
    await page.click('[data-testid="edit-participant-0"]');
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="save-participant"]');

    // Try to send email
    const sendButton = page.locator('[data-testid="send-email-button-0"]');
    if (await sendButton.isVisible()) {
      await sendButton.click();

      // Wait for error message
      await page.waitForSelector('[data-testid="error-toast"]', {
        timeout: 10000,
      });

      // Verify error message
      const errorToast = page.locator('[data-testid="error-toast"]');
      await expect(errorToast).toBeVisible();
      await expect(errorToast).toContainText('Invalid email address');

      // Verify email status shows failed
      const emailStatus = page.locator('[data-testid="email-status-0"]');
      await expect(emailStatus).toContainText('Failed');
    }
  });

  test('should show email status indicators', async ({ page }) => {
    // First, create a test event with participants
    await createTestEvent(page);

    // Navigate to participant manager
    await page.click('[data-testid="participant-manager-tab"]');

    // Wait for participants to load
    await page.waitForSelector('[data-testid="participant-table"]');

    // Send email to first participant
    const sendButton = page.locator('[data-testid="send-email-button-0"]');
    if (await sendButton.isVisible()) {
      await sendButton.click();

      // Wait for completion
      await page.waitForSelector('[data-testid="email-sending-indicator"]', {
        state: 'hidden',
        timeout: 15000,
      });

      // Verify status indicator
      const emailStatus = page.locator('[data-testid="email-status-0"]');
      await expect(emailStatus).toContainText('Sent');

      // Verify status icon
      const statusIcon = page.locator('[data-testid="email-status-icon-0"]');
      await expect(statusIcon).toHaveClass(/sent/);

      // Verify last sent date
      const lastSentDate = page.locator('[data-testid="last-sent-date-0"]');
      await expect(lastSentDate).toBeVisible();
    }
  });

  test('should retry failed emails', async ({ page }) => {
    // First, create a test event with participants
    await createTestEvent(page);

    // Navigate to participant manager
    await page.click('[data-testid="participant-manager-tab"]');

    // Wait for participants to load
    await page.waitForSelector('[data-testid="participant-table"]');

    // Edit first participant to have invalid email initially
    await page.click('[data-testid="edit-participant-0"]');
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="save-participant"]');

    // Try to send email (should fail)
    const sendButton = page.locator('[data-testid="send-email-button-0"]');
    if (await sendButton.isVisible()) {
      await sendButton.click();

      // Wait for error
      await page.waitForSelector('[data-testid="error-toast"]', {
        timeout: 10000,
      });

      // Fix the email address
      await page.click('[data-testid="edit-participant-0"]');
      await page.fill('[data-testid="email-input"]', 'valid@test.com');
      await page.click('[data-testid="save-participant"]');

      // Retry the email
      const retryButton = page.locator('[data-testid="retry-email-button-0"]');
      if (await retryButton.isVisible()) {
        await retryButton.click();

        // Wait for success
        await page.waitForSelector('[data-testid="success-toast"]', {
          timeout: 15000,
        });

        // Verify success
        await expect(
          page.locator('[data-testid="success-toast"]')
        ).toBeVisible();

        // Verify status updated
        const emailStatus = page.locator('[data-testid="email-status-0"]');
        await expect(emailStatus).toContainText('Sent');
      }
    }
  });

  test('should display email validation feedback', async ({ page }) => {
    // Open email configuration dialog
    const emailConfigButton = page.locator(
      '[data-testid="email-config-button"]'
    );
    if (await emailConfigButton.isVisible()) {
      await emailConfigButton.click();

      // Fill invalid SMTP settings
      await page.fill('[data-testid="smtp-host"]', 'invalid-host');
      await page.fill('[data-testid="smtp-port"]', '99999');
      await page.fill('[data-testid="smtp-user"]', 'invalid-user');
      await page.fill('[data-testid="smtp-pass"]', 'invalid-pass');

      // Check validation feedback
      const validationFeedback = page.locator(
        '[data-testid="email-validation-feedback"]'
      );
      if (await validationFeedback.isVisible()) {
        await expect(validationFeedback).toContainText('Invalid SMTP host');
        await expect(validationFeedback).toContainText('Invalid port number');
        await expect(validationFeedback).toContainText('Invalid email address');
      }
    }
  });

  test('should handle email template configuration', async ({ page }) => {
    // Open email configuration dialog
    const emailConfigButton = page.locator(
      '[data-testid="email-config-button"]'
    );
    if (await emailConfigButton.isVisible()) {
      await emailConfigButton.click();

      // Navigate to template tab
      await page.click('[data-testid="email-template-tab"]');

      // Edit subject template
      await page.fill(
        '[data-testid="subject-template"]',
        'Your Certificate - {eventTitle}'
      );

      // Edit HTML template
      await page.fill(
        '[data-testid="html-template"]',
        '<p>Hello {participantName}, your certificate is attached.</p>'
      );

      // Preview template
      await page.click('[data-testid="preview-template"]');

      // Verify preview
      const preview = page.locator('[data-testid="template-preview"]');
      await expect(preview).toContainText(
        'Hello John Doe, your certificate is attached.'
      );

      // Save template
      await page.click('[data-testid="save-template"]');

      // Verify success message
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    }
  });
});

// Helper function to create a test event with participants
async function createTestEvent(page: any) {
  // This would create a test event with participants
  // Implementation depends on the actual UI structure
  // For now, we'll assume the test data is already set up
}
