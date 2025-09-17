# Participant Actions Implementation Plan

## Overview

This document outlines the implementation plan for all participant management actions in the certificate generator application, excluding email functionality.

## Current State Analysis

### Existing Actions Identified

**Individual Participant Actions:**

- `download` - Download individual certificate
- `edit` - Edit participant details
- `delete` - Delete participant

**Bulk Actions:**

- `download` - Download selected certificates as ZIP
- `export` - Export selected participants as CSV
- `delete` - Delete selected participants

**Included Actions:**

- `send` - Send email via Nodemailer (now included - see email implementation plan)

### Current Implementation Status

✅ **Available:**

- `generateCertificates()` - Generates ZIP with all certificates
- `saveParticipants()` - Saves participants to database
- `updateEvent()` - Updates event data
- `getEvent()` - Retrieves event data

❌ **Missing:**

- Individual certificate download
- Participant editing functionality
- Participant deletion (individual and bulk)
- Selected participants certificate download
- CSV export functionality
- Email sending functionality (individual and bulk)
- UI components for editing participants
- Email status tracking and management

## Implementation Plan

### Phase 1: Individual Certificate Download (2-3 hours)

#### 1.1 Create Individual Certificate Generation Server Action

- **File:** `lib/actions.ts`
- **Function:** `generateIndividualCertificate(eventId: string, participantId: string): Promise<ArrayBuffer>`
- **Purpose:** Generate single certificate for specific participant
- **Implementation:**
  - Find participant by certification_id
  - Generate certificate using existing `generateCertificate()` function
  - Return PNG buffer instead of ZIP

#### 1.2 Create Download Utility Function

- **File:** `lib/certificate-utils.ts` (new)
- **Function:** `downloadCertificate(buffer: ArrayBuffer, filename: string): void`
- **Purpose:** Handle client-side certificate download
- **Implementation:**
  - Create blob from buffer
  - Create download link
  - Trigger download

#### 1.3 Update Participant Manager Section

- **File:** `components/participant-manager/participant-manager-section.tsx`
- **Changes:**
  - Implement `handleParticipantAction` for 'download' case
  - Add loading state for individual downloads
  - Add error handling

### Phase 2: Participant Editing Functionality (3-4 hours)

#### 2.1 Create Participant Edit Dialog Component

- **File:** `components/participant-manager/edit-participant-dialog.tsx`
- **Features:**
  - Form with name, email, certification_id fields
  - Validation for required fields
  - Save/Cancel buttons
  - Error handling

#### 2.2 Create Participant Update Server Action

- **File:** `lib/actions.ts`
- **Function:** `updateParticipant(eventId: string, participantId: string, updates: Partial<IRecipientData>): Promise<boolean>`
- **Purpose:** Update individual participant data
- **Implementation:**
  - Find participant by certification_id
  - Update participant data
  - Save to database
  - Return success status

#### 2.3 Update Participant Manager Section

- **Changes:**
  - Add edit dialog state management
  - Implement 'edit' action handler
  - Add dialog to JSX
  - Update participants list after edit

### Phase 3: Participant Deletion (2-3 hours)

#### 3.1 Create Participant Deletion Server Actions

- **File:** `lib/actions.ts`
- **Functions:**
  - `deleteParticipant(eventId: string, participantId: string): Promise<boolean>`
  - `deleteParticipants(eventId: string, participantIds: string[]): Promise<boolean>`
- **Purpose:** Remove participants from event
- **Implementation:**
  - Filter out participants by certification_id
  - Update event with new participants array
  - Save to database

#### 3.2 Add Confirmation Dialogs

- **File:** `components/participant-manager/delete-confirmation-dialog.tsx`
- **Features:**
  - Confirmation message for single/bulk deletion
  - Participant count display
  - Confirm/Cancel buttons
  - Warning styling

#### 3.3 Update Participant Manager Section

- **Changes:**
  - Add confirmation dialog state
  - Implement 'delete' action handlers
  - Add confirmation dialogs to JSX
  - Update participants list after deletion

