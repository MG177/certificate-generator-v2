'use client';

import { useState, useEffect } from 'react';
import { IRecipientData, IEvent } from '@/lib/types';
import { saveParticipants } from '@/lib/actions';
import { parseCSV } from '@/lib/csv-utils';
import { CSVActions } from './csv-actions';
import { ParticipantTable } from './participant-table';
import { FileUpload } from '@/components/ui/file-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ParticipantManagerSectionProps {
  event: IEvent | null;
  onParticipantsUploaded: () => void;
  onBack?: () => void;
}

export function ParticipantManagerSection({
  event,
  onParticipantsUploaded,
  onBack,
}: ParticipantManagerSectionProps) {
  const [participants, setParticipants] = useState<IRecipientData[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize participants from event
  useEffect(() => {
    if (event) {
      setParticipants(event.participants);
      setShowUpload(event.participants.length === 0);
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
    setError(null);

    try {
      const csvContent = await file.text();
      const parsedRecipients = parseCSV(csvContent);

      setParticipants(parsedRecipients);
      await saveParticipants(event._id.toString(), parsedRecipients);
      setShowUpload(false);
      onParticipantsUploaded();
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setError(
        'Failed to upload CSV file. Please check the format and try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCSVRemove = () => {
    setCsvFile(null);
    setParticipants([]);
    setShowUpload(true);
    setError(null);
  };

  const handleParticipantAction = (
    action: string,
    participant: IRecipientData
  ) => {
    console.log(`Action: ${action} on participant:`, participant);
    // Implement individual participant actions
    switch (action) {
      case 'download':
        // Download individual certificate
        break;
      case 'send':
        // Send email to participant
        break;
      case 'edit':
        // Edit participant
        break;
      case 'duplicate':
        // Duplicate participant
        break;
      case 'delete':
        // Delete participant
        break;
    }
  };

  const handleBulkAction = (action: string, participantIds: string[]) => {
    console.log(`Bulk action: ${action} on participants:`, participantIds);
    // Implement bulk actions
    switch (action) {
      case 'download':
        // Download selected certificates
        break;
      case 'send':
        // Send emails to selected participants
        break;
      case 'export':
        // Export selected participants
        break;
      case 'duplicate':
        // Duplicate selected participants
        break;
      case 'delete':
        // Delete selected participants
        break;
    }
  };

  if (!event) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Event Selected
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please select an event from the sidebar to manage participants.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Participant Manager
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage participants and generate certificates
          </p>
        </div>
        <CSVActions
          onDownload={downloadCSVTemplate}
          onUpload={() => setShowUpload(true)}
          hasParticipants={participants.length > 0}
          isUploading={isUploading}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      {showUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Upload Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Upload a CSV file with participant names and certificate IDs. The
              file must have 'name' and 'certification_id' columns.
            </div>
            <FileUpload
              onFileSelect={handleCSVUpload}
              onFileRemove={handleCSVRemove}
              accept=".csv"
              selectedFile={csvFile}
              disabled={isUploading}
            />
            {participants.length > 0 && (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 dark:text-green-200">
                  {participants.length} participants uploaded successfully
                </span>
                <button
                  onClick={() => setShowUpload(false)}
                  className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View Table
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Participants Table */}
      {!showUpload && (
        <ParticipantTable
          participants={participants}
          onParticipantAction={handleParticipantAction}
          onBulkAction={handleBulkAction}
          disabled={isUploading}
        />
      )}

      {/* Navigation Buttons */}
      {participants.length > 0 && !showUpload && (
        <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              ← Back to Template Adjustment
            </button>
          )}
          <button
            onClick={onParticipantsUploaded}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue to Generate →
          </button>
        </div>
      )}
    </div>
  );
}
