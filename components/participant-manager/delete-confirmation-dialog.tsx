'use client';

import { useState } from 'react';
import { IRecipientData } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  participants: IRecipientData[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({
  participants,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const isSingleParticipant = participants.length === 1;
  const participant = participants[0];

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting participants:', error);
      // Error handling is done in the parent component
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleCancel}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            {isSingleParticipant
              ? 'Delete Participant'
              : `Delete ${participants.length} Participants`}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {isSingleParticipant ? (
              <>
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {participant.name}
                </span>
                ? This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {participants.length} participants
                </span>
                ? This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Warning Alert */}
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Warning:</strong> This will permanently remove{' '}
            {isSingleParticipant
              ? 'the participant'
              : 'all selected participants'}{' '}
            from the event. Any certificates generated for{' '}
            {isSingleParticipant ? 'this participant' : 'these participants'}{' '}
            will no longer be accessible.
          </AlertDescription>
        </Alert>

        {/* Participant List (for multiple participants) */}
        {!isSingleParticipant && participants.length > 0 && (
          <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                Participants to be deleted:
              </h4>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {participants.map((p, index) => (
                <div
                  key={`${p.certification_id}-${index}`}
                  className="p-3 text-sm"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {p.name}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {p.certification_id}
                    {p.email && <span className="ml-2">• {p.email}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={handleCancel}
            disabled={isDeleting || isLoading}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting || isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {isSingleParticipant ? 'Delete Participant' : 'Delete All'}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
