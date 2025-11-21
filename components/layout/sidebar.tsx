'use client';

import { IEvent } from '@/lib/types';
import { Logo } from '../sidebar/logo';
import { SearchBar } from '../sidebar/search-bar';
import { EventList } from '../sidebar/event-list';
import { CreateEventButton } from '../sidebar/create-event-button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { IView, viewList } from '@/lib/types';

interface SidebarProps {
  events: IEvent[];
  selectedEvent: IEvent | null;
  onEventSelect: (event: IEvent) => void;
  onEventCreate: () => void;
  onEventEdit?: (event: IEvent) => void;
  onEventUpdate?: (event: IEvent) => void;
  onEventsChange?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentView: IView;
  onViewChange: (view: IView) => void;
}

const viewIcons = {
  create: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
  template:
    'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
  layout:
    'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
  recipients:
    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  generate: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  email:
    'M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9 2.5 2.5 0 000-5z',
  emailConfig:
    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
};

export function Sidebar({
  events,
  selectedEvent,
  onEventSelect,
  onEventCreate,
  onEventEdit,
  onEventUpdate,
  onEventsChange,
  searchQuery,
  onSearchChange,
  isCollapsed,
  onToggleCollapse,
  currentView,
  onViewChange,
}: SidebarProps) {
  const getViewStatus = (view: IView) => {
    if (!selectedEvent) return 'disabled';

    switch (view) {
      case viewList.create:
        return 'available';
      case viewList.template:
        return 'available';
      case viewList.layout:
        return selectedEvent.template.base64 ? 'available' : 'disabled';
      case viewList.recipients:
        return selectedEvent.template.base64 ? 'available' : 'disabled';
      case viewList.email:
        return selectedEvent.template.base64 &&
          selectedEvent.participants.length > 0
          ? 'available'
          : 'disabled';
      case viewList.emailConfig:
        return selectedEvent.template.base64 ? 'available' : 'disabled';
      default:
        return 'disabled';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Logo and Toggle */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && <Logo />}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden md:block"
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
          onEventEdit={onEventEdit}
          onEventUpdate={onEventUpdate}
          onEventsChange={onEventsChange}
          isCollapsed={isCollapsed}
        />
      </div>

      {/* View Navigation */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Navigation
            </h3>
            {Object.entries(viewList)
              .filter(([key]) => key !== viewList.create)
              .map(([key, label]) => {
                const status = getViewStatus(label);
                const isActive = currentView === label;
                const isDisabled = status === 'disabled';

                return (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => !isDisabled && onViewChange(label)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isActive
                              ? 'bg-blue-100 dark:bg-blue-900'
                              : isDisabled
                              ? 'bg-gray-100 dark:bg-gray-700'
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}
                        >
                          <svg
                            className={`w-4 h-4 ${
                              isActive
                                ? 'text-blue-600 dark:text-blue-400'
                                : isDisabled
                                ? 'text-gray-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={viewIcons[key as keyof typeof viewIcons]}
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate capitalize ${
                              isActive
                                ? 'text-blue-900 dark:text-blue-100'
                                : isDisabled
                                ? 'text-gray-400'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {label}
                          </p>
                          {isDisabled && (
                            <Badge variant="secondary" className="text-xs">
                              {key === viewList.layout ||
                              key === viewList.recipients ||
                              key === viewList.email
                                ? 'Template required'
                                : 'Not available'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Create Event Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <CreateEventButton onClick={onEventCreate} isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}
