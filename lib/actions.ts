'use server';

import { getDatabase } from './mongodb';
import { IEvent, ITextConfig, IRecipientData } from './types';
import { ObjectId } from 'mongodb';
import { generateCertificate } from './canvas-utils';
import archiver from 'archiver';
import { Readable } from 'stream';

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

export async function getEvent(eventId: string): Promise<IEvent | null> {
  try {
    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    const event = await eventsCollection.findOne({
      _id: new ObjectId(eventId),
    });
    return event ? serializeEvent(event) : null;
  } catch (error) {
    console.error('Error getting event:', error);
    throw new Error('Failed to get event');
  }
}

export async function getAllEvents(): Promise<IEvent[]> {
  try {
    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    const events = await eventsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return events.map(serializeEvent);
  } catch (error) {
    console.error('Error getting all events:', error);
    throw new Error('Failed to get events');
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

// Certificate Generation
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
