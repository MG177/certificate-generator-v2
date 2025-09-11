'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { IRecipientData } from '@/lib/types';

interface RecipientsUploadTabProps {
  csvFile: File | null;
  recipients: IRecipientData[];
  generating: boolean;
  onCSVUpload: (file: File) => void;
  onCSVRemove: () => void;
}

export function RecipientsUploadTab({
  csvFile,
  recipients,
  generating,
  onCSVUpload,
  onCSVRemove,
}: RecipientsUploadTabProps) {
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
            disabled={generating}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download CSV Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <FileUpload
          onFileSelect={onCSVUpload}
          onFileRemove={onCSVRemove}
          accept=".csv"
          selectedFile={csvFile}
          disabled={generating}
        />

        {recipients.length > 0 && (
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
