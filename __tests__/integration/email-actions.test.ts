import {
  sendParticipantEmail,
  sendBulkEmails,
  getEmailStatus,
  retryFailedEmail,
  testEmailConfiguration,
  updateEventEmailConfig,
  logEmailAttempt,
  getEmailLogs,
} from '../../lib/actions';
import { getEvent, createEvent } from '../../lib/actions';
import {
  IEvent,
  IRecipientData,
  IEmailConfig,
  IEmailTemplate,
} from '../../lib/types';

import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  jest,
} from '@jest/globals';

// Mock nodemailer
jest.mock('nodemailer');
const nodemailer = require('nodemailer');

describe('Email Actions Integration Tests', () => {
  let testEvent: IEvent;
  let testParticipants: IRecipientData[];
  let mockTransporter: any;

  beforeAll(async () => {
    // Create test event
    testEvent = await createEvent({
      title: 'Test Event',
      description: 'Test event for email testing',
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
        smtpHost: 'smtp.test.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'test@test.com',
        smtpPass: 'testpass',
        fromName: 'Test Sender',
        fromAddress: 'test@test.com',
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
    });

    // Create test participants
    testParticipants = [
      {
        name: 'John Doe',
        certification_id: 'CERT-001',
        email: 'john.doe@test.com',
      },
      {
        name: 'Jane Smith',
        certification_id: 'CERT-002',
        email: 'jane.smith@test.com',
      },
      {
        name: 'Bob Johnson',
        certification_id: 'CERT-003',
        email: 'bob.johnson@test.com',
      },
    ];

    // Update event with participants
    await createEvent({
      ...testEvent,
      participants: testParticipants,
    });
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock transporter
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
    };

    // Mock createTransport
    nodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  describe('sendParticipantEmail', () => {
    it('should send individual email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: 'Email sent successfully',
      });

      const result = await sendParticipantEmail(
        testEvent._id!.toString(),
        'CERT-001'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(result.error).toBeUndefined();
      expect(result.validationErrors).toBeUndefined();
    });

    it('should handle email sending failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error('SMTP connection failed')
      );

      const result = await sendParticipantEmail(
        testEvent._id!.toString(),
        'CERT-001'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('SMTP connection failed');
      expect(result.messageId).toBeUndefined();
    });

    it('should return validation errors for invalid participant', async () => {
      const result = await sendParticipantEmail(
        testEvent._id!.toString(),
        'INVALID-ID'
      );

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors![0]).toContain('Participant not found');
    });

    it('should return validation errors for participant without email', async () => {
      // Create participant without email
      const participantWithoutEmail = {
        name: 'No Email',
        certification_id: 'CERT-NO-EMAIL',
        email: undefined,
      };

      // Update event with participant without email
      const event = await getEvent(testEvent._id!.toString());
      if (event) {
        event.participants.push(participantWithoutEmail);
        await createEvent(event);
      }

      const result = await sendParticipantEmail(
        testEvent._id!.toString(),
        'CERT-NO-EMAIL'
      );

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors![0]).toContain('email address');
    });
  });

  describe('sendBulkEmails', () => {
    it('should send bulk emails successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: 'Email sent successfully',
      });

      const participantIds = ['CERT-001', 'CERT-002', 'CERT-003'];
      const result = await sendBulkEmails(
        testEvent._id!.toString(),
        participantIds
      );

      expect(result.success).toBe(true);
      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial failures in bulk sending', async () => {
      // Mock first two emails to succeed, third to fail
      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: 'msg-1', response: 'OK' })
        .mockResolvedValueOnce({ messageId: 'msg-2', response: 'OK' })
        .mockRejectedValueOnce(new Error('SMTP error'));

      const participantIds = ['CERT-001', 'CERT-002', 'CERT-003'];
      const result = await sendBulkEmails(
        testEvent._id!.toString(),
        participantIds
      );

      expect(result.success).toBe(true);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('SMTP error');
    });

    it('should skip participants without email addresses', async () => {
      // Create participant without email
      const participantWithoutEmail = {
        name: 'No Email',
        certification_id: 'CERT-NO-EMAIL',
        email: undefined,
      };

      // Update event with participant without email
      const event = await getEvent(testEvent._id!.toString());
      if (event) {
        event.participants.push(participantWithoutEmail);
        await createEvent(event);
      }

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: 'Email sent successfully',
      });

      const participantIds = ['CERT-001', 'CERT-NO-EMAIL', 'CERT-002'];
      const result = await sendBulkEmails(
        testEvent._id!.toString(),
        participantIds
      );

      expect(result.success).toBe(true);
      expect(result.sent).toBe(2); // Only participants with emails
      expect(result.failed).toBe(0);
    });
  });

  describe('getEmailStatus', () => {
    it('should return email status for participant', async () => {
      // First send an email
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: 'Email sent successfully',
      });

      await sendParticipantEmail(testEvent._id!.toString(), 'CERT-001');

      const status = await getEmailStatus(
        testEvent._id!.toString(),
        'CERT-001'
      );

      expect(status).toBe('sent');
    });

    it('should return not_sent for participant without email attempts', async () => {
      const status = await getEmailStatus(
        testEvent._id!.toString(),
        'CERT-002'
      );

      expect(status).toBe('not_sent');
    });
  });

  describe('retryFailedEmail', () => {
    it('should retry failed email successfully', async () => {
      // First fail an email
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));
      await sendParticipantEmail(testEvent._id!.toString(), 'CERT-001');

      // Then succeed on retry
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'retry-message-id',
        response: 'Email sent successfully',
      });

      const result = await retryFailedEmail(
        testEvent._id!.toString(),
        'CERT-001'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('retry-message-id');
    });

    it('should handle retry failure', async () => {
      // First fail an email
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));
      await sendParticipantEmail(testEvent._id!.toString(), 'CERT-001');

      // Fail again on retry
      mockTransporter.sendMail.mockRejectedValueOnce(
        new Error('SMTP error again')
      );

      const result = await retryFailedEmail(
        testEvent._id!.toString(),
        'CERT-001'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('SMTP error again');
    });
  });

  describe('testEmailConfiguration', () => {
    it('should test email configuration successfully', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const config: IEmailConfig = {
        smtpHost: 'smtp.test.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'test@test.com',
        smtpPass: 'testpass',
        fromName: 'Test Sender',
        fromAddress: 'test@test.com',
        subjectTemplate: 'Test Subject',
        enabled: true,
      };

      const result = await testEmailConfiguration(config);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle email configuration test failure', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      const config: IEmailConfig = {
        smtpHost: 'invalid-host',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'test@test.com',
        smtpPass: 'testpass',
        fromName: 'Test Sender',
        fromAddress: 'test@test.com',
        subjectTemplate: 'Test Subject',
        enabled: true,
      };

      const result = await testEmailConfiguration(config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
    });
  });

  describe('updateEventEmailConfig', () => {
    it('should update event email configuration', async () => {
      const newConfig: IEmailConfig = {
        smtpHost: 'smtp.newhost.com',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: 'newuser@newhost.com',
        smtpPass: 'newpass',
        fromName: 'New Sender',
        fromAddress: 'newuser@newhost.com',
        subjectTemplate: 'New Subject - {eventTitle}',
        enabled: true,
      };

      const result = await updateEventEmailConfig(
        testEvent._id!.toString(),
        newConfig
      );

      expect(result.success).toBe(true);

      // Verify the configuration was updated
      const updatedEvent = await getEvent(testEvent._id!.toString());
      expect(updatedEvent?.emailConfig?.smtpHost).toBe('smtp.newhost.com');
      expect(updatedEvent?.emailConfig?.smtpPort).toBe(465);
    });
  });

  describe('logEmailAttempt', () => {
    it('should log email attempt successfully', async () => {
      const logData = {
        participantId: 'CERT-001',
        eventId: testEvent._id!.toString(),
        emailAddress: 'test@test.com',
        status: 'sent' as const,
        sentAt: new Date(),
        retryCount: 0,
        createdAt: new Date(),
      };

      const result = await logEmailAttempt(logData);

      expect(result.success).toBe(true);
    });

    it('should log failed email attempt', async () => {
      const logData = {
        participantId: 'CERT-002',
        eventId: testEvent._id!.toString(),
        emailAddress: 'test@test.com',
        status: 'failed' as const,
        errorMessage: 'SMTP error',
        retryCount: 1,
        lastRetryAt: new Date(),
        createdAt: new Date(),
      };

      const result = await logEmailAttempt(logData);

      expect(result.success).toBe(true);
    });
  });

  describe('getEmailLogs', () => {
    it('should retrieve email logs for event', async () => {
      // First log some email attempts
      await logEmailAttempt({
        participantId: 'CERT-001',
        eventId: testEvent._id!.toString(),
        emailAddress: 'test@test.com',
        status: 'sent',
        sentAt: new Date(),
        retryCount: 0,
        createdAt: new Date(),
      });

      const logs = await getEmailLogs(testEvent._id!.toString());

      expect(logs.success).toBe(true);
      expect(logs.logs).toBeDefined();
      expect(logs.logs!.length).toBeGreaterThan(0);
      expect(logs.logs![0].participantId).toBe('CERT-001');
    });
  });
});
