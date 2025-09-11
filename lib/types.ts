import { ObjectId } from 'mongodb';

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