### Phase 4: Selected Participants Certificate Download (2-3 hours)

#### 4.1 Create Selected Certificates Generation Server Action

- **File:** `lib/actions.ts`
- **Function:** `generateSelectedCertificates(eventId: string, participantIds: string[]): Promise<ArrayBuffer>`
- **Purpose:** Generate ZIP with only selected participants' certificates
- **Implementation:**
  - Filter participants by certification_id
  - Generate certificates for selected participants only
  - Create ZIP archive
  - Return ZIP buffer

#### 4.2 Update Bulk Actions Handler

- **File:** `components/participant-manager/participant-manager-section.tsx`
- **Changes:**
  - Implement 'download' bulk action
  - Add loading state for bulk downloads
  - Add error handling

### Phase 5: CSV Export Functionality (1-2 hours)

#### 5.1 Create CSV Export Server Action

- **File:** `lib/actions.ts`
- **Function:** `exportParticipantsCSV(eventId: string, participantIds: string[]): Promise<string>`
- **Purpose:** Generate CSV data for selected participants
- **Implementation:**
  - Filter participants by certification_id
  - Convert to CSV format
  - Return CSV string

#### 5.2 Create CSV Download Utility

- **File:** `lib/csv-utils.ts` (update existing)
- **Function:** `downloadCSV(csvContent: string, filename: string): void`
- **Purpose:** Handle client-side CSV download
- **Implementation:**
  - Create blob from CSV string
  - Create download link
  - Trigger download

#### 5.3 Update Bulk Actions Handler

- **Changes:**
  - Implement 'export' bulk action
  - Add loading state for CSV export
  - Add error handling

### Phase 6: Email Functionality Implementation (8-12 hours)

#### 6.1 Email Service Setup (2-3 hours)

- **File:** `lib/email-service.ts`
- **Function:** Core email sending functionality using Nodemailer
- **Implementation:**
  - SMTP connection management
  - Email template rendering
  - Error handling and retry logic
  - Rate limiting implementation

#### 6.2 Email Server Actions (2-3 hours)

- **File:** `lib/actions.ts`
- **Functions:**
  - `sendParticipantEmail(eventId: string, participantId: string): Promise<boolean>`
  - `sendBulkEmails(eventId: string, participantIds: string[]): Promise<EmailResult>`
  - `getEmailStatus(eventId: string, participantId: string): Promise<EmailStatus>`
- **Purpose:** Handle email sending operations
- **Implementation:**
  - Generate individual certificates
  - Create email with certificate attachment
  - Send via configured SMTP server
  - Update participant email status
  - Log email attempts and results

#### 6.3 Email UI Components (2-3 hours)

- **Files:**
  - `components/email/email-status-indicator.tsx`
  - `components/email/email-config-dialog.tsx`
  - `components/email/bulk-email-actions.tsx`
- **Features:**
  - Email status display (sent, pending, failed, bounced)
  - SMTP configuration interface
  - Bulk email sending with progress tracking
  - Email retry functionality

#### 6.4 Email Status Tracking (2-3 hours)

- **Database Updates:**
  - Add email status fields to `IRecipientData`
  - Create email logs collection
  - Implement email status tracking
- **Features:**
  - Real-time status updates
  - Email history tracking
  - Failed email retry mechanisms
  - Email delivery statistics

### Phase 7: UI Enhancements and Polish (1-2 hours)

#### 7.1 Add Loading States

- **Components to Update:**
  - `participant-row.tsx` - Individual action loading
  - `bulk-actions.tsx` - Bulk action loading
  - `participant-manager-section.tsx` - Overall loading states

#### 7.2 Add Error Handling

- **Features:**
  - Toast notifications for success/error
  - Error boundaries for action failures
  - Retry mechanisms for failed actions

#### 7.3 Add Confirmation Feedback

- **Features:**
  - Success messages for completed actions
  - Progress indicators for bulk operations
  - Undo functionality for deletions

## Technical Considerations

### Data Flow

```
User Action → UI Handler → Server Action → Database Update → UI Refresh
```

