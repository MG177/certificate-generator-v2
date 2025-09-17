# Email Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the email functionality in the certificate generator application. The strategy covers unit testing, integration testing, end-to-end testing, and performance testing to ensure reliable email delivery and user experience.

## Testing Objectives

### 1. Functional Testing

- Verify email sending functionality works correctly
- Ensure proper error handling and recovery
- Validate email content and formatting
- Test bulk email operations

### 2. Security Testing

- Validate email authentication and authorization
- Test input validation and sanitization
- Verify secure credential handling
- Check for security vulnerabilities

### 3. Performance Testing

- Measure email sending performance
- Test system under load
- Validate rate limiting functionality
- Monitor resource usage

### 4. User Experience Testing

- Verify intuitive user interface
- Test error messages and feedback
- Validate progress indicators
- Check accessibility compliance

## Testing Environment Setup

### 1. Test Email Configuration

**Development Environment**:

```env
# Test SMTP Configuration
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=test-user
SMTP_PASS=test-password
EMAIL_FROM_NAME=Test Certificate Generator
EMAIL_FROM_ADDRESS=test@example.com

# Test Database
MONGODB_URI=mongodb://localhost:27017/certificate-generator-test
```

**Production-like Environment**:

- Use dedicated test email accounts
- Implement email sandboxing
- Set up test domains with proper DNS records
- Configure test SMTP servers

### 2. Test Data Management

**Test Participants**:

```typescript
const testParticipants = [
  {
    name: 'John Doe',
    email: 'john.doe@test.com',
    certification_id: 'CERT-001',
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@test.com',
    certification_id: 'CERT-002',
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@test.com',
    certification_id: 'CERT-003',
  },
];
```

**Test Events**:

- Create test events with various configurations
- Include events with missing templates
- Test events with invalid participant data
- Create events with different email settings

## Unit Testing

### 1. Email Service Tests

**File**: `lib/__tests__/email-service.test.ts`

```typescript
describe('EmailService', () => {
  let emailService: EmailService;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;

  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
    } as any;

    emailService = new EmailService(mockTransporter);
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        attachments: [],
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: 'Email sent successfully',
      });

      const result = await emailService.sendEmail(emailData);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(emailData);
    });

    it('should handle SMTP errors', async () => {
      const emailData = {
        to: 'invalid@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        attachments: [],
      };

      mockTransporter.sendMail.mockRejectedValue(
        new Error('SMTP connection failed')
      );

      const result = await emailService.sendEmail(emailData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('SMTP connection failed');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      expect(emailService.validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(emailService.validateEmail('invalid-email')).toBe(false);
    });

    it('should reject disposable email domains', () => {
      expect(emailService.validateEmail('test@10minutemail.com')).toBe(false);
    });
  });
});
```

### 2. Email Template Tests

**File**: `lib/__tests__/email-template.test.ts`

```typescript
describe('EmailTemplate', () => {
  let template: EmailTemplate;

  beforeEach(() => {
    template = new EmailTemplate();
  });

  describe('renderTemplate', () => {
    it('should render template with variables', () => {
      const templateContent =
        'Hello {participantName}, your certificate {certificateId} is ready.';
      const variables = {
        participantName: 'John Doe',
        certificateId: 'CERT-001',
      };

      const result = template.renderTemplate(templateContent, variables);

      expect(result).toBe(
        'Hello John Doe, your certificate CERT-001 is ready.'
      );
    });

    it('should handle missing variables', () => {
      const templateContent =
        'Hello {participantName}, your certificate is ready.';
      const variables = {};

      const result = template.renderTemplate(templateContent, variables);

      expect(result).toBe(
        'Hello {participantName}, your certificate is ready.'
      );
    });

    it('should sanitize HTML content', () => {
      const templateContent =
        '<p>Hello {participantName}</p><script>alert("xss")</script>';
      const variables = { participantName: 'John Doe' };

      const result = template.renderTemplate(templateContent, variables);

      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello John Doe');
    });
  });
});
```

### 3. Rate Limiter Tests

**File**: `lib/__tests__/rate-limiter.test.ts`

```typescript
describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
  });

  describe('canSend', () => {
    it('should allow sending within rate limit', () => {
      const userId = 'user-1';

      for (let i = 0; i < 10; i++) {
        expect(rateLimiter.canSend(userId, 100)).toBe(true);
      }
    });

    it('should block sending when rate limit exceeded', () => {
      const userId = 'user-2';

      // Send up to limit
      for (let i = 0; i < 100; i++) {
        rateLimiter.canSend(userId, 100);
      }

      // Next send should be blocked
      expect(rateLimiter.canSend(userId, 100)).toBe(false);
    });

    it('should reset rate limit after time window', async () => {
      const userId = 'user-3';

      // Fill up rate limit
      for (let i = 0; i < 100; i++) {
        rateLimiter.canSend(userId, 100);
      }

      // Wait for reset (in real implementation)
      jest.advanceTimersByTime(3600000); // 1 hour

      expect(rateLimiter.canSend(userId, 100)).toBe(true);
    });
  });
});
```

