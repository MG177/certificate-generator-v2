'use client';

import { useState } from 'react';
import { IParticipantAction, IRecipientData } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Send, MoreHorizontal } from 'lucide-react';

interface ParticipantRowProps {
  participant: IRecipientData;
  index: number;
  isSelected: boolean;
  onSelectionChange: (index: number, selected: boolean) => void;
  onAction: (action: IParticipantAction, participant: IRecipientData) => void;
  isDownloading?: boolean;
  isSending?: boolean;
}

export function ParticipantRow({
  participant,
  index,
  isSelected,
  onSelectionChange,
  onAction,
  isDownloading = false,
  isSending = false,
}: ParticipantRowProps) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const handleSelectionChange = (checked: boolean) => {
    onSelectionChange(index, checked);
  };

  const handleAction = (action: IParticipantAction) => {
    onAction(action, participant);
    setIsActionMenuOpen(false);
  };

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      {/* Checkbox Column */}
      <td className="p-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleSelectionChange}
          data-testid={`participant-checkbox-${index}`}
        />
      </td>

      {/* Name Column */}
      <td className="p-4">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {participant.name}
        </div>
      </td>

      {/* Email Column */}
      <td className="p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {participant.email || '-'}
        </div>
      </td>

      {/* Certificate ID Column */}
      <td className="p-4">
        <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
          {participant.certification_id}
        </div>
      </td>

      {/* Last Email Column */}
      <td className="p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {participant.lastEmailSent?.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) || '-'}
        </div>
      </td>

      {/* Actions Column */}
      <td className="p-4">
        <div className="flex items-center gap-2">
          {/* Download Certificate Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction('download')}
            className="h-8 w-8 p-0"
            disabled={isDownloading}
            data-testid={`download-certificate-${index}`}
          >
            {isDownloading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>

          {/* Send Email Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction('send')}
            className="h-8 w-8 p-0"
            data-testid={`send-email-${index}`}
            disabled={isSending || isDownloading || !participant.email}
          >
            <Send className="h-4 w-4" />
          </Button>

          {/* More Actions Menu */}
          <DropdownMenu
            open={isActionMenuOpen}
            onOpenChange={setIsActionMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                data-testid={`more-actions-${index}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAction('edit')}>
                Edit Participant
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => handleAction('duplicate')}>
                Duplicate
              </DropdownMenuItem> */}
              <DropdownMenuItem
                onClick={() => handleAction('delete')}
                className="text-red-600 dark:text-red-400"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
