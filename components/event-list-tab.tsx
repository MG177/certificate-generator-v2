'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  FileText,
  Users,
  Trash2,
  Edit,
  Download,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { IEvent } from '@/lib/types';
import { deleteEvent, generateCertificates } from '@/lib/actions';
import { useState } from 'react';

interface EventListTabProps {
  events: IEvent[];
  onEventSelect: (event: IEvent) => void;
  onEventDeleted: () => void;
}

export function EventListTab({
  events,
  onEventSelect,
  onEventDeleted,
}: EventListTabProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    setDeletingId(eventId);
    try {
      await deleteEvent(eventId);
      onEventDeleted();
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleGenerateCertificates = async (event: IEvent) => {
    if (!event.template.base64 || event.participants.length === 0) {
      alert('Event is missing template or participants');
      return;
    }

    setGeneratingId(event._id?.toString() || '');
    try {
      const zipBuffer = await generateCertificates(event._id?.toString() || '');

      // Create download link
      const blob = new Blob([zipBuffer], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.title}_certificates.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating certificates:', error);
      alert('Failed to generate certificates');
    } finally {
      setGeneratingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Events</CardTitle>
          <CardDescription>
            No events found. Create a new event to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Events</CardTitle>
        <CardDescription>
          Manage your certificate events and generate certificates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event._id?.toString()}
              className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>

                  {event.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {event.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(event.eventDate), 'MMM dd, yyyy')}
                    </div>

                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {event.participants.length} participants
                    </div>

                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {event.template.base64
                        ? 'Template uploaded'
                        : 'No template'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEventSelect(event)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>

                  {event.template.base64 && event.participants.length > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleGenerateCertificates(event)}
                      disabled={generatingId === event._id?.toString()}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {generatingId === event._id?.toString()
                        ? 'Generating...'
                        : 'Generate'}
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      handleDeleteEvent(event._id?.toString() || '')
                    }
                    disabled={deletingId === event._id?.toString()}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
