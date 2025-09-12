'use client';

import { useState, useEffect } from 'react';
import { EventCreationTab } from '@/components/event-creation-tab';
import { EventListTab } from '@/components/event-list-tab';
import { TemplateUploadTab } from '@/components/template-upload-tab';
import { LayoutCustomizationTab } from '@/components/layout-customization-tab';
import { RecipientsUploadTab } from '@/components/recipients-upload-tab';
import { CertificateGenerationTab } from '@/components/certificate-generation-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IEvent } from '@/lib/types';
import { getAllEvents } from '@/lib/actions';
import { Plus, List, FileImage, Settings, Users, Download } from 'lucide-react';

export default function Home() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);
  const [currentTab, setCurrentTab] = useState('create');
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
    setCurrentTab('template');
  };

  const handleEventSelected = (event: IEvent) => {
    setSelectedEvent(event);
    setCurrentTab('template');
  };

  const handleEventDeleted = () => {
    loadEvents();
    if (selectedEvent) {
      setSelectedEvent(null);
      setCurrentTab('create');
    }
  };

  const handleTemplateUploaded = () => {
    loadEvents(); // Refresh to get updated event
    setCurrentTab('layout');
  };

  const handleLayoutConfigured = () => {
    setCurrentTab('recipients');
  };

  const handleParticipantsUploaded = () => {
    loadEvents(); // Refresh to get updated event
    setCurrentTab('generate');
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Certificate Generator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Create events, upload templates, customize layouts, and generate
            personalized certificates in bulk
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Event
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              My Events
            </TabsTrigger>
            <TabsTrigger
              value="template"
              disabled={!selectedEvent}
              className="flex items-center gap-2"
            >
              <FileImage className="w-4 h-4" />
              Template
            </TabsTrigger>
            <TabsTrigger
              value="layout"
              disabled={!selectedEvent}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Layout
            </TabsTrigger>
            <TabsTrigger
              value="recipients"
              disabled={!selectedEvent}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Recipients
            </TabsTrigger>
            <TabsTrigger
              value="generate"
              disabled={!selectedEvent}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Generate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <EventCreationTab onEventCreated={handleEventCreated} />
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <EventListTab
              events={events}
              onEventSelect={handleEventSelected}
              onEventDeleted={handleEventDeleted}
            />
          </TabsContent>

          <TabsContent value="template" className="space-y-6">
            {!selectedEvent ? (
              <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Please create or select an event first.
                </AlertDescription>
              </Alert>
            ) : (
              <TemplateUploadTab
                event={selectedEvent}
                onTemplateUploaded={handleTemplateUploaded}
              />
            )}
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            {!selectedEvent ? (
              <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Please create or select an event first.
                </AlertDescription>
              </Alert>
            ) : (
              <LayoutCustomizationTab
                event={selectedEvent}
                onContinue={handleLayoutConfigured}
              />
            )}
          </TabsContent>

          <TabsContent value="recipients" className="space-y-6">
            {!selectedEvent ? (
              <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Please create or select an event first.
                </AlertDescription>
              </Alert>
            ) : (
              <RecipientsUploadTab
                event={selectedEvent}
                onParticipantsUploaded={handleParticipantsUploaded}
              />
            )}
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            {!selectedEvent ? (
              <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Please create or select an event first.
                </AlertDescription>
              </Alert>
            ) : (
              <CertificateGenerationTab
                event={selectedEvent}
                onCertificatesGenerated={() => {
                  // Optionally refresh the event data
                  loadEvents();
                }}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Event Status and Actions */}
        {selectedEvent && (
          <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedEvent.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Status:{' '}
                  {getEventStatus(selectedEvent) === 'ready'
                    ? 'Ready to generate'
                    : getEventStatus(selectedEvent) === 'no-template'
                    ? 'Template needed'
                    : 'Participants needed'}
                </p>
              </div>

              {canGenerate && (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedEvent.participants.length} participants ready
                  </div>
                  <button
                    onClick={() => setCurrentTab('recipients')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2 inline" />
                    Generate Certificates
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
