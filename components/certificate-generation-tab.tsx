'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { generateCertificates } from '@/lib/actions';
import { IEvent } from '@/lib/types';

interface CertificateGenerationTabProps {
  event: IEvent | null;
  onCertificatesGenerated?: () => void;
}

export function CertificateGenerationTab({
  event,
  onCertificatesGenerated,
}: CertificateGenerationTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCertificates = async () => {
    if (!event?._id) return;

    setIsGenerating(true);
    try {
      const zipBuffer = await generateCertificates(event._id.toString());

      // Create download link
      const blob = new Blob([zipBuffer], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.title}_certificates.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onCertificatesGenerated?.();
    } catch (error) {
      console.error('Error generating certificates:', error);
      alert('Failed to generate certificates');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!event) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generate Certificates</CardTitle>
          <CardDescription>
            Please create or select an event first.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const canGenerate = event.template.base64 && event.participants.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Generate Certificates
        </CardTitle>
        <CardDescription>
          Generate and download all certificates for this event
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Template:</span>
            <span
              className={`ml-2 ${
                event.template.base64 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {event.template.base64 ? 'Uploaded' : 'Not uploaded'}
            </span>
          </div>
          <div>
            <span className="font-medium">Participants:</span>
            <span
              className={`ml-2 ${
                event.participants.length > 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {event.participants.length} uploaded
            </span>
          </div>
        </div>

        {!canGenerate && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              {!event.template.base64 && event.participants.length === 0
                ? 'Please upload a template and participants data first.'
                : !event.template.base64
                ? 'Please upload a template first.'
                : 'Please upload participants data first.'}
            </p>
          </div>
        )}

        <Button
          onClick={handleGenerateCertificates}
          disabled={!canGenerate || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Certificates...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate & Download Certificates
            </>
          )}
        </Button>

        {canGenerate && (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            This will generate {event.participants.length} certificates and
            download them as a ZIP file.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
