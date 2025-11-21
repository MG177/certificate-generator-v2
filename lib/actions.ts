'use server';

import { getDatabase } from './mongodb';
import {
  IEvent,
  ITextConfig,
  IRecipientData,
  IEmailConfig,
  IEmailLog,
  EmailStatus,
  IEmailTemplate,
} from './types';
import { ObjectId } from 'mongodb';
import { generateCertificate } from './canvas-utils';
import { generateCertificateFilename } from './certificate-utils';
import archiver from 'archiver';
import { Readable } from 'stream';
import { EmailService, initializeEmailService } from './email-service';
import {
  getEventEmailConfig,
  DEFAULT_EMAIL_TEMPLATE,
  isEmailEnabled,
} from './email-config';
import {
  initializeEmailDatabase,
  checkEmailDatabaseSetup,
} from './database-init';
import {
  getDatabaseStats,
  runDatabaseMaintenance,
  optimizeDatabase,
} from './database-management';
import { EmailValidationService } from './email-validation-service';

// Utility function to serialize MongoDB documents for client components
function serializeEvent(event: any): IEvent {
  return {
    ...event,
    _id: event._id?.toString(),
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    eventDate: event.eventDate,
    template: {
      ...event.template,
      uploadedAt: event.template?.uploadedAt,
    },
  } as IEvent;
}

// Database initialization functions
export async function initializeDatabase(): Promise<{
  success: boolean;
  message: string;
  migrations: any[];
  validation: any;
}> {
  return await initializeEmailDatabase();
}

export async function checkDatabaseSetup(): Promise<{
  isSetup: boolean;
  issues: string[];
  recommendations: string[];
}> {
  return await checkEmailDatabaseSetup();
}

export async function getDatabaseStatistics() {
  return await getDatabaseStats();
}

export async function runMaintenance() {
  return await runDatabaseMaintenance();
}

export async function optimizeDatabasePerformance() {
  return await optimizeDatabase();
}

