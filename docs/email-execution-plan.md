# Email Feature Execution Plan

## Overview

This document provides a comprehensive execution plan for implementing the email functionality in the certificate generator application using Nodemailer. The plan integrates with the existing participant actions implementation and follows the established project patterns.

## Prerequisites

### 1. Environment Setup

- Node.js 18+ installed
- MongoDB running locally or accessible
- SMTP server access (Gmail, SendGrid, etc.)
- Development environment configured

### 2. Dependencies Installation

```bash
npm install nodemailer @types/nodemailer
```

### 3. Environment Variables

Create `.env.local` with:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=Certificate Generator
EMAIL_FROM_ADDRESS=your-email@gmail.com

# Email Templates
EMAIL_SUBJECT_TEMPLATE=Your Certificate - {eventTitle}
EMAIL_TEMPLATE_PATH=./lib/email-templates/
```

## Implementation Phases

### Phase 1: Core Email Infrastructure (3-4 hours)

#### 1.1 Update Type Definitions

**File**: `lib/types.ts`

Add email-related interfaces:

```typescript
export interface IEmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromAddress: string;
  subjectTemplate: string;
  enabled: boolean;
}

export interface IEmailLog {
  _id?: ObjectId;
  participantId: string;
  eventId: string;
  emailAddress: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  sentAt?: Date;
  errorMessage?: string;
  retryCount: number;
  lastRetryAt?: Date;
  createdAt: Date;
}

export type EmailStatus =
  | 'not_sent'
  | 'pending'
  | 'sent'
  | 'failed'
  | 'bounced';

