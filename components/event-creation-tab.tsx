'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { createEvent } from '@/lib/actions';
import { IEvent } from '@/lib/types';

interface EventCreationTabProps {
  onEventCreated: (event: IEvent) => void;
}

export function EventCreationTab({ onEventCreated }: EventCreationTabProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateEvent = async () => {
    if (!title.trim() || !eventDate) {
      return;
    }

    setIsCreating(true);
    try {
      const newEvent = await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        eventDate,
        status: 'draft',
        template: {
          base64: '',
          originalName: '',
          uploadedAt: new Date(),
        },
        nameConfig: {
          x: 0,
          y: 0,
          fontFamily: 'Arial',
          fontSize: 24,
          color: '#000000',
          textAlign: 'center',
        },
        idConfig: {
          x: 0,
          y: 0,
          fontFamily: 'Arial',
          fontSize: 18,
          color: '#000000',
          textAlign: 'center',
        },
        participants: [],
      });

      onEventCreated(newEvent);
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Event
        </CardTitle>
        <CardDescription>
          Create a new event to start generating certificates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Event Title *</Label>
          <Input
            id="title"
            placeholder="Enter event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isCreating}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Enter event description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isCreating}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Event Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !eventDate && 'text-muted-foreground'
                )}
                disabled={isCreating}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {eventDate ? format(eventDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={eventDate}
                onSelect={setEventDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          onClick={handleCreateEvent}
          disabled={!title.trim() || !eventDate || isCreating}
          className="w-full"
        >
          {isCreating ? 'Creating...' : 'Create Event'}
        </Button>
      </CardContent>
    </Card>
  );
}
