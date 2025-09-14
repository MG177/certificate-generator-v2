'use client';

import { IEvent } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface PageHeaderProps {
  selectedEvent: IEvent | null;
}

export function PageHeader({ selectedEvent }: PageHeaderProps) {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Ready to generate';
      case 'no-template':
        return 'Template needed';
      case 'no-participants':
        return 'Participants needed';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Generate Certificate
          </h1>
          {selectedEvent && (
            <div className="flex items-center gap-3 mt-2">
              <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {selectedEvent.title}
              </h2>
              <Badge className={getStatusColor(getEventStatus(selectedEvent))}>
                {getStatusText(getEventStatus(selectedEvent))}
              </Badge>
            </div>
          )}
        </div>

        {selectedEvent && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedEvent.participants.length} participants
            </div>
            {getEventStatus(selectedEvent) === 'ready' && (
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                Ready to generate certificates
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