// Update IRecipientData interface
export interface IRecipientData {
  name: string;
  certification_id: string;
  email?: string;
  lastEmailSent?: Date;
  emailStatus?: EmailStatus;
  emailError?: string;
  emailRetryCount?: number;
}
```

#### 1.2 Create Email Service

**File**: `lib/email-service.ts`

Core email functionality:

- SMTP connection management
- Email sending with attachments
- Template rendering
- Error handling and retry logic
- Rate limiting

#### 1.3 Create Email Configuration

**File**: `lib/email-config.ts`

Configuration management:

- Load settings from environment
- Validate SMTP configuration
- Provide default settings
- Handle configuration errors

#### 1.4 Create Email Templates

**Directory**: `lib/email-templates/`

- `certificate-email.html` - HTML email template
- `certificate-email.txt` - Plain text fallback
- Template variables: `{participantName}`, `{eventTitle}`, `{certificateId}`, `{eventDate}`

### Phase 2: Server Actions Implementation (2-3 hours)

#### 2.1 Individual Email Sending

**File**: `lib/actions.ts`

Add `sendParticipantEmail` function:

```typescript
export async function sendParticipantEmail(
  eventId: string,
  participantId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Implementation details:
  // 1. Get event and participant data
  // 2. Generate individual certificate
  // 3. Create email with certificate attachment
  // 4. Send via Nodemailer
  // 5. Update participant email status
  // 6. Log email attempt
}
```

#### 2.2 Bulk Email Sending

**File**: `lib/actions.ts`

Add `sendBulkEmails` function:

```typescript
export async function sendBulkEmails(
  eventId: string,
  participantIds: string[]
): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}> {
  // Implementation details:
  // 1. Process participants in batches
  // 2. Implement rate limiting
  // 3. Handle partial failures
  // 4. Provide progress tracking
  // 5. Return detailed results
}
```

#### 2.3 Email Status Management

**File**: `lib/actions.ts`

Add email status functions:

- `getEmailStatus(eventId: string, participantId: string)`
- `retryFailedEmail(eventId: string, participantId: string)`
- `getEmailLogs(eventId: string)`

### Phase 3: UI Components Implementation (3-4 hours)

#### 3.1 Email Status Indicator

**File**: `components/email/email-status-indicator.tsx`

Display email status with:

- Status icons (sent, pending, failed, bounced)
- Color coding
- Tooltip with details
- Last sent date
- Retry button for failed emails

#### 3.2 Email Configuration Dialog

**File**: `components/email/email-config-dialog.tsx`

SMTP configuration interface:

- Form fields for all SMTP settings
- Test connection button
- Email preview functionality
- Save/load configuration
- Validation and error handling

#### 3.3 Bulk Email Actions

**File**: `components/email/bulk-email-actions.tsx`

Bulk email operations:

- Send emails to selected participants
- Progress indicator
- Success/failure counts
- Retry failed emails
- Cancel operation

#### 3.4 Email Status Dashboard

**File**: `components/email/email-status-dashboard.tsx`

Email management interface:

- Overview of email statuses
- Failed email list with retry options
- Email logs viewer
- Statistics and analytics

### Phase 4: Integration with Participant Manager (2-3 hours)

#### 4.1 Update Participant Row

**File**: `components/participant-manager/participant-row.tsx`

Add email functionality:

- Email status indicator
- Send email button
- Email error display
- Retry functionality

#### 4.2 Update Bulk Actions

**File**: `components/participant-manager/bulk-actions.tsx`

Add email bulk actions:

- Send emails to selected participants
- Email status summary
- Bulk retry functionality

#### 4.3 Update Participant Manager Section

**File**: `components/participant-manager/participant-manager-section.tsx`

Integrate email handlers:

- Handle 'send' action in `handleParticipantAction`
- Implement bulk email sending
- Add email status updates
- Handle email errors

### Phase 5: Database Schema Updates (1-2 hours)

#### 5.1 Update Participant Data

Add email tracking fields to existing participants:

- `emailStatus`: Current email status
- `lastEmailSent`: When email was last sent
- `emailError`: Error message if failed
- `emailRetryCount`: Number of retry attempts

#### 5.2 Create Email Logs Collection

**Collection**: `emailLogs`

Store email attempt logs:

- Participant and event references
- Email address and status
- Timestamps and error messages
- Retry count and history

#### 5.3 Add Email Configuration to Events

**Field**: `emailConfig` in `IEvent`

Store email settings per event:

- SMTP configuration
- Email templates
- Email preferences

### Phase 6: Error Handling and Validation (1-2 hours)

#### 6.1 Email Validation

- Validate email addresses before sending
- Check for required fields
- Handle invalid email formats
- Prevent sending to disposable emails

#### 6.2 Error Handling

- SMTP connection errors
- Email delivery failures
- Rate limiting errors
- Template rendering errors
- Retry mechanisms

#### 6.3 User Feedback

- Toast notifications for email status
- Progress indicators for bulk operations
- Clear error messages
- Success confirmations

### Phase 7: Testing and Validation (2-3 hours)

#### 7.1 Unit Tests

- Email service functions
- Template rendering
- Configuration validation
- Error handling

#### 7.2 Integration Tests

- End-to-end email sending
- Bulk email operations
- Error scenarios
- Database updates

#### 7.3 User Acceptance Testing

- Test complete email workflow
- Verify email delivery
- Check error handling
- Validate UI feedback

## File Structure

### New Files Created

```
lib/
├── email-service.ts
├── email-config.ts
└── email-templates/
    ├── certificate-email.html
    └── certificate-email.txt

components/email/
├── email-status-indicator.tsx
├── email-config-dialog.tsx
├── bulk-email-actions.tsx
└── email-status-dashboard.tsx

app/api/email/
├── send/route.ts
├── bulk-send/route.ts
└── status/route.ts
```

### Files Updated

```
lib/
├── types.ts (add email interfaces)
├── actions.ts (add email server actions)
└── mongodb.ts (add email logging)

