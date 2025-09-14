'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Send, Trash2, MoreHorizontal } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onBulkAction: (action: string) => void;
  disabled?: boolean;
}

export function BulkActions({
  selectedCount,
  onBulkAction,
  disabled = false,
}: BulkActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAction = (action: string) => {
    onBulkAction(action);
    setIsMenuOpen(false);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="text-sm text-blue-800 dark:text-blue-200 font-medium">
        {selectedCount} participant{selectedCount > 1 ? 's' : ''} selected
      </div>

      <div className="flex items-center gap-2">
        {/* Download Selected Certificates */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('download')}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Certificates
        </Button>

        {/* Send Emails to Selected */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('send')}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          Send Emails
        </Button>

        {/* More Actions Menu */}
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAction('export')}>
              Export Selected
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('duplicate')}>
              Duplicate Selected
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAction('delete')}
              className="text-red-600 dark:text-red-400"
            >
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