## Integration Testing

### 1. Email Sending Integration Tests

**File**: `__tests__/integration/email-sending.test.ts`

```typescript
describe('Email Sending Integration', () => {
  let app: Express;
  let testDb: Db;
  let testEvent: IEvent;

  beforeAll(async () => {
    app = createTestApp();
    testDb = await connectTestDatabase();

    // Create test event
    testEvent = await createTestEvent({
      title: 'Test Event',
      participants: testParticipants,
    });
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/email/send', () => {
    it('should send individual email successfully', async () => {
      const response = await request(app)
        .post('/api/email/send')
        .send({
          eventId: testEvent._id,
          participantId: testParticipants[0].certification_id,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.messageId).toBeDefined();
    });

    it('should handle invalid participant', async () => {
      const response = await request(app)
        .post('/api/email/send')
        .send({
          eventId: testEvent._id,
          participantId: 'invalid-id',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Participant not found');
    });

    it('should validate email address', async () => {
      // Update participant with invalid email
      await updateParticipant(
        testEvent._id,
        testParticipants[0].certification_id,
        {
          email: 'invalid-email',
        }
      );

      const response = await request(app)
        .post('/api/email/send')
        .send({
          eventId: testEvent._id,
          participantId: testParticipants[0].certification_id,
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid email address');
    });
  });

  describe('POST /api/email/bulk-send', () => {
    it('should send bulk emails successfully', async () => {
      const response = await request(app)
        .post('/api/email/bulk-send')
        .send({
          eventId: testEvent._id,
          participantIds: testParticipants.map((p) => p.certification_id),
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.processed).toBe(testParticipants.length);
    });

    it('should handle partial failures', async () => {
      // Set up one participant with invalid email
      await updateParticipant(
        testEvent._id,
        testParticipants[0].certification_id,
        {
          email: 'invalid-email',
        }
      );

      const response = await request(app)
        .post('/api/email/bulk-send')
        .send({
          eventId: testEvent._id,
          participantIds: testParticipants.map((p) => p.certification_id),
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.failed).toBe(1);
      expect(response.body.sent).toBe(testParticipants.length - 1);
    });
  });
});
```

### 2. Database Integration Tests

**File**: `__tests__/integration/email-database.test.ts`

```typescript
describe('Email Database Integration', () => {
  let testDb: Db;

  beforeAll(async () => {
    testDb = await connectTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('Email Logging', () => {
    it('should log email attempts', async () => {
      const emailLog = {
        participantId: 'participant-1',
        eventId: 'event-1',
        emailAddress: 'test@example.com',
        status: 'sent',
        sentAt: new Date(),
      };

      const result = await testDb.collection('emailLogs').insertOne(emailLog);
      expect(result.insertedId).toBeDefined();

      const savedLog = await testDb.collection('emailLogs').findOne({
        _id: result.insertedId,
      });
      expect(savedLog).toMatchObject(emailLog);
    });

    it('should update participant email status', async () => {
      const eventId = 'event-1';
      const participantId = 'participant-1';

      await updateParticipantEmailStatus(eventId, participantId, {
        emailStatus: 'sent',
        lastEmailSent: new Date(),
      });

      const event = await getEvent(eventId);
      const participant = event.participants.find(
        (p) => p.certification_id === participantId
      );

      expect(participant.emailStatus).toBe('sent');
      expect(participant.lastEmailSent).toBeDefined();
    });
  });
});
```

## End-to-End Testing

### 1. Playwright E2E Tests