components/participant-manager/
├── participant-manager-section.tsx (add email handlers)
├── participant-row.tsx (add email status)
└── bulk-actions.tsx (add email bulk actions)
```

## Security Considerations

### 1. Credential Management

- Store SMTP credentials in environment variables
- Use app-specific passwords for Gmail
- Implement credential encryption
- Regular credential rotation

### 2. Rate Limiting

- Per-user rate limiting (100 emails/hour)
- Per-IP rate limiting (500 emails/hour)
- Exponential backoff for failures
- Queue management for bulk operations

### 3. Email Security

- Implement SPF, DKIM, and DMARC
- Use TLS/SSL for SMTP connections
- Validate email addresses
- Handle bounces and unsubscribes

## Performance Considerations

### 1. Email Processing

- Process emails in batches
- Implement background processing
- Use connection pooling
- Monitor memory usage

### 2. UI Responsiveness

- Real-time status updates
- Progress indicators
- Non-blocking operations
- Error handling

## Success Criteria

### Functional Requirements

- [ ] Send individual certificates via email
- [ ] Send bulk emails to multiple participants
- [ ] Track email delivery status
- [ ] Handle email failures gracefully
- [ ] Provide email configuration UI
- [ ] Support email templates
- [ ] Implement retry mechanisms

### Technical Requirements

- [ ] Secure credential management
- [ ] Rate limiting implementation
- [ ] Error handling and logging
- [ ] Performance optimization
- [ ] Mobile-responsive UI
- [ ] Accessibility compliance

### User Experience Requirements

- [ ] Intuitive email sending workflow
- [ ] Clear status indicators
- [ ] Helpful error messages
- [ ] Progress tracking for bulk operations
- [ ] Easy configuration management

## Timeline

- **Phase 1**: 3-4 hours (Core infrastructure)
- **Phase 2**: 2-3 hours (Server actions)
- **Phase 3**: 3-4 hours (UI components)
- **Phase 4**: 2-3 hours (Integration)
- **Phase 5**: 1-2 hours (Database updates)
- **Phase 6**: 1-2 hours (Error handling)
- **Phase 7**: 2-3 hours (Testing)

**Total Estimated Time**: 14-21 hours

## Risk Mitigation

### Potential Issues

1. **SMTP Configuration**: Complex setup for different providers
2. **Email Delivery**: Potential for emails to be marked as spam
3. **Rate Limiting**: Email providers may limit sending rates
4. **Template Rendering**: Complex template system requirements
5. **Error Handling**: Difficult to handle all email failure scenarios

### Mitigation Strategies

1. **Provider Documentation**: Use well-documented SMTP providers
2. **Email Authentication**: Implement SPF, DKIM, and DMARC
3. **Gradual Rollout**: Start with small batches and increase gradually
4. **Simple Templates**: Start with basic templates and enhance over time
5. **Comprehensive Logging**: Log all errors for debugging and improvement

## Next Steps

1. **Review and approve** this execution plan
2. **Set up development environment** with email testing capabilities
3. **Create TODO list** for tracking progress
4. **Begin Phase 1** implementation
5. **Regular validation** with email testing
6. **User feedback** collection and integration

## Dependencies

### Required Packages

- `nodemailer`: Core email sending functionality
- `@types/nodemailer`: TypeScript definitions

### Optional Packages

- `handlebars`: Advanced template rendering
- `bull`: Queue management for bulk operations
- `winston`: Enhanced logging

## Environment Variables

### Required

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=Certificate Generator
EMAIL_FROM_ADDRESS=your-email@gmail.com
```

### Optional

```env
EMAIL_SUBJECT_TEMPLATE=Your Certificate - {eventTitle}
EMAIL_TEMPLATE_PATH=./lib/email-templates/
EMAIL_RATE_LIMIT=100
EMAIL_RETRY_ATTEMPTS=3
```

## Conclusion

This execution plan provides a comprehensive roadmap for implementing email functionality in the certificate generator application. The phased approach ensures systematic development while maintaining code quality and user experience. Regular testing and validation at each phase will ensure the final implementation meets all requirements and provides a seamless user experience.
