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
import { Button } from '@/components/ui/button';
import { FileText, Download, CheckCircle } from 'lucide-react';
import { IRecipientData, IEvent } from '@/lib/types';
import { saveParticipants } from '@/lib/actions';
import { parseCSV } from '@/lib/csv-utils';

interface RecipientsUploadTabProps {
  event: IEvent | null;
  onParticipantsUploaded: () => void;
}

export function RecipientsUploadTab({
  event,
  onParticipantsUploaded,
}: RecipientsUploadTabProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [recipients, setRecipients] = useState<IRecipientData[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize recipients from event
  useEffect(() => {
    if (event) {
      setRecipients(event.participants);
    }
  }, [event]);

  const downloadCSVTemplate = () => {
    const csvContent =
      'name,certification_id\nJohn Doe,CERT-001\nJane Smith,CERT-002\nBob Johnson,CERT-003';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'recipients-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = async (file: File) => {
    if (!event?._id) return;

    setCsvFile(file);
    setIsUploading(true);

    try {
      const csvContent = await file.text();
      const parsedRecipients = parseCSV(csvContent);

      setRecipients(parsedRecipients);
      await saveParticipants(event._id.toString(), parsedRecipients);
      onParticipantsUploaded();
    } catch (error) {
      console.error('Error uploading CSV:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCSVRemove = () => {
    setCsvFile(null);
    setRecipients([]);
  };

  const hasParticipants = recipients.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Upload Recipients Data
        </CardTitle>
        <CardDescription>
          Upload a CSV file with recipient names and certificate IDs. The file
          must have 'name' and 'certification_id' columns.
        </CardDescription>
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCSVTemplate}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download CSV Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {hasParticipants ? (
          <div className="flex items-center gap-2 p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200">
              {recipients.length} participants uploaded
            </span>
          </div>
        ) : (
          <FileUpload
            onFileSelect={handleCSVUpload}
            onFileRemove={handleCSVRemove}
            accept=".csv"
            selectedFile={csvFile}
            disabled={isUploading}
          />
        )}

        {hasParticipants && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">
              Preview ({recipients.length} recipients)
            </h4>
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">
                      Certificate ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.slice(0, 10).map((recipient, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{recipient.name}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {recipient.certification_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recipients.length > 10 && (
                <div className="p-3 text-center text-sm text-gray-500 bg-gray-50 dark:bg-gray-800">
                  ... and {recipients.length - 10} more recipients
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
