import {
  EmailErrorFactory,
  EmailErrorType,
  EmailValidator,
  EmailRetryManager,
  EmailErrorLogger,
} from '../email-error-handler';
import { IEmailConfig, IEmailTemplate, IRecipientData } from '../types';

describe('EmailErrorFactory', () => {
  describe('createSMTPConnectionError', () => {
    it('should create SMTP connection error', () => {
      const originalError = new Error('Connection refused');
      const error = EmailErrorFactory.createSMTPConnectionError(originalError);

      expect(error.type).toBe(EmailErrorType.SMTP_CONNECTION_ERROR);
      expect(error.code).toBe('SMTP_CONNECTION_FAILED');
      expect(error.message).toContain('SMTP connection failed');
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toContain('Unable to connect to email server');
    });
  });

  describe('createAuthenticationError', () => {
    it('should create authentication error', () => {
      const originalError = new Error('Invalid credentials');
      const error = EmailErrorFactory.createAuthenticationError(originalError);

      expect(error.type).toBe(EmailErrorType.AUTHENTICATION_ERROR);
      expect(error.code).toBe('SMTP_AUTH_FAILED');
      expect(error.message).toContain('SMTP authentication failed');
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toContain('Email authentication failed');
    });
  });

  describe('createRateLimitError', () => {
    it('should create rate limit error', () => {
      const error = EmailErrorFactory.createRateLimitError(100, 50);

      expect(error.type).toBe(EmailErrorType.RATE_LIMIT_ERROR);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.message).toContain('Rate limit exceeded');
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toContain('Email sending rate limit exceeded');
    });
  });

  describe('createTemplateError', () => {
    it('should create template error', () => {
      const template = { subject: 'Test', html: 'Test', text: 'Test' };
      const originalError = new Error('Template rendering failed');
      const error = EmailErrorFactory.createTemplateError(
        template,
        originalError
      );

      expect(error.type).toBe(EmailErrorType.TEMPLATE_ERROR);
      expect(error.code).toBe('TEMPLATE_RENDER_FAILED');
      expect(error.message).toContain('Template rendering failed');
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toContain('Email template error');
    });
  });

  describe('createAttachmentError', () => {
    it('should create attachment error', () => {
      const filename = 'certificate.png';
      const originalError = new Error('File not found');
      const error = EmailErrorFactory.createAttachmentError(
        filename,
        originalError
      );

      expect(error.type).toBe(EmailErrorType.ATTACHMENT_ERROR);
      expect(error.code).toBe('ATTACHMENT_FAILED');
      expect(error.message).toContain('Attachment processing failed');
      expect(error.retryable).toBe(false);
    });
  });

  describe('createDeliveryError', () => {
    it('should create delivery error', () => {
      const recipient = 'test@example.com';
      const originalError = new Error('Recipient not found');
      const error = EmailErrorFactory.createDeliveryError(
        recipient,
        originalError
      );

      expect(error.type).toBe(EmailErrorType.DELIVERY_ERROR);
      expect(error.code).toBe('DELIVERY_FAILED');
      expect(error.message).toContain('Email delivery failed');
      expect(error.retryable).toBe(true);
    });
  });

  describe('createNetworkError', () => {
    it('should create network error', () => {
      const originalError = new Error('Network unreachable');
      const error = EmailErrorFactory.createNetworkError(originalError);

      expect(error.type).toBe(EmailErrorType.NETWORK_ERROR);
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.message).toContain('Network error occurred');
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toContain('Network error occurred');
    });
  });

  describe('createConfigurationError', () => {
    it('should create configuration error', () => {
      const setting = 'smtpHost';
      const originalError = new Error('Invalid host');
      const error = EmailErrorFactory.createConfigurationError(
        setting,
        originalError
      );

      expect(error.type).toBe(EmailErrorType.CONFIGURATION_ERROR);
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.message).toContain('Configuration error');
      expect(error.retryable).toBe(false);
    });
  });

  describe('createValidationError', () => {
    it('should create validation error', () => {
      const field = 'email';
      const value = 'invalid-email';
      const error = EmailErrorFactory.createValidationError(
        field,
        value,
        'Invalid email format'
      );

      expect(error.type).toBe(EmailErrorType.VALIDATION_ERROR);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toContain('Validation error');
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toContain('Invalid email format');
    });
  });

  describe('createUnknownError', () => {
    it('should create unknown error', () => {
      const originalError = new Error('Something went wrong');
      const error = EmailErrorFactory.createUnknownError(originalError);

      expect(error.type).toBe(EmailErrorType.UNKNOWN_ERROR);
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.message).toContain('Unknown error occurred');
      expect(error.retryable).toBe(true);
    });
  });
});