// Event Management
export async function createEvent(
  data: Omit<IEvent, '_id' | 'createdAt' | 'updatedAt'>
): Promise<IEvent> {
  try {
    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    const now = new Date();
    const eventData = {
      ...data,
      // Add default email configuration if not provided
      emailConfig: data.emailConfig || {
        smtpHost: '',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: '',
        smtpPass: '',
        fromName: 'Certificate Generator',
        fromAddress: '',
        subjectTemplate: 'Your Certificate - {eventTitle}',
        enabled: false,
      },
      emailTemplate: data.emailTemplate || DEFAULT_EMAIL_TEMPLATE,
      emailSettings: data.emailSettings || {
        enabled: false,
        requireEmail: false,
        autoSend: false,
      },
      createdAt: now,
      updatedAt: now,
    };

    const result = await eventsCollection.insertOne(eventData);

    return serializeEvent({
      ...eventData,
      _id: result.insertedId,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    throw new Error('Failed to create event');
  }
}

export async function updateEvent(
  eventId: string,
  data: Partial<IEvent>
): Promise<IEvent> {
  try {
    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    const result = await eventsCollection.findOneAndUpdate(
      { _id: new ObjectId(eventId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error('Event not found');
    }

    return serializeEvent(result);
  } catch (error) {
    console.error('Error updating event:', error);
    throw new Error('Failed to update event');
  }
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    const result = await eventsCollection.deleteOne({
      _id: new ObjectId(eventId),
    });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw new Error('Failed to delete event');
  }
}

export async function getEvent(
  eventId: string,
  projection?: Record<string, 0 | 1>
): Promise<IEvent | null> {
  try {
    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    const options = projection ? { projection } : {};
    const event = await eventsCollection.findOne(
      { _id: new ObjectId(eventId) },
      options
    );

    return event ? serializeEvent(event) : null;
  } catch (error) {
    console.error('Error getting event:', error);
    throw new Error('Failed to get event');
  }
}

export async function getAllEvents(
  includeDeleted: boolean = false,
  projection?: Record<string, 0 | 1>
): Promise<IEvent[]> {
  try {
    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    const filter = includeDeleted ? {} : { isDeleted: { $ne: true } };
    const query = eventsCollection.find(filter).sort({ createdAt: -1 });

    if (projection) {
      query.project(projection);
    }

    const events = await query.toArray();

    return events.map(serializeEvent);
  } catch (error) {
    console.error('Error getting all events:', error);
    throw new Error('Failed to get events');
  }
}

// Optimized function to get event summaries without large base64 data
export async function getAllEventsSummary(
  includeDeleted: boolean = false
): Promise<IEvent[]> {
  try {
    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    const filter = includeDeleted ? {} : { isDeleted: { $ne: true } };
    const events = await eventsCollection
      .find(filter)
      .project({
        // Exclude only the large fields we don't need
        'template.base64': 0,
        participants: 0,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return events.map((event) => ({
      ...serializeEvent(event),
      template: {
        ...event.template,
        base64: '', // Empty string to maintain type compatibility
      },
      participants: [], // Empty array to maintain type compatibility
    }));
  } catch (error) {
    console.error('Error getting event summaries:', error);
    throw new Error('Failed to get event summaries');
  }
}

export async function softDeleteEvent(eventId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error soft deleting event:', error);
    throw new Error('Failed to soft delete event');
  }
}

export async function restoreEvent(eventId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      {
        $unset: {
          isDeleted: '',
          deletedAt: '',
        },
        $set: {
          updatedAt: new Date(),
        },
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error restoring event:', error);
    throw new Error('Failed to restore event');
  }
}

export async function duplicateEvent(eventId: string): Promise<IEvent> {
  try {
    const originalEvent = await getEvent(eventId);
    if (!originalEvent) {
      throw new Error('Event not found');
    }

    const duplicatedEvent = {
      ...originalEvent,
      _id: undefined, // Remove ID so it creates a new one
      title: `${originalEvent.title} (Copy)`,
      status: 'draft' as const,
      isDeleted: false,
      deletedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await createEvent(duplicatedEvent);
  } catch (error) {
    console.error('Error duplicating event:', error);
    throw new Error('Failed to duplicate event');
  }
}

export async function archiveEvent(eventId: string): Promise<boolean> {
  try {
    return (
      (await updateEvent(eventId, {
        status: 'archived',
        updatedAt: new Date(),
      })) !== null
    );
  } catch (error) {
    console.error('Error archiving event:', error);
    throw new Error('Failed to archive event');
  }
}

export async function unarchiveEvent(eventId: string): Promise<boolean> {
  try {
    return (
      (await updateEvent(eventId, {
        status: 'draft',
        updatedAt: new Date(),
      })) !== null
    );
  } catch (error) {
    console.error('Error unarchiving event:', error);
    throw new Error('Failed to unarchive event');
  }
}

// Template Management
export async function saveTemplate(
  eventId: string,
  templateData: {
    base64: string;
    originalName: string;
    uploadedAt: string;
  }
): Promise<boolean> {
  try {
    const updateData = {
      template: {
        base64: templateData.base64,
        originalName: templateData.originalName,
        uploadedAt: new Date(templateData.uploadedAt),
      },
      updatedAt: new Date(),
    };

    await updateEvent(eventId, updateData);
    return true;
  } catch (error) {
    console.error('Error saving template:', error);
    throw new Error('Failed to save template');
  }
}

export async function updateLayoutConfig(
  eventId: string,
  nameConfig: ITextConfig,
  idConfig: ITextConfig
): Promise<boolean> {
  try {
    const updateData = {
      nameConfig,
      idConfig,
      updatedAt: new Date(),
    };

    await updateEvent(eventId, updateData);
    return true;
  } catch (error) {
    console.error('Error updating layout config:', error);
    throw new Error('Failed to update layout config');
  }
}

// Participant Management
export async function saveParticipants(
  eventId: string,
  participants: IRecipientData[]
): Promise<boolean> {
  try {
    const updateData = {
      participants,
      updatedAt: new Date(),
    };

    await updateEvent(eventId, updateData);
    return true;
  } catch (error) {
    console.error('Error saving participants:', error);
    throw new Error('Failed to save participants');
  }
}

export async function updateParticipant(
  eventId: string,
  participantId: string,
  updates: Partial<IRecipientData>
): Promise<boolean> {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Find the participant to update
    const participantIndex = event.participants.findIndex(
      (p) => p.certification_id === participantId
    );

    if (participantIndex === -1) {
      throw new Error('Participant not found');
    }

    // Validate that certification_id is unique if it's being changed
    if (
      updates.certification_id &&
      updates.certification_id !== participantId
    ) {
      const existingParticipant = event.participants.find(
        (p) => p.certification_id === updates.certification_id
      );
      if (existingParticipant) {
        throw new Error('Certificate ID already exists');
      }
    }

    // Update the participant
    const updatedParticipants = [...event.participants];
    updatedParticipants[participantIndex] = {
      ...updatedParticipants[participantIndex],
      ...updates,
    };

    const updateData = {
      participants: updatedParticipants,
      updatedAt: new Date(),
    };

    await updateEvent(eventId, updateData);
    return true;
  } catch (error) {
    console.error('Error updating participant:', error);
    throw new Error('Failed to update participant');
  }
}

export async function deleteParticipant(
  eventId: string,
  participantId: string
): Promise<boolean> {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Find the participant to delete
    const participantIndex = event.participants.findIndex(
      (p) => p.certification_id === participantId
    );

    if (participantIndex === -1) {
      throw new Error('Participant not found');
    }

    // Remove the participant
    const updatedParticipants = event.participants.filter(
      (p) => p.certification_id !== participantId
    );

    const updateData = {
      participants: updatedParticipants,
      updatedAt: new Date(),
    };

    await updateEvent(eventId, updateData);
    return true;
  } catch (error) {
    console.error('Error deleting participant:', error);
    throw new Error('Failed to delete participant');
  }
}

export async function deleteParticipants(
  eventId: string,
  participantIds: string[]
): Promise<boolean> {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (participantIds.length === 0) {
      throw new Error('No participants to delete');
    }

    // Remove all specified participants
    const updatedParticipants = event.participants.filter(
      (p) => !participantIds.includes(p.certification_id)
    );

    // Check if any participants were actually removed
    if (updatedParticipants.length === event.participants.length) {
      throw new Error('None of the specified participants were found');
    }

    const updateData = {
      participants: updatedParticipants,
      updatedAt: new Date(),
    };

    await updateEvent(eventId, updateData);
    return true;
  } catch (error) {
    console.error('Error deleting participants:', error);
    throw new Error('Failed to delete participants');
  }
}

// Certificate Generation
export async function generateIndividualCertificate(
  eventId: string,
  participantId: string
): Promise<ArrayBuffer> {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.template.base64 || event.participants.length === 0) {
      throw new Error('Event missing template or participants');
    }

    // Find the specific participant
    const participant = event.participants.find(
      (p) => p.certification_id === participantId
    );
    if (!participant) {
      throw new Error('Participant not found');
    }

    // Convert base64 template to data URL
    const templateDataUrl = `data:image/png;base64,${event.template.base64}`;

    // Generate certificate for the specific participant
    const certificateBuffer = await generateCertificate(
      templateDataUrl,
      participant,
      event.nameConfig,
      event.idConfig
    );

    // Convert Buffer to ArrayBuffer
    const arrayBuffer = certificateBuffer.buffer.slice(
      certificateBuffer.byteOffset,
      certificateBuffer.byteOffset + certificateBuffer.byteLength
    );
    return arrayBuffer as ArrayBuffer;
  } catch (error) {
    console.error('Error generating individual certificate:', error);
    throw new Error('Failed to generate certificate');
  }
}

