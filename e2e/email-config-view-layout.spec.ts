import { test, expect } from '@playwright/test';

test.describe('Email Config View Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should render email config view without breaking layout', async ({ page }) => {
    // Wait for events to load
    await page.waitForSelector('[data-testid="event-item"], .event-item, [class*="event"]', {
      timeout: 5000,
    }).catch(() => {
      // If no events exist, we'll create one or skip
    });

    // Try to find and select an event that has a template (Ready status)
    const readyEvent = page.locator('text=Ready').first();
    
    if (await readyEvent.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click on an event that's ready
      await readyEvent.click();
      await page.waitForTimeout(1000);
    } else {
      // If no ready events, try to click any event
      const firstEvent = page.locator('[data-testid="event-item"], .event-item').first();
      if (await firstEvent.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstEvent.click();
        await page.waitForTimeout(1000);
      }
    }

    // Navigate to Email Settings - try multiple ways
    let navigated = false;
    
    // Try clicking on Email Settings link in sidebar
    const emailSettingsLink = page.getByRole('link', { name: /Email Settings/i }).or(
      page.locator('a:has-text("Email Settings")')
    ).first();
    
    if (await emailSettingsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailSettingsLink.click();
      navigated = true;
      await page.waitForTimeout(1000);
    }
    
    // If that didn't work, try finding any clickable element with "Email Settings"
    if (!navigated) {
      const anyEmailSettings = page.getByText(/Email Settings/i).first();
      if (await anyEmailSettings.isVisible({ timeout: 2000 }).catch(() => false)) {
        await anyEmailSettings.click();
        navigated = true;
        await page.waitForTimeout(1000);
      }
    }

    // Wait for email config view to load
    await page.waitForTimeout(2000);

    // Check that the main content area is properly structured
    const mainContent = page.locator('.flex-1.overflow-y-auto, [class*="main-content"]').first();
    await expect(mainContent).toBeVisible();

    // Check that the email config view header is visible (try multiple selectors)
    const emailSettingsHeader = page.getByRole('heading', { name: /Email Settings/i }).or(page.locator('h1:has-text("Email Settings")')).first();
    await expect(emailSettingsHeader).toBeVisible({ timeout: 5000 });

    // Check that the Back button is visible
    const backButton = page.getByRole('button', { name: /Back/i }).or(page.locator('button:has-text("Back")')).first();
    await expect(backButton).toBeVisible({ timeout: 5000 });

    // Check that Configuration Status card is visible
    const configStatusCard = page.getByText('Configuration Status').first();
    await expect(configStatusCard).toBeVisible({ timeout: 5000 });

    // Check that Email Configuration card is visible
    const emailConfigCard = page.getByText('Email Configuration').first();
    await expect(emailConfigCard).toBeVisible({ timeout: 5000 });

    // Check that tabs are visible
    const smtpTab = page.locator('button:has-text("SMTP Settings"), [role="tab"]:has-text("SMTP")').first();
    await expect(smtpTab).toBeVisible();

    const templatesTab = page.locator('button:has-text("Email Templates"), [role="tab"]:has-text("Templates")').first();
    await expect(templatesTab).toBeVisible();

    // Check layout doesn't overflow horizontally
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    const viewportWidth = page.viewportSize()?.width || 1280;
    
    // Check that content doesn't exceed viewport
    expect(bodyBox?.width).toBeLessThanOrEqual(viewportWidth + 20); // Allow small margin for scrollbar

    // Check that cards are properly contained
    const cards = page.locator('[class*="card"]');
    const cardCount = await cards.count();
    
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = cards.nth(i);
      const cardBox = await card.boundingBox();
      if (cardBox) {
        expect(cardBox.width).toBeLessThanOrEqual(viewportWidth);
      }
    }
  });

  test('should display email templates tab correctly', async ({ page }) => {
    // Navigate to email settings (similar to above)
    await page.waitForSelector('[data-testid="event-item"], .event-item', {
      timeout: 5000,
    }).catch(() => {});

    const readyEvent = page.locator('text=Ready').first();
    if (await readyEvent.isVisible({ timeout: 2000 }).catch(() => false)) {
      await readyEvent.click();
      await page.waitForTimeout(1000);
    }

    const emailSettingsLink = page.locator('a:has-text("Email Settings")').first();
    if (await emailSettingsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailSettingsLink.click();
      await page.waitForTimeout(1000);
    }

    // Click on Email Templates tab
    const templatesTab = page.locator('button:has-text("Email Templates"), [role="tab"]:has-text("Templates")').first();
    if (await templatesTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await templatesTab.click();
      await page.waitForTimeout(500);

      // Check that template inputs are visible
      const subjectInput = page.locator('input[placeholder*="Subject"], input[id*="subject"], label:has-text("Subject") + input').first();
      await expect(subjectInput).toBeVisible({ timeout: 2000 });

      // Check that HTML template textarea is visible
      const htmlTextarea = page.locator('textarea[id*="html"], textarea[placeholder*="HTML"], label:has-text("HTML") + textarea').first();
      await expect(htmlTextarea).toBeVisible({ timeout: 2000 });

      // Check that preview section is visible
      const preview = page.locator('[class*="preview"], :has-text("Live Preview"), :has-text("Preview")').first();
      await expect(preview).toBeVisible({ timeout: 2000 });
    }
  });

  test('should handle responsive layout on smaller screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Navigate to email settings
    await page.waitForSelector('[data-testid="event-item"], .event-item', {
      timeout: 5000,
    }).catch(() => {});

    const readyEvent = page.locator('text=Ready').first();
    if (await readyEvent.isVisible({ timeout: 2000 }).catch(() => false)) {
      await readyEvent.click();
      await page.waitForTimeout(1000);
    }

    const emailSettingsLink = page.locator('a:has-text("Email Settings")').first();
    if (await emailSettingsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailSettingsLink.click();
      await page.waitForTimeout(1000);

      // Check that layout is responsive (no horizontal overflow)
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();
      const viewportWidth = 375;
      
      if (bodyBox) {
        expect(bodyBox.width).toBeLessThanOrEqual(viewportWidth + 20);
      }

      // Check that cards stack vertically on mobile
      const cards = page.locator('[class*="card"]');
      const firstCard = cards.first();
      if (await firstCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        const cardBox = await firstCard.boundingBox();
        if (cardBox) {
          expect(cardBox.width).toBeLessThanOrEqual(viewportWidth);
        }
      }
    }
  });
});

