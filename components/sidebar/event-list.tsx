'use client';

import { IEvent } from '@/lib/types';
import { EventItem } from './event-item';

interface EventListProps {
  events: IEvent[];
  selectedEvent: IEvent | null;
  onEventSelect: (event: IEvent) => void;
  isCollapsed: boolean;
}

export function EventList({
  events,
  selectedEvent,
  onEventSelect,
  isCollapsed,
}: EventListProps) {
  if (isCollapsed) {
    return (
      <div className="p-2 space-y-2">
        {events.slice(0, 5).map((event) => (
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
    <div className="p-4">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
        Events ({events.length})
      </h3>
      <div className="space-y-2">
        {events.length === 0 ? (
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
            <p className="text-sm">No events found</p>
            <p className="text-xs mt-1">
              Create your first event to get started
            </p>
          </div>
        ) : (
          events.map((event) => (
            <EventItem
              key={event._id?.toString()}
              event={event}
              isSelected={selectedEvent?._id === event._id}
              onClick={() => onEventSelect(event)}
            />
          ))
        )}
      </div>
    </div>
  );
}