export async function generateSelectedCertificates(
  eventId: string,
  participantIds: string[]
): Promise<ArrayBuffer> {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.template.base64 || event.participants.length === 0) {
      throw new Error('Event missing template or participants');
    }

    if (participantIds.length === 0) {
      throw new Error('No participants selected for certificate generation');
    }

    // Filter participants to only include selected ones
    const selectedParticipants = event.participants.filter((p) =>
      participantIds.includes(p.certification_id)
    );

    if (selectedParticipants.length === 0) {
      throw new Error('None of the selected participants were found');
    }

    // Convert base64 template to data URL
    const templateDataUrl = `data:image/png;base64,${event.template.base64}`;

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    // Set up event listeners
    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      throw err;
    });

    // Generate certificates for selected participants only
    for (const participant of selectedParticipants) {
      try {
        const certificateBuffer = await generateCertificate(
          templateDataUrl,
          participant,
          event.nameConfig,
          event.idConfig
        );

        // Generate filename for the certificate
        const filename = generateCertificateFilename(
          participant.name,
          participant.certification_id
        );

        // Add certificate to ZIP
        archive.append(certificateBuffer, { name: filename });
      } catch (error) {
        console.error(
          `Error generating certificate for ${participant.name}:`,
          error
        );
        // Continue with other participants even if one fails
      }
    }

    // Finalize the archive
    await archive.finalize();

    // Convert chunks to single buffer
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new Uint8Array(arrayBuffer);
    let offset = 0;

    for (const chunk of chunks) {
      const chunkView = new Uint8Array(
        chunk.buffer,
        chunk.byteOffset,
        chunk.byteLength
      );
      view.set(chunkView, offset);
      offset += chunk.length;
    }

    return arrayBuffer;
  } catch (error) {
    console.error('Error generating selected certificates:', error);
    throw new Error('Failed to generate selected certificates');
  }
}

