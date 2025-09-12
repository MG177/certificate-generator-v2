'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { Progress } from '@/components/ui/progress';
import { FileImage, CheckCircle } from 'lucide-react';
import { saveTemplate } from '@/lib/actions';
import { IEvent } from '@/lib/types';

interface TemplateUploadTabProps {
  event: IEvent | null;
  onTemplateUploaded: () => void;
}

export function TemplateUploadTab({
  event,
  onTemplateUploaded,
}: TemplateUploadTabProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  const handleTemplateUpload = async (file: File) => {
    if (!event?._id) return;

    setTemplateFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      // Convert file to base64 on client side
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      // Create a simple object to pass to server action
      const templateData = {
        base64,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      };

      await saveTemplate(event._id.toString(), templateData);

      clearInterval(progressInterval);
      setUploadProgress(100);
      onTemplateUploaded();
    } catch (error) {
      console.error('Error uploading template:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTemplateRemove = () => {
    setTemplateFile(null);
    setUploadProgress(0);
  };

  const hasTemplate =
    event?.template.base64 && event.template.base64.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="w-5 h-5" />
          Upload Certificate Template
        </CardTitle>
        <CardDescription>
          Upload a PNG image that will serve as your certificate template
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasTemplate ? (
          <div className="flex items-center gap-2 p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200">
              Template uploaded: {event.template.originalName}
            </span>
          </div>
        ) : (
          <FileUpload
            onFileSelect={handleTemplateUpload}
            onFileRemove={handleTemplateRemove}
            accept="image/png"
            selectedFile={templateFile}
            disabled={isUploading}
          />
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <Progress value={uploadProgress} className="mt-4" />
        )}
      </CardContent>
    </Card>
  );
}
