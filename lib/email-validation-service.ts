import { IEmailConfig, IEmailTemplate, IRecipientData, IEvent } from './types';
import {
  EmailValidator,
  EmailValidationResult,
  EmailErrorFactory,
} from './email-error-handler';

/**
 * Comprehensive email validation service
 */

export interface ValidationContext {
  eventId?: string;
  participantId?: string;
  operation: 'send' | 'bulk_send' | 'test' | 'config';
}

export class EmailValidationService {
  /**
   * Validate complete email sending context
   */
  static async validateEmailSendingContext(
    event: IEvent,
    participant: IRecipientData,
    context: ValidationContext
  ): Promise<EmailValidationResult> {
    const errors: any[] = [];
    const warnings: string[] = [];

    // Validate event
    const eventValidation = this.validateEventForEmail(event);
    if (!eventValidation.isValid) {
      errors.push(...eventValidation.errors);
    }
    warnings.push(...eventValidation.warnings);

    // Validate participant
    const participantValidation =
      EmailValidator.validateParticipantForEmail(participant);
    if (!participantValidation.isValid) {
      errors.push(...participantValidation.errors);
    }
    warnings.push(...participantValidation.warnings);

    // Validate email configuration
    if (event.emailConfig) {
      const configValidation = EmailValidator.validateSMTPConfig(
        event.emailConfig
      );
      if (!configValidation.isValid) {
        errors.push(...configValidation.errors);
      }
      warnings.push(...configValidation.warnings);
    } else {
      errors.push(
        EmailErrorFactory.createValidationError(
          'emailConfig',
          null,
          'Email configuration is required'
        )
      );
    }

    // Validate email template
    if (event.emailTemplate) {
      const templateValidation = EmailValidator.validateEmailTemplate(
        event.emailTemplate
      );
      if (!templateValidation.isValid) {
        errors.push(...templateValidation.errors);
      }
      warnings.push(...templateValidation.warnings);
    } else {
      errors.push(
        EmailErrorFactory.createValidationError(
          'emailTemplate',
          null,
          'Email template is required'
        )
      );
    }

    // Check if email is enabled
    if (!event.emailSettings?.enabled) {
      errors.push(
        EmailErrorFactory.createValidationError(
          'emailSettings.enabled',
          event.emailSettings?.enabled,
          'Email functionality is disabled for this event'
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate event for email functionality
   */
  static validateEventForEmail(event: IEvent): EmailValidationResult {
    const errors: any[] = [];
    const warnings: string[] = [];

    if (!event) {
      errors.push(
        EmailErrorFactory.createValidationError(
          'event',
          event,
          'Event is required'
        )
      );
      return { isValid: false, errors, warnings };
    }

    // Check if event has a template
    if (!event.template || !event.template.base64) {
      errors.push(
        EmailErrorFactory.createValidationError(
          'template',
          event.template,
          'Event must have a certificate template'
        )
      );
    }

    // Check if event has name and ID configuration
    if (!event.nameConfig || !event.idConfig) {
      errors.push(
        EmailErrorFactory.createValidationError(
          'textConfig',
          { nameConfig: event.nameConfig, idConfig: event.idConfig },
          'Event must have text positioning configuration'
        )
      );
    }

    // Check if event has participants
    if (!event.participants || event.participants.length === 0) {
      warnings.push('Event has no participants');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate bulk email sending context
   */
  static async validateBulkEmailSendingContext(
    event: IEvent,
    participants: IRecipientData[],
    context: ValidationContext
  ): Promise<EmailValidationResult> {
    const errors: any[] = [];
    const warnings: string[] = [];

    // Validate event
    const eventValidation = this.validateEventForEmail(event);
    if (!eventValidation.isValid) {
      errors.push(...eventValidation.errors);
    }
    warnings.push(...eventValidation.warnings);

    // Validate participants
    if (!participants || participants.length === 0) {
      errors.push(
        EmailErrorFactory.createValidationError(
          'participants',
          participants,
          'At least one participant is required'
        )
      );
      return { isValid: false, errors, warnings };
    }

    // Check for participants with valid email addresses
    const participantsWithEmails = participants.filter(
      (p) => p.email && p.email.trim() !== ''
    );
    const participantsWithoutEmails = participants.filter(
      (p) => !p.email || p.email.trim() === ''
    );

    if (participantsWithEmails.length === 0) {
      errors.push(
        EmailErrorFactory.createValidationError(
          'participants',
          participants,
          'No participants have valid email addresses'
        )
      );
    }

    if (participantsWithoutEmails.length > 0) {
      warnings.push(
        `${participantsWithoutEmails.length} participants don't have email addresses and will be skipped`
      );
    }

    // Validate each participant with email
    for (const participant of participantsWithEmails) {
      const participantValidation =
        EmailValidator.validateParticipantForEmail(participant);
      if (!participantValidation.isValid) {
        errors.push(...participantValidation.errors);
      }
      warnings.push(...participantValidation.warnings);
    }

    // Validate email configuration
    if (event.emailConfig) {
      const configValidation = EmailValidator.validateSMTPConfig(
        event.emailConfig
      );
      if (!configValidation.isValid) {
        errors.push(...configValidation.errors);
      }
      warnings.push(...configValidation.warnings);
    } else {
      errors.push(
        EmailErrorFactory.createValidationError(
          'emailConfig',
          null,
          'Email configuration is required'
        )
      );
    }

    // Validate email template
    if (event.emailTemplate) {
      const templateValidation = EmailValidator.validateEmailTemplate(
        event.emailTemplate
      );
      if (!templateValidation.isValid) {
        errors.push(...templateValidation.errors);
      }
      warnings.push(...templateValidation.warnings);
    } else {
      errors.push(
        EmailErrorFactory.createValidationError(
          'emailTemplate',
          null,
          'Email template is required'
        )
      );
    }

    // Check if email is enabled
    if (!event.emailSettings?.enabled) {
      errors.push(
        EmailErrorFactory.createValidationError(
          'emailSettings.enabled',
          event.emailSettings?.enabled,
          'Email functionality is disabled for this event'
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate email configuration
   */
  static validateEmailConfiguration(
    config: IEmailConfig
  ): EmailValidationResult {
    return EmailValidator.validateSMTPConfig(config);
  }

  /**
   * Validate email template
   */
  static validateEmailTemplate(
    template: IEmailTemplate
  ): EmailValidationResult {
    return EmailValidator.validateEmailTemplate(template);
  }

  /**
   * Validate participant data
   */
  static validateParticipant(
    participant: IRecipientData
  ): EmailValidationResult {
    return EmailValidator.validateParticipantForEmail(participant);
  }

  /**
   * Get validation summary for UI display
   */
  static getValidationSummary(validation: EmailValidationResult): {
    status: 'valid' | 'warning' | 'error';
    message: string;
    details: string[];
  } {
    if (validation.isValid && validation.warnings.length === 0) {
      return {
        status: 'valid',
        message: 'All validations passed',
        details: [],
      };
    }

    if (validation.isValid && validation.warnings.length > 0) {
      return {
        status: 'warning',
        message: `${validation.warnings.length} warning(s) found`,
        details: validation.warnings,
      };
    }

    return {
      status: 'error',
      message: `${validation.errors.length} error(s) found`,
      details: validation.errors.map((error) => error.userMessage),
    };
  }

  /**
   * Check if email sending is possible for an event
   */
  static async canSendEmails(event: IEvent): Promise<{
    canSend: boolean;
    reasons: string[];
    suggestions: string[];
  }> {
    const reasons: string[] = [];
    const suggestions: string[] = [];

    // Check if email is enabled
    if (!event.emailSettings?.enabled) {
      reasons.push('Email functionality is disabled');
      suggestions.push('Enable email functionality in event settings');
    }

    // Check if email configuration exists
    if (!event.emailConfig) {
      reasons.push('Email configuration is missing');
      suggestions.push('Configure SMTP settings in email configuration');
    } else {
      const configValidation = EmailValidator.validateSMTPConfig(
        event.emailConfig
      );
      if (!configValidation.isValid) {
        reasons.push('Email configuration is invalid');
        suggestions.push('Fix SMTP configuration errors');
      }
    }

    // Check if email template exists
    if (!event.emailTemplate) {
      reasons.push('Email template is missing');
      suggestions.push('Configure email template in email settings');
    } else {
      const templateValidation = EmailValidator.validateEmailTemplate(
        event.emailTemplate
      );
      if (!templateValidation.isValid) {
        reasons.push('Email template is invalid');
        suggestions.push('Fix email template errors');
      }
    }

    // Check if event has participants
    if (!event.participants || event.participants.length === 0) {
      reasons.push('No participants found');
      suggestions.push('Add participants to the event');
    } else {
      // Check if any participants have email addresses
      const participantsWithEmails = event.participants.filter(
        (p) => p.email && p.email.trim() !== ''
      );
      if (participantsWithEmails.length === 0) {
        reasons.push('No participants have email addresses');
        suggestions.push('Add email addresses to participants');
      }
    }

    return {
      canSend: reasons.length === 0,
      reasons,
      suggestions,
    };
  }
}
