import { EmailStatus } from './types';

/**
 * Email error handling utilities and error types
 */

export enum EmailErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SMTP_CONNECTION_ERROR = 'SMTP_CONNECTION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  ATTACHMENT_ERROR = 'ATTACHMENT_ERROR',
  DELIVERY_ERROR = 'DELIVERY_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface EmailError {
  type: EmailErrorType;
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  userMessage: string;
  timestamp: Date;
}

export interface EmailValidationResult {
  isValid: boolean;
  errors: EmailError[];
  warnings: string[];
}

/**
 * Email error factory for creating standardized errors
 */
export class EmailErrorFactory {
  static createValidationError(
    field: string,
    value: any,
    reason: string
  ): EmailError {
    return {
      type: EmailErrorType.VALIDATION_ERROR,
      code: `VALIDATION_${field.toUpperCase()}`,
      message: `Validation failed for ${field}: ${reason}`,
      details: { field, value, reason },
      retryable: false,
      userMessage: `Invalid ${field}: ${reason}`,
      timestamp: new Date(),
    };
  }

  static createSMTPConnectionError(error: any): EmailError {
    return {
      type: EmailErrorType.SMTP_CONNECTION_ERROR,
      code: 'SMTP_CONNECTION_FAILED',
      message: `SMTP connection failed: ${error.message || 'Unknown error'}`,
      details: { originalError: error },
      retryable: true,
      userMessage:
        'Unable to connect to email server. Please check your SMTP settings.',
      timestamp: new Date(),
    };
  }

  static createAuthenticationError(error: any): EmailError {
    return {
      type: EmailErrorType.AUTHENTICATION_ERROR,
      code: 'SMTP_AUTH_FAILED',
      message: `SMTP authentication failed: ${
        error.message || 'Unknown error'
      }`,
      details: { originalError: error },
      retryable: false,
      userMessage:
        'Email authentication failed. Please check your username and password.',
      timestamp: new Date(),
    };
  }

