'use client';

import { IEvent } from '@/lib/types';
import { Logo } from '../sidebar/logo';
import { SearchBar } from '../sidebar/search-bar';
import { EventList } from '../sidebar/event-list';
import { CreateEventButton } from '../sidebar/create-event-button';

interface SidebarProps {
  events: IEvent[];
  selectedEvent: IEvent | null;
  onEventSelect: (event: IEvent) => void;
  onEventCreate: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  events,
  selectedEvent,
  onEventSelect,
  onEventCreate,
  searchQuery,
  onSearchChange,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header with Logo and Toggle */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && <Logo />}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-5 h-5 transition-transform ${
                isCollapsed ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="p-4">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search for events"
          />
        </div>
      )}

      {/* Event List */}
      <div className="flex-1 overflow-y-auto">
        <EventList
          events={events}
          selectedEvent={selectedEvent}
          onEventSelect={onEventSelect}
          isCollapsed={isCollapsed}
        />
      </div>

      {/* Create Event Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <CreateEventButton onClick={onEventCreate} isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}
