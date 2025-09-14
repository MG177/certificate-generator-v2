'use client';

import { IEvent } from '@/lib/types';
import { format } from 'date-fns';
import { Calendar, Users, FileText } from 'lucide-react';

interface EventItemProps {
  event: IEvent;
  isSelected: boolean;
  onClick: () => void;
}

export function EventItem({ event, isSelected, onClick }: EventItemProps) {
  const getEventStatus = (event: IEvent) => {
    if (!event.template.base64) return 'no-template';
    if (event.participants.length === 0) return 'no-participants';
    return 'ready';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'no-template':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'no-participants':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const status = getEventStatus(event);

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-3 rounded-lg transition-colors
        ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
        }
      `}
      data-testid={`event-item-${event._id}`}
    >
      <div className="flex items-start gap-3">
        {/* Diamond Icon */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-4 h-4">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`w-full h-full ${
                isSelected
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400'
              }`}
            >
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L12 17L22 12" />
            </svg>
          </div>
        </div>

        {/* Event Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
              {event.title}
            </h4>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                status
              )}`}
            >
              {status === 'ready'
                ? 'Ready'
                : status === 'no-template'
                ? 'No Template'
                : 'No Participants'}
            </span>
          </div>

          {event.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(event.eventDate), 'MMM dd, yyyy')}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {event.participants.length}
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {event.template.base64 ? 'Template' : 'No Template'}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
