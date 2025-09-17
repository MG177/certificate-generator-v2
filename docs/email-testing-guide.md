# Email Testing Guide

## Overview

This guide provides comprehensive instructions for testing the email functionality in the certificate generator application. The testing suite includes unit tests, integration tests, end-to-end tests, and performance tests.

## Test Structure

### Unit Tests (`lib/__tests__/`)

- **`email-service.test.ts`** - Tests for the core email service functionality
- **`email-validation-service.test.ts`** - Tests for email validation logic
- **`email-error-handler.test.ts`** - Tests for error handling and categorization

### Integration Tests (`__tests__/integration/`)

- **`email-actions.test.ts`** - Tests for email server actions and database interactions

### End-to-End Tests (`e2e/`)

- **`email-functionality.spec.ts`** - Playwright tests for complete email workflows

### Performance Tests (`tests/performance/`)

- **`email-performance.test.ts`** - Performance and load testing for email operations

## Running Tests

### Prerequisites

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up test environment variables:

   ```bash
   cp .env.example .env.test
   ```

3. Start MongoDB test instance:
   ```bash
   mongod --dbpath ./test-data
   ```

### Unit Tests

Run all unit tests:

```bash
npm run test:unit
```

Run specific test file:

```bash
npm test -- email-service.test.ts
```

Run with coverage:

```bash
npm run test:coverage
```

### Integration Tests

Run integration tests:

```bash
npm run test:integration
```

### End-to-End Tests

Install Playwright browsers:

```bash
npx playwright install
```

Run E2E tests:

```bash
npm run test:e2e
```

Run specific E2E test:

```bash
npx playwright test email-functionality.spec.ts
```

### Performance Tests

Run performance tests:

```bash
npm run test:performance
```

### All Tests

Run all tests:

```bash
npm run test:all
```

## Test Data

### Test Participants

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
  // ... more participants
];
```

### Test Email Configuration

```typescript
const testEmailConfig = {
  smtpHost: 'smtp.test.com',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: 'test@test.com',
  smtpPass: 'testpass',
  fromName: 'Test Sender',
  fromAddress: 'test@test.com',
  subjectTemplate: 'Your Certificate - {eventTitle}',
  enabled: true,
};
```

### Test Email Template

```typescript
const testEmailTemplate = {
  subject: 'Your Certificate - {eventTitle}',
  html: '<p>Hello {participantName}, your certificate is attached.</p>',
  text: 'Hello {participantName}, your certificate is attached.',
};
```

## Test Scenarios

### 1. Individual Email Sending

**Test Case**: Send email to single participant

- **Input**: Valid participant with email address
- **Expected**: Email sent successfully, status updated to 'sent'
- **Validation**: Check email logs, participant status

### 2. Bulk Email Sending

**Test Case**: Send emails to multiple participants

- **Input**: Array of participants with email addresses
- **Expected**: All emails sent successfully, progress tracking
- **Validation**: Check bulk operation results, individual statuses

### 3. Email Validation

**Test Case**: Validate email addresses and configuration

- **Input**: Various email formats and configurations
- **Expected**: Proper validation errors and warnings
- **Validation**: Check validation service responses

### 4. Error Handling

**Test Case**: Handle various email sending errors

- **Input**: SMTP errors, authentication failures, network issues
- **Expected**: Proper error categorization and retry logic
- **Validation**: Check error types, retry attempts, user messages

### 5. Performance Testing

**Test Case**: Send large number of emails

- **Input**: 100+ participants
- **Expected**: Completion within time limits, memory efficiency
- **Validation**: Check execution time, memory usage, success rate

## Mocking

### Nodemailer Mock

```typescript
const mockTransporter = {
  sendMail: jest.fn(),
  verify: jest.fn(),
  close: jest.fn(),
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));
```

### Database Mock

```typescript
const mockDatabase = {
  collection: jest.fn(() => ({
    findOne: jest.fn(),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  })),
};
```

## Test Environment Setup

### Environment Variables

```bash
# Test Database
MONGODB_URI=mongodb://localhost:27017/certificate-generator-test

# Test SMTP (use test service like Ethereal)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=test-user
SMTP_PASS=test-password

# Test Configuration
NODE_ENV=test
```

### Test Database

- Use separate test database
- Clean up after each test
- Use transactions where possible
- Mock external services

## Continuous Integration

### GitHub Actions

```yaml
name: Email Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - run: npm run test:e2e
```

## Debugging Tests

### Unit Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test with debugging
npm test -- --testNamePattern="should send email successfully" --verbose
```

### E2E Tests

```bash
# Run with headed browser
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

### Performance Tests

```bash
# Run with detailed output
npm run test:performance -- --reporter=html

# Run specific performance test
npx playwright test --grep "should handle bulk email sending efficiently"
```

## Test Coverage

### Coverage Goals

- **Unit Tests**: >90% coverage
- **Integration Tests**: >80% coverage
- **E2E Tests**: >70% coverage

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection**: Ensure test database is running
2. **SMTP Errors**: Use test SMTP service like Ethereal
3. **Timeout Issues**: Increase timeout values for slow operations
4. **Memory Issues**: Monitor memory usage during bulk operations

### Debug Commands

```bash
# Check test database connection
mongosh mongodb://localhost:27017/certificate-generator-test

# Test SMTP connection
node -e "const nodemailer = require('nodemailer'); const transporter = nodemailer.createTransport({host: 'smtp.ethereal.email', port: 587, auth: {user: 'test', pass: 'test'}}); transporter.verify().then(console.log).catch(console.error);"

# Check test environment
npm run test -- --verbose --no-coverage
```

## Best Practices

### Test Organization

- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Clean up after each test

### Test Data

- Use factory functions for test data
- Keep test data minimal and focused
- Use realistic but not production data
- Clean up test data after tests

### Assertions

- Use specific assertions
- Test both success and failure cases
- Verify side effects (database updates, logs)
- Check error messages and types

### Performance

- Set reasonable timeouts
- Monitor memory usage
- Test with realistic data volumes
- Use performance budgets

## Conclusion

This testing suite provides comprehensive coverage of the email functionality, ensuring reliability and performance. Regular execution of these tests helps maintain code quality and prevents regressions.

For questions or issues with testing, refer to the test files or contact the development team.