describe('EmailValidator', () => {
  describe('validateEmailAddress', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name+tag@domain.co.uk',
        'user123@subdomain.example.org',
      ];

      validEmails.forEach((email) => {
        const result = EmailValidator.validateEmailAddress(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        '',
        'user..name@domain.com',
      ];

      invalidEmails.forEach((email) => {
        const result = EmailValidator.validateEmailAddress(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should reject disposable email domains', () => {
      const disposableEmails = [
        'test@10minutemail.com',
        'user@tempmail.org',
        'temp@guerrillamail.com',
      ];

      disposableEmails.forEach((email) => {
        const result = EmailValidator.validateEmailAddress(email);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].userMessage).toContain('disposable email');
      });
    });
  });

  describe('validateSMTPConfig', () => {
    it('should validate correct SMTP configuration', () => {
      const config: IEmailConfig = {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'test@gmail.com',
        smtpPass: 'validpassword',
        fromName: 'Test Sender',
        fromAddress: 'test@gmail.com',
        subjectTemplate: 'Test Subject',
        enabled: true,
      };

      const result = EmailValidator.validateSMTPConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for invalid host', () => {
      const config: IEmailConfig = {
        smtpHost: 'invalid-host',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'test@gmail.com',
        smtpPass: 'validpassword',
        fromName: 'Test Sender',
        fromAddress: 'test@gmail.com',
        subjectTemplate: 'Test Subject',
        enabled: true,
      };

      const result = EmailValidator.validateSMTPConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].userMessage).toContain('Invalid SMTP host');
    });

    it('should fail validation for invalid port', () => {
      const config: IEmailConfig = {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 99999,
        smtpSecure: false,
        smtpUser: 'test@gmail.com',
        smtpPass: 'validpassword',
        fromName: 'Test Sender',
        fromAddress: 'test@gmail.com',
        subjectTemplate: 'Test Subject',
        enabled: true,
      };

      const result = EmailValidator.validateSMTPConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].userMessage).toContain('Invalid port number');
    });

    it('should fail validation for invalid email address', () => {
      const config: IEmailConfig = {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'test@gmail.com',
        smtpPass: 'validpassword',
        fromName: 'Test Sender',
        fromAddress: 'invalid-email',
        subjectTemplate: 'Test Subject',
        enabled: true,
      };

      const result = EmailValidator.validateSMTPConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].userMessage).toContain('Invalid email address');
    });
  });

  describe('validateEmailTemplate', () => {
    it('should validate correct email template', () => {
      const template: IEmailTemplate = {
        subject: 'Your Certificate - {eventTitle}',
        html: '<p>Hello {participantName}, your certificate is attached.</p>',
        text: 'Hello {participantName}, your certificate is attached.',
      };

      const result = EmailValidator.validateEmailTemplate(template);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing subject', () => {
      const template: IEmailTemplate = {
        subject: '',
        html: '<p>Hello {participantName}, your certificate is attached.</p>',
        text: 'Hello {participantName}, your certificate is attached.',
      };

      const result = EmailValidator.validateEmailTemplate(template);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].userMessage).toContain('Subject is required');
    });

    it('should fail validation for missing HTML content', () => {
      const template: IEmailTemplate = {
        subject: 'Your Certificate - {eventTitle}',
        html: '',
        text: 'Hello {participantName}, your certificate is attached.',
      };

      const result = EmailValidator.validateEmailTemplate(template);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].userMessage).toContain(
        'HTML content is required'
      );
    });

    it('should warn about missing plain text template', () => {
      const template: IEmailTemplate = {
        subject: 'Your Certificate - {eventTitle}',
        html: '<p>Hello {participantName}, your certificate is attached.</p>',
        text: '',
      };

      const result = EmailValidator.validateEmailTemplate(template);

      expect(result.isValid).toBe(true);
      expect(result.warnings[0]).toContain(
        'Plain text template is recommended'
      );
    });
  });

  describe('validateParticipantForEmail', () => {
    it('should validate correct participant data', () => {
      const participant: IRecipientData = {
        name: 'John Doe',
        certification_id: 'CERT-001',
        email: 'john.doe@example.com',
      };

      const result = EmailValidator.validateParticipantForEmail(participant);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing name', () => {
      const participant: IRecipientData = {
        name: '',
        certification_id: 'CERT-001',
        email: 'john.doe@example.com',
      };

      const result = EmailValidator.validateParticipantForEmail(participant);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].userMessage).toContain('Name is required');
    });

    it('should fail validation for missing certification ID', () => {
      const participant: IRecipientData = {
        name: 'John Doe',
        certification_id: '',
        email: 'john.doe@example.com',
      };

      const result = EmailValidator.validateParticipantForEmail(participant);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].userMessage).toContain(
        'Certification ID is required'
      );
    });

    it('should fail validation for invalid email', () => {
      const participant: IRecipientData = {
        name: 'John Doe',
        certification_id: 'CERT-001',
        email: 'invalid-email',
      };

      const result = EmailValidator.validateParticipantForEmail(participant);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].userMessage).toContain('Invalid email format');
    });
  });
});