**File**: `e2e/email-functionality.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Email Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Set up test event and participants
  });

  test('should send individual email', async ({ page }) => {
    // Navigate to participant manager
    await page.click('[data-testid="participant-manager-tab"]');

    // Click send button on first participant
    await page.click('[data-testid="send-email-button-0"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();

    // Verify email status updated
    await expect(page.locator('[data-testid="email-status-0"]')).toHaveText(
      'Sent'
    );
  });

  test('should send bulk emails', async ({ page }) => {
    // Select multiple participants
    await page.check('[data-testid="participant-checkbox-0"]');
    await page.check('[data-testid="participant-checkbox-1"]');
    await page.check('[data-testid="participant-checkbox-2"]');

    // Click bulk send button
    await page.click('[data-testid="bulk-send-emails"]');

    // Verify progress indicator
    await expect(
      page.locator('[data-testid="bulk-email-progress"]')
    ).toBeVisible();

    // Wait for completion
    await expect(
      page.locator('[data-testid="bulk-email-progress"]')
    ).not.toBeVisible();

    // Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });

  test('should handle email failures gracefully', async ({ page }) => {
    // Set up participant with invalid email
    await page.click('[data-testid="edit-participant-0"]');
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="save-participant"]');

    // Try to send email
    await page.click('[data-testid="send-email-button-0"]');

    // Verify error message
    await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-toast"]')).toContainText(
      'Invalid email address'
    );
  });

  test('should show email status indicators', async ({ page }) => {
    // Send email to first participant
    await page.click('[data-testid="send-email-button-0"]');

    // Verify status indicator
    await expect(page.locator('[data-testid="email-status-0"]')).toHaveText(
      'Sent'
    );
    await expect(
      page.locator('[data-testid="email-status-icon-0"]')
    ).toHaveClass(/sent/);

    // Verify last sent date
    await expect(
      page.locator('[data-testid="last-sent-date-0"]')
    ).toBeVisible();
  });
});
```

### 2. Email Configuration E2E Tests

**File**: `e2e/email-configuration.spec.ts`

```typescript
test.describe('Email Configuration', () => {
  test('should configure SMTP settings', async ({ page }) => {
    await page.goto('http://localhost:3000/settings');

    // Open email configuration
    await page.click('[data-testid="email-config-tab"]');

    // Fill SMTP settings
    await page.fill('[data-testid="smtp-host"]', 'smtp.gmail.com');
    await page.fill('[data-testid="smtp-port"]', '587');
    await page.fill('[data-testid="smtp-user"]', 'test@gmail.com');
    await page.fill('[data-testid="smtp-pass"]', 'test-password');

    // Test connection
    await page.click('[data-testid="test-connection"]');
    await expect(page.locator('[data-testid="connection-status"]')).toHaveText(
      'Connected'
    );

    // Save configuration
    await page.click('[data-testid="save-email-config"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });

  test('should edit email templates', async ({ page }) => {
    await page.goto('http://localhost:3000/settings/email-templates');

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
    await expect(
      page.locator('[data-testid="template-preview"]')
    ).toContainText('Hello John Doe, your certificate is attached.');

    // Save template
    await page.click('[data-testid="save-template"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });
});
```

## Performance Testing

### 1. Load Testing

**File**: `tests/performance/email-load.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Email Performance', () => {
  test('should handle bulk email sending efficiently', async ({ page }) => {
    const startTime = Date.now();

    // Create 100 test participants
    const participants = Array.from({ length: 100 }, (_, i) => ({
      name: `Participant ${i}`,
      email: `participant${i}@test.com`,
      certification_id: `CERT-${i.toString().padStart(3, '0')}`,
    }));

    // Upload participants
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="upload-csv"]');
    await page.setInputFiles(
      '[data-testid="csv-file"]',
      createTestCSV(participants)
    );

    // Select all participants
    await page.click('[data-testid="select-all-participants"]');

    // Send bulk emails
    await page.click('[data-testid="bulk-send-emails"]');

    // Wait for completion
    await expect(
      page.locator('[data-testid="bulk-email-progress"]')
    ).not.toBeVisible();

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within 2 minutes
    expect(duration).toBeLessThan(120000);
  });

  test('should respect rate limiting', async ({ page }) => {
    // Set up rate limiting test
    await page.goto('http://localhost:3000');

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
});
```

### 2. Memory Usage Testing

**File**: `tests/performance/memory-usage.test.ts`

