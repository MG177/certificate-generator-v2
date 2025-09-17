'use client';

import { useState, useEffect } from 'react';
import { IRecipientData, IEvent, IParticipantAction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  saveParticipants,
  generateIndividualCertificate,
  updateParticipant,
  deleteParticipant,
  deleteParticipants,
  generateSelectedCertificates,
  exportParticipantsCSV,
  sendParticipantEmail,
  sendBulkEmails,
  getEmailStatus,
  retryFailedEmail,
} from '@/lib/actions';
import { parseCSV, downloadCSV, generateCSVFilename } from '@/lib/csv-utils';
import {
  downloadCertificate,
  generateCertificateFilename,
  downloadZipFile,
  generateZipFilename,
} from '@/lib/certificate-utils';
import { CSVActions } from './csv-actions';
import { ParticipantTable } from './participant-table';
import { EditParticipantDialog } from './edit-participant-dialog';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { BulkEmailActions } from '@/components/email';
import { FileUpload } from '@/components/ui/file-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2, Settings } from 'lucide-react';

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
  const { toast } = useToast();
  const [participants, setParticipants] = useState<IRecipientData[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingParticipants, setDownloadingParticipants] = useState<
    Set<string>
  >(new Set());
  const [editingParticipant, setEditingParticipant] =
    useState<IRecipientData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdatingParticipant, setIsUpdatingParticipant] = useState(false);
  const [deletingParticipants, setDeletingParticipants] = useState<
    IRecipientData[]
  >([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingParticipant, setIsDeletingParticipant] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sendingEmails, setSendingEmails] = useState<Set<string>>(new Set());
  const [isBulkSendingEmails, setIsBulkSendingEmails] = useState(false);
  const [emailStatuses, setEmailStatuses] = useState<Map<string, any>>(
    new Map()
  );

  // Initialize participants from event
  useEffect(() => {
    if (event) {
      setParticipants(event.participants);
      setShowUpload(event.participants.length === 0);
    }
  }, [event]);

  const downloadCSVTemplate = () => {
    const csvContent =
      'name,certification_id,email\nJohn Doe,CERT-001,john@example.com\nJane Smith,CERT-002,jane@example.com\nBob Johnson,CERT-003,bob@example.com';
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

      toast({
        title: 'Participants Uploaded',
        description: `${parsedRecipients.length} participants have been uploaded successfully.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error uploading CSV:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to upload CSV file: ${errorMessage}`);

      toast({
        title: 'Upload Failed',
        description: `Failed to upload CSV file: ${errorMessage}`,
        variant: 'destructive',
      });
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

  const handleParticipantAction = async (
    action: IParticipantAction,
    participant: IRecipientData
  ) => {
    console.log(`Action: ${action} on participant:`, participant);

    switch (action) {
      case 'download':
        await handleIndividualDownload(participant);
        break;
      case 'send':
        await handleSendEmail(participant);
        break;
      case 'edit':
        handleEditParticipant(participant);
        break;
      case 'delete':
        handleDeleteParticipant(participant);
        break;
    }
  };

  const handleIndividualDownload = async (participant: IRecipientData) => {
    if (!event?._id) return;

    const participantId = participant.certification_id;

    // Add to downloading set
    setDownloadingParticipants((prev) => new Set(prev).add(participantId));
    setError(null);

    try {
      // Generate individual certificate
      const certificateBuffer = await generateIndividualCertificate(
        event._id.toString(),
        participantId
      );

      // Generate filename
      const filename = generateCertificateFilename(
        participant.name,
        participant.certification_id
      );

      // Download the certificate
      downloadCertificate(certificateBuffer, filename);

      toast({
        title: 'Certificate Downloaded',
        description: `Certificate for ${participant.name} has been downloaded successfully.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error downloading certificate:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(
        `Failed to download certificate for ${participant.name}: ${errorMessage}`
      );

      toast({
        title: 'Download Failed',
        description: `Failed to download certificate for ${participant.name}: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      // Remove from downloading set
      setDownloadingParticipants((prev) => {
        const newSet = new Set(prev);
        newSet.delete(participantId);
        return newSet;
      });
    }
  };

  const handleEditParticipant = (participant: IRecipientData) => {
    setEditingParticipant(participant);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingParticipant(null);
  };

  const handleSaveParticipant = async (updatedParticipant: IRecipientData) => {
    if (!event?._id || !editingParticipant) return;

    setIsUpdatingParticipant(true);
    setError(null);

    try {
      await updateParticipant(
        event._id.toString(),
        editingParticipant.certification_id,
        updatedParticipant
      );

      // Update local participants list
      setParticipants((prev) =>
        prev.map((p) =>
          p.certification_id === editingParticipant.certification_id
            ? updatedParticipant
            : p
        )
      );

      // If certification_id changed, update the event data
      if (
        updatedParticipant.certification_id !==
        editingParticipant.certification_id
      ) {
        // Reload events to get updated data
        if (onParticipantsUploaded) {
          onParticipantsUploaded();
        }
      }

      setIsEditDialogOpen(false);
      setEditingParticipant(null);

      toast({
        title: 'Participant Updated',
        description: `${updatedParticipant.name} has been updated successfully.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating participant:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to update participant: ${errorMessage}`);

      toast({
        title: 'Update Failed',
        description: `Failed to update ${updatedParticipant.name}: ${errorMessage}`,
        variant: 'destructive',
      });
      throw error; // Re-throw to let the dialog handle it
    } finally {
      setIsUpdatingParticipant(false);
    }
  };

  const handleDeleteParticipant = (participant: IRecipientData) => {
    setDeletingParticipants([participant]);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingParticipants([]);
  };

  const handleConfirmDelete = async () => {
    if (!event?._id || deletingParticipants.length === 0) return;

    setIsDeletingParticipant(true);
    setError(null);

    try {
      if (deletingParticipants.length === 1) {
        // Delete single participant
        await deleteParticipant(
          event._id.toString(),
          deletingParticipants[0].certification_id
        );
      } else {
        // Delete multiple participants
        const participantIds = deletingParticipants.map(
          (p) => p.certification_id
        );
        await deleteParticipants(event._id.toString(), participantIds);
      }

      // Update local participants list
      const deletedIds = new Set(
        deletingParticipants.map((p) => p.certification_id)
      );
      setParticipants((prev) =>
        prev.filter((p) => !deletedIds.has(p.certification_id))
      );

      // Reload events to get updated data
      if (onParticipantsUploaded) {
        onParticipantsUploaded();
      }

      const participantNames = deletingParticipants
        .map((p) => p.name)
        .join(', ');
      toast({
        title: 'Participants Deleted',
        description: `${deletingParticipants.length} participant(s) deleted successfully: ${participantNames}`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error deleting participants:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to delete participants: ${errorMessage}`);

      toast({
        title: 'Deletion Failed',
        description: `Failed to delete participants: ${errorMessage}`,
        variant: 'destructive',
      });
      throw error; // Re-throw to let the dialog handle it
    } finally {
      setIsDeletingParticipant(false);
    }
  };

  const handleBulkAction = (
    action: IParticipantAction,
    participantIds: string[]
  ) => {
    console.log(`Bulk action: ${action} on participants:`, participantIds);

    switch (action) {
      case 'download':
        handleBulkDownload(participantIds);
        break;
      case 'send':
        handleBulkSendEmails(participantIds);
        break;
      case 'export':
        handleCSVExport(participantIds);
        break;
      case 'delete':
        handleBulkDelete(participantIds);
        break;
    }
  };

  const handleBulkDownload = async (participantIds: string[]) => {
    if (!event?._id || participantIds.length === 0) {
      setError('No participants selected for download');
      return;
    }

    setIsBulkDownloading(true);
    setError(null);

    try {
      // Generate certificates for selected participants
      const zipBuffer = await generateSelectedCertificates(
        event._id.toString(),
        participantIds
      );

      // Generate filename for the ZIP file
      const zipFilename = generateZipFilename(
        event.title,
        participantIds.length
      );

      // Download the ZIP file
      downloadZipFile(zipBuffer, zipFilename);

      toast({
        title: 'Certificates Downloaded',
        description: `ZIP file with ${participantIds.length} certificates has been downloaded successfully.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error downloading selected certificates:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to download certificates: ${errorMessage}`);

      toast({
        title: 'Download Failed',
        description: `Failed to download certificates: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const handleCSVExport = async (participantIds: string[]) => {
    if (!event?._id || participantIds.length === 0) {
      setError('No participants selected for export');
      return;
    }

    setIsExportingCSV(true);
    setError(null);

    try {
      // Export selected participants as CSV
      const csvContent = await exportParticipantsCSV(
        event._id.toString(),
        participantIds
      );

      // Generate filename for the CSV file
      const csvFilename = generateCSVFilename(
        event.title,
        participantIds.length
      );

      // Download the CSV file
      downloadCSV(csvContent, csvFilename);

      toast({
        title: 'CSV Exported',
        description: `CSV file with ${participantIds.length} participants has been exported successfully.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to export CSV: ${errorMessage}`);

      toast({
        title: 'Export Failed',
        description: `Failed to export CSV: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleBulkDelete = (participantIds: string[]) => {
    const participantsToDelete = participants.filter((p) =>
      participantIds.includes(p.certification_id)
    );

    if (participantsToDelete.length === 0) {
      setError('No participants selected for deletion');
      return;
    }

    setDeletingParticipants(participantsToDelete);
    setIsDeleteDialogOpen(true);
  };

  // Email functionality
  const handleSendEmail = async (participant: IRecipientData) => {
    if (!event?._id) return;

    const participantId = participant.certification_id;

    // Check if participant has email
    if (!participant.email) {
      toast({
        title: 'Email Required',
        description:
          'Please add an email address for this participant before sending.',
        variant: 'destructive',
      });
      return;
    }

    // Add to sending set
    setSendingEmails((prev) => new Set(prev).add(participantId));
    setError(null);

    try {
      const result = await sendParticipantEmail(
        event._id.toString(),
        participantId
      );

      if (result.success) {
        toast({
          title: 'Email Sent',
          description: `Certificate sent to ${participant.name} at ${participant.email}`,
          variant: 'default',
        });

        // Update local participant data
        setParticipants((prev) =>
          prev.map((p) =>
            p.certification_id === participantId
              ? {
                  ...p,
                  emailStatus: 'sent',
                  lastEmailSent: new Date(),
                  emailError: undefined,
                }
              : p
          )
        );

        // Refresh event data
        if (onParticipantsUploaded) {
          onParticipantsUploaded();
        }
      } else {
        toast({
          title: 'Email Failed',
          description: result.error || 'Failed to send email',
          variant: 'destructive',
        });

        // Update local participant data with error
        setParticipants((prev) =>
          prev.map((p) =>
            p.certification_id === participantId
              ? {
                  ...p,
                  emailStatus: 'failed',
                  emailError: result.error,
                  emailRetryCount: (p.emailRetryCount || 0) + 1,
                }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: 'Email Failed',
        description: `Failed to send email: ${errorMessage}`,
        variant: 'destructive',
      });

      // Update local participant data with error
      setParticipants((prev) =>
        prev.map((p) =>
          p.certification_id === participantId
            ? {
                ...p,
                emailStatus: 'failed',
                emailError: errorMessage,
                emailRetryCount: (p.emailRetryCount || 0) + 1,
              }
            : p
        )
      );
    } finally {
      setSendingEmails((prev) => {
        const newSet = new Set(prev);
        newSet.delete(participantId);
        return newSet;
      });
    }
  };

  const handleBulkSendEmails = async (participantIds: string[]) => {
    if (!event?._id || participantIds.length === 0) {
      setError('No participants selected for email sending');
      return;
    }

    // Filter participants with email addresses
    const participantsWithEmail = participants.filter(
      (p) => participantIds.includes(p.certification_id) && p.email
    );

    if (participantsWithEmail.length === 0) {
      toast({
        title: 'No Valid Emails',
        description: 'Selected participants do not have email addresses.',
        variant: 'destructive',
      });
      return;
    }

    setIsBulkSendingEmails(true);
    setError(null);

    try {
      const result = await sendBulkEmails(
        event._id.toString(),
        participantsWithEmail.map((p) => p.certification_id)
      );

      if (result.success) {
        toast({
          title: 'Bulk Email Sent',
          description: `Successfully sent ${result.sent} emails. ${result.failed} failed.`,
          variant: result.failed > 0 ? 'destructive' : 'default',
        });

        // Refresh event data
        if (onParticipantsUploaded) {
          onParticipantsUploaded();
        }
      } else {
        toast({
          title: 'Bulk Email Failed',
          description: result.errors.join(', '),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: 'Bulk Email Failed',
        description: `Failed to send bulk emails: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsBulkSendingEmails(false);
    }
  };

  const handleRetryFailedEmail = async (participant: IRecipientData) => {
    if (!event?._id) return;

    const participantId = participant.certification_id;

    // Add to sending set
    setSendingEmails((prev) => new Set(prev).add(participantId));
    setError(null);

    try {
      const result = await retryFailedEmail(
        event._id.toString(),
        participantId
      );

      if (result.success) {
        toast({
          title: 'Email Retried',
          description: `Certificate resent to ${participant.name} at ${participant.email}`,
          variant: 'default',
        });

        // Update local participant data
        setParticipants((prev) =>
          prev.map((p) =>
            p.certification_id === participantId
              ? {
                  ...p,
                  emailStatus: 'sent',
                  lastEmailSent: new Date(),
                  emailError: undefined,
                }
              : p
          )
        );

        // Refresh event data
        if (onParticipantsUploaded) {
          onParticipantsUploaded();
        }
      } else {
        toast({
          title: 'Retry Failed',
          description: result.error || 'Failed to retry email',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error retrying email:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: 'Retry Failed',
        description: `Failed to retry email: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setSendingEmails((prev) => {
        const newSet = new Set(prev);
        newSet.delete(participantId);
        return newSet;
      });
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
          <AlertDescription className="text-red-800 dark:text-red-200 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-lg leading-none"
            >
              ×
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message Display */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800 dark:text-green-200 flex items-center justify-between">
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 text-lg leading-none"
            >
              ×
            </button>
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
        <div className="relative">
          <ParticipantTable
            participants={participants}
            onParticipantAction={handleParticipantAction}
            onBulkAction={handleBulkAction}
            disabled={isUploading}
            downloadingParticipants={downloadingParticipants}
            isBulkDownloading={isBulkDownloading}
            isExportingCSV={isExportingCSV}
            sendingEmails={sendingEmails}
            isBulkSendingEmails={isBulkSendingEmails}
            onRetryFailedEmail={handleRetryFailedEmail}
            onBulkSendEmails={handleBulkSendEmails}
            eventId={event?._id?.toString()}
            isEmailConfigured={event?.emailConfig?.enabled || false}
          />

          {/* Loading Overlay for Bulk Operations */}
          {(isBulkDownloading || isExportingCSV || isBulkSendingEmails) && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {isBulkDownloading
                    ? 'Generating certificates...'
                    : isBulkSendingEmails
                    ? 'Sending emails...'
                    : 'Exporting CSV...'}
                </span>
              </div>
            </div>
          )}
        </div>
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
          {/* <button
            onClick={onParticipantsUploaded}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue to Generate →
          </button> */}
        </div>
      )}

      {/* Edit Participant Dialog */}
      <EditParticipantDialog
        participant={editingParticipant}
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        onSave={handleSaveParticipant}
        isLoading={isUpdatingParticipant}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        participants={deletingParticipants}
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        isLoading={isDeletingParticipant}
      />

      {/* Email Dashboard Toggle */}
      {/* {participants.length > 0 && !showUpload && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowEmailDashboard(!showEmailDashboard)}
          >
            {showEmailDashboard ? 'Hide' : 'Show'} Email Dashboard
          </Button>
        </div>
      )} */}
    </div>
  );
}
