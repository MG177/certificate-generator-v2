'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { MainContent } from './main-content';
import { IEvent } from '@/lib/types';

interface ResponsiveLayoutProps {
  events: IEvent[];
  selectedEvent: IEvent | null;
  onEventSelect: (event: IEvent) => void;
  onEventCreate: () => void;
  onEventUpdate: (event: IEvent) => void;
  onEventEdit?: (event: IEvent) => void;
  onEventsChange?: () => void;
  children?: React.ReactNode;
}

export function ResponsiveLayout({
  events,
  selectedEvent,
  onEventSelect,
  onEventCreate,
  onEventUpdate,
  onEventEdit,
  onEventsChange,
  children,
}: ResponsiveLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`
          ${isSidebarCollapsed ? 'w-16' : 'w-80'}
          transition-all duration-300 ease-in-out
          bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          flex flex-col
          ${isSidebarCollapsed ? 'lg:w-16' : 'lg:w-80'}
        `}
      >
        <Sidebar
          events={filteredEvents}
          selectedEvent={selectedEvent}
          onEventSelect={onEventSelect}
          onEventCreate={onEventCreate}
          onEventEdit={onEventEdit}
          onEventsChange={onEventsChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainContent
          selectedEvent={selectedEvent}
          onEventUpdate={onEventUpdate}
        >
          {children}
        </MainContent>
      </div>
    </div>
  );
}
