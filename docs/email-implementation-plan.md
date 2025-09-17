# Email Implementation Plan with Nodemailer

## Overview

This document outlines the comprehensive implementation plan for adding email functionality to the certificate generator application using Nodemailer. The feature will allow users to send individual certificates via email to participants.

## Current State Analysis

### Existing Infrastructure

- **Database**: MongoDB with events and participant data
- **Certificate Generation**: Already implemented with individual certificate generation
- **Participant Management**: Full CRUD operations for participants
- **UI Components**: Participant table with action buttons including 'send' action

### Missing Components

- Email service configuration and setup
- Email template system
- Email sending server actions
- Email status tracking
- Error handling for email failures
- Email configuration UI

## Technical Requirements

### 1. Dependencies

- **nodemailer**: Core email sending library
- **@types/nodemailer**: TypeScript definitions
- **handlebars**: Email template engine (optional, for advanced templates)

### 2. Environment Configuration

- SMTP server configuration
- Email credentials management
- Email template configuration
- Rate limiting configuration

### 3. Database Schema Updates

- Add email tracking fields to participant data
- Add email configuration to event data
- Add email logs for audit trail

## Implementation Plan

### Phase 1: Environment Setup and Configuration (1-2 hours)

#### 1.1 Install Dependencies

```bash
npm install nodemailer @types/nodemailer
```

#### 1.2 Environment Variables Setup

Create `.env.local` with email configuration:

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

#### 1.3 Email Configuration Types

Update `lib/types.ts` with email-related interfaces:

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
}

export interface IEmailLog {
  participantId: string;
  eventId: string;
  emailAddress: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  sentAt?: Date;
  errorMessage?: string;
  retryCount: number;
  lastRetryAt?: Date;
}

export interface IEmailTemplate {
  subject: string;
  html: string;
  text: string;
}
```

### Phase 2: Email Service Implementation (2-3 hours)

#### 2.1 Create Email Service

Create `lib/email-service.ts`:

- SMTP connection management
- Email sending functionality
- Template rendering
- Error handling and retry logic
- Rate limiting

#### 2.2 Create Email Templates

Create `lib/email-templates/` directory:

- `certificate-email.html` - HTML email template
- `certificate-email.txt` - Plain text fallback
- Template variables: {participantName}, {eventTitle}, {certificateId}, {downloadLink}

#### 2.3 Email Configuration Management

Create `lib/email-config.ts`:

- Load configuration from environment
- Validate email settings
- Provide default configurations
- Handle configuration errors

### Phase 3: Server Actions Implementation (2-3 hours)

#### 3.1 Individual Email Sending

Create `sendParticipantEmail` server action:

- Generate individual certificate
- Create email with certificate attachment
- Send email via Nodemailer
- Update participant's email status
- Log email attempt

#### 3.2 Bulk Email Sending

Create `sendBulkEmails` server action:

- Process multiple participants
- Queue emails for sending
- Handle rate limiting
- Provide progress tracking
- Handle partial failures

#### 3.3 Email Status Management

Create email status tracking functions:

- `getEmailStatus` - Check email delivery status
- `retryFailedEmails` - Retry failed email attempts
- `getEmailLogs` - Retrieve email history

### Phase 4: Database Schema Updates (1 hour)

#### 4.1 Update Participant Interface

Add email tracking fields to `IRecipientData`:

```typescript
export interface IRecipientData {
  name: string;
  certification_id: string;
  email?: string;
  lastEmailSent?: Date;
  emailStatus?: 'not_sent' | 'pending' | 'sent' | 'failed' | 'bounced';
  emailError?: string;
  emailRetryCount?: number;
}
```

#### 4.2 Update Event Interface

Add email configuration to `IEvent`:

```typescript
export interface IEvent {
  // ... existing fields
  emailConfig?: IEmailConfig;
  emailTemplate?: IEmailTemplate;
  emailSettings?: {
    enabled: boolean;
    requireEmail: boolean;
    autoSend: boolean;
  };
}
```

#### 4.3 Create Email Logs Collection

Add email logging functionality:

- Track all email attempts
- Store error messages
- Monitor delivery status
- Enable retry mechanisms

### Phase 5: UI Components Implementation (2-3 hours)

#### 5.1 Email Status Indicators

Update `participant-row.tsx`:

- Show email status icons
- Display last sent date
- Show error messages for failed emails
- Add retry button for failed emails

#### 5.2 Email Configuration Dialog

Create `components/email/email-config-dialog.tsx`:

- SMTP configuration form
- Email template editor
- Test email functionality
- Save configuration

#### 5.3 Bulk Email Actions

Update `bulk-actions.tsx`:

- Add "Send Emails" bulk action
- Show progress indicator
- Display success/failure counts
- Handle partial failures

#### 5.4 Email Status Dashboard

Create `components/email/email-status-dashboard.tsx`:

- Overview of email statuses
- Failed email retry options
- Email logs viewer
- Statistics and analytics

### Phase 6: Error Handling and Validation (1-2 hours)

#### 6.1 Email Validation

- Validate email addresses before sending
- Check for required fields
- Handle invalid email formats
- Provide user feedback

#### 6.2 Error Handling

- SMTP connection errors
- Email delivery failures
- Rate limiting errors
- Template rendering errors
- Retry mechanisms

#### 6.3 User Feedback

- Toast notifications for email status
- Progress indicators for bulk operations
- Error messages with actionable steps
- Success confirmations

### Phase 7: Testing and Validation (1-2 hours)

#### 7.1 Unit Tests

- Email service functions
- Template rendering
- Configuration validation
- Error handling

#### 7.2 Integration Tests

- End-to-end email sending
- Bulk email operations
- Error scenarios
- Retry mechanisms

#### 7.3 User Acceptance Testing

- Test email sending workflow
- Verify email delivery
- Check error handling
- Validate UI feedback

## File Structure Changes

### New Files to Create

```
lib/
├── email-service.ts           # Core email functionality
├── email-config.ts           # Email configuration management
├── email-templates/
│   ├── certificate-email.html
│   └── certificate-email.txt
└── email-utils.ts            # Email utility functions

