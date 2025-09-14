'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreateEventButtonProps {
  onClick: () => void;
  isCollapsed: boolean;
}

export function CreateEventButton({
  onClick,
  isCollapsed,
}: CreateEventButtonProps) {
  if (isCollapsed) {
    return (
      <Button
        onClick={onClick}
        size="sm"
        className="w-full aspect-square p-0"
        data-testid="create-event-button-collapsed"
      >
        <Plus className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      className="w-full"
      data-testid="create-event-button"
    >
      <Plus className="w-4 h-4 mr-2" />
      Create Event
    </Button>
  );
}
