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

// Keep IProject for backward compatibility
export interface IProject {
  _id?: ObjectId;
  userId: string;
  name: string;
  templateUrl: string;
  namePosition: ITextConfig;
  idPosition: ITextConfig;
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

export interface IProjectConfig {
  namePosition: ITextConfig;
  idPosition: ITextConfig;
}

export type TGenerateCertificates = (
  templateUrl: string,
  recipients: IRecipientData[],
  config: IProjectConfig
) => Promise<ArrayBuffer>;

export type TUploadFile = (file: File) => Promise<string>;

export interface CertificateEditorProps {
  project: IProject;
  onConfigChange: (newConfig: Partial<IProject>) => void;
  onSave: () => Promise<void>;
}

export interface EventEditorProps {
  event: IEvent;
  onConfigChange: (newConfig: Partial<IEvent>) => void;
  onSave: () => Promise<void>;
}

export interface EventListProps {
  events: IEvent[];
  onEventSelect: (eventId: string) => void;
  onEventDelete: (eventId: string) => Promise<void>;
}

export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
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

export const viewList: { [key: string]: string } = {
  create: 'create',
  template: 'template',
  layout: 'layout',
  recipients: 'email distribution',
  email: 'email status',
  // generate: 'generate',
};

export type IView = keyof typeof viewList;