  static createRateLimitError(limit: number, current: number): EmailError {
    return {
      type: EmailErrorType.RATE_LIMIT_ERROR,
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded: ${current}/${limit} emails per hour`,
      details: { limit, current },
      retryable: true,
      userMessage: `Email sending rate limit exceeded. Please wait before sending more emails.`,
      timestamp: new Date(),
    };
  }

  static createTemplateError(template: string, error: any): EmailError {
    return {
      type: EmailErrorType.TEMPLATE_ERROR,
      code: 'TEMPLATE_RENDER_FAILED',
      message: `Template rendering failed: ${error.message || 'Unknown error'}`,
      details: { template, originalError: error },
      retryable: false,
      userMessage:
        'Email template error. Please check your template configuration.',
      timestamp: new Date(),
    };
  }

  static createAttachmentError(filename: string, error: any): EmailError {
    return {
      type: EmailErrorType.ATTACHMENT_ERROR,
      code: 'ATTACHMENT_FAILED',
      message: `Attachment processing failed for ${filename}: ${
        error.message || 'Unknown error'
      }`,
      details: { filename, originalError: error },
      retryable: false,
      userMessage: 'Failed to attach certificate. Please try again.',
      timestamp: new Date(),
    };
  }

  static createDeliveryError(recipient: string, error: any): EmailError {
    return {
      type: EmailErrorType.DELIVERY_ERROR,
      code: 'DELIVERY_FAILED',
      message: `Email delivery failed to ${recipient}: ${
        error.message || 'Unknown error'
      }`,
      details: { recipient, originalError: error },
      retryable: true,
      userMessage: `Failed to deliver email to ${recipient}. Please check the email address.`,
      timestamp: new Date(),
    };
  }

  static createNetworkError(error: any): EmailError {
    return {
      type: EmailErrorType.NETWORK_ERROR,
      code: 'NETWORK_ERROR',
      message: `Network error: ${error.message || 'Unknown error'}`,
      details: { originalError: error },
      retryable: true,
      userMessage:
        'Network error occurred. Please check your internet connection.',
      timestamp: new Date(),
    };
  }

  static createConfigurationError(setting: string, error: any): EmailError {
    return {
      type: EmailErrorType.CONFIGURATION_ERROR,
      code: 'CONFIG_ERROR',
      message: `Configuration error for ${setting}: ${
        error.message || 'Unknown error'
      }`,
      details: { setting, originalError: error },
      retryable: false,
      userMessage: 'Email configuration error. Please check your settings.',
      timestamp: new Date(),
    };
  }

  static createUnknownError(error: any): EmailError {
    return {
      type: EmailErrorType.UNKNOWN_ERROR,
      code: 'UNKNOWN_ERROR',
      message: `Unknown error: ${error.message || 'Unknown error'}`,
      details: { originalError: error },
      retryable: true,
      userMessage: 'An unexpected error occurred. Please try again.',
      timestamp: new Date(),
    };
  }
}

/**
 * Email validation utilities
 */
export class EmailValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly DISPOSABLE_EMAIL_DOMAINS = [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email',
    'temp-mail.org',
    'yopmail.com',
  ];

  /**
   * Validate email address format and domain
   */
  static validateEmailAddress(email: string): EmailValidationResult {
    const errors: EmailError[] = [];
    const warnings: string[] = [];

    if (!email || email.trim() === '') {
      errors.push(
        EmailErrorFactory.createValidationError(
          'email',
          email,
          'Email address is required'
        )
      );
      return { isValid: false, errors, warnings };
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check format
    if (!this.EMAIL_REGEX.test(trimmedEmail)) {
      errors.push(
        EmailErrorFactory.createValidationError(
          'email',
          email,
          'Invalid email format'
        )
      );
      return { isValid: false, errors, warnings };
    }

    // Check for disposable email domains
    const domain = trimmedEmail.split('@')[1];
    if (this.DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
      warnings.push(`Email address uses a disposable email service: ${domain}`);
    }

    // Check for common typos in popular domains
    const commonDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
    ];
    const similarDomains = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmail.co': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
    };

    if (similarDomains[domain as keyof typeof similarDomains]) {
      warnings.push(
        `Did you mean ${similarDomains[domain as keyof typeof similarDomains]}?`
      );
    }

    return { isValid: true, errors, warnings };
  }

  /**
   * Validate SMTP configuration
   */
  static validateSMTPConfig(config: any): EmailValidationResult {
    const errors: EmailError[] = [];
    const warnings: string[] = [];

    // Required fields
    const requiredFields = [
      'smtpHost',
      'smtpPort',
      'smtpUser',
      'smtpPass',
      'fromName',
      'fromAddress',
    ];

    for (const field of requiredFields) {
      if (
        !config[field] ||
        (typeof config[field] === 'string' && config[field].trim() === '')
      ) {
        errors.push(
          EmailErrorFactory.createValidationError(
            field,
            config[field],
            `${field} is required`
          )
        );
      }
    }

    // Validate port number
    if (
      config.smtpPort &&
      (isNaN(config.smtpPort) || config.smtpPort < 1 || config.smtpPort > 65535)
    ) {
      errors.push(
        EmailErrorFactory.createValidationError(
          'smtpPort',
          config.smtpPort,
          'Port must be a number between 1 and 65535'
        )
      );
    }

    // Validate from email address
    if (config.fromAddress) {
      const emailValidation = this.validateEmailAddress(config.fromAddress);
      if (!emailValidation.isValid) {
        errors.push(...emailValidation.errors);
      }
      warnings.push(...emailValidation.warnings);
    }

    // Validate host format
    if (config.smtpHost && !this.isValidHostname(config.smtpHost)) {
      errors.push(
        EmailErrorFactory.createValidationError(
          'smtpHost',
          config.smtpHost,
          'Invalid hostname format'
        )
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate email template
   */
  static validateEmailTemplate(template: any): EmailValidationResult {
    const errors: EmailError[] = [];
    const warnings: string[] = [];

    if (!template.subject || template.subject.trim() === '') {
      errors.push(
        EmailErrorFactory.createValidationError(
          'subject',
          template.subject,
          'Email subject is required'
        )
      );
    }

    if (!template.html || template.html.trim() === '') {
      errors.push(
        EmailErrorFactory.createValidationError(
          'html',
          template.html,
          'HTML template is required'
        )
      );
    }

    if (!template.text || template.text.trim() === '') {
      warnings.push(
        'Plain text template is recommended for better compatibility'
      );
    }

    // Check for required template variables
    const requiredVariables = [
      '{participantName}',
      '{eventTitle}',
      '{certificateId}',
    ];
    const templateContent = `${template.subject} ${template.html} ${template.text}`;

    for (const variable of requiredVariables) {
      if (!templateContent.includes(variable)) {
        warnings.push(`Template variable ${variable} is missing`);
      }
    }

    // Check for potentially dangerous HTML
    const dangerousTags = ['<script', '<iframe', '<object', '<embed'];
    for (const tag of dangerousTags) {
      if (template.html.toLowerCase().includes(tag)) {
        errors.push(
          EmailErrorFactory.createValidationError(
            'html',
            template.html,
            `Potentially dangerous HTML tag detected: ${tag}`
          )
        );
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate participant data for email sending
   */
  static validateParticipantForEmail(participant: any): EmailValidationResult {
    const errors: EmailError[] = [];
    const warnings: string[] = [];

    if (!participant.name || participant.name.trim() === '') {
      errors.push(
        EmailErrorFactory.createValidationError(
          'name',
          participant.name,
          'Participant name is required'
        )
      );
    }

    if (
      !participant.certification_id ||
      participant.certification_id.trim() === ''
    ) {
      errors.push(
        EmailErrorFactory.createValidationError(
          'certification_id',
          participant.certification_id,
          'Certificate ID is required'
        )
      );
    }

    if (participant.email) {
      const emailValidation = this.validateEmailAddress(participant.email);
      if (!emailValidation.isValid) {
        errors.push(...emailValidation.errors);
      }
      warnings.push(...emailValidation.warnings);
    } else {
      errors.push(
        EmailErrorFactory.createValidationError(
          'email',
          participant.email,
          'Email address is required for sending emails'
        )
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Check if hostname is valid
   */
  private static isValidHostname(hostname: string): boolean {
    const hostnameRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    return hostnameRegex.test(hostname);
  }
}

/**
 * Error retry logic
 */
export class EmailRetryManager {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

  /**
   * Determine if an error should be retried
   */
  static shouldRetry(error: EmailError, currentRetryCount: number): boolean {
    if (currentRetryCount >= this.MAX_RETRIES) {
      return false;
    }

    if (!error.retryable) {
      return false;
    }

    // Don't retry validation or configuration errors
    if (
      error.type === EmailErrorType.VALIDATION_ERROR ||
      error.type === EmailErrorType.CONFIGURATION_ERROR
    ) {
      return false;
    }

    return true;
  }

  /**
   * Get delay for next retry attempt
   */
  static getRetryDelay(retryCount: number): number {
    const index = Math.min(retryCount, this.RETRY_DELAYS.length - 1);
    return this.RETRY_DELAYS[index];
  }

  /**
   * Get next retry time
   */
  static getNextRetryTime(retryCount: number): Date {
    const delay = this.getRetryDelay(retryCount);
    return new Date(Date.now() + delay);
  }
}

/**
 * Error logging and monitoring
 */
export class EmailErrorLogger {
  /**
   * Log email error with context
   */
  static async logError(
    error: EmailError,
    context: {
      eventId?: string;
      participantId?: string;
      emailAddress?: string;
      operation?: string;
    }
  ): Promise<void> {
    const logEntry = {
      ...error,
      context,
      timestamp: new Date(),
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Email Error:', logEntry);
    }

    // TODO: Implement proper logging to database or external service
    // This could be integrated with a logging service like Winston, LogRocket, etc.
  }

  /**
   * Get error statistics
   */
  static async getErrorStatistics(
    eventId?: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    totalErrors: number;
    errorsByType: Record<EmailErrorType, number>;
    errorsByCode: Record<string, number>;
    retryableErrors: number;
    nonRetryableErrors: number;
  }> {
    // TODO: Implement error statistics from database
    return {
      totalErrors: 0,
      errorsByType: {} as Record<EmailErrorType, number>,
      errorsByCode: {},
      retryableErrors: 0,
      nonRetryableErrors: 0,
    };
  }
}