### Error Handling Strategy

1. **Client-side validation** before server calls
2. **Server-side validation** and error responses
3. **UI feedback** with toast notifications
4. **Graceful degradation** for failed actions

### Performance Considerations

1. **Optimistic updates** for better UX
2. **Debounced bulk operations** to prevent spam
3. **Progress indicators** for long-running operations
4. **Memory management** for large certificate generation

### Security Considerations

1. **Input validation** on all participant data
2. **Authorization checks** for event access
3. **Rate limiting** for bulk operations
4. **File size limits** for certificate downloads

## File Structure Changes

### New Files to Create

```
components/participant-manager/
├── edit-participant-dialog.tsx
├── delete-confirmation-dialog.tsx
└── action-loading-states.tsx

components/email/
├── email-status-indicator.tsx
├── email-config-dialog.tsx
├── bulk-email-actions.tsx
└── email-status-dashboard.tsx

lib/
├── certificate-utils.ts
├── email-service.ts
├── email-config.ts
├── email-templates/
│   ├── certificate-email.html
│   └── certificate-email.txt
└── participant-actions.ts (optional)
```

### Files to Update

```
lib/actions.ts - Add new server actions
lib/csv-utils.ts - Add CSV download utility
components/participant-manager/
├── participant-manager-section.tsx - Main action handlers
├── participant-table.tsx - Loading states
├── participant-row.tsx - Individual action loading
└── bulk-actions.tsx - Bulk action loading
```

## Success Criteria

### Functional Requirements

- [ ] Individual certificate download works
- [ ] Participant editing with validation
- [ ] Individual and bulk participant deletion
- [ ] Selected participants certificate download
- [ ] CSV export of selected participants
- [ ] Individual email sending works
- [ ] Bulk email sending works
- [ ] Email status tracking and display
- [ ] Email configuration management
- [ ] All actions have proper loading states
- [ ] All actions have error handling
- [ ] Confirmation dialogs for destructive actions

### User Experience Requirements

- [ ] Actions complete within 3 seconds (individual)
- [ ] Email sending completes within 10 seconds (individual)
- [ ] Bulk actions show progress indicators
- [ ] Email status updates in real-time
- [ ] Clear success/error feedback
- [ ] Intuitive confirmation dialogs
- [ ] Responsive design maintained

### Technical Requirements

- [ ] TypeScript types for all new functions
- [ ] Proper error boundaries
- [ ] Memory efficient certificate generation
- [ ] Secure email sending with proper authentication
- [ ] Rate limiting for email operations
- [ ] Accessible UI components
- [ ] Mobile-friendly interactions

## Timeline Estimate

- **Phase 1:** 2-3 hours (Individual downloads)
- **Phase 2:** 3-4 hours (Participant editing)
- **Phase 3:** 2-3 hours (Deletion functionality)
- **Phase 4:** 2-3 hours (Selected certificates)
- **Phase 5:** 1-2 hours (CSV export)
- **Phase 6:** 8-12 hours (Email functionality)
- **Phase 7:** 1-2 hours (UI polish)

**Total Estimated Time:** 19-29 hours

## Risk Mitigation

### Potential Issues

1. **Large certificate generation** - Implement progress indicators
2. **Memory issues with bulk operations** - Add chunking for large datasets
3. **Concurrent action conflicts** - Add action queuing
4. **File download issues** - Add fallback mechanisms
5. **Email delivery failures** - Implement retry mechanisms and error handling
6. **SMTP configuration complexity** - Provide clear setup documentation
7. **Rate limiting issues** - Implement proper throttling and user feedback

### Testing Strategy

1. **Unit tests** for server actions
2. **Integration tests** for UI interactions
3. **Performance tests** for bulk operations
4. **User acceptance tests** for complete workflows

## Next Steps

1. **Review and approve** this implementation plan
2. **Set up development environment** for new features
3. **Create TODO list** for tracking progress
4. **Begin Phase 1** implementation
5. **Regular validation** with Playwright testing
