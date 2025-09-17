import {
  EmailValidationService,
  ValidationContext,
} from '../email-validation-service';
import { IEvent, IRecipientData, IEmailConfig, IEmailTemplate } from '../types';

describe('EmailValidationService', () => {
  const mockEvent: IEvent = {
    _id: 'event-1',
    title: 'Test Event',
    description: 'Test event description',
    eventDate: new Date('2024-01-01'),
    status: 'draft',
    template: {
      base64: 'base64-template-data',
      originalName: 'template.png',
      uploadedAt: new Date(),
    },
    nameConfig: {
      x: 100,
      y: 100,
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#000000',
      textAlign: 'center',
    },
    idConfig: {
      x: 100,
      y: 150,
      fontFamily: 'Arial',
      fontSize: 18,
      color: '#666666',
      textAlign: 'center',
    },
    participants: [],
    emailConfig: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: 'test@gmail.com',
      smtpPass: 'testpass',
      fromName: 'Test Sender',
      fromAddress: 'test@gmail.com',
      subjectTemplate: 'Your Certificate - {eventTitle}',
      enabled: true,
    },
    emailTemplate: {
      subject: 'Your Certificate - {eventTitle}',
      html: '<p>Hello {participantName}, your certificate is attached.</p>',
      text: 'Hello {participantName}, your certificate is attached.',
    },
    emailSettings: {
      enabled: true,
      requireEmail: true,
      autoSend: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockParticipant: IRecipientData = {
    name: 'John Doe',
    certification_id: 'CERT-001',
    email: 'john.doe@example.com',
  };

  describe('validateEmailSendingContext', () => {
    it('should validate successful email sending context', async () => {
      const context: ValidationContext = {
        operation: 'send',
        participantId: 'CERT-001',
        eventId: 'event-1',
      };

      const result = await EmailValidationService.validateEmailSendingContext(
        mockEvent,
        mockParticipant,
        context
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing email', async () => {
      const participantWithoutEmail = { ...mockParticipant, email: undefined };
      const context: ValidationContext = {
        operation: 'send',
        participantId: 'CERT-001',
        eventId: 'event-1',
      };

      const result = await EmailValidationService.validateEmailSendingContext(
        mockEvent,
        participantWithoutEmail,
        context
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].userMessage).toContain('email address');
    });

    it('should fail validation for invalid email format', async () => {
      const participantWithInvalidEmail = {
        ...mockParticipant,
        email: 'invalid-email',
      };
      const context: ValidationContext = {
        operation: 'send',
        participantId: 'CERT-001',
        eventId: 'event-1',
      };

      const result = await EmailValidationService.validateEmailSendingContext(
        mockEvent,
        participantWithInvalidEmail,
        context
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0].userMessage).toContain('Invalid email format');
    });

    it('should fail validation for missing email configuration', async () => {
      const eventWithoutConfig = { ...mockEvent, emailConfig: undefined };
      const context: ValidationContext = {
        operation: 'send',
        participantId: 'CERT-001',
        eventId: 'event-1',
      };

      const result = await EmailValidationService.validateEmailSendingContext(
        eventWithoutConfig,
        mockParticipant,
        context
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0].userMessage).toContain('Email configuration');
    });
  });

  describe('validateBulkEmailSendingContext', () => {
    it('should validate successful bulk email sending', async () => {
      const participants = [
        { ...mockParticipant, certification_id: 'CERT-001' },
        {
          ...mockParticipant,
          name: 'Jane Smith',
          certification_id: 'CERT-002',
          email: 'jane@example.com',
        },
      ];

      const context: ValidationContext = {
        operation: 'bulk_send',
        participantIds: ['CERT-001', 'CERT-002'],
        eventId: 'event-1',
      };

      const result =
        await EmailValidationService.validateBulkEmailSendingContext(
          mockEvent,
          participants,
          context
        );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about participants without email addresses', async () => {
      const participants = [
        { ...mockParticipant, certification_id: 'CERT-001' },
        {
          ...mockParticipant,
          name: 'Jane Smith',
          certification_id: 'CERT-002',
          email: '',
        },
        {
          ...mockParticipant,
          name: 'Bob Johnson',
          certification_id: 'CERT-003',
          email: undefined,
        },
      ];

      const context: ValidationContext = {
        operation: 'bulk_send',
        participantIds: ['CERT-001', 'CERT-002', 'CERT-003'],
        eventId: 'event-1',
      };

      const result =
        await EmailValidationService.validateBulkEmailSendingContext(
          mockEvent,
          participants,
          context
        );

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("don't have email addresses");
    });

    it('should fail validation when no participants have email addresses', async () => {
      const participants = [
        { ...mockParticipant, certification_id: 'CERT-001', email: '' },
        {
          ...mockParticipant,
          name: 'Jane Smith',
          certification_id: 'CERT-002',
          email: undefined,
        },
      ];

      const context: ValidationContext = {
        operation: 'bulk_send',
        participantIds: ['CERT-001', 'CERT-002'],
        eventId: 'event-1',
      };

      const result =
        await EmailValidationService.validateBulkEmailSendingContext(
          mockEvent,
          participants,
          context
        );

      expect(result.isValid).toBe(false);
      expect(result.errors[0].userMessage).toContain(
        'No participants have email addresses'
      );
    });
  });

  describe('validateEmailConfiguration', () => {
    it('should validate correct email configuration', () => {
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

      const result = EmailValidationService.validateEmailConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for invalid SMTP host', () => {
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

      const result = EmailValidationService.validateEmailConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].userMessage).toContain('Invalid SMTP host');
    });

    it('should fail validation for invalid port number', () => {
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

      const result = EmailValidationService.validateEmailConfiguration(config);

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

      const result = EmailValidationService.validateEmailConfiguration(config);

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

      const result = EmailValidationService.validateEmailTemplate(template);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing subject', () => {
      const template: IEmailTemplate = {
        subject: '',
        html: '<p>Hello {participantName}, your certificate is attached.</p>',
        text: 'Hello {participantName}, your certificate is attached.',
      };

      const result = EmailValidationService.validateEmailTemplate(template);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].userMessage).toContain('Subject is required');
    });

    it('should fail validation for missing HTML content', () => {
      const template: IEmailTemplate = {
        subject: 'Your Certificate - {eventTitle}',
        html: '',
        text: 'Hello {participantName}, your certificate is attached.',
      };

      const result = EmailValidationService.validateEmailTemplate(template);

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

      const result = EmailValidationService.validateEmailTemplate(template);

      expect(result.isValid).toBe(true);
      expect(result.warnings[0]).toContain(
        'Plain text template is recommended'
      );
    });
  });

  describe('validateParticipant', () => {
    it('should validate correct participant data', () => {
      const result =
        EmailValidationService.validateParticipant(mockParticipant);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing name', () => {
      const participantWithoutName = { ...mockParticipant, name: '' };
      const result = EmailValidationService.validateParticipant(
        participantWithoutName
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0].userMessage).toContain('Name is required');
    });

    it('should fail validation for missing certification ID', () => {
      const participantWithoutId = { ...mockParticipant, certification_id: '' };
      const result =
        EmailValidationService.validateParticipant(participantWithoutId);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].userMessage).toContain(
        'Certification ID is required'
      );
    });
  });

  describe('getEmailReadinessStatus', () => {
    it('should return ready status for fully configured event', () => {
      const result = EmailValidationService.getEmailReadinessStatus(mockEvent);

      expect(result.status).toBe('ready');
      expect(result.reasons).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should return not_configured status for event without email config', () => {
      const eventWithoutConfig = { ...mockEvent, emailConfig: undefined };
      const result =
        EmailValidationService.getEmailReadinessStatus(eventWithoutConfig);

      expect(result.status).toBe('not_configured');
      expect(result.reasons).toContain('Email configuration is missing');
      expect(result.suggestions).toContain(
        'Configure SMTP settings in email configuration'
      );
    });

    it('should return not_ready status for event without participants', () => {
      const eventWithoutParticipants = { ...mockEvent, participants: [] };
      const result = EmailValidationService.getEmailReadinessStatus(
        eventWithoutParticipants
      );

      expect(result.status).toBe('not_ready');
      expect(result.reasons).toContain('No participants have email addresses');
    });
  });
});
