import { EmailService, initializeEmailService } from '../email-service';
import { IEmailConfig, IEmailTemplate } from '../types';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');
const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

describe('EmailService', () => {
  let mockTransporter: any;
  let emailService: EmailService;
  let testConfig: IEmailConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock transporter
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
    };

    // Mock createTransport
    mockedNodemailer.createTransport.mockReturnValue(mockTransporter);

    // Test configuration
    testConfig = {
      smtpHost: 'smtp.test.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: 'test@test.com',
      smtpPass: 'testpass',
      fromName: 'Test Sender',
      fromAddress: 'test@test.com',
      subjectTemplate: 'Test Subject - {eventTitle}',
      enabled: true,
    };

    emailService = new EmailService(testConfig);
  });

  describe('constructor', () => {
    it('should create transporter with correct configuration', () => {
      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith({
        host: testConfig.smtpHost,
        port: testConfig.smtpPort,
        secure: testConfig.smtpSecure,
        auth: {
          user: testConfig.smtpUser,
          pass: testConfig.smtpPass,
        },
      });
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailData = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Test content',
        attachments: [],
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: 'Email sent successfully',
      });

      const result = await emailService.sendEmail(emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(emailData);
    });

    it('should handle SMTP errors', async () => {
      const emailData = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Test content',
        attachments: [],
      };

      const smtpError = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(smtpError);

      const result = await emailService.sendEmail(emailData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('SMTP connection failed');
      expect(result.emailError).toBeDefined();
      expect(result.retryable).toBe(true);
    });

    it('should handle authentication errors', async () => {
      const emailData = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Test content',
        attachments: [],
      };

      const authError = new Error('Authentication failed');
      authError.message = 'Invalid login';
      mockTransporter.sendMail.mockRejectedValue(authError);

      const result = await emailService.sendEmail(emailData);

      expect(result.success).toBe(false);
      expect(result.emailError?.type).toBe('AUTHENTICATION_ERROR');
      expect(result.retryable).toBe(false);
    });
  });

  describe('sendCertificateEmail', () => {
    it('should send certificate email with attachment', async () => {
      const template: IEmailTemplate = {
        subject: 'Your Certificate - {eventTitle}',
        html: '<p>Hello {participantName}, your certificate is attached.</p>',
        text: 'Hello {participantName}, your certificate is attached.',
      };

      const certificateBuffer = Buffer.from('fake-certificate-data');
      const participantName = 'John Doe';
      const eventTitle = 'Test Event';
      const certificateId = 'CERT-001';

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: 'Email sent successfully',
      });

      const result = await emailService.sendCertificateEmail(
        'recipient@test.com',
        participantName,
        eventTitle,
        certificateId,
        certificateBuffer,
        template
      );

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'recipient@test.com',
          subject: 'Your Certificate - Test Event',
          html: expect.stringContaining('Hello John Doe'),
          text: expect.stringContaining('Hello John Doe'),
          attachments: [
            expect.objectContaining({
              filename: 'CERT-001-certificate.png',
              content: certificateBuffer,
              contentType: 'image/png',
            }),
          ],
        })
      );
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await emailService.testConnection();

      expect(result.success).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle connection test failure', async () => {
      const connectionError = new Error('Connection failed');
      mockTransporter.verify.mockRejectedValue(connectionError);

      const result = await emailService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
      expect(result.emailError).toBeDefined();
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      expect(emailService.validateEmail('test@example.com')).toBe(true);
      expect(emailService.validateEmail('user.name+tag@domain.co.uk')).toBe(
        true
      );
    });

    it('should reject invalid email format', () => {
      expect(emailService.validateEmail('invalid-email')).toBe(false);
      expect(emailService.validateEmail('@domain.com')).toBe(false);
      expect(emailService.validateEmail('user@')).toBe(false);
      expect(emailService.validateEmail('')).toBe(false);
    });

    it('should reject disposable email domains', () => {
      expect(emailService.validateEmail('test@10minutemail.com')).toBe(false);
      expect(emailService.validateEmail('user@tempmail.org')).toBe(false);
    });
  });
});

describe('initializeEmailService', () => {
  it('should initialize email service with configuration', () => {
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

    const service = initializeEmailService(config);

    expect(service).toBeInstanceOf(EmailService);
    expect(mockedNodemailer.createTransport).toHaveBeenCalledWith({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  });
});
