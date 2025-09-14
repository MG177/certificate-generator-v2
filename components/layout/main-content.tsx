'use client';

import { PageHeader } from './page-header';
import { IEvent } from '@/lib/types';

interface MainContentProps {
  selectedEvent: IEvent | null;
  onEventUpdate: (event: IEvent) => void;
  children?: React.ReactNode;
}

export function MainContent({
  selectedEvent,
  onEventUpdate,
  children,
}: MainContentProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Page Header */}
      <PageHeader selectedEvent={selectedEvent} />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-8">{children}</div>
      </div>
    </div>
  );
}
