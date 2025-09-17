import { test, expect } from '@playwright/test';

test.describe('Email Performance Tests', () => {
  test('should handle bulk email sending efficiently', async ({ page }) => {
    const startTime = Date.now();

    // Create 100 test participants
    const participants = Array.from({ length: 100 }, (_, i) => ({
      name: `Participant ${i + 1}`,
      email: `participant${i + 1}@test.com`,
      certification_id: `CERT-${(i + 1).toString().padStart(3, '0')}`,
    }));

    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Upload participants via CSV
    await page.click('[data-testid="upload-csv"]');

    // Create CSV content
    const csvContent = [
      'name,certification_id,email',
      ...participants.map((p) => `${p.name},${p.certification_id},${p.email}`),
    ].join('\n');

    // Upload CSV file
    const fileInput = page.locator('[data-testid="csv-file"]');
    await fileInput.setInputFiles({
      name: 'participants.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Wait for upload to complete
    await page.waitForSelector('[data-testid="upload-success"]', {
      timeout: 10000,
    });

    // Select all participants
    await page.click('[data-testid="select-all-participants"]');

    // Send bulk emails
    await page.click('[data-testid="bulk-send-emails"]');

    // Wait for completion
    await page.waitForSelector('[data-testid="bulk-email-progress"]', {
      state: 'hidden',
      timeout: 120000,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within 2 minutes
    expect(duration).toBeLessThan(120000);

    // Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });

  test('should respect rate limiting', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Create a test event with participants
    await createTestEvent(page);

    // Navigate to participant manager
    await page.click('[data-testid="participant-manager-tab"]');
    await page.waitForSelector('[data-testid="participant-table"]');

    // Try to send emails rapidly
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="send-email-button-0"]');
      await page.waitForTimeout(100); // 100ms between sends
    }

    // Should show rate limit error
    await expect(
      page.locator('[data-testid="rate-limit-error"]')
    ).toBeVisible();
  });

  test('should not leak memory during bulk email sending', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Get initial memory usage
    const initialMemory = await page.evaluate(
      () => performance.memory?.usedJSHeapSize || 0
    );

    // Create test event with participants
    await createTestEvent(page);

    // Navigate to participant manager
    await page.click('[data-testid="participant-manager-tab"]');
    await page.waitForSelector('[data-testid="participant-table"]');

    // Send 50 emails
    for (let i = 0; i < 50; i++) {
      await page.click('[data-testid="send-email-button-0"]');
      await page.waitForTimeout(100);
    }

    // Force garbage collection
    await page.evaluate(() => {
      if (window.gc) window.gc();
    });

    // Get final memory usage
    const finalMemory = await page.evaluate(
      () => performance.memory?.usedJSHeapSize || 0
    );

    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  test('should handle concurrent email sending', async ({ page, context }) => {
    // Create multiple browser contexts to simulate concurrent users
    const contexts = await Promise.all([
      context,
      await context.browser()?.newContext(),
      await context.browser()?.newContext(),
    ]);

    const pages = await Promise.all(contexts.map((ctx) => ctx?.newPage()));

    // Navigate all pages to the application
    await Promise.all(pages.map((p) => p?.goto('http://localhost:3000')));

    // Create test events on each page
    await Promise.all(pages.map((p) => createTestEvent(p)));

    // Start sending emails concurrently
    const startTime = Date.now();

    await Promise.all(
      pages.map(async (p, index) => {
        if (p) {
          await p.click('[data-testid="participant-manager-tab"]');
          await p.waitForSelector('[data-testid="participant-table"]');

          // Send emails with different participants
          for (let i = 0; i < 10; i++) {
            await p.click(`[data-testid="send-email-button-${i}"]`);
            await p.waitForTimeout(100);
          }
        }
      })
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time
    expect(duration).toBeLessThan(60000); // 1 minute

    // Close additional contexts
    await Promise.all(contexts.slice(1).map((ctx) => ctx?.close()));
  });

  test('should handle large email templates efficiently', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Open email configuration
    const emailConfigButton = page.locator(
      '[data-testid="email-config-button"]'
    );
    if (await emailConfigButton.isVisible()) {
      await emailConfigButton.click();

      // Navigate to template tab
      await page.click('[data-testid="email-template-tab"]');

      // Create large HTML template
      const largeHtmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { background-color: #f0f0f0; padding: 20px; }
            .content { padding: 20px; }
            .footer { background-color: #333; color: white; padding: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Certificate of Completion</h1>
          </div>
          <div class="content">
            <p>Dear {participantName},</p>
            <p>Congratulations! You have successfully completed the {eventTitle} program.</p>
            <p>Your certificate ID is: {certificateId}</p>
            <p>This certificate is valid and can be verified through our system.</p>
            <p>Thank you for your participation!</p>
          </div>
          <div class="footer">
            <p>© 2024 Certificate Generator. All rights reserved.</p>
          </div>
        </body>
        </html>
      `.repeat(10); // Make it even larger

      // Fill template
      await page.fill('[data-testid="html-template"]', largeHtmlTemplate);

      const startTime = Date.now();

      // Preview template
      await page.click('[data-testid="preview-template"]');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should render within 2 seconds
      expect(duration).toBeLessThan(2000);

      // Verify preview is visible
      await expect(
        page.locator('[data-testid="template-preview"]')
      ).toBeVisible();
    }
  });

  test('should handle email queue efficiently', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Create test event with many participants
    await createTestEventWithManyParticipants(page);

    // Navigate to participant manager
    await page.click('[data-testid="participant-manager-tab"]');
    await page.waitForSelector('[data-testid="participant-table"]');

    // Select all participants
    await page.click('[data-testid="select-all-participants"]');

    const startTime = Date.now();

    // Send bulk emails
    await page.click('[data-testid="bulk-send-emails"]');

    // Monitor progress
    const progressBar = page.locator('[data-testid="bulk-email-progress"]');
    await expect(progressBar).toBeVisible();

    // Wait for completion
    await page.waitForSelector('[data-testid="bulk-email-progress"]', {
      state: 'hidden',
      timeout: 180000,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within 3 minutes
    expect(duration).toBeLessThan(180000);

    // Verify all emails were processed
    const successToast = page.locator('[data-testid="success-toast"]');
    await expect(successToast).toBeVisible();
  });
});

// Helper functions
async function createTestEvent(page: any) {
  // Implementation to create a test event
  // This would depend on the actual UI structure
}

async function createTestEventWithManyParticipants(page: any) {
  // Implementation to create a test event with many participants
  // This would depend on the actual UI structure
}
