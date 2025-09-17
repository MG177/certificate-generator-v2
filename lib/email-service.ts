import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { IEmailConfig, IEmailTemplate, EmailStatus } from './types';
import {
  EmailErrorFactory,
  EmailError,
  EmailErrorType,
  EmailRetryManager,
} from './email-error-handler';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  emailError?: EmailError;
  retryable: boolean;
  nextRetryAt?: Date;
}

export class EmailService {
  private transporter: Transporter;
  private config: IEmailConfig;
  private rateLimiter: Map<string, { count: number; resetTime: number }> =
    new Map();

  constructor(config: IEmailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: true,
      },
    });
  }

  /**
   * Validate email address format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    // Check for disposable email domains
    const disposableDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      'tempmail.net',
    ];
    const domain = email.split('@')[1]?.toLowerCase();
    if (disposableDomains.includes(domain)) return false;

    return true;
  }

  /**
   * Check if user can send email based on rate limiting
   */
  canSend(userId: string, limit: number = 100): boolean {
    const now = Date.now();
    const userLimit = this.rateLimiter.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      this.rateLimiter.set(userId, { count: 1, resetTime: now + 3600000 }); // 1 hour
      return true;
    }

    if (userLimit.count >= limit) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  /**
   * Test SMTP connection
   */
  async testConnection(): Promise<{
    success: boolean;
    error?: string;
    emailError?: EmailError;
  }> {
    try {
      await this.transporter.verify();
      return { success: true };
    } catch (error) {
      const emailError = this.categorizeError(error);
      return {
        success: false,
        error: emailError.userMessage,
        emailError,
      };
    }
  }

  /**
   * Send email with retry logic
   */
  async sendEmail(
    emailData: EmailData,
    retryCount: number = 0
  ): Promise<EmailResult> {
    try {
      // Validate email address
      if (!this.validateEmail(emailData.to)) {
        const error = EmailErrorFactory.createValidationError(
          'email',
          emailData.to,
          'Invalid email address format'
        );
        return {
          success: false,
          error: error.userMessage,
          emailError: error,
          retryable: false,
        };
      }

      const mailOptions: SendMailOptions = {
        from: `"${this.config.fromName}" <${this.config.fromAddress}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        attachments: emailData.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        retryable: false,
      };
    } catch (error) {
      const emailError = this.categorizeError(error);

      // Check if we should retry
      if (EmailRetryManager.shouldRetry(emailError, retryCount)) {
        const nextRetryAt = EmailRetryManager.getNextRetryTime(retryCount);
        return {
          success: false,
          error: emailError.userMessage,
          emailError,
          retryable: true,
          nextRetryAt,
        };
      }

      return {
        success: false,
        error: emailError.userMessage,
        emailError,
        retryable: false,
      };
    }
  }

  /**
   * Categorize error and create appropriate EmailError
   */
  private categorizeError(error: any): EmailError {
    const message = error?.message || 'Unknown error';
    const code = error?.code || 'UNKNOWN';

    // SMTP connection errors
    if (
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT' ||
      message.includes('connection')
    ) {
      return EmailErrorFactory.createSMTPConnectionError(error);
    }

    // Authentication errors
    if (
      code === 'EAUTH' ||
      message.includes('authentication') ||
      message.includes('login')
    ) {
      return EmailErrorFactory.createAuthenticationError(error);
    }

    // Rate limiting errors
    if (
      code === 'EENVELOPE' ||
      message.includes('rate limit') ||
      message.includes('throttle')
    ) {
      return EmailErrorFactory.createRateLimitError(100, 0); // Default limits
    }

    // Template errors
    if (message.includes('template') || message.includes('render')) {
      return EmailErrorFactory.createTemplateError('email template', error);
    }

    // Attachment errors
    if (message.includes('attachment') || message.includes('file')) {
      return EmailErrorFactory.createAttachmentError('certificate', error);
    }

    // Delivery errors
    if (message.includes('delivery') || message.includes('recipient')) {
      return EmailErrorFactory.createDeliveryError('recipient', error);
    }

    // Network errors
    if (
      code === 'ENOTFOUND' ||
      code === 'ENETUNREACH' ||
      message.includes('network')
    ) {
      return EmailErrorFactory.createNetworkError(error);
    }

    // Configuration errors
    if (message.includes('config') || message.includes('setting')) {
      return EmailErrorFactory.createConfigurationError('SMTP', error);
    }

    // Default to unknown error
    return EmailErrorFactory.createUnknownError(error);
  }

  /**
   * Render email template with variables
   */
  renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), value || '');
    });

    return rendered;
  }

  /**
   * Sanitize HTML content to prevent XSS
   */
  sanitizeHtml(html: string): string {
    // Basic HTML sanitization - in production, use a proper library like DOMPurify
    const allowedTags = [
      'p',
      'br',
      'strong',
      'em',
      'a',
      'h1',
      'h2',
      'h3',
      'ul',
      'li',
    ];
    const allowedAttributes = ['href', 'target'];

    // Remove script tags and dangerous attributes
    let sanitized = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');

    return sanitized;
  }

  /**
   * Create email from template
   */
  createEmailFromTemplate(
    template: IEmailTemplate,
    variables: Record<string, string>
  ): EmailData {
    const sanitizedHtml = this.sanitizeHtml(template.html);

    return {
      to: variables.email || '',
      subject: this.renderTemplate(template.subject, variables),
      html: this.renderTemplate(sanitizedHtml, variables),
      text: this.renderTemplate(template.text, variables),
    };
  }

  /**
   * Send certificate email
   */
  async sendCertificateEmail(
    participantEmail: string,
    participantName: string,
    eventTitle: string,
    certificateId: string,
    certificateBuffer: Buffer,
    template: IEmailTemplate
  ): Promise<EmailResult> {
    const variables = {
      participantName,
      eventTitle,
      certificateId,
      email: participantEmail,
    };

    const emailData = this.createEmailFromTemplate(template, variables);

    // Add certificate as attachment
    emailData.attachments = [
      {
        filename: `certificate-${certificateId}.png`,
        content: certificateBuffer,
        contentType: 'image/png',
      },
    ];

    return this.sendEmail(emailData);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(errorMessage: string): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'temporary failure',
      'rate limit',
      'quota exceeded',
    ];

    return retryableErrors.some((error) =>
      errorMessage.toLowerCase().includes(error.toLowerCase())
    );
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get rate limit status for user
   */
  getRateLimitStatus(
    userId: string,
    limit: number = 100
  ): {
    canSend: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const userLimit = this.rateLimiter.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      return {
        canSend: true,
        remaining: limit,
        resetTime: now + 3600000,
      };
    }

    return {
      canSend: userLimit.count < limit,
      remaining: Math.max(0, limit - userLimit.count),
      resetTime: userLimit.resetTime,
    };
  }

  /**
   * Clear rate limit for user (for testing)
   */
  clearRateLimit(userId: string): void {
    this.rateLimiter.delete(userId);
  }

  /**
   * Update email configuration
   */
  updateConfig(newConfig: IEmailConfig): void {
    this.config = newConfig;
    this.transporter = nodemailer.createTransport({
      host: newConfig.smtpHost,
      port: newConfig.smtpPort,
      secure: newConfig.smtpSecure,
      auth: {
        user: newConfig.smtpUser,
        pass: newConfig.smtpPass,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: true,
      },
    });
  }
}

// Default email service instance
let defaultEmailService: EmailService | null = null;

export function getEmailService(config?: IEmailConfig): EmailService {
  if (!defaultEmailService && config) {
    defaultEmailService = new EmailService(config);
  }

  if (!defaultEmailService) {
    throw new Error(
      'Email service not initialized. Please provide configuration.'
    );
  }

  return defaultEmailService;
}

export function initializeEmailService(config: IEmailConfig): EmailService {
  defaultEmailService = new EmailService(config);
  return defaultEmailService;
}