export async function exportParticipantsCSV(
  eventId: string,
  participantIds: string[]
): Promise<string> {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (participantIds.length === 0) {
      throw new Error('No participants selected for export');
    }

    // Filter participants to only include selected ones
    const selectedParticipants = event.participants.filter((p) =>
      participantIds.includes(p.certification_id)
    );

    if (selectedParticipants.length === 0) {
      throw new Error('None of the selected participants were found');
    }

    // Generate CSV content
    const csvHeader = 'name,certification_id,email\n';
    const csvRows = selectedParticipants
      .map((participant) => {
        // Escape CSV values (handle commas, quotes, newlines)
        const escapeCsvValue = (value: string) => {
          if (
            value.includes(',') ||
            value.includes('"') ||
            value.includes('\n')
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        };

        return [
          escapeCsvValue(participant.name),
          escapeCsvValue(participant.certification_id),
          escapeCsvValue(participant.email || ''),
        ].join(',');
      })
      .join('\n');

    return csvHeader + csvRows;
  } catch (error) {
    console.error('Error exporting participants CSV:', error);
    throw new Error('Failed to export participants CSV');
  }
}

export async function generateCertificates(
  eventId: string
): Promise<ArrayBuffer> {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.template.base64 || event.participants.length === 0) {
      throw new Error('Event missing template or participants');
    }

    // Convert base64 template to buffer
    const templateBuffer = Buffer.from(event.template.base64, 'base64');
    const templateDataUrl = `data:image/png;base64,${event.template.base64}`;

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    // Set up event listeners
    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      throw err;
    });

    // Generate certificates for each participant
    for (const participant of event.participants) {
      try {
        const certificateBuffer = await generateCertificate(
          templateDataUrl,
          participant,
          event.nameConfig,
          event.idConfig
        );

        const filename = `certificate_${participant.certification_id}.png`;
        archive.append(certificateBuffer, { name: filename });
      } catch (error) {
        console.error(
          `Error generating certificate for ${participant.name}:`,
          error
        );
        // Continue with other certificates even if one fails
      }
    }

    // Finalize the archive
    await new Promise<void>((resolve, reject) => {
      archive.on('end', () => {
        console.log('Archive finalized successfully');
        resolve();
      });

      archive.on('error', (err) => {
        console.error('Archive finalization error:', err);
        reject(err);
      });

      archive.finalize();
    });

    const zipBuffer = Buffer.concat(chunks as unknown as Uint8Array[]);
    return zipBuffer.buffer.slice(
      zipBuffer.byteOffset,
      zipBuffer.byteOffset + zipBuffer.byteLength
    ) as ArrayBuffer;
  } catch (error) {
    console.error('Error generating certificates:', error);
    throw new Error('Failed to generate certificates');
  }
}

