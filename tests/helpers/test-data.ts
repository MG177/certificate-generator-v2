import {
  IEvent,
  IRecipientData,
  IEmailConfig,
  IEmailTemplate,
} from '../../lib/types';

export const createTestEvent = (overrides: Partial<IEvent> = {}): IEvent => {
  const defaultEvent: IEvent = {
    _id: undefined,
    title: 'Test Event',
    description: 'Test event for email testing',
    eventDate: new Date('2024-01-01'),
    status: 'draft',
    template: {
      base64: 'base64-template-data',
      originalName: 'test-template.png',
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { ...defaultEvent, ...overrides };
};

export const createTestParticipants = (count: number): IRecipientData[] => {
  return Array.from({ length: count }, (_, i) => ({
    name: `Test Participant ${i + 1}`,
    email: `participant${i + 1}@test.com`,
    certification_id: `CERT-${(i + 1).toString().padStart(3, '0')}`,
  }));
};

export const createTestParticipant = (
  overrides: Partial<IRecipientData> = {}
): IRecipientData => {
  const defaultParticipant: IRecipientData = {
    name: 'John Doe',
    email: 'john.doe@test.com',
    certification_id: 'CERT-001',
  };

  return { ...defaultParticipant, ...overrides };
};

export const createTestEmailConfig = (
  overrides: Partial<IEmailConfig> = {}
): IEmailConfig => {
  const defaultConfig: IEmailConfig = {
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

  return { ...defaultConfig, ...overrides };
};

export const createTestEmailTemplate = (
  overrides: Partial<IEmailTemplate> = {}
): IEmailTemplate => {
  const defaultTemplate: IEmailTemplate = {
    subject: 'Your Certificate - {eventTitle}',
    html: '<p>Hello {participantName}, your certificate is attached.</p>',
    text: 'Hello {participantName}, your certificate is attached.',
  };

  return { ...defaultTemplate, ...overrides };
};

export const createTestCSV = (participants: IRecipientData[]): string => {
  const csvContent = [
    'name,certification_id,email',
    ...participants.map(
      (p) => `${p.name},${p.certification_id},${p.email || ''}`
    ),
  ].join('\n');

  return csvContent;
};

export const createTestCSVBlob = (participants: IRecipientData[]): Blob => {
  const csvContent = createTestCSV(participants);
  return new Blob([csvContent], { type: 'text/csv' });
};

export const createTestCertificateBuffer = (): Buffer => {
  // Create a simple test certificate buffer
  // In a real test, this would be an actual PNG buffer
  return Buffer.from('fake-certificate-data');
};

export const createTestEmailData = () => ({
  to: 'test@example.com',
  subject: 'Test Subject',
  html: '<p>Test content</p>',
  text: 'Test content',
  attachments: [],
});

export const createTestSMTPError = (
  message: string = 'SMTP connection failed'
) => {
  const error = new Error(message);
  error.code = 'ECONNREFUSED';
  return error;
};

export const createTestAuthError = (
  message: string = 'Authentication failed'
) => {
  const error = new Error(message);
  error.code = 'EAUTH';
  return error;
};

export const createTestRateLimitError = (
  message: string = 'Rate limit exceeded'
) => {
  const error = new Error(message);
  error.code = 'EENVELOPE';
  return error;
};

export const createTestNetworkError = (
  message: string = 'Network unreachable'
) => {
  const error = new Error(message);
  error.code = 'ENOTFOUND';
  return error;
};

export const mockNodemailerTransporter = {
  sendMail: jest.fn(),
  verify: jest.fn(),
  close: jest.fn(),
};

export const mockNodemailer = {
  createTransport: jest.fn(() => mockNodemailerTransporter),
};

// Test data for different scenarios
export const testScenarios = {
  validEmailSending: {
    event: createTestEvent(),
    participant: createTestParticipant(),
    config: createTestEmailConfig(),
    template: createTestEmailTemplate(),
  },
  invalidEmailAddress: {
    event: createTestEvent(),
    participant: createTestParticipant({ email: 'invalid-email' }),
    config: createTestEmailConfig(),
    template: createTestEmailTemplate(),
  },
  missingEmailConfig: {
    event: createTestEvent({ emailConfig: undefined }),
    participant: createTestParticipant(),
    config: undefined,
    template: createTestEmailTemplate(),
  },
  smtpConnectionError: {
    event: createTestEvent(),
    participant: createTestParticipant(),
    config: createTestEmailConfig({ smtpHost: 'invalid-host' }),
    template: createTestEmailTemplate(),
    error: createTestSMTPError(),
  },
  authenticationError: {
    event: createTestEvent(),
    participant: createTestParticipant(),
    config: createTestEmailConfig({ smtpUser: 'invalid-user' }),
    template: createTestEmailTemplate(),
    error: createTestAuthError(),
  },
  rateLimitError: {
    event: createTestEvent(),
    participant: createTestParticipant(),
    config: createTestEmailConfig(),
    template: createTestEmailTemplate(),
    error: createTestRateLimitError(),
  },
  bulkEmailSending: {
    event: createTestEvent({ participants: createTestParticipants(10) }),
    participants: createTestParticipants(10),
    config: createTestEmailConfig(),
    template: createTestEmailTemplate(),
  },
  largeBulkEmailSending: {
    event: createTestEvent({ participants: createTestParticipants(100) }),
    participants: createTestParticipants(100),
    config: createTestEmailConfig(),
    template: createTestEmailTemplate(),
  },
};
