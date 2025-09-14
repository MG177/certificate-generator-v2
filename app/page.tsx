'use client';

import { useState, useEffect } from 'react';
import { ResponsiveLayout } from '@/components/layout/responsive-layout';
import { EventCreationTab } from '@/components/event-creation-tab';
import { TemplateUploadSection } from '@/components/template-upload-section';
import { TemplateAdjustmentSection } from '@/components/template-adjustment/template-adjustment-section';
import { ParticipantManagerSection } from '@/components/participant-manager/participant-manager-section';
import { CertificateGenerationTab } from '@/components/certificate-generation-tab';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IEvent } from '@/lib/types';
import { getAllEvents } from '@/lib/actions';

export default function Home() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);
  const [currentView, setCurrentView] = useState<
    'create' | 'template' | 'layout' | 'recipients' | 'generate'
  >('create');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await getAllEvents();
      setEvents(allEvents);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleEventCreated = (event: IEvent) => {
    setEvents((prev) => [event, ...prev]);
    setSelectedEvent(event);
    setCurrentView('template');
  };

  const handleEventSelected = (event: IEvent) => {
    setSelectedEvent(event);
    // If event has template, go to layout section, otherwise go to template upload
    if (event.template.base64) {
      setCurrentView('template');
    } else {
      setCurrentView('template');
    }
  };

  const handleEventUpdate = (event: IEvent) => {
    setEvents((prev) => prev.map((e) => (e._id === event._id ? event : e)));
    setSelectedEvent(event);
  };

  const handleEventCreate = () => {
    setCurrentView('create');
  };

  const handleTemplateUploaded = () => {
    loadEvents(); // Refresh to get updated event
    setCurrentView('layout');
  };

  const handleLayoutConfigured = () => {
    loadEvents(); // Refresh to get updated event
    setCurrentView('recipients');
  };

  const handleParticipantsUploaded = () => {
    loadEvents(); // Refresh to get updated event
    setCurrentView('generate');
  };

  // Back navigation handlers
  const handleBackToTemplate = () => {
    setCurrentView('template');
  };

  const handleBackToLayout = () => {
    setCurrentView('layout');
  };

  const getEventStatus = (event: IEvent) => {
    if (!event.template.base64) return 'no-template';
    if (event.participants.length === 0) return 'no-participants';
    return 'ready';
  };

  const canGenerate =
    selectedEvent &&
    selectedEvent.template.base64 &&
    selectedEvent.participants.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveLayout
      events={events}
      selectedEvent={selectedEvent}
      onEventSelect={handleEventSelected}
      onEventCreate={handleEventCreate}
      onEventUpdate={handleEventUpdate}
    >
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Views */}
      {currentView === 'create' && (
        <EventCreationTab onEventCreated={handleEventCreated} />
      )}

      {currentView === 'template' && selectedEvent && (
        <TemplateUploadSection
          event={selectedEvent}
          onTemplateUploaded={handleTemplateUploaded}
          onBack={handleEventCreate}
        />
      )}

      {currentView === 'layout' && selectedEvent && (
        <TemplateAdjustmentSection
          event={selectedEvent}
          onContinue={handleLayoutConfigured}
          onBack={handleBackToTemplate}
        />
      )}

      {currentView === 'recipients' && selectedEvent && (
        <ParticipantManagerSection
          event={selectedEvent}
          onParticipantsUploaded={handleParticipantsUploaded}
          onBack={handleBackToLayout}
        />
      )}

      {currentView === 'generate' && selectedEvent && (
        <CertificateGenerationTab
          event={selectedEvent}
          onCertificatesGenerated={() => {
            loadEvents();
          }}
        />
      )}

      {/* No Event Selected State */}
      {!selectedEvent && currentView !== 'create' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Event Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please select an event from the sidebar to continue.
          </p>
        </div>
      )}
    </ResponsiveLayout>
  );
}
