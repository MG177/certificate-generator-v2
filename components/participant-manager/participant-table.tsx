'use client';

import { useState, useMemo } from 'react';
import { IRecipientData } from '@/lib/types';
import { ParticipantRow } from './participant-row';
import { BulkActions } from './bulk-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ParticipantTableProps {
  participants: IRecipientData[];
  onParticipantAction: (action: string, participant: IRecipientData) => void;
  onBulkAction: (action: string, participantIds: string[]) => void;
  disabled?: boolean;
}

export function ParticipantTable({
  participants,
  onParticipantAction,
  onBulkAction,
  disabled = false,
}: ParticipantTableProps) {
  const [selectedParticipants, setSelectedParticipants] = useState<Set<number>>(
    new Set()
  );

  const selectedCount = selectedParticipants.size;
  const allSelected =
    participants.length > 0 && selectedCount === participants.length;
  const someSelected = selectedCount > 0 && selectedCount < participants.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedParticipants(new Set(participants.map((_, index) => index)));
    } else {
      setSelectedParticipants(new Set());
    }
  };

  const handleSelectParticipant = (index: number, selected: boolean) => {
    const newSelected = new Set(selectedParticipants);
    if (selected) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedParticipants(newSelected);
  };

  const handleBulkAction = (action: string) => {
    const selectedParticipantIds = Array.from(selectedParticipants).map(
      (index) => participants[index].certification_id
    );
    onBulkAction(action, selectedParticipantIds);
  };

  const handleParticipantAction = (
    action: string,
    participant: IRecipientData
  ) => {
    onParticipantAction(action, participant);
  };

  if (participants.length === 0) {
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
          No Participants
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Upload a CSV file to add participants to this event.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedCount}
        onBulkAction={handleBulkAction}
        disabled={disabled}
      />

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800">
              <TableHead className="w-12 p-4">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLInputElement).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  disabled={disabled}
                />
              </TableHead>
              <TableHead className="p-4 font-medium text-gray-900 dark:text-gray-100">
                Name
              </TableHead>
              <TableHead className="p-4 font-medium text-gray-900 dark:text-gray-100">
                Email
              </TableHead>
              <TableHead className="p-4 font-medium text-gray-900 dark:text-gray-100">
                Certificate ID
              </TableHead>
              <TableHead className="p-4 font-medium text-gray-900 dark:text-gray-100">
                Last Email
              </TableHead>
              <TableHead className="w-32 p-4 font-medium text-gray-900 dark:text-gray-100">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((participant, index) => (
              <ParticipantRow
                key={`${participant.certification_id}-${index}`}
                participant={participant}
                index={index}
                isSelected={selectedParticipants.has(index)}
                onSelectionChange={handleSelectParticipant}
                onAction={handleParticipantAction}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Table Footer */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>
          Showing {participants.length} participant
          {participants.length > 1 ? 's' : ''}
        </div>
        <div>
          {selectedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedParticipants(new Set())}
              className="text-blue-600 dark:text-blue-400"
            >
              Clear Selection
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