describe('EmailRetryManager', () => {
  describe('shouldRetry', () => {
    it('should allow retry for retryable errors', () => {
      const error = EmailErrorFactory.createSMTPConnectionError(
        new Error('Connection failed')
      );
      const retryCount = 0;

      const result = EmailRetryManager.shouldRetry(error, retryCount);

      expect(result).toBe(true);
    });

    it('should not allow retry for non-retryable errors', () => {
      const error = EmailErrorFactory.createAuthenticationError(
        new Error('Invalid credentials')
      );
      const retryCount = 0;

      const result = EmailRetryManager.shouldRetry(error, retryCount);

      expect(result).toBe(false);
    });

    it('should not allow retry when max retries exceeded', () => {
      const error = EmailErrorFactory.createSMTPConnectionError(
        new Error('Connection failed')
      );
      const retryCount = 5;

      const result = EmailRetryManager.shouldRetry(error, retryCount);

      expect(result).toBe(false);
    });

    it('should not allow retry for validation errors', () => {
      const error = EmailErrorFactory.createValidationError(
        'email',
        'invalid',
        'Invalid format'
      );
      const retryCount = 0;

      const result = EmailRetryManager.shouldRetry(error, retryCount);

      expect(result).toBe(false);
    });
  });

  describe('getNextRetryTime', () => {
    it('should calculate exponential backoff', () => {
      const error = EmailErrorFactory.createSMTPConnectionError(
        new Error('Connection failed')
      );
      const retryCount = 2;

      const nextRetryTime = EmailRetryManager.getNextRetryTime(
        error,
        retryCount
      );
      const now = Date.now();

      expect(nextRetryTime).toBeGreaterThan(now);
      expect(nextRetryTime - now).toBeGreaterThan(4000); // 2^2 * 1000ms
    });

    it('should use different backoff for rate limit errors', () => {
      const error = EmailErrorFactory.createRateLimitError(100, 50);
      const retryCount = 1;

      const nextRetryTime = EmailRetryManager.getNextRetryTime(
        error,
        retryCount
      );
      const now = Date.now();

      expect(nextRetryTime).toBeGreaterThan(now);
      expect(nextRetryTime - now).toBeGreaterThan(60000); // 1 minute for rate limit
    });
  });
});

describe('EmailErrorLogger', () => {
  let logger: EmailErrorLogger;

  beforeEach(() => {
    logger = new EmailErrorLogger();
  });

  describe('logError', () => {
    it('should log error with correct format', () => {
      const error = EmailErrorFactory.createSMTPConnectionError(
        new Error('Connection failed')
      );
      const context = { participantId: 'CERT-001', eventId: 'event-1' };

      const logEntry = logger.logError(error, context);

      expect(logEntry.timestamp).toBeInstanceOf(Date);
      expect(logEntry.errorType).toBe(EmailErrorType.SMTP_CONNECTION_ERROR);
      expect(logEntry.message).toContain('SMTP connection failed');
      expect(logEntry.context).toEqual(context);
      expect(logEntry.retryable).toBe(true);
    });
  });

  describe('getErrorSummary', () => {
    it('should return error summary', () => {
      const error1 = EmailErrorFactory.createSMTPConnectionError(
        new Error('Connection failed')
      );
      const error2 = EmailErrorFactory.createAuthenticationError(
        new Error('Invalid credentials')
      );

      logger.logError(error1, { participantId: 'CERT-001' });
      logger.logError(error2, { participantId: 'CERT-002' });

      const summary = logger.getErrorSummary();

      expect(summary.totalErrors).toBe(2);
      expect(summary.errorTypes[EmailErrorType.SMTP_CONNECTION_ERROR]).toBe(1);
      expect(summary.errorTypes[EmailErrorType.AUTHENTICATION_ERROR]).toBe(1);
      expect(summary.retryableErrors).toBe(1);
    });
  });
});
