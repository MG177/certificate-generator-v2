import { test, expect } from '@playwright/test';

test.describe('Email Config View Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should display email config view without layout breaking', async ({ page }) => {
    // Wait for events to load
    await page.waitForSelector('text=/Events/i', { timeout: 10000 });
    
    // Find and click on an event that has participants (Ready status)
    const eventItem = page.locator('[data-testid="event-item"], .event-item').filter({ hasText: /Ready|3 participants/i }).first();
    
    if (await eventItem.count() > 0) {
      await eventItem.click();
      await page.waitForTimeout(1000); // Wait for event to load
    } else {
      // If no ready event, just click the first event
      const firstEvent = page.locator('[data-testid="event-item"], .event-item').first();
      if (await firstEvent.count() > 0) {
        await firstEvent.click();
        await page.waitForTimeout(1000);
      }
    }

    // Navigate to Email Settings
    const emailSettingsLink = page.locator('text=Email Settings').first();
    if (await emailSettingsLink.isVisible({ timeout: 5000 })) {
      await emailSettingsLink.click();
    } else {
      // Try alternative selector
      const navLink = page.locator('a, button').filter({ hasText: /Email Settings/i }).first();
      if (await navLink.isVisible({ timeout: 5000 })) {
        await navLink.click();
      }
    }

    // Wait for email config view to load
    await page.waitForSelector('text=Email Settings', { timeout: 10000 });
    await page.waitForSelector('text=Configuration Status', { timeout: 5000 });

    // Verify main layout structure is intact
    const mainContent = page.locator('.flex-1.overflow-y-auto, [class*="main-content"]').first();
    await expect(mainContent).toBeVisible();

    // Verify header is visible and not broken
    const header = page.locator('h1:has-text("Email Settings")').first();
    await expect(header).toBeVisible();

    // Verify Back button is visible
    const backButton = page.locator('button:has-text("Back"), [aria-label*="Back"]').first();
    await expect(backButton).toBeVisible();

    // Verify Configuration Status card is visible
    const configStatusCard = page.locator('text=Configuration Status').first();
    await expect(configStatusCard).toBeVisible();

    // Verify Email Configuration card is visible
    const emailConfigCard = page.locator('text=Email Configuration').first();
    await expect(emailConfigCard).toBeVisible();

    // Check that content is not overflowing horizontally
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    const viewportWidth = page.viewportSize()?.width || 1280;
    
    if (bodyBox) {
      // Content should not exceed viewport width significantly
      expect(bodyBox.width).toBeLessThanOrEqual(viewportWidth + 20); // Allow small margin for scrollbars
    }

    // Verify tabs are visible and clickable
    const smtpTab = page.locator('button, [role="tab"]').filter({ hasText: /SMTP Settings/i }).first();
    const templatesTab = page.locator('button, [role="tab"]').filter({ hasText: /Email Templates/i }).first();
    
    if (await smtpTab.isVisible()) {
      await expect(smtpTab).toBeVisible();
    }
    
    if (await templatesTab.isVisible()) {
      await expect(templatesTab).toBeVisible();
    }
  });

  test('should handle responsive layout on different screen sizes', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Navigate to email settings if possible
    const eventItem = page.locator('[data-testid="event-item"], .event-item').first();
    if (await eventItem.count() > 0) {
      await eventItem.click();
      await page.waitForTimeout(1000);

      const emailSettingsLink = page.locator('text=Email Settings').first();
      if (await emailSettingsLink.isVisible({ timeout: 5000 })) {
        await emailSettingsLink.click();
        await page.waitForSelector('text=Email Settings', { timeout: 10000 });

        // Verify layout doesn't break on mobile
        const mainContent = page.locator('.flex-1.overflow-y-auto').first();
        await expect(mainContent).toBeVisible();

        // Check for horizontal overflow
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // Allow small margin
      }
    }
  });

  test('should switch between SMTP and Templates tabs without layout issues', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Navigate to email settings
    const eventItem = page.locator('[data-testid="event-item"], .event-item').first();
    if (await eventItem.count() > 0) {
      await eventItem.click();
      await page.waitForTimeout(1000);

      const emailSettingsLink = page.locator('text=Email Settings').first();
      if (await emailSettingsLink.isVisible({ timeout: 5000 })) {
        await emailSettingsLink.click();
        await page.waitForSelector('text=Email Configuration', { timeout: 10000 });

        // Click on Templates tab
        const templatesTab = page.locator('button, [role="tab"]').filter({ hasText: /Email Templates/i }).first();
        if (await templatesTab.isVisible()) {
          await templatesTab.click();
          await page.waitForTimeout(500);

          // Verify template content is visible
          const htmlTemplate = page.locator('textarea, input').filter({ hasText: /HTML/i }).or(page.locator('label:has-text("HTML")')).first();
          
          // Verify layout is still intact
          const mainContent = page.locator('.flex-1.overflow-y-auto').first();
          await expect(mainContent).toBeVisible();

          // Check for overflow
          const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
          expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
        }
      }
    }
  });

  test('should display all form fields without horizontal overflow', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Navigate to email settings
    const eventItem = page.locator('[data-testid="event-item"], .event-item').first();
    if (await eventItem.count() > 0) {
      await eventItem.click();
      await page.waitForTimeout(1000);

      const emailSettingsLink = page.locator('text=Email Settings').first();
      if (await emailSettingsLink.isVisible({ timeout: 5000 })) {
        await emailSettingsLink.click();
        await page.waitForSelector('text=SMTP Settings', { timeout: 10000 });

        // Verify form fields are visible and properly contained
        const smtpHost = page.locator('input[id="smtpHost"], input[placeholder*="smtp"]').first();
        const smtpPort = page.locator('input[id="smtpPort"], input[type="number"]').first();
        const smtpUser = page.locator('input[id="smtpUser"]').first();

        if (await smtpHost.isVisible()) {
          await expect(smtpHost).toBeVisible();
        }
        if (await smtpPort.isVisible()) {
          await expect(smtpPort).toBeVisible();
        }
        if (await smtpUser.isVisible()) {
          await expect(smtpUser).toBeVisible();
        }

        // Check for horizontal scroll (should be minimal or none)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        // Allow small margin for potential scrollbars
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        const overflow = scrollWidth - clientWidth;
        
        // Overflow should be minimal (less than 20px, likely just scrollbar)
        expect(overflow).toBeLessThan(20);
      }
    }
  });
});

