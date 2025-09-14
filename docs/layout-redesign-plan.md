# Layout Redesign Execution Plan

## Overview

This document outlines the step-by-step execution plan to redesign the certificate generator webapp based on the provided image mockup. The new design features a sidebar navigation with event management and a main content area with template adjustment and participant management sections.

## Current State Analysis

- **Current Layout**: Tab-based interface with horizontal navigation
- **Current Structure**: Single page with 6 tabs (Create, Events, Template, Layout, Recipients, Generate)
- **Current Components**: Well-structured React components with TypeScript

## Target Design Analysis

Based on the image, the new layout should have:

1. **Left Sidebar**:

   - LumenDev branding/logo
   - Search bar for events
   - Event list with diamond icons
   - Active event highlighting

2. **Main Content Area**:
   - Page title "Generate Certificate"
   - **Template Adjustment Section**:
     - Certificate preview (left side)
     - Font controls (right side): Name/ID radio buttons, font family, alignment, color, size, position
   - **Participant Manager Section**:
     - Download/Upload CSV buttons
     - Participant table with checkboxes, name, email, certificate ID, last email
     - Row actions (download, send, menu)

## Execution Plan

### Phase 1: Layout Structure Redesign

1. **Create new layout components**

   - `components/layout/sidebar.tsx` - Left sidebar with navigation
   - `components/layout/main-content.tsx` - Main content wrapper
   - `components/layout/page-header.tsx` - Page title component

2. **Update main page structure**
   - Replace tab-based layout with sidebar + main content
   - Implement responsive design for mobile/desktop
   - Add proper state management for selected event

### Phase 2: Sidebar Implementation

3. **Build sidebar navigation**

   - LumenDev logo/branding
   - Search functionality for events
   - Event list with diamond icons
   - Active state management
   - Event creation button

4. **Implement event search**
   - Real-time search filtering
   - Search state management
   - Clear search functionality

### Phase 3: Template Adjustment Section

5. **Redesign template preview area**

   - Larger certificate preview canvas
   - Better positioning for text elements
   - Real-time preview updates

6. **Rebuild font customization controls**

   - Radio button selection (Name/Certificate ID)
   - Font family dropdown
   - Text alignment dropdown
   - Color picker component
   - Font size slider
   - Position indicators (X, Y coordinates)

7. **Enhance certificate canvas component**
   - Better click-to-position functionality
   - Visual indicators for text positions
   - Improved drag-and-drop positioning

### Phase 4: Participant Manager Section

8. **Redesign participant table**

   - Checkbox column for selection
   - Name, Email, Certificate ID, Last Email columns
   - Row action buttons (download, send, menu)
   - Better table styling and responsiveness

9. **Implement CSV management**

   - Download CSV button (outlined style)
   - Upload CSV button (filled style)
   - Better file upload feedback

10. **Add participant actions**
    - Individual certificate download
    - Email sending functionality
    - Bulk actions for selected participants

### Phase 5: State Management & Integration

11. **Update state management**

    - Selected event state
    - Search state
    - Template configuration state
    - Participant selection state

12. **Integrate with existing actions**
    - Maintain all existing server actions
    - Update component props and interfaces
    - Ensure data persistence works correctly

### Phase 6: Visual Design & Styling

13. **Apply consistent styling**

    - Match the color scheme from the image
    - Implement proper spacing and typography
    - Add hover states and transitions
    - Ensure accessibility compliance

14. **Responsive design**
    - Mobile-first approach
    - Collapsible sidebar on mobile
    - Responsive table and controls
    - Touch-friendly interactions

### Phase 7: Testing & Validation

15. **Visual testing with Playwright**

    - Take screenshots at each phase
    - Compare with target design
    - Test responsive behavior
    - Validate all interactions

16. **Functionality testing**
    - Test all existing features work
    - Validate new interactions
    - Test data persistence
    - Performance testing

### Phase 8: Documentation & Cleanup

17. **Update documentation**

    - Update PRD with new layout
    - Document new components
    - Update user workflow documentation

18. **Code cleanup**
    - Remove unused components
    - Optimize imports
    - Add proper TypeScript types
    - Code review and refactoring

## Technical Considerations

### Component Architecture

- Maintain existing TypeScript interfaces
- Use existing UI components from shadcn/ui
- Implement proper error boundaries
- Add loading states for all async operations

### Performance

- Lazy load components where appropriate
- Optimize re-renders with proper state management
- Implement virtual scrolling for large participant lists
- Cache search results

### Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

### Browser Compatibility

- Test on major browsers
- Ensure mobile responsiveness
- Handle different screen sizes
- Graceful degradation for older browsers

## Success Criteria

1. **Visual Match**: Layout matches the provided image design
2. **Functionality**: All existing features work correctly
3. **Performance**: No performance regression
4. **Responsive**: Works on mobile and desktop
5. **Accessibility**: Meets WCAG guidelines
6. **User Experience**: Intuitive and easy to use

## Timeline Estimate

- **Phase 1-2**: 2-3 hours (Layout structure + Sidebar)
- **Phase 3**: 3-4 hours (Template adjustment)
- **Phase 4**: 2-3 hours (Participant manager)
- **Phase 5**: 1-2 hours (State management)
- **Phase 6**: 2-3 hours (Styling)
- **Phase 7**: 1-2 hours (Testing)
- **Phase 8**: 1 hour (Documentation)

**Total Estimated Time**: 12-18 hours

## Risk Mitigation

- Test each phase thoroughly before proceeding
- Maintain backup of working version
- Use feature flags for gradual rollout
- Regular visual validation with Playwright
- Incremental commits for easy rollback