```typescript
test.describe('Memory Usage', () => {
  test('should not leak memory during bulk email sending', async ({ page }) => {
    const initialMemory = await page.evaluate(
      () => performance.memory?.usedJSHeapSize || 0
    );

    // Send 50 emails
    for (let i = 0; i < 50; i++) {
      await page.click('[data-testid="send-email-button-0"]');
      await page.waitForTimeout(100);
    }

    // Force garbage collection
    await page.evaluate(() => {
      if (window.gc) window.gc();
    });

    const finalMemory = await page.evaluate(
      () => performance.memory?.usedJSHeapSize || 0
    );
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

## Security Testing

### 1. Input Validation Testing

**File**: `tests/security/input-validation.test.ts`

```typescript
test.describe('Email Input Validation', () => {
  test('should prevent XSS in email templates', async ({ page }) => {
    await page.goto('http://localhost:3000/settings/email-templates');

    // Try to inject script
    await page.fill(
      '[data-testid="html-template"]',
      '<script>alert("xss")</script><p>Hello {participantName}</p>'
    );
    await page.click('[data-testid="preview-template"]');

    // Script should be removed
    const preview = await page
      .locator('[data-testid="template-preview"]')
      .textContent();
    expect(preview).not.toContain('<script>');
    expect(preview).toContain('Hello John Doe');
  });

  test('should validate email addresses', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Try to add participant with invalid email
    await page.click('[data-testid="add-participant"]');
    await page.fill('[data-testid="participant-email"]', 'invalid-email');
    await page.click('[data-testid="save-participant"]');

    // Should show validation error
    await expect(
      page.locator('[data-testid="email-validation-error"]')
    ).toBeVisible();
  });
});
```

### 2. Authentication Testing

**File**: `tests/security/authentication.test.ts`

```typescript
test.describe('Email Authentication', () => {
  test('should require authentication for email sending', async ({ page }) => {
    // Try to access email API without authentication
    const response = await page.request.post('/api/email/send', {
      data: { eventId: 'test', participantId: 'test' },
    });

    expect(response.status()).toBe(401);
  });

  test('should validate SMTP credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/settings');

    // Enter invalid SMTP credentials
    await page.fill('[data-testid="smtp-user"]', 'invalid-user');
    await page.fill('[data-testid="smtp-pass"]', 'invalid-pass');

    // Test connection should fail
    await page.click('[data-testid="test-connection"]');
    await expect(
      page.locator('[data-testid="connection-error"]')
    ).toBeVisible();
  });
});
```

## Test Data Management

### 1. Test Data Setup

**File**: `tests/helpers/test-data.ts`

```typescript
export const createTestEvent = async (overrides = {}) => {
  const defaultEvent = {
    title: 'Test Event',
    description: 'Test event for email testing',
    eventDate: new Date(),
    status: 'draft',
    template: {
      base64: 'test-base64-data',
      originalName: 'test-template.png',
      uploadedAt: new Date(),
    },
    nameConfig: {
      x: 100,
      y: 100,
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#000000',
      textAlign: 'center' as const,
    },
    idConfig: {
      x: 100,
      y: 150,
      fontFamily: 'Arial',
      fontSize: 18,
      color: '#666666',
      textAlign: 'center' as const,
    },
    participants: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { ...defaultEvent, ...overrides };
};

export const createTestParticipants = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    name: `Test Participant ${i + 1}`,
    email: `participant${i + 1}@test.com`,
    certification_id: `CERT-${(i + 1).toString().padStart(3, '0')}`,
  }));
};

export const createTestCSV = (participants: any[]) => {
  const csvContent = [
    'name,certification_id,email',
    ...participants.map((p) => `${p.name},${p.certification_id},${p.email}`),
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv' });
};
```

### 2. Test Environment Cleanup

**File**: `tests/helpers/cleanup.ts`

```typescript
export const cleanupTestDatabase = async () => {
  const db = await getTestDatabase();
  await db.collection('events').deleteMany({});
  await db.collection('emailLogs').deleteMany({});
};

export const cleanupTestFiles = async () => {
  // Clean up any test files created during testing
  const testDir = path.join(__dirname, '../test-files');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
  }
};
```

## Continuous Integration

### 1. GitHub Actions Workflow

**File**: `.github/workflows/email-tests.yml`

```yaml
name: Email Functionality Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --eval 'db.adminCommand(\"ping\")'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit
        env:
          NODE_ENV: test
          MONGODB_URI: mongodb://localhost:27017/certificate-generator-test

      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          MONGODB_URI: mongodb://localhost:27017/certificate-generator-test
          SMTP_HOST: smtp.ethereal.email
          SMTP_PORT: 587
          SMTP_USER: test-user
          SMTP_PASS: test-password

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NODE_ENV: test
          MONGODB_URI: mongodb://localhost:27017/certificate-generator-test

      - name: Run security tests
        run: npm run test:security
        env:
          NODE_ENV: test
```

### 2. Test Scripts

**File**: `package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:security": "jest --testPathPattern=security",
    "test:performance": "jest --testPathPattern=performance",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

## Test Reporting

### 1. Coverage Reports

- Unit test coverage: >90%
- Integration test coverage: >80%
- E2E test coverage: >70%

### 2. Performance Benchmarks

- Individual email sending: <5 seconds
- Bulk email (100 participants): <2 minutes
- Memory usage: <512MB for bulk operations
- Error rate: <1%

### 3. Security Test Results

- No XSS vulnerabilities
- No injection attacks possible
- Proper input validation
- Secure credential handling

## Conclusion

This comprehensive testing strategy ensures the email functionality is reliable, secure, and performant. Regular execution of these tests as part of the CI/CD pipeline maintains code quality and prevents regressions.

Key testing principles:

- Test early and often
- Cover all critical paths
- Include security testing
- Monitor performance
- Maintain test data quality
- Document test results
