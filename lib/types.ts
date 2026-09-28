import { ObjectId } from 'mongodb';

export interface IEvent {
  _id?: ObjectId;
  title: string;
  description?: string;
  eventDate: Date;
  status: 'draft' | 'completed' | 'archived';
  isDeleted?: boolean; // Soft delete flag
  deletedAt?: Date; // When it was soft deleted
  template: {
    base64: string; // Base64 encoded PNG template
    originalName: string;
    uploadedAt: Date;
  };
  nameConfig: ITextConfig;
  idConfig: ITextConfig;
  participants: IRecipientData[];
  emailConfig?: IEmailConfig;
  emailTemplate?: IEmailTemplate;
  emailSettings?: {
    enabled: boolean;
    requireEmail: boolean;
    autoSend: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ITextConfig {
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface IRecipientData {
  name: string;
  certification_id: string;
  email?: string;
  lastEmailSent?: Date;
  emailStatus?: EmailStatus;
  emailError?: string;
  emailRetryCount?: number;
}

export const FONT_FAMILIES = [
  'Arial',
  'Times New Roman',
  'Calibri',
  'Georgia',
  'Verdana',
  'Comic Sans MS',
  'Impact',
  'Trebuchet MS',
  'Courier New',
  'Palatino',
] as const;

export type FontFamily = (typeof FONT_FAMILIES)[number];

export type IParticipantAction =
  | 'download'
  | 'send'
  | 'edit'
  | 'delete'
  | 'export';

// Email-related interfaces
export interface IEmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromAddress: string;
  subjectTemplate: string;
  enabled: boolean;
}

export interface IEmailLog {
  _id?: ObjectId;
  participantId: string;
  eventId: ObjectId;
  emailAddress: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  sentAt?: Date;
  errorMessage?: string;
  retryCount: number;
  lastRetryAt?: Date;
  createdAt: Date;
}

export type EmailStatus =
  | 'not_sent'
  | 'pending'
  | 'sent'
  | 'failed'
  | 'bounced';

export interface IEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export const viewList = {
  create: 'create',
  template: 'template',
  layout: 'layout',
  recipients: 'email distribution',
  email: 'email status',
  emailConfig: 'email settings',
} as const;

export type IView = (typeof viewList)[keyof typeof viewList];