// Email Management
export async function sendParticipantEmail(
  eventId: string,
  participantId: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
  validationErrors?: string[];
}> {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    const participant = event.participants.find(
      (p) => p.certification_id === participantId
    );
    if (!participant) {
      return { success: false, error: 'Participant not found' };
    }

    console.log('participant', participant);
    console.log('event', event);
    console.log('eventId', eventId);
    console.log('participantId', participantId);
    console.log('operation', 'send');

    // Validate email sending context
    const validation = await EmailValidationService.validateEmailSendingContext(
      event,
      participant,
      { eventId, participantId, operation: 'send' }
    );

    console.log('validation', validation);

    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors.map((e) => e.userMessage),
      };
    }

    // Get email configuration
    const emailConfig = getEventEmailConfig(event.emailConfig);

    // Initialize email service
    const emailService = initializeEmailService(emailConfig);

    // Check rate limiting
    if (!emailService.canSend(eventId)) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      };
    }

    // Generate certificate
    const certificateBuffer = await generateIndividualCertificate(
      eventId,
      participantId
    );
    const certificateArrayBuffer = Buffer.from(certificateBuffer);

    // Use event template or default template
    const emailTemplate = event.emailTemplate || DEFAULT_EMAIL_TEMPLATE;

    // Send email
    const result = await emailService.sendCertificateEmail(
      participant.email!,
      participant.name,
      event.title,
      participant.certification_id,
      certificateArrayBuffer,
      emailTemplate
    );

    // Update participant email status
    if (result.success) {
      await updateParticipantEmailStatus(eventId, participantId, {
        emailStatus: 'sent',
        lastEmailSent: new Date(),
        emailError: undefined,
        emailRetryCount: 0,
      });

      // Log email attempt
      await logEmailAttempt({
        participantId,
        eventId: new ObjectId(eventId),
        emailAddress: participant.email!,
        status: 'sent',
        sentAt: new Date(),
        retryCount: 0,
        createdAt: new Date(),
      });
    } else {
      await updateParticipantEmailStatus(eventId, participantId, {
        emailStatus: 'failed',
        emailError: result.error,
        emailRetryCount: (participant.emailRetryCount || 0) + 1,
      });

      // Log failed attempt
      await logEmailAttempt({
        participantId,
        eventId: new ObjectId(eventId),
        emailAddress: participant.email!,
        status: 'failed',
        errorMessage: result.error,
        retryCount: (participant.emailRetryCount || 0) + 1,
        lastRetryAt: new Date(),
        createdAt: new Date(),
      });
    }

    return result;
  } catch (error) {
    console.error('Error sending participant email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function sendBulkEmails(
  eventId: string,
  participantIds: string[]
): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}> {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: ['Event not found'],
      };
    }

    if (participantIds.length === 0) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: ['No participants selected'],
      };
    }

    // Check if email is enabled
    const emailConfig = getEventEmailConfig(event.emailConfig);
    if (!isEmailEnabled(emailConfig)) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: ['Email functionality is not enabled'],
      };
    }

    // Initialize email service
    const emailService = initializeEmailService(emailConfig);

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process participants in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < participantIds.length; i += batchSize) {
      const batch = participantIds.slice(i, i + batchSize);

      const batchPromises = batch.map(async (participantId) => {
        try {
          const result = await sendParticipantEmail(eventId, participantId);
          if (result.success) {
            results.sent++;
          } else {
            results.failed++;
            results.errors.push(`${participantId}: ${result.error}`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push(
            `${participantId}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      });

      await Promise.all(batchPromises);

      // Add delay between batches to respect rate limits
      if (i + batchSize < participantIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return {
      success: results.sent > 0,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    };
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    return {
      success: false,
      sent: 0,
      failed: participantIds.length,
      errors: [
        error instanceof Error ? error.message : 'Unknown error occurred',
      ],
    };
  }
}

export async function updateParticipantEmailStatus(
  eventId: string,
  participantId: string,
  updates: {
    emailStatus?: EmailStatus;
    lastEmailSent?: Date;
    emailError?: string;
    emailRetryCount?: number;
  }
): Promise<boolean> {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const participantIndex = event.participants.findIndex(
      (p) => p.certification_id === participantId
    );

    if (participantIndex === -1) {
      throw new Error('Participant not found');
    }

    const updatedParticipants = [...event.participants];
    updatedParticipants[participantIndex] = {
      ...updatedParticipants[participantIndex],
      ...updates,
    };

    const updateData = {
      participants: updatedParticipants,
      updatedAt: new Date(),
    };

    await updateEvent(eventId, updateData);
    return true;
  } catch (error) {
    console.error('Error updating participant email status:', error);
    throw new Error('Failed to update participant email status');
  }
}

export async function logEmailAttempt(
  emailLog: Omit<IEmailLog, '_id'>
): Promise<string> {
  try {
    const db = await getDatabase();
    const emailLogsCollection = db.collection('emailLogs');

    const result = await emailLogsCollection.insertOne(emailLog);
    return result.insertedId.toString();
  } catch (error) {
    console.error('Error logging email attempt:', error);
    throw new Error('Failed to log email attempt');
  }
}

export async function getEmailStatus(
  eventId: string,
  participantId: string
): Promise<{
  emailStatus?: EmailStatus;
  lastEmailSent?: Date;
  emailError?: string;
  emailRetryCount?: number;
} | null> {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      return null;
    }

    const participant = event.participants.find(
      (p) => p.certification_id === participantId
    );

    if (!participant) {
      return null;
    }

    return {
      emailStatus: participant.emailStatus,
      lastEmailSent: participant.lastEmailSent,
      emailError: participant.emailError,
      emailRetryCount: participant.emailRetryCount,
    };
  } catch (error) {
    console.error('Error getting email status:', error);
    throw new Error('Failed to get email status');
  }
}

export async function retryFailedEmail(
  eventId: string,
  participantId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const participant = await getEmailStatus(eventId, participantId);
    if (!participant) {
      return { success: false, error: 'Participant not found' };
    }

    if (participant.emailStatus !== 'failed') {
      return { success: false, error: 'Email is not in failed state' };
    }

    // Reset email status to not_sent before retry
    await updateParticipantEmailStatus(eventId, participantId, {
      emailStatus: 'not_sent',
      emailError: undefined,
    });

    // Attempt to send email again
    return await sendParticipantEmail(eventId, participantId);
  } catch (error) {
    console.error('Error retrying failed email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function getEmailLogs(eventId: string): Promise<IEmailLog[]> {
  try {
    const db = await getDatabase();
    const emailLogsCollection = db.collection('emailLogs');

    const logs = await emailLogsCollection
      .find({ eventId: new ObjectId(eventId) })
      .sort({ createdAt: -1 })
      .toArray();

    return logs.map((log) => ({
      participantId: log.participantId,
      eventId: log.eventId,
      emailAddress: log.emailAddress,
      status: log.status,
      sentAt: log.sentAt,
      errorMessage: log.errorMessage,
      retryCount: log.retryCount,
      lastRetryAt: log.lastRetryAt,
      createdAt: log.createdAt,
      _id: log._id,
    })) as IEmailLog[];
  } catch (error) {
    console.error('Error getting email logs:', error);
    throw new Error('Failed to get email logs');
  }
}

export async function testEmailConfiguration(
  config: IEmailConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailService = new EmailService(config);
    return await emailService.testConnection();
  } catch (error) {
    console.error('Error testing email configuration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function updateEventEmailConfig(
  eventId: string,
  emailConfig: IEmailConfig
): Promise<boolean> {
  try {
    const updateData = {
      emailConfig,
      updatedAt: new Date(),
    };

    await updateEvent(eventId, updateData);
    return true;
  } catch (error) {
    console.error('Error updating event email config:', error);
    throw new Error('Failed to update event email configuration');
  }
}

export async function updateEventEmailTemplate(
  eventId: string,
  emailTemplate: IEmailTemplate
): Promise<boolean> {
  try {
    const updateData = {
      emailTemplate,
      updatedAt: new Date(),
    };

    await updateEvent(eventId, updateData);
    return true;
  } catch (error) {
    console.error('Error updating event email template:', error);
    throw new Error('Failed to update event email template');
  }
}
