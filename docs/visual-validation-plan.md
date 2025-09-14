# Visual Validation Plan with Playwright

## Overview

This document outlines the visual validation strategy using Playwright MCP to ensure the redesigned layout matches the target design from the provided image.

## Validation Strategy

### 1. Baseline Screenshots

Before starting the redesign, capture current state:

- Full page screenshot
- Individual component screenshots
- Mobile and desktop views
- Different states (loading, error, success)

### 2. Phase-by-Phase Validation

After each major phase, capture screenshots and compare:

- Sidebar implementation
- Template adjustment section
- Participant manager section
- Overall layout integration

### 3. Responsive Testing

Test across different screen sizes:

- Mobile (375px width)
- Tablet (768px width)
- Desktop (1024px+ width)
- Large desktop (1440px+ width)

## Playwright Test Scenarios

### Scenario 1: Initial State Validation

```typescript
// Test current state before changes
await page.goto('http://localhost:3000');
await page.screenshot({ path: 'baseline/full-page.png' });
await page.screenshot({
  path: 'baseline/mobile-view.png',
  viewport: { width: 375, height: 667 },
});
```

### Scenario 2: Sidebar Implementation

```typescript
// Test sidebar after Phase 1-2
await page.goto('http://localhost:3000');
await page.screenshot({ path: 'phase2/sidebar-desktop.png' });
await page.screenshot({
  path: 'phase2/sidebar-mobile.png',
  viewport: { width: 375, height: 667 },
});

// Test sidebar interactions
await page.click('[data-testid="search-input"]');
await page.type('[data-testid="search-input"]', 'test event');
await page.screenshot({ path: 'phase2/search-active.png' });
```

### Scenario 3: Template Adjustment Section

```typescript
// Test template adjustment after Phase 3
await page.goto('http://localhost:3000');
await page.click('[data-testid="event-item-0"]'); // Select first event
await page.screenshot({ path: 'phase3/template-adjustment.png' });

// Test font controls
await page.click('[data-testid="font-family-select"]');
await page.screenshot({ path: 'phase3/font-dropdown.png' });

// Test color picker
await page.click('[data-testid="color-picker"]');
await page.screenshot({ path: 'phase3/color-picker.png' });
```

### Scenario 4: Participant Manager Section

```typescript
// Test participant manager after Phase 4
await page.goto('http://localhost:3000');
await page.click('[data-testid="event-item-0"]');
await page.screenshot({ path: 'phase4/participant-manager.png' });

// Test table interactions
await page.click('[data-testid="participant-checkbox-0"]');
await page.screenshot({ path: 'phase4/participant-selected.png' });

// Test CSV actions
await page.click('[data-testid="download-csv-button"]');
await page.screenshot({ path: 'phase4/csv-actions.png' });
```

### Scenario 5: Responsive Design

```typescript
// Test responsive behavior
const viewports = [
  { width: 375, height: 667, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1024, height: 768, name: 'desktop' },
  { width: 1440, height: 900, name: 'large-desktop' },
];

for (const viewport of viewports) {
  await page.setViewportSize(viewport);
  await page.screenshot({
    path: `responsive/${viewport.name}-full.png`,
  });

  // Test sidebar collapse on mobile
  if (viewport.width < 768) {
    await page.click('[data-testid="sidebar-toggle"]');
    await page.screenshot({
      path: `responsive/${viewport.name}-sidebar-collapsed.png`,
    });
  }
}
```

## Visual Comparison Criteria

### 1. Layout Structure

- [ ] Sidebar positioned correctly on left
- [ ] Main content area takes remaining space
- [ ] Proper spacing between sections
- [ ] Responsive behavior works correctly

### 2. Sidebar Elements

- [ ] LumenDev logo visible and positioned correctly
- [ ] Search bar with magnifying glass icon
- [ ] Event list with diamond icons
- [ ] Active event highlighting
- [ ] Create event button

### 3. Template Adjustment Section

- [ ] Certificate preview on left side
- [ ] Font controls on right side
- [ ] Name/ID radio button selector
- [ ] Font family dropdown
- [ ] Text alignment dropdown
- [ ] Color picker
- [ ] Font size slider
- [ ] Position indicators (X, Y)

### 4. Participant Manager Section

- [ ] Download/Upload CSV buttons
- [ ] Participant table with proper columns
- [ ] Checkbox column for selection
- [ ] Row action buttons (download, send, menu)
- [ ] Proper table styling

### 5. Visual Design

- [ ] Color scheme matches target
- [ ] Typography is consistent
- [ ] Spacing follows design system
- [ ] Hover states work correctly
- [ ] Loading states are properly styled

## Automated Validation Script

### Setup

```typescript
// playwright-validation.ts
import { test, expect } from '@playwright/test';

test.describe('Layout Redesign Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should match target design', async ({ page }) => {
    // Take screenshot
    await page.screenshot({ path: 'current-design.png' });

    // Compare with baseline (if available)
    // await expect(page).toHaveScreenshot('baseline-design.png');
  });

  test('should be responsive', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.screenshot({
        path: `responsive-${viewport.width}x${viewport.height}.png`,
      });
    }
  });
});
```

## Validation Checklist

### Phase 1-2: Layout Structure + Sidebar

- [ ] Sidebar renders correctly
- [ ] Logo displays properly
- [ ] Search functionality works
- [ ] Event list shows with diamond icons
- [ ] Active event highlighting works
- [ ] Responsive behavior on mobile

### Phase 3: Template Adjustment

- [ ] Certificate preview displays correctly
- [ ] Font controls are properly positioned
- [ ] All control elements are functional
- [ ] Real-time preview updates work
- [ ] Position indicators show correct values

### Phase 4: Participant Manager

- [ ] Table displays with all columns
- [ ] Checkbox selection works
- [ ] Row actions are visible and functional
- [ ] CSV buttons are properly styled
- [ ] Bulk actions work correctly

### Phase 5: Integration

- [ ] All sections work together
- [ ] State management works correctly
- [ ] Data persistence functions
- [ ] No visual regressions
- [ ] Performance is acceptable

## Error Handling

### Common Issues to Check

1. **Layout breaks on mobile** - Check responsive CSS
2. **Components not rendering** - Check imports and props
3. **State not updating** - Check state management
4. **Styling conflicts** - Check CSS specificity
5. **Performance issues** - Check for unnecessary re-renders

### Debugging Steps

1. Take screenshot of current state
2. Check browser console for errors
3. Inspect element to verify CSS
4. Check network tab for failed requests
5. Verify component props and state

## Success Metrics

### Visual Accuracy

- 95%+ match with target design
- All interactive elements functional
- Responsive design works across devices
- No visual regressions

### Performance

- Page load time < 2 seconds
- Smooth interactions and transitions
- No memory leaks
- Efficient re-rendering

### Accessibility

- Proper ARIA labels
- Keyboard navigation works
- Screen reader compatibility
- Color contrast meets standards
