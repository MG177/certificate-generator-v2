'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { Progress } from '@/components/ui/progress';
import { FileImage } from 'lucide-react';

interface TemplateUploadTabProps {
  templateFile: File | null;
  uploadProgress: number;
  generating: boolean;
  onTemplateUpload: (file: File) => void;
  onTemplateRemove: () => void;
}

export function TemplateUploadTab({
  templateFile,
  uploadProgress,
  generating,
  onTemplateUpload,
  onTemplateRemove,
}: TemplateUploadTabProps) {
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
        <FileUpload
          onFileSelect={onTemplateUpload}
          onFileRemove={onTemplateRemove}
          accept="image/png"
          selectedFile={templateFile}
          disabled={generating}
        />
        {uploadProgress > 0 && uploadProgress < 100 && (
          <Progress value={uploadProgress} className="mt-4" />
        )}
      </CardContent>
    </Card>
  );
}