components/email/
├── email-config-dialog.tsx   # Email configuration UI
├── email-status-dashboard.tsx # Email status overview
├── email-status-indicator.tsx # Status display component
└── bulk-email-actions.tsx    # Bulk email operations

app/api/email/
├── send/route.ts             # Individual email API
├── bulk-send/route.ts        # Bulk email API
└── status/route.ts           # Email status API
```

### Files to Update

```
lib/
├── types.ts                  # Add email interfaces
├── actions.ts                # Add email server actions
└── mongodb.ts                # Add email logging

components/participant-manager/
├── participant-manager-section.tsx # Add email handlers
├── participant-row.tsx       # Add email status display
└── bulk-actions.tsx          # Add email bulk actions
```

## Security Considerations

### 1. Email Credentials

- Store SMTP credentials securely in environment variables
- Use app-specific passwords for Gmail
- Implement credential rotation
- Never log sensitive information

### 2. Rate Limiting

- Implement per-user rate limiting
- Add delays between bulk emails
- Monitor for abuse patterns
- Implement backoff strategies

### 3. Email Validation

- Validate email addresses before sending
- Implement bounce handling
- Monitor delivery rates
- Handle unsubscribe requests

### 4. Privacy Compliance

- Ensure GDPR compliance for email data
- Implement data retention policies
- Provide opt-out mechanisms
- Audit email activities

## Performance Considerations

### 1. Email Queuing

- Implement email queue for bulk operations
- Use background processing for large batches
- Provide progress tracking
- Handle timeouts gracefully

### 2. Resource Management

- Limit concurrent email sending
- Implement memory management for large batches
- Use streaming for large attachments
- Monitor resource usage

### 3. Caching

- Cache email templates
- Cache SMTP connections
- Implement template compilation caching
- Use Redis for queue management (optional)

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

## Timeline Estimate

- **Phase 1**: 1-2 hours (Environment setup)
- **Phase 2**: 2-3 hours (Email service)
- **Phase 3**: 2-3 hours (Server actions)
- **Phase 4**: 1 hour (Database updates)
- **Phase 5**: 2-3 hours (UI components)
- **Phase 6**: 1-2 hours (Error handling)
- **Phase 7**: 1-2 hours (Testing)

**Total Estimated Time**: 10-16 hours

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

1. **Review and approve** this implementation plan
2. **Set up development environment** with email testing capabilities
3. **Create TODO list** for tracking progress
4. **Begin Phase 1** implementation
5. **Regular validation** with email testing
6. **User feedback** collection and integration
