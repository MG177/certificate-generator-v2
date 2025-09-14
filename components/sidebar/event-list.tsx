'use client';

import { IEvent } from '@/lib/types';
import { EventItem } from './event-item';
import { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  softDeleteEvent,
  restoreEvent,
  duplicateEvent,
  archiveEvent,
  unarchiveEvent,
} from '@/lib/actions';
import { toast } from '@/hooks/use-toast';

type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'title-asc'
  | 'title-desc'
  | 'status';
type FilterOption = 'all' | 'active' | 'archived';

interface EventListProps {
  events: IEvent[];
  selectedEvent: IEvent | null;
  onEventSelect: (event: IEvent) => void;
  onEventEdit?: (event: IEvent) => void;
  onEventUpdate?: (event: IEvent) => void;
  onEventsChange?: () => void;
  isCollapsed: boolean;
}

export function EventList({
  events,
  selectedEvent,
  onEventSelect,
  onEventEdit,
  onEventUpdate,
  onEventsChange,
  isCollapsed,
}: EventListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('active');

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events;

    // Apply filter
    switch (filterBy) {
      case 'active':
        filtered = events.filter(
          (event) => !event.isDeleted && event.status !== 'archived'
        );
        break;
      case 'archived':
        filtered = events.filter(
          (event) => event.status === 'archived' && !event.isDeleted
        );
        break;
      default:
        filtered = events;
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return (
            new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
          );
        case 'date-asc':
          return (
            new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
          );
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'status':
          const statusOrder = {
            ready: 0,
            'no-template': 1,
            'no-participants': 2,
            archived: 3,
            // deleted: 4,
          };
          const aStatus =
            // a.isDeleted
            //   ? 'deleted'
            a.status === 'archived'
              ? 'archived'
              : !a.template.base64
              ? 'no-template'
              : a.participants.length === 0
              ? 'no-participants'
              : 'ready';
          const bStatus =
            // b.isDeleted
            //   ? 'deleted'
            b.status === 'archived'
              ? 'archived'
              : !b.template.base64
              ? 'no-template'
              : b.participants.length === 0
              ? 'no-participants'
              : 'ready';
          return (statusOrder[aStatus] || 5) - (statusOrder[bStatus] || 5);
        default:
          return 0;
      }
    });
  }, [events, sortBy, filterBy]);

  const handleDuplicate = async (eventId: string) => {
    try {
      await duplicateEvent(eventId);
      toast({
        title: 'Event Duplicated',
        description: 'The event has been duplicated successfully.',
      });
      onEventsChange?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate event.',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (eventId: string) => {
    try {
      await archiveEvent(eventId);
      toast({
        title: 'Event Archived',
        description: 'The event has been archived.',
      });
      onEventsChange?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to archive event.',
        variant: 'destructive',
      });
    }
  };

  const handleUnarchive = async (eventId: string) => {
    try {
      await unarchiveEvent(eventId);
      toast({
        title: 'Event Unarchived',
        description: 'The event has been unarchived.',
      });
      onEventsChange?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unarchive event.',
        variant: 'destructive',
      });
    }
  };

  const handleSoftDelete = async (eventId: string) => {
    try {
      await softDeleteEvent(eventId);
      toast({
        title: 'Event Deleted',
        description: 'The event has been moved to trash.',
      });
      onEventsChange?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete event.',
        variant: 'destructive',
      });
    }
  };

  const handleRestore = async (eventId: string) => {
    try {
      await restoreEvent(eventId);
      toast({
        title: 'Event Restored',
        description: 'The event has been restored from trash.',
      });
      onEventsChange?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore event.',
        variant: 'destructive',
      });
    }
  };

  if (isCollapsed) {
    return (
      <div className="p-2 space-y-2">
        {filteredAndSortedEvents.slice(0, 5).map((event) => (
          <button
            key={event._id?.toString()}
            onClick={() => onEventSelect(event)}
            className={`
              w-full p-2 rounded-lg transition-colors
              ${
                selectedEvent?._id === event._id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }
              ${event.isDeleted ? 'opacity-60' : ''}
            `}
            title={event.title}
            data-testid={`event-item-${events.indexOf(event)}`}
          >
            <div className="w-4 h-4 mx-auto">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-full h-full"
              >
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" />
                <path d="M2 12L12 17L22 12" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 pt-1 overflow-visible">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Events ({filteredAndSortedEvents.length})
        </h3>
        <div className="flex gap-2">
          <Select
            value={filterBy}
            onValueChange={(value: FilterOption) => setFilterBy(value)}
          >
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              {/* <SelectItem value="deleted">Deleted</SelectItem> */}
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => setSortBy(value)}
          >
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date ↓</SelectItem>
              <SelectItem value="date-asc">Date ↑</SelectItem>
              <SelectItem value="title-asc">Title A-Z</SelectItem>
              <SelectItem value="title-desc">Title Z-A</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        {filteredAndSortedEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-sm">
              {filterBy === 'all'
                ? 'No events found'
                : filterBy === 'active'
                ? 'No active events'
                : filterBy === 'archived'
                ? 'No archived events'
                : // : 'No deleted events'
                  'No events found'}
            </p>
            <p className="text-xs mt-1">
              {
                filterBy === 'all'
                  ? 'Create your first event to get started'
                  : // : filterBy === 'deleted'
                    // 'No events in trash'
                    'No events found'
                // `No ${filterBy} events found`
              }
            </p>
          </div>
        ) : (
          filteredAndSortedEvents.map((event) => (
            <EventItem
              key={event._id?.toString()}
              event={event}
              isSelected={selectedEvent?._id === event._id}
              onClick={() => onEventSelect(event)}
              onEdit={onEventEdit}
              onEventUpdate={onEventUpdate}
              onEventsChange={onEventsChange}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
              onSoftDelete={handleSoftDelete}
              onRestore={handleRestore}
            />
          ))
        )}
      </div>
    </div>
  );
}
